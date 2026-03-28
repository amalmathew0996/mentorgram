export const config = { runtime: "nodejs", maxDuration: 60 };

const ALL_FEEDS = [
  // jobs.ac.uk — subject areas (30 feeds)
  { url: "https://www.jobs.ac.uk/jobs/computer-sciences/?format=rss",               sector: "Technology", source: "jobs.ac.uk" },
  { url: "https://www.jobs.ac.uk/jobs/engineering-and-technology/?format=rss",      sector: "Engineering", source: "jobs.ac.uk" },
  { url: "https://www.jobs.ac.uk/jobs/health-and-medical/?format=rss",              sector: "Healthcare", source: "jobs.ac.uk" },
  { url: "https://www.jobs.ac.uk/jobs/health-wellbeing-and-care/?format=rss",       sector: "Healthcare", source: "jobs.ac.uk" },
  { url: "https://www.jobs.ac.uk/jobs/business-and-management-studies/?format=rss", sector: "Business", source: "jobs.ac.uk" },
  { url: "https://www.jobs.ac.uk/jobs/economics/?format=rss",                       sector: "Finance", source: "jobs.ac.uk" },
  { url: "https://www.jobs.ac.uk/jobs/it-services/?format=rss",                     sector: "Technology", source: "jobs.ac.uk" },
  { url: "https://www.jobs.ac.uk/jobs/finance-and-procurement/?format=rss",         sector: "Finance", source: "jobs.ac.uk" },
  { url: "https://www.jobs.ac.uk/jobs/mathematics-and-statistics/?format=rss",      sector: "AI & Data", source: "jobs.ac.uk" },
  { url: "https://www.jobs.ac.uk/jobs/biological-sciences/?format=rss",             sector: "Healthcare", source: "jobs.ac.uk" },
  { url: "https://www.jobs.ac.uk/jobs/physical-and-environmental-sciences/?format=rss", sector: "Engineering", source: "jobs.ac.uk" },
  { url: "https://www.jobs.ac.uk/jobs/education-studies-inc-tefl/?format=rss",      sector: "Education", source: "jobs.ac.uk" },
  { url: "https://www.jobs.ac.uk/jobs/psychology/?format=rss",                      sector: "Healthcare", source: "jobs.ac.uk" },
  { url: "https://www.jobs.ac.uk/jobs/law/?format=rss",                             sector: "Business", source: "jobs.ac.uk" },
  { url: "https://www.jobs.ac.uk/jobs/social-sciences-and-social-care/?format=rss", sector: "Public Sector", source: "jobs.ac.uk" },
  { url: "https://www.jobs.ac.uk/jobs/senior-management/?format=rss",               sector: "Business", source: "jobs.ac.uk" },
  { url: "https://www.jobs.ac.uk/jobs/human-resources/?format=rss",                 sector: "Business", source: "jobs.ac.uk" },
  { url: "https://www.jobs.ac.uk/jobs/pr-marketing-sales-and-communication/?format=rss", sector: "Business", source: "jobs.ac.uk" },
  { url: "https://www.jobs.ac.uk/jobs/web-design-and-development/?format=rss",      sector: "Technology", source: "jobs.ac.uk" },
  { url: "https://www.jobs.ac.uk/jobs/project-management-and-consulting/?format=rss",sector: "Business", source: "jobs.ac.uk" },
  { url: "https://www.jobs.ac.uk/jobs/sustainability/?format=rss",                  sector: "Engineering", source: "jobs.ac.uk" },
  { url: "https://www.jobs.ac.uk/jobs/international-activities/?format=rss",        sector: "Business", source: "jobs.ac.uk" },
  { url: "https://www.jobs.ac.uk/jobs/administrative/?format=rss",                  sector: "Public Sector", source: "jobs.ac.uk" },
  { url: "https://www.jobs.ac.uk/jobs/laboratory-clinical-and-technician/?format=rss", sector: "Healthcare", source: "jobs.ac.uk" },
  { url: "https://www.jobs.ac.uk/jobs/architecture-building-and-planning/?format=rss", sector: "Engineering", source: "jobs.ac.uk" },
  { url: "https://www.jobs.ac.uk/jobs/media-and-communications/?format=rss",        sector: "Business", source: "jobs.ac.uk" },
  { url: "https://www.jobs.ac.uk/jobs/creative-arts-and-design/?format=rss",        sector: "Business", source: "jobs.ac.uk" },
  { url: "https://www.jobs.ac.uk/jobs/languages-literature-and-culture/?format=rss",sector: "Education", source: "jobs.ac.uk" },
  { url: "https://www.jobs.ac.uk/jobs/library-services-data-and-information-management/?format=rss", sector: "AI & Data", source: "jobs.ac.uk" },
  { url: "https://www.jobs.ac.uk/jobs/historical-and-philosophical-studies/?format=rss", sector: "Education", source: "jobs.ac.uk" },
  // jobs.ac.uk — by location (11 feeds = different listings)
  { url: "https://www.jobs.ac.uk/jobs/london/?format=rss",                          sector: "Technology", source: "jobs.ac.uk" },
  { url: "https://www.jobs.ac.uk/jobs/manchester/?format=rss",                      sector: "Business", source: "jobs.ac.uk" },
  { url: "https://www.jobs.ac.uk/jobs/birmingham/?format=rss",                      sector: "Healthcare", source: "jobs.ac.uk" },
  { url: "https://www.jobs.ac.uk/jobs/leeds/?format=rss",                           sector: "Engineering", source: "jobs.ac.uk" },
  { url: "https://www.jobs.ac.uk/jobs/edinburgh/?format=rss",                       sector: "Education", source: "jobs.ac.uk" },
  { url: "https://www.jobs.ac.uk/jobs/bristol/?format=rss",                         sector: "Technology", source: "jobs.ac.uk" },
  { url: "https://www.jobs.ac.uk/jobs/sheffield/?format=rss",                       sector: "Engineering", source: "jobs.ac.uk" },
  { url: "https://www.jobs.ac.uk/jobs/nottingham/?format=rss",                      sector: "Healthcare", source: "jobs.ac.uk" },
  { url: "https://www.jobs.ac.uk/jobs/glasgow/?format=rss",                         sector: "Business", source: "jobs.ac.uk" },
  { url: "https://www.jobs.ac.uk/jobs/oxford/?format=rss",                          sector: "Education", source: "jobs.ac.uk" },
  { url: "https://www.jobs.ac.uk/jobs/cambridge/?format=rss",                       sector: "AI & Data", source: "jobs.ac.uk" },
  // Guardian Jobs (12 categories)
  { url: "https://jobs.theguardian.com/jobs/technology/?format=rss",                sector: "Technology", source: "Guardian Jobs" },
  { url: "https://jobs.theguardian.com/jobs/healthcare/?format=rss",                sector: "Healthcare", source: "Guardian Jobs" },
  { url: "https://jobs.theguardian.com/jobs/finance/?format=rss",                   sector: "Finance", source: "Guardian Jobs" },
  { url: "https://jobs.theguardian.com/jobs/engineering/?format=rss",               sector: "Engineering", source: "Guardian Jobs" },
  { url: "https://jobs.theguardian.com/jobs/education/?format=rss",                 sector: "Education", source: "Guardian Jobs" },
  { url: "https://jobs.theguardian.com/jobs/social-care/?format=rss",               sector: "Public Sector", source: "Guardian Jobs" },
  { url: "https://jobs.theguardian.com/jobs/marketing-pr/?format=rss",              sector: "Business", source: "Guardian Jobs" },
  { url: "https://jobs.theguardian.com/jobs/charity/?format=rss",                   sector: "Public Sector", source: "Guardian Jobs" },
  { url: "https://jobs.theguardian.com/jobs/housing/?format=rss",                   sector: "Public Sector", source: "Guardian Jobs" },
  { url: "https://jobs.theguardian.com/jobs/data/?format=rss",                      sector: "AI & Data", source: "Guardian Jobs" },
  { url: "https://jobs.theguardian.com/jobs/science/?format=rss",                   sector: "Healthcare", source: "Guardian Jobs" },
  { url: "https://jobs.theguardian.com/jobs/environment/?format=rss",               sector: "Engineering", source: "Guardian Jobs" },
];

