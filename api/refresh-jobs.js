export const config = { runtime: "nodejs", maxDuration: 60 };

const ALL_FEEDS = [
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
  { url: "https://www.jobs.ac.uk/jobs/project-management-and-consulting/?format=rss", sector: "Business", source: "jobs.ac.uk" },
  { url: "https://www.jobs.ac.uk/jobs/sustainability/?format=rss",                  sector: "Engineering", source: "jobs.ac.uk" },
  { url: "https://www.jobs.ac.uk/jobs/international-activities/?format=rss",        sector: "Business", source: "jobs.ac.uk" },
  { url: "https://www.jobs.ac.uk/jobs/administrative/?format=rss",                  sector: "Public Sector", source: "jobs.ac.uk" },
  { url: "https://www.jobs.ac.uk/jobs/laboratory-clinical-and-technician/?format=rss", sector: "Healthcare", source: "jobs.ac.uk" },
  { url: "https://www.jobs.ac.uk/jobs/architecture-building-and-planning/?format=rss", sector: "Engineering", source: "jobs.ac.uk" },
  { url: "https://www.jobs.ac.uk/jobs/media-and-communications/?format=rss",        sector: "Business", source: "jobs.ac.uk" },
  { url: "https://www.jobs.ac.uk/jobs/creative-arts-and-design/?format=rss",        sector: "Business", source: "jobs.ac.uk" },
  { url: "https://www.jobs.ac.uk/jobs/languages-literature-and-culture/?format=rss", sector: "Education", source: "jobs.ac.uk" },
  { url: "https://www.jobs.ac.uk/jobs/library-services-data-and-information-management/?format=rss", sector: "AI & Data", source: "jobs.ac.uk" },
  { url: "https://www.jobs.ac.uk/jobs/historical-and-philosophical-studies/?format=rss", sector: "Education", source: "jobs.ac.uk" },
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
  // Totaljobs RSS
  { url: "https://www.totaljobs.com/jobs/healthcare/rss",                             sector: "Healthcare",   source: "Totaljobs" },
  { url: "https://www.totaljobs.com/jobs/it-jobs/rss",                                sector: "Technology",   source: "Totaljobs" },
  { url: "https://www.totaljobs.com/jobs/engineering/rss",                            sector: "Engineering",  source: "Totaljobs" },
  { url: "https://www.totaljobs.com/jobs/finance/rss",                               sector: "Finance",      source: "Totaljobs" },
  { url: "https://www.totaljobs.com/jobs/education/rss",                             sector: "Education",    source: "Totaljobs" },
  { url: "https://www.totaljobs.com/jobs/social-care/rss",                           sector: "Public Sector",source: "Totaljobs" },
  // CWJobs RSS — UK tech specialist
  { url: "https://www.cwjobs.co.uk/jobs/it/rss",                                     sector: "Technology",   source: "CWJobs" },
  { url: "https://www.cwjobs.co.uk/jobs/data-science/rss",                           sector: "AI & Data",    source: "CWJobs" },
  { url: "https://www.cwjobs.co.uk/jobs/software-engineering/rss",                   sector: "Technology",   source: "CWJobs" },
  // NHS Jobs RSS — official NHS vacancies
  { url: "https://www.jobs.nhs.uk/xi/vacancy_feed/?pincode=&distance=50&vacancy_type=JOB&specialty=&job_type_code=&employer_type=1&hours=&pay_band=&orderby=publicationdate&pagenum=1", sector: "Healthcare", source: "NHS Jobs" },
  // LG Jobs RSS — official UK local government jobs
  { url: "https://www.lgjobs.com/vacancies/rss",                                     sector: "Public Sector", source: "LG Jobs" },
  { url: "https://www.lgjobs.com/vacancies/rss?keyword=social+worker",               sector: "Public Sector", source: "LG Jobs" },
  { url: "https://www.lgjobs.com/vacancies/rss?keyword=housing",                     sector: "Public Sector", source: "LG Jobs" },
  { url: "https://www.lgjobs.com/vacancies/rss?keyword=planning",                    sector: "Public Sector", source: "LG Jobs" },
  { url: "https://www.lgjobs.com/vacancies/rss?keyword=finance",                     sector: "Finance",       source: "LG Jobs" },
  { url: "https://www.lgjobs.com/vacancies/rss?keyword=IT",                          sector: "Technology",    source: "LG Jobs" },
  // Civil Service Jobs RSS
  { url: "https://www.civilservicejobs.service.gov.uk/csr/index.cgi?SID=b3duZXI9NTA3MDAwMCZvd25lcnR5cGU9ZmFpcg==&format=rss", sector: "Public Sector", source: "Civil Service" },
];

