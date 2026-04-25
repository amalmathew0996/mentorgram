// /api/live-jobs.js — Consolidated live job sources
// Replaces: jobsacuk.js + jobs.js
// Returns BOTH RSS feeds AND Indeed/Adzuna/Reed in a single call (parallel)
// Usage: GET /api/live-jobs?q=software&location=London&source=all|rss|api

export const config = { runtime: "nodejs", maxDuration: 30 };

// ── Common helpers ──
const VISA_KW = ["visa sponsor","sponsorship","skilled worker","tier 2","certificate of sponsorship","will sponsor","work permit","cos ","visa provided","right to work provided"];
const NO_SPONSOR = ["no sponsorship","unable to sponsor","must have right to work","must already have the right","uk residency required","must be eligible to work in the uk"];

function isSponsored(title = "", desc = "") {
  const t = `${title} ${desc}`.toLowerCase();
  if (NO_SPONSOR.some(k => t.includes(k))) return false;
  return VISA_KW.some(k => t.includes(k));
}

function getSector(title = "", feedSector = "") {
  const t = (title || "").toLowerCase();
  if (/software|developer|programmer|web|mobile|devops|cloud|cyber|network|sysadmin|ux|ui|designer/.test(t)) return "Technology";
  if (/data|scientist|machine learning|ai |mlops|intelligence|analyst/.test(t)) return "AI & Data";
  if (/nurse|doctor|gp|nhs|healthcare|medical|dental|care|clinical|therapist|pharmacist|surgeon|radiograph|paramedic/.test(t)) return "Healthcare";
  if (/finance|financial|accountant|audit|banking|investment|payroll|actuar|risk|compliance/.test(t)) return "Finance";
  if (/engineer|mechanical|civil|electrical|chemical|aerospace|manufacturing|quantity surveyor/.test(t)) return "Engineering";
  if (/teacher|teaching|lecturer|education|school|university|academic/.test(t)) return "Education";
  if (/chef|cook|hotel|restaurant|hospitality|catering/.test(t)) return "Hospitality";
  if (/social worker|probation|council|government|police|civil service/.test(t)) return "Public Sector";
  if (/marketing|sales|business|operations|product manager|hr |human resources|supply chain/.test(t)) return "Business";
  return feedSector || "Other";
}

function clean(s = "") {
  return s.replace(/<[^>]+>/g,"").replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&nbsp;/g," ").trim();
}