const SPONSOR_KW = ["visa sponsor","sponsorship","skilled worker","tier 2","work permit","certificate of sponsorship","will sponsor","cos provided"];
const NO_SPONSOR = ["no sponsorship","unable to sponsor","must have right to work","must already have the right","uk residency required"];

function detectSponsorship(title = "", desc = "") {
  const t = `${title} ${desc}`.toLowerCase();
  if (NO_SPONSOR.some(k => t.includes(k))) return false;
  if (SPONSOR_KW.some(k => t.includes(k))) return true;
  return null;
}

function clean(s = "") {
  return s.replace(/<[^>]+>/g,"").replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"').replace(/&#39;/g,"'").trim();
}

function getSector(title = "", feedSector = "") {
  const t = title.toLowerCase();
  if (/software|developer|programmer|web|mobile|devops|cloud|cyber|network/.test(t)) return "Technology";
  if (/data|scientist|machine learning|ai |mlops|intelligence/.test(t)) return "AI & Data";
  if (/nurse|doctor|gp|nhs|healthcare|medical|dental|care|clinical|therapist|pharmacist/.test(t)) return "Healthcare";
  if (/finance|financial|accountant|audit|banking|investment|payroll|risk/.test(t)) return "Finance";
  if (/engineer|mechanical|civil|electrical|chemical|architect/.test(t)) return "Engineering";
  if (/teacher|teaching|lecturer|education|school|university|academic/.test(t)) return "Education";
  if (/chef|cook|hotel|restaurant|hospitality/.test(t)) return "Hospitality";
  if (/social worker|probation|council|government|police|charity/.test(t)) return "Public Sector";
  if (/marketing|sales|hr |human resources|product manager/.test(t)) return "Business";
  return feedSector || "Other";
}

