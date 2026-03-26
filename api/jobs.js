export const config = { runtime: "nodejs" };

const VISA_KW = ["visa sponsor","sponsorship","skilled worker","tier 2","certificate of sponsorship","will sponsor","work permit","cos ","visa provided","right to work provided"];

function isSponsored(title = "", desc = "") {
  const t = `${title} ${desc}`.toLowerCase();
  if (t.includes("no sponsorship") || t.includes("unable to sponsor") || t.includes("sponsorship not available")) return false;
  return VISA_KW.some(k => t.includes(k));
}

function getSector(title = "") {
  const t = title.toLowerCase();
  if (/software|developer|programmer|web|mobile|devops|cloud|cyber|network|sysadmin|ux|ui|designer/.test(t)) return "Technology";
  if (/data|scientist|machine learning|ai |mlops|intelligence|analyst/.test(t)) return "AI & Data";
  if (/nurse|doctor|gp|nhs|healthcare|medical|dental|care|clinical|therapist|pharmacist|surgeon|radiograph|paramedic/.test(t)) return "Healthcare";
  if (/finance|financial|accountant|audit|banking|investment|payroll|actuar|risk|compliance/.test(t)) return "Finance";
  if (/engineer|mechanical|civil|electrical|chemical|aerospace|manufacturing|quantity surveyor/.test(t)) return "Engineering";
  if (/teacher|teaching|lecturer|education|school|university|academic/.test(t)) return "Education";
  if (/chef|cook|hotel|restaurant|hospitality|catering/.test(t)) return "Hospitality";
  if (/social worker|probation|council|government|police|civil service/.test(t)) return "Public Sector";
  if (/marketing|sales|business|operations|product manager|hr |human resources|supply chain/.test(t)) return "Business";
  return "Other";
}

// ── Indeed via MCP ────────────────────────────────────────────────────────
async function searchIndeed(apiKey, q, loc) {
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "mcp-client-2025-04-04",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2000,
        mcp_servers: [{ type: "url", url: "https://mcp.indeed.com/claude/mcp", name: "indeed" }],
        system: `Search Indeed UK jobs. country_code GB, location "${loc}", query "${q}".
Return ONLY a valid JSON array (no markdown, no text).
Schema: {"title":"","company":"","location":"","salary":"","posted":"","url":"","sponsorship":false}
sponsorship:true ONLY if listing explicitly mentions visa sponsorship/skilled worker/work permit.
Return max 10 jobs.`,
        messages: [{ role: "user", content: q }],
      }),
    });
    const d = await r.json();
    const txt = (d.content || []).filter(b => b.type === "text").map(b => b.text).join("");
    const s = txt.indexOf("["), e = txt.lastIndexOf("]");
    if (s < 0 || e < 0) return [];
    const jobs = JSON.parse(txt.slice(s, e + 1));
    return Array.isArray(jobs) ? jobs.map(j => ({ ...j, source: "indeed" })) : [];
  } catch { return []; }
}

// ── Adzuna REST API ────────────────────────────────────────────────────────
async function searchAdzuna(appId, appKey, q, page = 1) {
  try {
    const params = new URLSearchParams({
      app_id: appId,
      app_key: appKey,
      results_per_page: "50",
      what: q,
      where: "UK",
      content_type: "application/json",
    });
    const r = await fetch(`https://api.adzuna.com/v1/api/jobs/gb/search/${page}?${params}`);
    if (!r.ok) return [];
    const d = await r.json();
    return (d.results || []).map(j => ({
      title:       j.title || "",
      company:     j.company?.display_name || "Unknown Company",
      location:    j.location?.display_name || "United Kingdom",
      salary:      j.salary_min ? `£${Math.round(j.salary_min).toLocaleString()}–£${Math.round(j.salary_max || j.salary_min).toLocaleString()}/yr` : "Competitive",
      posted:      j.created ? new Date(j.created).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "",
      url:         j.redirect_url || "",
      sponsorship: isSponsored(j.title, j.description || ""),
      source:      "adzuna",
    }));
  } catch { return []; }
}