// 39 searches split into 4 groups — only one group runs per cron job
// Group 0 runs at 0,4,8,12,16,20 — Group 1 at 1,5,9... etc.
// Total Adzuna calls per day: ~10 searches × 2 pages × 6 runs = 120/day (well under 250 limit)
const ADZUNA_SEARCHES = [
  // Group 0 — Technology
  { q: "software engineer",         sector: "Technology",    group: 0 },
  { q: "software developer",        sector: "Technology",    group: 0 },
  { q: "data scientist",            sector: "AI & Data",     group: 0 },
  { q: "data engineer",             sector: "AI & Data",     group: 0 },
  { q: "machine learning engineer", sector: "AI & Data",     group: 0 },
  { q: "DevOps engineer",           sector: "Technology",    group: 0 },
  { q: "web developer",             sector: "Technology",    group: 0 },
  { q: "cybersecurity analyst",     sector: "Technology",    group: 0 },
  { q: "network engineer",          sector: "Technology",    group: 0 },
  { q: "data analyst",              sector: "AI & Data",     group: 0 },
  // Group 1 — Healthcare (NHS roles)
  { q: "NHS nurse",                 sector: "Healthcare",    group: 1 },
  { q: "registered nurse",          sector: "Healthcare",    group: 1 },
  { q: "staff nurse",               sector: "Healthcare",    group: 1 },
  { q: "NHS healthcare assistant",  sector: "Healthcare",    group: 1 },
  { q: "NHS doctor",                sector: "Healthcare",    group: 1 },
  { q: "NHS pharmacist",            sector: "Healthcare",    group: 1 },
  { q: "NHS physiotherapist",       sector: "Healthcare",    group: 1 },
  { q: "NHS occupational therapist",sector: "Healthcare",    group: 1 },
  { q: "NHS radiographer",          sector: "Healthcare",    group: 1 },
  { q: "NHS mental health nurse",   sector: "Healthcare",    group: 1 },
  // Group 2 — Healthcare (general) + Finance
  { q: "care worker",               sector: "Healthcare",    group: 2 },
  { q: "midwife",                   sector: "Healthcare",    group: 2 },
  { q: "paramedic",                 sector: "Healthcare",    group: 2 },
  { q: "dental nurse",              sector: "Healthcare",    group: 2 },
  { q: "NHS social worker",         sector: "Healthcare",    group: 2 },
  { q: "financial analyst",         sector: "Finance",       group: 2 },
  { q: "accountant",                sector: "Finance",       group: 2 },
  { q: "mechanical engineer",       sector: "Engineering",   group: 2 },
  { q: "civil engineer",            sector: "Engineering",   group: 2 },
  { q: "electrical engineer",       sector: "Engineering",   group: 2 },
  // Group 3 — Business + Education + Other
  { q: "project manager",           sector: "Business",      group: 3 },
  { q: "marketing manager",         sector: "Business",      group: 3 },
  { q: "business analyst",          sector: "Business",      group: 3 },
  { q: "product manager",           sector: "Business",      group: 3 },
  { q: "HR manager",                sector: "Business",      group: 3 },
  { q: "operations manager",        sector: "Business",      group: 3 },
  { q: "social worker",             sector: "Public Sector", group: 3 },
  { q: "teacher",                   sector: "Education",     group: 3 },
  { q: "chef",                      sector: "Hospitality",   group: 3 },
  // Council / Public Sector
  { q: "council social worker",      sector: "Public Sector",  group: 0 },
  { q: "local authority planner",    sector: "Public Sector",  group: 1 },
  { q: "council housing officer",    sector: "Public Sector",  group: 2 },
  { q: "environmental health officer",sector: "Public Sector", group: 3 },
  { q: "council finance officer",    sector: "Finance",        group: 0 },
  { q: "council IT officer",         sector: "Technology",     group: 1 },
];

