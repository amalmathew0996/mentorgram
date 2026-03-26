export const config = { runtime: "nodejs", maxDuration: 60 };

const ALL_FEEDS = [
  // jobs.ac.uk — subject areas (30 feeds)
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
  // jobs.ac.uk — by location (11 feeds = different listings)
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
  // Guardian Jobs (12 categories)
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

function parseRSS(xml, feedSector) {
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
      posted, source: "RSS",
      url: link,
      sponsorship: detectSponsorship(title, desc),
      expires_at:  expiresAt,
    });
  }
  return jobs;
}

async function supabaseUpsert(url, key, rows) {
  const r = await fetch(`${url}/rest/v1/jobs`, {
    method: "POST",
    headers: { "Content-Type":"application/json","apikey":key,"Authorization":`Bearer ${key}`,"Prefer":"resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify(rows),
  });
  if (!r.ok) throw new Error(`Supabase error: ${r.status} ${await r.text()}`);
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
    const settled = await Promise.allSettled(
      ALL_FEEDS.map(({ url, sector }) =>
        fetch(url, { headers:{ "User-Agent":"Mentorgram AI (+https://mentorgramai.com)" }, signal: AbortSignal.timeout(12000) })
          .then(r => r.ok ? r.text() : "")
          .then(xml => xml ? parseRSS(xml, sector) : [])
          .catch(() => [])
      )
    );

    let jobs = settled.filter(r => r.status === "fulfilled").flatMap(r => r.value);
    const seen = new Set();
    jobs = jobs.filter(j => { const k = j.url.split("?")[0]; if (seen.has(k)) return false; seen.add(k); return true; });
    log.push(`Fetched ${jobs.length} unique jobs from ${ALL_FEEDS.length} feeds`);

    const BATCH = 100;
    for (let i = 0; i < jobs.length; i += BATCH) {
      await supabaseUpsert(supabaseUrl, serviceKey, jobs.slice(i, i + BATCH));
      log.push(`Upserted batch ${Math.floor(i/BATCH)+1}: ${Math.min(BATCH, jobs.length-i)} jobs`);
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
