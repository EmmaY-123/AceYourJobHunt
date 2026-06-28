const SUPABASE_URL = "https://tqrhfnvrczfwqnjaehug.supabase.co";
const SUPABASE_KEY = "sb_publishable_mahppe_AEgUYVwEG07_Uag_yFCj92gT";

const statusEl = document.getElementById("status");
const connectBtn = document.getElementById("connect");
const saveBtn = document.getElementById("save");
const appliedBtn = document.getElementById("applied");

let savedApplication = null;

const setStatus = (message) => {
  statusEl.textContent = message;
};

const getStored = (keys) => chrome.storage.local.get(keys);
const setStored = (values) => chrome.storage.local.set(values);

function extractJobPage() {
  const clean = (value) => String(value || "").replace(/\s+/g, " ").trim();
  const compact = (value, limit = 30000) => clean(value).slice(0, limit);
  const asArray = (value) => (Array.isArray(value) ? value : [value]);

  const findJobPostings = () => {
    const scripts = [...document.querySelectorAll('script[type="application/ld+json"]')];
    const found = [];

    const visit = (node) => {
      if (!node || typeof node !== "object") return;
      const types = asArray(node["@type"]).map(String);
      if (types.includes("JobPosting")) found.push(node);
      asArray(node["@graph"]).forEach(visit);
      asArray(node.itemListElement).forEach(visit);
    };

    for (const script of scripts) {
      try {
        visit(JSON.parse(script.textContent));
      } catch {
        // ponytail: ignore broken JSON-LD; visible text fallback covers the page.
      }
    }

    return found;
  };

  const selection = compact(window.getSelection?.().toString(), 20000);
  const job = findJobPostings()[0];
  const pageText = compact(
    selection || document.querySelector("main")?.innerText || document.body?.innerText,
  );

  return {
    url: location.href,
    pageTitle: document.title,
    company: clean(job?.hiringOrganization?.name),
    title: clean(job?.title),
    description: compact(job?.description || pageText),
  };
}

const formatJobInfo = (job) =>
  [
    `Source URL: ${job.url}`,
    `Page Title: ${job.pageTitle}`,
    job.company && `Company: ${job.company}`,
    job.title && `Job Title: ${job.title}`,
    "",
    "Job Description:",
    job.description,
  ]
    .filter(Boolean)
    .join("\n");

const getCurrentJob = async () => {
  setStatus("Reading current tab...");

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const [result] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: extractJobPage,
  });

  return result.result;
};

const saveSession = async (session) => {
  await setStored({
    acejob_access_token: session.access_token,
    acejob_refresh_token: session.refresh_token,
    acejob_expires_at: Date.now() + Number(session.expires_in || 3600) * 1000,
  });
};

const parseAuthCallback = (url) => {
  const hash = new URL(url).hash.slice(1);
  return Object.fromEntries(new URLSearchParams(hash));
};

const refreshSession = async (refreshToken) => {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!response.ok) throw new Error("Session expired. Connect AceJob again.");
  const session = await response.json();
  await saveSession(session);
  return session.access_token;
};

const getAccessToken = async () => {
  const stored = await getStored(["acejob_access_token", "acejob_refresh_token", "acejob_expires_at"]);
  if (!stored.acejob_access_token) return null;

  if (Date.now() < Number(stored.acejob_expires_at || 0) - 60000) {
    return stored.acejob_access_token;
  }

  return refreshSession(stored.acejob_refresh_token);
};

const renderAuthState = async () => {
  const token = await getAccessToken().catch(() => null);
  connectBtn.hidden = Boolean(token);
  saveBtn.hidden = !token;
  if (!token) setStatus("Connect AceJob once to save jobs.");
};

connectBtn.addEventListener("click", async () => {
  const redirectTo = chrome.identity.getRedirectURL();
  const authUrl = `${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectTo)}`;
  setStatus("Opening Google sign-in...");

  try {
    const callbackUrl = await chrome.identity.launchWebAuthFlow({ url: authUrl, interactive: true });
    const session = parseAuthCallback(callbackUrl);
    if (!session.access_token) throw new Error("No access token returned.");
    await saveSession(session);
    await renderAuthState();
    setStatus("Connected. Ready to save.");
  } catch (error) {
    setStatus(`Connect failed. Add redirect URL in Supabase: ${redirectTo}`);
  }
});

saveBtn.addEventListener("click", async () => {
  setStatus("Saving to AceJob...");
  saveBtn.disabled = true;
  appliedBtn.hidden = true;

  try {
    const [token, capture] = await Promise.all([getAccessToken(), getCurrentJob()]);
    if (!token) throw new Error("Connect AceJob first.");

    const response = await fetch(`${SUPABASE_URL}/functions/v1/save-captured-job`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ capture }),
    });

    const result = await response.json();
    if (!response.ok || result.error) throw new Error(result.error || "Save failed.");

    savedApplication = result.application;
    setStatus("Saved to Wishlist.");
    appliedBtn.hidden = false;
  } catch (error) {
    setStatus(error?.message || "Save failed.");
  } finally {
    saveBtn.disabled = false;
  }
});

appliedBtn.addEventListener("click", async () => {
  if (!savedApplication?.id) return;
  setStatus("Moving to Applied...");
  appliedBtn.disabled = true;

  try {
    const token = await getAccessToken();
    const activityLog = [
      ...(savedApplication.activity_log || []),
      { status: "applied", from: savedApplication.status || "wishlist", entered_at: new Date().toISOString() },
    ];

    const response = await fetch(`${SUPABASE_URL}/rest/v1/applications?id=eq.${savedApplication.id}`, {
      method: "PATCH",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({ status: "applied", activity_log: activityLog }),
    });

    const [updated] = await response.json();
    if (!response.ok) throw new Error("Could not move application.");

    savedApplication = updated;
    setStatus("Moved to Applied.");
  } catch (error) {
    setStatus(error?.message || "Could not move application.");
  } finally {
    appliedBtn.disabled = false;
  }
});

document.getElementById("copy").addEventListener("click", async () => {
  try {
    const job = await getCurrentJob();
    await navigator.clipboard.writeText(formatJobInfo(job));
    setStatus("Copied. Paste it into AceJob.");
  } catch (error) {
    setStatus(error?.message || "Could not read this page.");
  }
});

renderAuthState();