// ── Reed REST API ──────────────────────────────────────────────────────────
async function searchReed(reedKey, q) {
  try {
    const params = new URLSearchParams({ keywords: q, locationName: "United Kingdom", resultsToTake: "50" });
    const r = await fetch(`https://www.reed.co.uk/api/1.0/search?${params}`, {
      headers: { Authorization: `Basic ${Buffer.from(`${reedKey}:`).toString("base64")}` },
    });
    if (!r.ok) return [];
    const d = await r.json();
    return (d.results || []).map(j => ({
      title:       j.jobTitle || "",
      company:     j.employerName || "Unknown Company",
      location:    j.locationName || "United Kingdom",
      salary:      j.minimumSalary ? `£${Math.round(j.minimumSalary).toLocaleString()}–£${Math.round(j.maximumSalary || j.minimumSalary).toLocaleString()}/yr` : "Competitive",
      posted:      j.date ? new Date(j.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "",
      url:         `https://www.reed.co.uk/jobs/${j.jobId}`,
      sponsorship: isSponsored(j.jobTitle, j.jobDescription || ""),
      source:      "reed",
    }));
  } catch { return []; }
}

export default async function handler(req, res) {
  const cors = { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" };

  const url = new URL(req.url, "https://mentorgramai.com");
  const customQ   = url.searchParams.get("q") || "";
  const customLoc = url.searchParams.get("location") || "United Kingdom";

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const adzunaId     = process.env.ADZUNA_APP_ID;
  const adzunaKey    = process.env.ADZUNA_APP_KEY;
  const reedKey      = process.env.REED_API_KEY;

  const searchTerm = customQ || "visa sponsorship UK jobs";

  try {
    // Run all 3 APIs in parallel
    const [indeedResults, adzunaResults, reedResults] = await Promise.allSettled([
      // Indeed: 5 searches for custom query, 3 for default
      customQ
        ? Promise.all([
            searchIndeed(anthropicKey, customQ, customLoc),
            searchIndeed(anthropicKey, `${customQ} visa sponsorship`, "London"),
            searchIndeed(anthropicKey, customQ, "Manchester"),
          ]).then(r => r.flat())
        : Promise.all([
            searchIndeed(anthropicKey, "visa sponsorship software engineer", "London"),
            searchIndeed(anthropicKey, "visa sponsorship NHS healthcare nurse", "United Kingdom"),
            searchIndeed(anthropicKey, "visa sponsorship engineer", "United Kingdom"),
          ]).then(r => r.flat()),

      // Adzuna: search with query
      adzunaId && adzunaKey
        ? searchAdzuna(adzunaId, adzunaKey, customQ || "visa sponsorship")
        : Promise.resolve([]),

      // Reed: search with query
      reedKey
        ? searchReed(reedKey, customQ || "visa sponsorship")
        : Promise.resolve([]),
    ]);

    const indeedJobs = indeedResults.status === "fulfilled" ? indeedResults.value : [];
    const adzunaJobs = adzunaResults.status === "fulfilled" ? adzunaResults.value : [];
    const reedJobs   = reedResults.status   === "fulfilled" ? reedResults.value   : [];

    // Merge: Indeed first (most relevant for sponsorship), then Adzuna, then Reed
    const all = [...indeedJobs, ...adzunaJobs, ...reedJobs];

    // Deduplicate by title+company
    const seen = new Set();
    const jobs = all.filter(j => {
      if (!j.title || !j.company) return false;
      const key = `${j.title}||${j.company}`.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      j.sector = j.sector || getSector(j.title);
      j.salary = j.salary || "Competitive";
      return true;
    });

    // Sort: sponsored first
    jobs.sort((a, b) => {
      if (a.sponsorship && !b.sponsorship) return -1;
      if (!a.sponsorship && b.sponsorship) return 1;
      return 0;
    });

    return res.status(200).json({ jobs, total: jobs.length, updatedAt: new Date().toISOString() });
  } catch (err) {
    return res.status(500).json({ error: err.message, jobs: [] });
  }
}