// Reed searches also split into 4 groups
const REED_SEARCHES = [
  { q: "software engineer",          group: 0 },
  { q: "software developer",         group: 0 },
  { q: "data scientist",             group: 0 },
  { q: "data analyst",               group: 0 },
  { q: "machine learning engineer",  group: 0 },
  { q: "DevOps engineer",            group: 0 },
  { q: "web developer",              group: 0 },
  { q: "cybersecurity",              group: 0 },
  { q: "network engineer",           group: 0 },
  { q: "cloud engineer",             group: 0 },
  { q: "NHS nurse",                  group: 1 },
  { q: "NHS registered nurse",       group: 1 },
  { q: "NHS staff nurse",            group: 1 },
  { q: "NHS healthcare assistant",   group: 1 },
  { q: "NHS doctor",                 group: 1 },
  { q: "NHS pharmacist",             group: 1 },
  { q: "NHS physiotherapist",        group: 1 },
  { q: "NHS occupational therapist", group: 1 },
  { q: "NHS radiographer",           group: 1 },
  { q: "NHS mental health nurse",    group: 1 },
  { q: "NHS social worker",          group: 1 },
  { q: "registered nurse",           group: 2 },
  { q: "healthcare assistant",       group: 2 },
  { q: "pharmacist",                 group: 2 },
  { q: "physiotherapist",            group: 2 },
  { q: "care worker",                group: 2 },
  { q: "dental nurse",               group: 2 },
  { q: "radiographer",               group: 2 },
  { q: "midwife",                    group: 2 },
  { q: "paramedic",                  group: 2 },
  { q: "financial analyst",          group: 3 },
  { q: "accountant",                 group: 3 },
  { q: "mechanical engineer",        group: 3 },
  { q: "civil engineer",             group: 3 },
  { q: "electrical engineer",        group: 3 },
  { q: "project manager",            group: 3 },
  { q: "business analyst",           group: 3 },
  { q: "marketing manager",          group: 3 },
  { q: "teacher",                    group: 3 },
  { q: "social worker",              group: 3 },
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
    const title   = clean(get("title")).substring(0, 120);
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
      company:     org ? clean(org[1]).substring(0, 80) : "UK Employer",
      location:    loc ? clean(loc[1]).substring(0, 80) : "United Kingdom",
      salary:      sal ? clean(sal[1]).substring(0, 70) : "Competitive",
      sector:      getSector(title, feedSector),
      posted,
      source:      feedSource,
      url:         link.split("?")[0].substring(0, 500),
      sponsorship: detectSponsorship(title, desc),
      expires_at:  expiresAt,
    });
  }
  return jobs;
}

async function supabaseUpsert(supabaseUrl, key, rows) {
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
    console.error(`Supabase upsert warning: ${r.status}`, errText);
  }
}

async function supabaseDeleteExpired(url, key) {
  await fetch(`${url}/rest/v1/jobs?expires_at=lt.${encodeURIComponent(new Date().toISOString())}`, {
    method: "DELETE",
    headers: { "apikey": key, "Authorization": `Bearer ${key}`, "Prefer": "return=minimal" },
  });
}

async function supabaseCount(url, key) {
  const r = await fetch(`${url}/rest/v1/jobs?select=id`, {
    headers: { "apikey": key, "Authorization": `Bearer ${key}`, "Prefer": "count=exact", "Range": "0-0" },
  });
  const match = (r.headers.get("content-range") || "").match(/\/(\d+)/);
  return match ? parseInt(match[1]) : 0;
}

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
      // Keep Adzuna redirect_url intact — do NOT strip query string
      url:         j.redirect_url || `https://www.adzuna.co.uk/search?q=${encodeURIComponent(j.title || q)}&w=United+Kingdom`,
      source:      "Adzuna",
      sponsorship: detectSponsorship(j.title||"", j.description||""),
      expires_at:  expiresAt,
    });
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