function parseRSS(xml, feedSector, feedSource) {
  const jobs = [];
  const items = xml.match(/<item[\s>][\s\S]*?<\/item>/g) || [];
  for (const item of items) {
    const get = (tag) => {
      const m = item.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([^<]*)<\\/${tag}>`));
      return m ? (m[1] ?? m[2] ?? "").trim() : "";
    };
    const title   = clean(get("title")).substring(0,120);
    const link    = clean(get("link") || get("guid"));
    const pubDate = get("pubDate");
    const desc    = get("description") || "";
    if (!title || !link) continue;
    const org = desc.match(/(?:Organisation|Employer|Institution):\s*([^\n<]+)/i);
    const loc = desc.match(/(?:Location|Place of [Ww]ork):\s*([^\n<,]+)/i);
    const sal = desc.match(/(?:Salary|Remuneration|Grade):\s*([^\n<]+)/i);
    let posted = "";
    if (pubDate) { try { posted = new Date(pubDate).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"}); } catch {} }
    const expiresAt = new Date(Date.now() + 30*24*60*60*1000).toISOString();
    jobs.push({
      title,
      company:     org ? clean(org[1]).substring(0,80) : "UK Employer",
      location:    loc ? clean(loc[1]).substring(0,80) : "United Kingdom",
      salary:      sal ? clean(sal[1]).substring(0,70) : "Competitive",
      sector:      getSector(title, feedSector),
      posted, source: feedSource,
      url: link,
      sponsorship: detectSponsorship(title, desc),
      expires_at:  expiresAt,
    });
  }
  return jobs;
}

async function supabaseUpsert(supabaseUrl, key, rows) {
  // Use ?on_conflict=url to properly handle duplicate URLs
  const r = await fetch(`${supabaseUrl}/rest/v1/jobs?on_conflict=url`, {
    method: "POST",
    headers: {
      "Content-Type":  "application/json",
      "apikey":        key,
      "Authorization": `Bearer ${key}`,
      "Prefer":        "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(rows),
  });
  if (!r.ok) {
    const errText = await r.text();
    // Log but don't throw — skip bad batches and continue
    console.error(`Supabase upsert warning: ${r.status}`, errText);
  }
}

async function supabaseDeleteExpired(url, key) {
  await fetch(`${url}/rest/v1/jobs?expires_at=lt.${encodeURIComponent(new Date().toISOString())}`, {
    method: "DELETE",
    headers: { "apikey":key,"Authorization":`Bearer ${key}`,"Prefer":"return=minimal" },
  });
}

async function supabaseCount(url, key) {
  const r = await fetch(`${url}/rest/v1/jobs?select=id`, {
    headers: { "apikey":key,"Authorization":`Bearer ${key}`,"Prefer":"count=exact","Range":"0-0" },
  });
  const match = (r.headers.get("content-range") || "").match(/\/(\d+)/);
  return match ? parseInt(match[1]) : 0;
}

// ── Adzuna API — up to 1000 jobs with real sponsorship data ──────────────
const ADZUNA_SEARCHES = [
  // Technology
  { q: "software engineer", sector: "Technology" },
  { q: "software developer", sector: "Technology" },
  { q: "data scientist", sector: "AI & Data" },
  { q: "data engineer", sector: "AI & Data" },
  { q: "machine learning engineer", sector: "AI & Data" },
  { q: "DevOps engineer", sector: "Technology" },
  { q: "web developer", sector: "Technology" },
  { q: "cybersecurity analyst", sector: "Technology" },
  { q: "network engineer", sector: "Technology" },
  // Healthcare & NHS
  { q: "NHS nurse", sector: "Healthcare" },
  { q: "registered nurse", sector: "Healthcare" },
  { q: "staff nurse", sector: "Healthcare" },
  { q: "NHS healthcare assistant", sector: "Healthcare" },
  { q: "NHS doctor", sector: "Healthcare" },
  { q: "NHS pharmacist", sector: "Healthcare" },
  { q: "NHS physiotherapist", sector: "Healthcare" },
  { q: "NHS occupational therapist", sector: "Healthcare" },
  { q: "NHS radiographer", sector: "Healthcare" },
  { q: "NHS social worker", sector: "Healthcare" },
  { q: "NHS mental health nurse", sector: "Healthcare" },
  { q: "care worker", sector: "Healthcare" },
  { q: "midwife", sector: "Healthcare" },
  { q: "paramedic", sector: "Healthcare" },
  { q: "dental nurse", sector: "Healthcare" },
  // Finance
  { q: "financial analyst", sector: "Finance" },
  { q: "accountant", sector: "Finance" },
  // Engineering
  { q: "mechanical engineer", sector: "Engineering" },
  { q: "civil engineer", sector: "Engineering" },
  { q: "electrical engineer", sector: "Engineering" },
  { q: "architect", sector: "Engineering" },
  // Business
  { q: "project manager", sector: "Business" },
  { q: "marketing manager", sector: "Business" },
  { q: "business analyst", sector: "Business" },
  { q: "product manager", sector: "Business" },
  { q: "HR manager", sector: "Business" },
  { q: "operations manager", sector: "Business" },
  // Public Sector
  { q: "social worker", sector: "Public Sector" },
  // Education & Hospitality
  { q: "teacher", sector: "Education" },
  { q: "chef", sector: "Hospitality" },
];

async function fetchAdzuna(appId, appKey, q, sector) {
  try {
    const expiresAt = new Date(Date.now() + 30*24*60*60*1000).toISOString();
    const mapJob = j => ({
      title:       (j.title || "").substring(0, 120),
      company:     j.company?.display_name || "UK Employer",
      location:    j.location?.display_name || "United Kingdom",
      salary:      j.salary_min ? `£${Math.round(j.salary_min).toLocaleString()}–£${Math.round(j.salary_max||j.salary_min).toLocaleString()}/yr` : "Competitive",
      sector:      getSector(j.title || "", sector),
      posted:      j.created ? new Date(j.created).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"}) : "",
      url:         (() => {
        const base = encodeURIComponent(j.title || q);
        const loc  = encodeURIComponent(j.location?.split(",")[0] || "");
        return `https://www.adzuna.co.uk/search?q=${base}&w=${loc || "United+Kingdom"}`;
      })(),
      source:      "Adzuna",
      sponsorship: detectSponsorship(j.title||"", j.description||""),
      expires_at:  expiresAt,
    });
    // Fetch pages 1 and 2 to get up to 100 results per search
    const [r1, r2] = await Promise.allSettled([
      fetch(`https://api.adzuna.com/v1/api/jobs/gb/search/1?${new URLSearchParams({app_id:appId,app_key:appKey,results_per_page:"50",what:q,where:"UK"})}`, { signal: AbortSignal.timeout(8000) }),
      fetch(`https://api.adzuna.com/v1/api/jobs/gb/search/2?${new URLSearchParams({app_id:appId,app_key:appKey,results_per_page:"50",what:q,where:"UK"})}`, { signal: AbortSignal.timeout(8000) }),
    ]);
    const jobs = [];
    for (const r of [r1, r2]) {
      if (r.status === "fulfilled" && r.value.ok) {
        const d = await r.value.json();
        jobs.push(...(d.results || []).map(mapJob).filter(j => j.url));
      }
    }
    return jobs;
  } catch { return []; }
}


