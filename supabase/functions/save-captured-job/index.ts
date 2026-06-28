import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const model = Deno.env.get("GEMINI_MODEL") || "gemini-2.5-flash-lite";
const apiKey = Deno.env.get("GEMINI_API_KEY");
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const parseGeminiJson = (text: string) => {
  const cleaned = text.replace(/```json|```/g, "").trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  return JSON.parse(match ? match[0] : cleaned);
};

const callGemini = async (text: string) => {
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        generationConfig: { responseMimeType: "application/json" },
        contents: [{ role: "user", parts: [{ text }] }],
      }),
    },
  );

  if (!response.ok) throw new Error(await response.text());

  const data = await response.json();
  return parseGeminiJson(data.candidates?.[0]?.content?.parts?.[0]?.text || "{}");
};

const getClient = (authorization: string) => {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase function environment");
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authorization } },
  });
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authorization = request.headers.get("authorization");
    if (!authorization) return json({ error: "Not authenticated" }, 401);

    const body = await request.json();
    const capture = body.capture || {};
    const now = new Date().toISOString();

    const jobInfo = await callGemini(`Clean this captured browser text from a job posting page.

URL: ${capture.url || ""}
Page title: ${capture.pageTitle || ""}
Possible company from structured data: ${capture.company || ""}
Possible job title from structured data: ${capture.title || ""}

Raw captured text:
${String(capture.description || "").slice(0, 50000)}

Return JSON with:
- company_name: the real employer or hiring brand, not the page vendor
- job_title: the specific active job title from the current URL/page, not a generic page title
- description: a readable, sectioned job description in the source language

Rules:
- Do not dump navigation, breadcrumbs, buttons, duplicate text, or unrelated job cards.
- If the page contains multiple directions under one posting, keep them under clear headings.
- Use line breaks and labels like 职位描述, 招聘方向, 工作职责, 任职要求, 工作地点 when present.`);

    const supabase = getClient(authorization);
    const { data, error } = await supabase
      .from("applications")
      .insert({
        company_name: jobInfo.company_name || "",
        job_title: jobInfo.job_title || capture.pageTitle || "Untitled role",
        description: jobInfo.description || capture.description || "",
        job_url: capture.url || "",
        status: "wishlist",
        date_applied: new Date().toISOString().slice(0, 10),
        activity_log: [{ status: "wishlist", from: null, entered_at: now }],
      })
      .select()
      .single();

    if (error) throw error;
    return json({ application: data });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Save failed" }, 500);
  }
});
