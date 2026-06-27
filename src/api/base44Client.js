import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const bucket = import.meta.env.VITE_SUPABASE_BUCKET || 'job-files';

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

const tables = {
  Application: 'applications',
  Resume: 'resumes',
  SupplementaryDocument: 'supplementary_documents',
};

const stripReadonly = (payload) => {
  const { id, user_id, created_date, updated_date, ...rest } = payload;
  return rest;
};

const getOrder = (sort = '-created_date') => ({
  column: sort.replace(/^-/, ''),
  ascending: !sort.startsWith('-'),
});

const throwIfError = ({ error }) => {
  if (error) throw error;
};

const uploadFile = async ({ file }) => {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) throw userError || new Error('Not authenticated');

  const safeName = file.name.replace(/[^\w.-]+/g, '_');
  const path = `${userData.user.id}/${crypto.randomUUID()}-${safeName}`;
  const uploaded = await supabase.storage.from(bucket).upload(path, file);
  throwIfError(uploaded);

  const signed = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, 60 * 60 * 24 * 365);
  throwIfError(signed);

  return { file_url: signed.data.signedUrl };
};

const makeEntity = (name) => {
  const table = tables[name];

  return {
    async list(sort, limit = 200) {
      const order = getOrder(sort);
      const result = await supabase
        .from(table)
        .select('*')
        .order(order.column, { ascending: order.ascending })
        .limit(limit);
      throwIfError(result);
      return result.data || [];
    },

    async create(payload) {
      const result = await supabase
        .from(table)
        .insert(stripReadonly(payload))
        .select()
        .single();
      throwIfError(result);
      return result.data;
    },

    async update(id, payload) {
      const result = await supabase
        .from(table)
        .update(stripReadonly(payload))
        .eq('id', id)
        .select()
        .single();
      throwIfError(result);
      return result.data;
    },

    async delete(id) {
      const result = await supabase.from(table).delete().eq('id', id);
      throwIfError(result);
      return true;
    },
  };
};

export const base44 = {
  auth: {
    async me() {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        const authError = error || new Error('Not authenticated');
        authError.status = 401;
        throw authError;
      }

      return {
        id: data.user.id,
        email: data.user.email,
        full_name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || '',
        role: data.user.app_metadata?.role || 'user',
      };
    },

    async loginViaEmailPassword(email, password) {
      const result = await supabase.auth.signInWithPassword({ email, password });
      throwIfError(result);
      return result.data;
    },

    async loginWithProvider(provider, redirectTo = '/dashboard') {
      const result = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}${redirectTo}` },
      });
      throwIfError(result);
      return result.data;
    },

    async register({ email, password }) {
      const result = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/dashboard` },
      });
      throwIfError(result);
      return result.data;
    },

    async resetPasswordRequest(email) {
      const result = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      throwIfError(result);
      return result.data;
    },

    async resetPassword({ newPassword }) {
      const result = await supabase.auth.updateUser({ password: newPassword });
      throwIfError(result);
      return result.data;
    },

    async verifyOtp({ email, otpCode }) {
      const result = await supabase.auth.verifyOtp({
        email,
        token: otpCode,
        type: 'signup',
      });
      throwIfError(result);
      return result.data;
    },

    async resendOtp(email) {
      const result = await supabase.auth.resend({ type: 'signup', email });
      throwIfError(result);
      return result.data;
    },

    async logout(redirectTo) {
      await supabase.auth.signOut();
      if (redirectTo) window.location.href = '/login';
    },

    redirectToLogin() {
      window.location.href = '/login';
    },

    setToken() {},
  },

  entities: {
    Application: makeEntity('Application'),
    Resume: makeEntity('Resume'),
    SupplementaryDocument: makeEntity('SupplementaryDocument'),
  },

  integrations: {
    Core: {
      UploadFile: uploadFile,
      async InvokeLLM(payload) {
        const { data, error } = await supabase.functions.invoke('jobtrackr-ai', {
          body: payload,
        });
        if (error) throw error;
        return data;
      },
    },
  },
};
