import { fetchCustomSites, siteURL } from "../lib/jobWatchSites.js";
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
// COUNCIL RSS FEEDS (jobsgopublic, myjobscotland, wmjobs, lg-jobs)
// ═══════════════════════════════════════════════════════════════
const COUNCIL_FEEDS = [
  // jobsgopublic.com — RSS feed covers ~150 English councils
  // Their RSS: https://www.jobsgopublic.com/rss/latest_jobs
  { url: "https://www.jobsgopublic.com/rss/latest_jobs",      source: "jobsgopublic" },
  // myjobscotland.gov.uk — Scottish councils
  { url: "https://www.myjobscotland.gov.uk/rss.xml",           source: "myjobscotland" },
  // wmjobs.co.uk — West Midlands councils (Birmingham, Coventry, Solihull, etc.)
  { url: "https://www.wmjobs.co.uk/rss/latest",                source: "wmjobs" },
  // lg-jobs.co.uk — Local Government Jobs aggregator
  { url: "https://www.lg-jobs.co.uk/rss/jobs",                 source: "lg-jobs" },
];

function parseCouncilRSS(xml, source) {
  const jobs = [];
  const items = xml.match(/<item[\s>][\s\S]*?<\/item>/g) || [];
  for (const item of items) {
    const get = (tag) => {
      const m = item.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([^<]*)<\\/${tag}>`));
      return m ? (m[1] ?? m[2] ?? "").trim() : "";
    };
    const title   = clean(get("title")).substring(0, 140);
    const link    = clean(get("link") || get("guid"));
    const pubDate = get("pubDate");
    const desc    = get("description") || "";
    if (!title || !link) continue;

    // Try to extract council name from description patterns
    // jobsgopublic often uses "Employer: <Council>" or the title contains the council
    const employerMatch = desc.match(/(?:Employer|Organisation|Company|Council):\s*([^\n<]+)/i);
    let council = employerMatch ? clean(employerMatch[1]).substring(0, 80) : "UK Council";

    // If no employer found, try to detect from title (common pattern: "Job Title - Council Name")
    if (council === "UK Council") {
      const titleParts = title.split(" - ");
      if (titleParts.length >= 2) {
        const lastPart = titleParts[titleParts.length - 1].trim();
        // Check if last part looks like a council name (contains "council", "borough", "city", "county")
        if (/council|borough|city|county|authority|district/i.test(lastPart)) {
          council = lastPart;
        }
      }
    }

    const loc = desc.match(/(?:Location|Place of [Ww]ork|Based in):\s*([^\n<,]+)/i);
    const sal = desc.match(/(?:Salary|Grade|Pay):\s*([^\n<]+)/i);
    let posted = "";
    if (pubDate) { try { posted = new Date(pubDate).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"}); } catch {} }

    jobs.push({
      title,
      company:     council,
      location:    loc ? clean(loc[1]).substring(0,80) : "United Kingdom",
      salary:      sal ? clean(sal[1]).substring(0,70) : "See listing",
      sector:      "Public Sector",
      posted,
      url:         link,
      source,
      sponsorship: null, // Councils don't typically sponsor visas
      isCouncil:   true,
    });
  }
  return jobs;
}

async function fetchCouncilJobs(councilName) {
  const settled = await Promise.allSettled(
    COUNCIL_FEEDS.map(({ url: feedUrl, source }) =>
      fetch(feedUrl, {
        headers: { "User-Agent": "Mentorgram AI (+https://mentorgramai.com)" },
        signal: AbortSignal.timeout(10000)
      })
        .then(r => r.ok ? r.text() : "")
        .then(xml => xml ? parseCouncilRSS(xml, source) : [])
        .catch(() => [])
    )
  );
  let jobs = settled.filter(r => r.status === "fulfilled").flatMap(r => r.value);

  // Dedupe
  const seen = new Set();
  jobs = jobs.filter(j => { const k = j.url.split("?")[0]; if (seen.has(k)) return false; seen.add(k); return true; });

  // Filter by specific council name if provided
  if (councilName) {
    const cn = councilName.toLowerCase().trim();
    jobs = jobs.filter(j =>
      j.company.toLowerCase().includes(cn) ||
      j.location.toLowerCase().includes(cn) ||
      j.title.toLowerCase().includes(cn)
    );
  }

  // Sort by most recent
  jobs.sort((a, b) => {
    try {
      if (!a.posted) return 1;
      if (!b.posted) return -1;
      return new Date(b.posted) - new Date(a.posted);
    } catch { return 0; }
  });

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

// ═══════════════════════════════════════════════════════════════
// GERMANY JOB SEARCH (Adzuna DE + English-only filter)
// ═══════════════════════════════════════════════════════════════

const GERMAN_ENGLISH_KW = [
  "english speaking", "english-speaking", "in english", "english required",
  "english language", "no german required", "no german needed",
  "english fluent", "international team", "international company",
  "english as working language", "english communication",
];

const GERMAN_NO_ENGLISH = [
  "deutsch fließend", "deutschkenntnisse erforderlich", "muttersprache deutsch",
  "sehr gute deutschkenntnisse", "verhandlungssicher deutsch",
];

function isEnglishSpeaking(title = "", desc = "") {
  const t = `${title} ${desc}`.toLowerCase();
  // If description explicitly requires strong German → exclude
  if (GERMAN_NO_ENGLISH.some(k => t.includes(k))) return false;
  // If English is mentioned as working language → include
  if (GERMAN_ENGLISH_KW.some(k => t.includes(k))) return true;
  // Default: check if title is in English (heuristic)
  const englishOnlyTitle = /^[a-zA-Z0-9\s\-\/&\(\)\+,\.]+$/.test(title);
  return englishOnlyTitle;
}

const GERMAN_VISA_KW = [
  "blue card", "blaue karte", "visa sponsorship", "visum",
  "work permit", "arbeitserlaubnis", "relocation", "relocate to germany",
  "international candidates welcome", "we sponsor visas",
];

function isGermanVisaSponsored(title = "", desc = "") {
  const t = `${title} ${desc}`.toLowerCase();
  return GERMAN_VISA_KW.some(k => t.includes(k));
}

async function searchAdzunaGermany(appId, appKey, q, page = 1) {
  if (!appId || !appKey) return [];
  try {
    const params = new URLSearchParams({
      app_id: appId,
      app_key: appKey,
      results_per_page: "50",
      what: q || "english",
      content_type: "application/json",
    });
    const r = await fetch(`https://api.adzuna.com/v1/api/jobs/de/search/${page}?${params}`);
    if (!r.ok) return [];
    const d = await r.json();
    return (d.results || [])
      .map(j => ({
        title:       j.title || "",
        company:     j.company?.display_name || "Unknown Company",
        location:    j.location?.display_name || "Germany",
        salary:      j.salary_min ? `€${Math.round(j.salary_min).toLocaleString()}–€${Math.round(j.salary_max || j.salary_min).toLocaleString()}/yr` : "Competitive",
        posted:      j.created ? new Date(j.created).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "",
        url:         j.redirect_url || "",
        sponsorship: isGermanVisaSponsored(j.title, j.description || ""),
        source:      "adzuna-de",
        country:     "DE",
        description: j.description || "",
      }))
      // Filter to English-friendly roles only
      .filter(j => isEnglishSpeaking(j.title, j.description));
  } catch { return []; }
}

// German RSS feeds (English-friendly companies)
const GERMAN_ENGLISH_FEEDS = [
  // AngelList Berlin / Berlin Startup Jobs
  { url: "https://berlinstartupjobs.com/feed/",              sector: "Technology" },
  // JobsInBerlin — English jobs in Berlin
  { url: "https://www.jobsinberlin.eu/rss/jobs",             sector: "Technology" },
];

async function fetchGermanRSSJobs() {
  const settled = await Promise.allSettled(
    GERMAN_ENGLISH_FEEDS.map(({ url: feedUrl, sector }) =>
      fetch(feedUrl, {
        headers: { "User-Agent": "Mentorgram AI (+https://mentorgramai.com)" },
        signal: AbortSignal.timeout(10000),
      })
        .then(r => r.ok ? r.text() : "")
        .then(xml => {
          if (!xml) return [];
          const items = xml.match(/<item[\s>][\s\S]*?<\/item>/g) || [];
          return items.map(item => {
            const get = (tag) => {
              const m = item.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([^<]*)<\\/${tag}>`));
              return m ? (m[1] ?? m[2] ?? "").trim() : "";
            };
            const title = clean(get("title")).substring(0, 140);
            const link  = clean(get("link") || get("guid"));
            const desc  = get("description") || "";
            const pubDate = get("pubDate");
            if (!title || !link) return null;
            let posted = "";
            if (pubDate) { try { posted = new Date(pubDate).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"}); } catch {} }
            return {
              title,
              company: "Berlin Startup",
              location: "Berlin, Germany",
              salary: "Competitive",
              sector,
              posted,
              url: link,
              source: "berlinstartupjobs",
              sponsorship: isGermanVisaSponsored(title, desc),
              country: "DE",
            };
          }).filter(Boolean);
        })
        .catch(() => [])
    )
  );
  return settled.filter(r => r.status === "fulfilled").flatMap(r => r.value);
}

async function fetchGermanyJobs(q) {
  const adzunaId  = process.env.ADZUNA_APP_ID;
  const adzunaKey = process.env.ADZUNA_APP_KEY;

  const [adzunaResults, rssResults] = await Promise.allSettled([
    q
      ? searchAdzunaGermany(adzunaId, adzunaKey, q)
      : Promise.all([
          searchAdzunaGermany(adzunaId, adzunaKey, "english"),
          searchAdzunaGermany(adzunaId, adzunaKey, "software engineer english"),
          searchAdzunaGermany(adzunaId, adzunaKey, "blue card visa"),
        ]).then(r => r.flat()),
    fetchGermanRSSJobs(),
  ]);

  const adzunaJobs = adzunaResults.status === "fulfilled" ? adzunaResults.value : [];
  const rssJobs    = rssResults.status    === "fulfilled" ? rssResults.value    : [];

  const all = [...adzunaJobs, ...rssJobs];

  const seen = new Set();
  return all.filter(j => {
    if (!j.title || !j.company) return false;
    const key = `${j.title}||${j.company}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    j.sector = j.sector || getSector(j.title);
    j.salary = j.salary || "Competitive";
    j.country = "DE";
    return true;
  });
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
// Current NHS Jobs search pages replace the retired vacancy RSS feed for Job Watch.
export function parseNHSWatch(html) {
  const text = value => clean(value || "").replace(/\s+/g, " ").trim();
  const blocks = html.split(/<li\b[^>]*data-test="search-result"[^>]*>/).slice(1);
  return blocks.flatMap(block => {
    const link = block.match(/<a\b[^>]*href="([^"]*\/candidate\/jobadvert\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/);
    if (!link) return [];
    const employer = block.match(/data-test="search-result-location"[^>]*>[\s\S]*?<h3[^>]*>([\s\S]*?)<div/);
    const location = block.match(/class="location-font-size"[^>]*>([\s\S]*?)<\/div>/);
    const field = name => text(block.match(new RegExp(`data-test="search-result-${name}"[^>]*>[\\s\\S]*?<strong[^>]*>([\\s\\S]*?)<\\/strong>`))?.[1]);
    const url = new URL(clean(link[1]), "https://www.jobs.nhs.uk");
    url.search = "";
    if (url.hostname !== "www.jobs.nhs.uk") return [];
    return [{ title: text(link[2]), url: url.href, company: text(employer?.[1]), location: text(location?.[1]), salary: field("salary"), posted: field("publicationDate"), closing_date: field("closingDate"), source: "NHS Jobs", sponsorship: null, origin: "live" }];
  });
}

async function fetchNHSWatch(titles) {
  const warnings = ["NHS live search checks the first results page for up to ten job titles; use the source website for a complete search."];
  if (!titles.length) return { jobs: [], warnings: ["Enter a job title to search NHS Jobs."] };
  const pages = await Promise.all(titles.map(async title => {
    try {
      const params = new URLSearchParams({ keyword: title, language: "en" });
      const response = await fetch(`https://www.jobs.nhs.uk/candidate/search/results?${params}`, { signal: AbortSignal.timeout(10000) });
      if (!response.ok) throw new Error("Unavailable");
      const html = await response.text();
      if (!html.includes("data-test=\'search-result-query\'") && !html.includes('data-test="search-result-query"')) throw new Error("Search page unavailable");
      return { ok: true, jobs: parseNHSWatch(html) };
    } catch { return { ok: false, jobs: [] }; }
  }));
  if (pages.some(p => !p.ok)) warnings.push("Some NHS live searches were unavailable. Results may be incomplete.");
  const seen = new Set();
  const jobs = pages.flatMap(p => p.jobs).filter(job => {
    if (seen.has(job.url)) return false;
    seen.add(job.url);
    return titles.some(title => title.toLowerCase().split(/\s+/).every(word => job.title.toLowerCase().includes(word)));
  });
  // Read a bounded number of actual adverts to identify explicit sponsorship text.
  await Promise.all(jobs.slice(0, 20).map(async job => {
    try {
      const response = await fetch(job.url, { signal: AbortSignal.timeout(7000) });
      if (!response.ok) return;
      const html = await response.text();
      const description = clean(html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] || "");
      if (description) job.sponsorship = detectSponsorshipRSS(job.title, description);
    } catch { /* Leave sponsorship unknown when an advert cannot be read. */ }
  }));
  return { jobs, warnings, available: pages.some(page => page.ok) };
}

export async function fetchWatchJobs({ selected = [], titles = [], customSites = [] }) {
      const customSearch = fetchCustomSites(customSites);
      const feeds = [];
      if (selected.includes("jobs_ac_uk")) {
        feeds.push(...FEEDS.filter(f => new URL(f.url).hostname === "www.jobs.ac.uk")
          .map(f => ({ ...f, name: "jobs.ac.uk" })));
      }
      const nhsSearch = selected.includes("nhs_jobs") ? fetchNHSWatch(titles) : Promise.resolve({ jobs: [], warnings: [] });
      const results = await Promise.all(feeds.map(async feed => {
        try {
          const response = await fetch(feed.url, {
            headers: { "User-Agent": "Mentorgram AI (+https://mentorgramai.com)" },
            signal: AbortSignal.timeout(10000),
          });
          if (!response.ok) throw new Error("Feed unavailable");
          const xml = await response.text();
          if (!/<rss[\s>]|<rdf:RDF[\s>]/i.test(xml)) throw new Error("Invalid feed");
          return { name: feed.name, ok: true, jobs: parseRSS(xml, feed.sector).map(job => ({ ...job, source: feed.name, origin: "live" })) };
        } catch {
          return { name: feed.name, ok: false, jobs: [] };
        }
      }));
      const nhs = await nhsSearch;
      const custom = await customSearch;
      const warnings = [...nhs.warnings, ...custom.map(result => result.warning).filter(Boolean)];
      for (const name of [...new Set(feeds.map(f => f.name))]) {
        const group = results.filter(r => r.name === name);
        const failed = group.filter(r => !r.ok).length;
        if (failed) warnings.push(`${name}: ${failed === group.length ? "live feed unavailable" : "some live feeds unavailable"}. Stored listings may still appear.`);
      }
      if (selected.includes("trac") || selected.includes("nhs_scotland")) {
        warnings.push("Trac and NHS Scotland currently use stored listings only; direct live feeds are not connected.");
      }
      return { available: results.some(result => result.ok) || nhs.available === true || custom.some(result => result.available), jobs: [...custom.flatMap(r => r.jobs), ...nhs.jobs, ...results.flatMap(r => r.jobs)], warnings, updatedAt: new Date().toISOString() };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");

  const url = new URL(req.url, "https://mentorgramai.com");
  const q   = (url.searchParams.get("q") || "").toLowerCase().trim();
  const loc = (url.searchParams.get("location") || "").toLowerCase().trim();
  const source = (url.searchParams.get("source") || "all").toLowerCase();
  const council = (url.searchParams.get("council") || "").trim();
  const country = (url.searchParams.get("country") || "UK").toUpperCase();

  try {
    // Job Watch uses only the selected direct feeds, without paid search APIs.
    if (source === "job-watch") {
      res.setHeader("Cache-Control", "no-store");
      let customSites;
      try {
        customSites = JSON.parse(url.searchParams.get("sites") || "[]");
        if (!Array.isArray(customSites) || customSites.length > 5 || customSites.some(site => typeof site !== "string")) throw new Error("Invalid sites");
        customSites = [...new Set(customSites.map(site => siteURL(site).href))];
      } catch { return res.status(400).json({ error: "Add up to five public HTTPS site URLs.", jobs: [] }); }
      if (customSites.length) {
        const token = req.headers?.authorization;
        const supabaseUrl = process.env.VITE_SUPABASE_URL;
        const key = process.env.VITE_SUPABASE_ANON_KEY;
        if (!token?.startsWith("Bearer ") || !supabaseUrl || !key) return res.status(401).json({ error: "Sign in again to search your added sites.", jobs: [] });
        const auth = await fetch(`${supabaseUrl}/auth/v1/user`, { headers: { apikey: key, Authorization: token }, signal: AbortSignal.timeout(5000) });
        if (!auth.ok) return res.status(401).json({ error: "Sign in again to search your added sites.", jobs: [] });
      }
      const selected = (url.searchParams.get("sources") || "").split(",");
      const titles = (url.searchParams.get("titles") || "").split(",").map(x => x.trim().slice(0, 120)).filter(Boolean).slice(0, 10);
      return res.status(200).json(await fetchWatchJobs({ selected, titles, customSites }));
    }

    // Council jobs route
    if (source === "councils") {
      const councilJobs = await fetchCouncilJobs(council);
      return res.status(200).json({
        jobs: councilJobs,
        count: councilJobs.length,
        source: "councils",
        council: council || "all",
        updatedAt: new Date().toISOString(),
      });
    }

    // Germany route
    if (country === "DE" || country === "GERMANY") {
      const germanyJobs = await fetchGermanyJobs(q);
      germanyJobs.sort((a, b) => {
        if (a.sponsorship && !b.sponsorship) return -1;
        if (!a.sponsorship && b.sponsorship) return 1;
        try {
          if (!a.posted) return 1;
          if (!b.posted) return -1;
          return new Date(b.posted) - new Date(a.posted);
        } catch { return 0; }
      });
      return res.status(200).json({
        jobs: germanyJobs,
        count: germanyJobs.length,
        country: "DE",
        updatedAt: new Date().toISOString(),
      });
    }

    // Default: UK jobs
    let rssJobs = [];
    let apiJobs = [];

    if (source === "all" || source === "rss") {
      rssJobs = await fetchRSSJobs(q, loc);
    }
    if (source === "all" || source === "api") {
      apiJobs = await fetchAPIJobs(q || "", loc || "United Kingdom");
    }

    // Merge + sort: sponsored first, then most recent
    const all = [...apiJobs, ...rssJobs].map(j => ({ ...j, country: "UK" }));
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
      country: "UK",
      sources: { rss: rssJobs.length, api: apiJobs.length },
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message, jobs: [] });
  }
}
