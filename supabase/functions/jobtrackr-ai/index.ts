const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const model = Deno.env.get("GEMINI_MODEL") || "gemini-2.5-flash-lite";
const apiKey = Deno.env.get("GEMINI_API_KEY");

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const stripHtml = (html: string) =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 50000);

const extractUrl = (text: string) => text.match(/https?:\/\/[^\s)]+/i)?.[0];

const fetchJobPage = async (prompt: string) => {
  const url = extractUrl(prompt);
  if (!url) return "";

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 JobTrackr/1.0",
        "Accept": "text/html,application/xhtml+xml",
      },
    });
    if (!response.ok) return "";
    return stripHtml(await response.text());
  } catch {
    return "";
  }
};

const fetchPdfParts = async (urls: string[] = []) => {
  const parts = [];

  for (const url of urls.slice(0, 5)) {
    try {
      const response = await fetch(url);
      const contentType = response.headers.get("content-type") || "";
      if (!response.ok || !contentType.includes("pdf")) continue;

      const bytes = new Uint8Array(await response.arrayBuffer());
      let binary = "";
      for (const byte of bytes) binary += String.fromCharCode(byte);
      parts.push({
        inline_data: {
          mime_type: "application/pdf",
          data: btoa(binary),
        },
      });
    } catch {
      // ponytail: skip unreadable files; add DOCX/PDF parsing retries if matching quality needs it.
    }
  }

  return parts;
};

const parseGeminiJson = (text: string) => {
  const cleaned = text.replace(/```json|```/g, "").trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  return JSON.parse(match ? match[0] : cleaned);
};

const callGemini = async (parts: unknown[]) => {
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        generationConfig: { responseMimeType: "application/json" },
        contents: [{ role: "user", parts }],
      }),
    },
  );

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const data = await response.json();
  return parseGeminiJson(data.candidates?.[0]?.content?.parts?.[0]?.text || "{}");
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await request.json();
    const prompt = String(body.prompt || "");
    const wantsJobInfo = Boolean(body.response_json_schema?.properties?.company_name);
    const wantsResumeMatch = Boolean(body.response_json_schema?.properties?.bestMatch);

    if (wantsJobInfo) {
      const pageText = await fetchJobPage(prompt);
      return json(await callGemini([
        {
          text:
            `${prompt}\n\nReturn only JSON with company_name, job_title, and description.` +
            (pageText ? `\n\nFetched page text:\n${pageText}` : ""),
        },
      ]));
    }

    if (wantsResumeMatch) {
      const pdfParts = await fetchPdfParts(body.file_urls);
      return json(await callGemini([
        { text: `${prompt}\n\nReturn only JSON with bestMatch, reason, and score.` },
        ...pdfParts,
      ]));
    }

    return json(await callGemini([{ text: prompt }]));
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "AI request failed" }, 500);
  }
});