// ═══════════════════════════════════════════════════════════════
// RSS FEEDS (jobs.ac.uk + Guardian Jobs)
// ═══════════════════════════════════════════════════════════════
const FEEDS = [
  { url: "https://www.jobs.ac.uk/jobs/computer-sciences/?format=rss",               sector: "Technology" },
  { url: "https://www.jobs.ac.uk/jobs/engineering-and-technology/?format=rss",      sector: "Engineering" },
  { url: "https://www.jobs.ac.uk/jobs/health-and-medical/?format=rss",              sector: "Healthcare" },
  { url: "https://www.jobs.ac.uk/jobs/health-wellbeing-and-care/?format=rss",       sector: "Healthcare" },
  { url: "https://www.jobs.ac.uk/jobs/business-and-management-studies/?format=rss", sector: "Business" },
  { url: "https://www.jobs.ac.uk/jobs/economics/?format=rss",                       sector: "Finance" },
  { url: "https://www.jobs.ac.uk/jobs/it-services/?format=rss",                     sector: "Technology" },
  { url: "https://www.jobs.ac.uk/jobs/finance-and-procurement/?format=rss",         sector: "Finance" },
  { url: "https://www.jobs.ac.uk/jobs/mathematics-and-statistics/?format=rss",      sector: "AI & Data" },
  { url: "https://www.jobs.ac.uk/jobs/biological-sciences/?format=rss",             sector: "Healthcare" },
  { url: "https://www.jobs.ac.uk/jobs/physical-and-environmental-sciences/?format=rss", sector: "Engineering" },
  { url: "https://www.jobs.ac.uk/jobs/education-studies-inc-tefl/?format=rss",      sector: "Education" },
  { url: "https://www.jobs.ac.uk/jobs/psychology/?format=rss",                      sector: "Healthcare" },
  { url: "https://www.jobs.ac.uk/jobs/law/?format=rss",                             sector: "Business" },
  { url: "https://www.jobs.ac.uk/jobs/social-sciences-and-social-care/?format=rss", sector: "Public Sector" },
  { url: "https://www.jobs.ac.uk/jobs/senior-management/?format=rss",               sector: "Business" },
  { url: "https://www.jobs.ac.uk/jobs/human-resources/?format=rss",                 sector: "Business" },
  { url: "https://www.jobs.ac.uk/jobs/pr-marketing-sales-and-communication/?format=rss", sector: "Business" },
  { url: "https://www.jobs.ac.uk/jobs/web-design-and-development/?format=rss",      sector: "Technology" },
  { url: "https://www.jobs.ac.uk/jobs/project-management-and-consulting/?format=rss",sector: "Business" },
  { url: "https://www.jobs.ac.uk/jobs/sustainability/?format=rss",                  sector: "Engineering" },
  { url: "https://www.jobs.ac.uk/jobs/international-activities/?format=rss",        sector: "Business" },
  { url: "https://www.jobs.ac.uk/jobs/administrative/?format=rss",                  sector: "Public Sector" },
  { url: "https://www.jobs.ac.uk/jobs/laboratory-clinical-and-technician/?format=rss", sector: "Healthcare" },
  { url: "https://www.jobs.ac.uk/jobs/architecture-building-and-planning/?format=rss", sector: "Engineering" },
  { url: "https://www.jobs.ac.uk/jobs/media-and-communications/?format=rss",        sector: "Business" },
  { url: "https://www.jobs.ac.uk/jobs/creative-arts-and-design/?format=rss",        sector: "Business" },
  { url: "https://www.jobs.ac.uk/jobs/languages-literature-and-culture/?format=rss",sector: "Education" },
  { url: "https://www.jobs.ac.uk/jobs/library-services-data-and-information-management/?format=rss", sector: "AI & Data" },
  { url: "https://www.jobs.ac.uk/jobs/historical-and-philosophical-studies/?format=rss", sector: "Education" },
  { url: "https://www.jobs.ac.uk/jobs/london/?format=rss",                          sector: "Technology" },
  { url: "https://www.jobs.ac.uk/jobs/manchester/?format=rss",                      sector: "Business" },
  { url: "https://www.jobs.ac.uk/jobs/birmingham/?format=rss",                      sector: "Healthcare" },
  { url: "https://www.jobs.ac.uk/jobs/leeds/?format=rss",                           sector: "Engineering" },
  { url: "https://www.jobs.ac.uk/jobs/edinburgh/?format=rss",                       sector: "Education" },
  { url: "https://www.jobs.ac.uk/jobs/bristol/?format=rss",                         sector: "Technology" },
  { url: "https://www.jobs.ac.uk/jobs/sheffield/?format=rss",                       sector: "Engineering" },
  { url: "https://www.jobs.ac.uk/jobs/nottingham/?format=rss",                      sector: "Healthcare" },
  { url: "https://www.jobs.ac.uk/jobs/glasgow/?format=rss",                         sector: "Business" },
  { url: "https://www.jobs.ac.uk/jobs/oxford/?format=rss",                          sector: "Education" },
  { url: "https://www.jobs.ac.uk/jobs/cambridge/?format=rss",                       sector: "AI & Data" },
  { url: "https://jobs.theguardian.com/jobs/technology/?format=rss",                sector: "Technology" },
  { url: "https://jobs.theguardian.com/jobs/healthcare/?format=rss",                sector: "Healthcare" },
  { url: "https://jobs.theguardian.com/jobs/finance/?format=rss",                   sector: "Finance" },
  { url: "https://jobs.theguardian.com/jobs/engineering/?format=rss",               sector: "Engineering" },
  { url: "https://jobs.theguardian.com/jobs/education/?format=rss",                 sector: "Education" },
  { url: "https://jobs.theguardian.com/jobs/social-care/?format=rss",               sector: "Public Sector" },
  { url: "https://jobs.theguardian.com/jobs/marketing-pr/?format=rss",              sector: "Business" },
  { url: "https://jobs.theguardian.com/jobs/charity/?format=rss",                   sector: "Public Sector" },
  { url: "https://jobs.theguardian.com/jobs/housing/?format=rss",                   sector: "Public Sector" },
  { url: "https://jobs.theguardian.com/jobs/data/?format=rss",                      sector: "AI & Data" },
  { url: "https://jobs.theguardian.com/jobs/science/?format=rss",                   sector: "Healthcare" },
  { url: "https://jobs.theguardian.com/jobs/environment/?format=rss",               sector: "Engineering" },
];

function detectSponsorshipRSS(title = "", desc = "") {
  const t = `${title} ${desc}`.toLowerCase();
  if (NO_SPONSOR.some(k => t.includes(k))) return false;
  if (VISA_KW.some(k => t.includes(k))) return true;
  return null;
}