// ── Reed API — up to 2,500 UK jobs ────────────────────────────────────────
const REED_SEARCHES = [
  // Technology
  "software engineer", "software developer", "data scientist", "data analyst",
  "machine learning engineer", "DevOps engineer", "web developer", "cybersecurity",
  // NHS & Healthcare
  "NHS nurse", "NHS registered nurse", "NHS staff nurse", "NHS healthcare assistant",
  "NHS doctor", "NHS pharmacist", "NHS physiotherapist", "NHS occupational therapist",
  "NHS radiographer", "NHS mental health nurse", "NHS social worker",
  "registered nurse", "healthcare assistant", "pharmacist", "physiotherapist",
  "doctor", "care worker", "dental nurse", "radiographer", "midwife", "paramedic",
  // Finance & Engineering
  "financial analyst", "accountant", "investment banker", "risk analyst",
  "mechanical engineer", "civil engineer", "electrical engineer", "structural engineer",
  // Business & Other
  "project manager", "business analyst", "marketing manager", "HR manager",
  "operations manager", "product manager", "social worker", "teacher",
  "chef", "hotel manager", "quantity surveyor", "architect",
];

async function fetchReed(reedKey, q) {
  try {
    const params = new URLSearchParams({ keywords: q, locationName: "United Kingdom", resultsToTake: "100" });
    const r = await fetch(`https://www.reed.co.uk/api/1.0/search?${params}`, {
      headers: { "Authorization": `Basic ${Buffer.from(reedKey + ":").toString("base64")}` },
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) return [];
    const d = await r.json();
    const expiresAt = new Date(Date.now() + 30*24*60*60*1000).toISOString();
    return (d.results || []).map(j => ({
      title:       (j.jobTitle || "").substring(0, 120),
      company:     j.employerName || "UK Employer",
      location:    j.locationName || "United Kingdom",
      salary:      j.minimumSalary ? `£${Math.round(j.minimumSalary).toLocaleString()}–£${Math.round(j.maximumSalary||j.minimumSalary).toLocaleString()}/yr` : "Competitive",
      sector:      getSector(j.jobTitle||"", "Other"),
      posted:      j.date ? new Date(j.date).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"}) : "",
      url:         `https://www.reed.co.uk/jobs?keywords=${encodeURIComponent(j.jobTitle||"")}&locationName=United+Kingdom&jobId=${j.jobId||""}` ,
      source:      "Reed",
      sponsorship: detectSponsorship(j.jobTitle||"", j.jobDescription||""),
      expires_at:  expiresAt,
    })).filter(j => j.url);
  } catch { return []; }
}


export default async function handler(req, res) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers["authorization"] !== `Bearer ${secret}`) {
    return res.status(401).json({ error: "Unauthorised" });
  }
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({ error: "Missing env vars: VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" });
  }

  const log = [`Starting refresh of ${ALL_FEEDS.length} feeds...`];

  try {
    const appId  = process.env.ADZUNA_APP_ID;
    const appKey = process.env.ADZUNA_APP_KEY;

    const reedKey = process.env.REED_API_KEY;

    // Fetch RSS, Adzuna AND Reed all in parallel
    const [rssSettled, adzunaSettled, reedSettled] = await Promise.all([
      Promise.allSettled(
        ALL_FEEDS.map(({ url, sector }) =>
          fetch(url, { headers:{ "User-Agent":"Mentorgram AI (+https://mentorgramai.com)" }, signal: AbortSignal.timeout(12000) })
            .then(r => r.ok ? r.text() : "")
            .then(xml => xml ? parseRSS(xml, sector, source) : [])
            .catch(() => [])
        )
      ),
      appId && appKey
        ? Promise.allSettled(ADZUNA_SEARCHES.map(({ q, sector }) => fetchAdzuna(appId, appKey, q, sector)))
        : Promise.resolve([]),
      reedKey
        ? Promise.allSettled(REED_SEARCHES.map(q => fetchReed(reedKey, q)))
        : Promise.resolve([]),
    ]);

    const rssJobs    = rssSettled.filter(r => r.status === "fulfilled").flatMap(r => r.value);
    const adzunaJobs = Array.isArray(adzunaSettled) ? adzunaSettled.filter(r => r.status === "fulfilled").flatMap(r => r.value) : [];
    const reedJobs   = Array.isArray(reedSettled)   ? reedSettled.filter(r => r.status === "fulfilled").flatMap(r => r.value) : [];
    let jobs = [...rssJobs, ...adzunaJobs, ...reedJobs];
    // Normalise URLs — strip query params so same job isn't duplicated
    jobs = jobs.map(j => ({ ...j, url: j.url.split("?")[0].substring(0, 500) }));
    const seen = new Set();
    jobs = jobs.filter(j => {
      if (!j.url || j.url.length < 10) return false;
      if (seen.has(j.url)) return false;
      seen.add(j.url);
      return true;
    });
    log.push(`RSS: ${rssJobs.length} | Adzuna: ${adzunaJobs.length} | Reed: ${reedJobs.length} | Raw total: ${jobs.length}`);

    const BATCH = 100;
    let batchNum = 0;
    for (let i = 0; i < jobs.length; i += BATCH) {
      batchNum++;
      try {
        await supabaseUpsert(supabaseUrl, serviceKey, jobs.slice(i, i + BATCH));
        log.push(`Batch ${batchNum}: ${Math.min(BATCH, jobs.length-i)} jobs upserted`);
      } catch (e) {
        log.push(`Batch ${batchNum} skipped: ${e.message}`);
      }
    }

    await supabaseDeleteExpired(supabaseUrl, serviceKey);
    const total = await supabaseCount(supabaseUrl, serviceKey);
    log.push(`Total in database: ${total}`);
    log.push("✅ Done!");

    return res.status(200).json({ success: true, inserted: jobs.length, total, log });
  } catch (err) {
    return res.status(500).json({ error: err.message, log });
  }
}