async function fetchReed(reedKey, q) {
  try {
    const params = new URLSearchParams({ keywords: q, locationName: "United Kingdom", resultsToTake: "100" });
    const r = await fetch(`https://www.reed.co.uk/api/1.0/search?${params}`, {
      headers: { "Authorization": `Basic ${Buffer.from(reedKey + ":").toString("base64")}` },
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) return [];
    const d = await r.json();
    const expiresAt = new Date(Date.now() + 14*24*60*60*1000).toISOString();
    return (d.results || []).map(j => ({
      title:       (j.jobTitle || "").substring(0, 120),
      company:     j.employerName || "UK Employer",
      location:    j.locationName || "United Kingdom",
      salary:      j.minimumSalary ? `£${Math.round(j.minimumSalary).toLocaleString()}–£${Math.round(j.maximumSalary||j.minimumSalary).toLocaleString()}/yr` : "Competitive",
      sector:      getSector(j.jobTitle||"", "Other"),
      posted:      (() => {
        if (!j.date) return '';
        try {
          const d = new Date(j.date);
          // Reject future dates — Reed sometimes returns expiry not posted date
          if (d > new Date()) return '';
          return d.toLocaleDateString('en-GB', {day:'numeric', month:'short', year:'numeric'});
        } catch { return ''; }
      })(),
      url:         (() => {
        // Always use search URL — direct job IDs expire when jobs are filled
        const encoded = encodeURIComponent(j.jobTitle || '');
        const loc = encodeURIComponent(j.locationName || 'United Kingdom');
        return `https://www.reed.co.uk/jobs?keywords=${encoded}&locationName=${loc}`;
      })(),
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
    return res.status(500).json({ error: "Missing env vars" });
  }

  // Work out which rotation group to run based on current hour
  // 4 groups × 6 runs/day = every search runs ~6 times per day
  // Adzuna: ~10 searches × 2 pages × 6 runs = ~120 calls/day (under 250 limit)
  const group = new Date().getHours() % 4;

  const log = [`Rotation group ${group} | ${new Date().toISOString()}`];

  try {
    const appId   = process.env.ADZUNA_APP_ID;
    const appKey  = process.env.ADZUNA_APP_KEY;
    const reedKey = process.env.REED_API_KEY;

    const adzunaGroup = ADZUNA_SEARCHES.filter(s => s.group === group);
    const reedGroup   = REED_SEARCHES.filter(s => s.group === group);

    log.push(`Running ${ALL_FEEDS.length} RSS feeds + ${adzunaGroup.length} Adzuna + ${reedGroup.length} Reed searches`);

    const [rssSettled, adzunaSettled, reedSettled] = await Promise.all([
      // RSS — run all feeds every time (they're free and fast)
      Promise.allSettled(
        ALL_FEEDS.map((feed) =>
          fetch(feed.url, { headers: { "User-Agent": "Mentorgram AI (+https://mentorgramai.com)" }, signal: AbortSignal.timeout(12000) })
            .then(r => r.ok ? r.text() : "")
            .then(xml => xml ? parseRSS(xml, feed.sector, feed.source) : [])
            .catch(() => [])
        )
      ),
      // Adzuna — only this group's searches
      appId && appKey
        ? Promise.allSettled(adzunaGroup.map(({ q, sector }) => fetchAdzuna(appId, appKey, q, sector)))
        : Promise.resolve([]),
      // Reed — only this group's searches
      reedKey
        ? Promise.allSettled(reedGroup.map(({ q }) => fetchReed(reedKey, q)))
        : Promise.resolve([]),
    ]);

    const rssJobs    = rssSettled.filter(r => r.status === "fulfilled").flatMap(r => r.value);
    const adzunaJobs = Array.isArray(adzunaSettled) ? adzunaSettled.filter(r => r.status === "fulfilled").flatMap(r => r.value) : [];
    const reedJobs   = Array.isArray(reedSettled)   ? reedSettled.filter(r => r.status === "fulfilled").flatMap(r => r.value) : [];

    let jobs = [...rssJobs, ...adzunaJobs, ...reedJobs];

    // Deduplicate by URL
    const seen = new Set();
    jobs = jobs.filter(j => {
      if (!j.url || j.url.length < 10) return false;
      if (seen.has(j.url)) return false;
      seen.add(j.url);
      return true;
    });

    log.push(`RSS: ${rssJobs.length} | Adzuna: ${adzunaJobs.length} | Reed: ${reedJobs.length} | Unique: ${jobs.length}`);

    // Upsert in batches of 100
    const BATCH = 100;
    let batchNum = 0;
    for (let i = 0; i < jobs.length; i += BATCH) {
      batchNum++;
      try {
        await supabaseUpsert(supabaseUrl, serviceKey, jobs.slice(i, i + BATCH));
        log.push(`Batch ${batchNum}: ${Math.min(BATCH, jobs.length - i)} upserted`);
      } catch (e) {
        log.push(`Batch ${batchNum} skipped: ${e.message}`);
      }
    }

    // Delete jobs older than 30 days
    await supabaseDeleteExpired(supabaseUrl, serviceKey);

    const total = await supabaseCount(supabaseUrl, serviceKey);
    log.push(`Total in database: ${total}`);
    log.push("✅ Done!");

    return res.status(200).json({ success: true, inserted: jobs.length, total, log });
  } catch (err) {
    return res.status(500).json({ error: err.message, log });
  }
}