function parseRSS(xml, feedSector) {
  const jobs = [];
  const items = xml.match(/<item[\s>][\s\S]*?<\/item>/g) || [];
  for (const item of items) {
    const get = (tag) => {
      const m = item.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([^<]*)<\\/${tag}>`));
      return m ? (m[1] ?? m[2] ?? "").trim() : "";
    };
    const title   = clean(get("title")).substring(0, 120);
    const link    = clean(get("link") || get("guid"));
    const pubDate = get("pubDate");
    const desc    = get("description") || "";
    if (!title || !link) continue;
    const org = desc.match(/(?:Organisation|Employer|Institution|Company):\s*([^\n<]+)/i);
    const loc = desc.match(/(?:Location|Place of [Ww]ork|Based in):\s*([^\n<,]+)/i);
    const sal = desc.match(/(?:Salary|Remuneration|Grade|Pay):\s*([^\n<]+)/i);
    let posted = "";
    if (pubDate) { try { posted = new Date(pubDate).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"}); } catch {} }
    jobs.push({
      title,
      company:     org ? clean(org[1]).substring(0,80) : "UK Employer",
      location:    loc ? clean(loc[1]).substring(0,80) : "United Kingdom",
      salary:      sal ? clean(sal[1]).substring(0,70) : "Competitive",
      sector:      getSector(title, feedSector),
      posted,
      url:         link,
      source:      "jobs.ac.uk",
      sponsorship: detectSponsorshipRSS(title, desc),
    });
  }
  return jobs;
}

async function fetchRSSJobs(q, loc) {
  const settled = await Promise.allSettled(
    FEEDS.map(({ url: feedUrl, sector }) =>
      fetch(feedUrl, {
        headers: { "User-Agent": "Mentorgram AI (+https://mentorgramai.com)" },
        signal: AbortSignal.timeout(10000)
      })
        .then(r => r.ok ? r.text() : "")
        .then(xml => xml ? parseRSS(xml, sector) : [])
        .catch(() => [])
    )
  );
  let jobs = settled.filter(r => r.status === "fulfilled").flatMap(r => r.value);
  const seen = new Set();
  jobs = jobs.filter(j => { const k = j.url.split("?")[0]; if (seen.has(k)) return false; seen.add(k); return true; });
  if (q) jobs = jobs.filter(j => j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q) || j.location.toLowerCase().includes(q) || j.sector.toLowerCase().includes(q));
  if (loc && loc !== "uk" && loc !== "united kingdom") jobs = jobs.filter(j => j.location.toLowerCase().includes(loc));
  return jobs;
}

// ═══════════════════════════════════════════════════════════════
// API JOBS (Indeed via MCP, Adzuna, Reed)
// ═══════════════════════════════════════════════════════════════
async function searchIndeed(apiKey, q, loc) {
  if (!apiKey) return [];
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

async function searchAdzuna(appId, appKey, q, page = 1) {
  if (!appId || !appKey) return [];
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

async function searchReed(reedKey, q) {
  if (!reedKey) return [];
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

async function fetchAPIJobs(q, loc) {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const adzunaId     = process.env.ADZUNA_APP_ID;
  const adzunaKey    = process.env.ADZUNA_APP_KEY;
  const reedKey      = process.env.REED_API_KEY;

  const searchTerm = q || "visa sponsorship UK jobs";

  const [indeedResults, adzunaResults, reedResults] = await Promise.allSettled([
    q
      ? Promise.all([
          searchIndeed(anthropicKey, q, loc),
          searchIndeed(anthropicKey, `${q} visa sponsorship`, "London"),
          searchIndeed(anthropicKey, q, "Manchester"),
        ]).then(r => r.flat())
      : Promise.all([
          searchIndeed(anthropicKey, "visa sponsorship software engineer", "London"),
          searchIndeed(anthropicKey, "visa sponsorship NHS healthcare nurse", "United Kingdom"),
          searchIndeed(anthropicKey, "visa sponsorship engineer", "United Kingdom"),
        ]).then(r => r.flat()),
    searchAdzuna(adzunaId, adzunaKey, q || "visa sponsorship"),
    searchReed(reedKey, q || "visa sponsorship"),
  ]);

  const indeedJobs = indeedResults.status === "fulfilled" ? indeedResults.value : [];
  const adzunaJobs = adzunaResults.status === "fulfilled" ? adzunaResults.value : [];
  const reedJobs   = reedResults.status   === "fulfilled" ? reedResults.value   : [];

  const all = [...indeedJobs, ...adzunaJobs, ...reedJobs];

  const seen = new Set();
  return all.filter(j => {
    if (!j.title || !j.company) return false;
    const key = `${j.title}||${j.company}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    j.sector = j.sector || getSector(j.title);
    j.salary = j.salary || "Competitive";
    return true;
  });
}

// ═══════════════════════════════════════════════════════════════
// MAIN HANDLER
// ═══════════════════════════════════════════════════════════════
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");

  const url = new URL(req.url, "https://mentorgramai.com");
  const q   = (url.searchParams.get("q") || "").toLowerCase().trim();
  const loc = (url.searchParams.get("location") || "").toLowerCase().trim();
  const source = (url.searchParams.get("source") || "all").toLowerCase();

  try {
    let rssJobs = [];
    let apiJobs = [];

    if (source === "all" || source === "rss") {
      rssJobs = await fetchRSSJobs(q, loc);
    }
    if (source === "all" || source === "api") {
      apiJobs = await fetchAPIJobs(q || "", loc || "United Kingdom");
    }

    // Merge + sort: sponsored first, then most recent
    const all = [...apiJobs, ...rssJobs];
    all.sort((a, b) => {
      if (a.sponsorship && !b.sponsorship) return -1;
      if (!a.sponsorship && b.sponsorship) return 1;
      try {
        if (!a.posted) return 1;
        if (!b.posted) return -1;
        return new Date(b.posted) - new Date(a.posted);
      } catch { return 0; }
    });

    return res.status(200).json({
      jobs: all,
      count: all.length,
      sources: { rss: rssJobs.length, api: apiJobs.length },
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message, jobs: [] });
  }
}
