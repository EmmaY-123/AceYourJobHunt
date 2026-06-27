const statusEl = document.getElementById("status");

const setStatus = (message) => {
  statusEl.textContent = message;
};

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

const encodeJob = (job) => {
  const bytes = new TextEncoder().encode(JSON.stringify(job));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
};

document.getElementById("autofill").addEventListener("click", async () => {
  try {
    const job = await getCurrentJob();
    const url = `https://aceyourjobhunt.tech/dashboard#jobtrackr=${encodeURIComponent(encodeJob(job))}`;
    await chrome.tabs.create({ url });
    setStatus("Opening JobTrackr...");
  } catch (error) {
    setStatus(error?.message || "Could not read this page.");
  }
});

document.getElementById("copy").addEventListener("click", async () => {
  try {
    const job = await getCurrentJob();
    const text = formatJobInfo(job);
    await navigator.clipboard.writeText(text);
    setStatus("Copied. Paste it into JobTrackr.");
  } catch (error) {
    setStatus(error?.message || "Could not read this page.");
  }
});
