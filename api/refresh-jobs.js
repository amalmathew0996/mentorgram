import { createClient } from "@supabase/supabase-js";

export const config = { runtime: "nodejs", maxDuration: 60 };

// ── All RSS feed sources ────────────────────────────────────────────────────
const RSS_FEEDS = [
  { url: "https://www.jobs.ac.uk/jobs/computer-sciences/?format=rss",               sector: "Technology",   source: "jobs.ac.uk" },
  { url: "https://www.jobs.ac.uk/jobs/engineering-and-technology/?format=rss",      sector: "Engineering",  source: "jobs.ac.uk" },
  { url: "https://www.jobs.ac.uk/jobs/health-and-medical/?format=rss",              sector: "Healthcare",   source: "jobs.ac.uk" },
  { url: "https://www.jobs.ac.uk/jobs/health-wellbeing-and-care/?format=rss",       sector: "Healthcare",   source: "jobs.ac.uk" },
  { url: "https://www.jobs.ac.uk/jobs/business-and-management-studies/?format=rss", sector: "Business",     source: "jobs.ac.uk" },
  { url: "https://www.jobs.ac.uk/jobs/economics/?format=rss",                       sector: "Finance",      source: "jobs.ac.uk" },
  { url: "https://www.jobs.ac.uk/jobs/it-services/?format=rss",                     sector: "Technology",   source: "jobs.ac.uk" },
  { url: "https://www.jobs.ac.uk/jobs/finance-and-procurement/?format=rss",         sector: "Finance",      source: "jobs.ac.uk" },
  { url: "https://www.jobs.ac.uk/jobs/mathematics-and-statistics/?format=rss",      sector: "AI & Data",    source: "jobs.ac.uk" },
  { url: "https://www.jobs.ac.uk/jobs/biological-sciences/?format=rss",             sector: "Healthcare",   source: "jobs.ac.uk" },
  { url: "https://www.jobs.ac.uk/jobs/physical-and-environmental-sciences/?format=rss", sector: "Engineering", source: "jobs.ac.uk" },
  { url: "https://www.jobs.ac.uk/jobs/education-studies-inc-tefl/?format=rss",      sector: "Education",    source: "jobs.ac.uk" },
  { url: "https://www.jobs.ac.uk/jobs/psychology/?format=rss",                      sector: "Healthcare",   source: "jobs.ac.uk" },
  { url: "https://www.jobs.ac.uk/jobs/law/?format=rss",                             sector: "Business",     source: "jobs.ac.uk" },
  { url: "https://www.jobs.ac.uk/jobs/social-sciences-and-social-care/?format=rss", sector: "Public Sector",source: "jobs.ac.uk" },
  { url: "https://www.jobs.ac.uk/jobs/senior-management/?format=rss",               sector: "Business",     source: "jobs.ac.uk" },
  { url: "https://www.jobs.ac.uk/jobs/human-resources/?format=rss",                 sector: "Business",     source: "jobs.ac.uk" },
  { url: "https://www.jobs.ac.uk/jobs/pr-marketing-sales-and-communication/?format=rss", sector: "Business",source: "jobs.ac.uk" },
  { url: "https://www.jobs.ac.uk/jobs/web-design-and-development/?format=rss",      sector: "Technology",   source: "jobs.ac.uk" },
  { url: "https://www.jobs.ac.uk/jobs/project-management-and-consulting/?format=rss",sector: "Business",    source: "jobs.ac.uk" },
  { url: "https://www.jobs.ac.uk/jobs/sustainability/?format=rss",                  sector: "Engineering",  source: "jobs.ac.uk" },
  { url: "https://www.jobs.ac.uk/jobs/international-activities/?format=rss",        sector: "Business",     source: "jobs.ac.uk" },
  { url: "https://www.jobs.ac.uk/jobs/administrative/?format=rss",                  sector: "Public Sector",source: "jobs.ac.uk" },
  { url: "https://www.jobs.ac.uk/jobs/laboratory-clinical-and-technician/?format=rss", sector: "Healthcare",source: "jobs.ac.uk" },
  { url: "https://jobs.theguardian.com/jobs/technology/?format=rss",                sector: "Technology",   source: "Guardian Jobs" },
  { url: "https://jobs.theguardian.com/jobs/healthcare/?format=rss",                sector: "Healthcare",   source: "Guardian Jobs" },
  { url: "https://jobs.theguardian.com/jobs/finance/?format=rss",                   sector: "Finance",      source: "Guardian Jobs" },
  { url: "https://jobs.theguardian.com/jobs/engineering/?format=rss",               sector: "Engineering",  source: "Guardian Jobs" },
  { url: "https://jobs.theguardian.com/jobs/education/?format=rss",                 sector: "Education",    source: "Guardian Jobs" },
  { url: "https://jobs.theguardian.com/jobs/social-care/?format=rss",               sector: "Public Sector",source: "Guardian Jobs" },
  { url: "https://jobs.theguardian.com/jobs/marketing-pr/?format=rss",              sector: "Business",     source: "Guardian Jobs" },
  { url: "https://jobs.theguardian.com/jobs/charity/?format=rss",                   sector: "Public Sector",source: "Guardian Jobs" },
];

const SPONSOR_KW  = ["visa sponsor","sponsorship","skilled worker","tier 2","work permit","certificate of sponsorship","will sponsor"];
const NO_SPONSOR  = ["no sponsorship","unable to sponsor","must have right to work","must already have the right","uk residency required"];

function detectSponsorship(title = "", desc = "") {
  const t = `${title} ${desc}`.toLowerCase();
  if (NO_SPONSOR.some(k => t.includes(k))) return false;
  if (SPONSOR_KW.some(k => t.includes(k))) return true;
  return null;
}

function clean(s = "") {
  return s.replace(/<[^>]+>/g,"").replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"').replace(/&#39;/g,"'").trim();
}

function parseRSS(xml, sector, source) {
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
    const org  = desc.match(/(?:Organisation|Employer|Institution):\s*([^\n<]+)/i);
    const loc  = desc.match(/(?:Location|Place of [Ww]ork):\s*([^\n<,]+)/i);
    const sal  = desc.match(/(?:Salary|Remuneration|Grade):\s*([^\n<]+)/i);
    let posted = "";
    if (pubDate) { try { posted = new Date(pubDate).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"}); } catch {} }
    jobs.push({
      title,
      company:     org ? clean(org[1]).substring(0,80) : "UK Employer",
      location:    loc ? clean(loc[1]).substring(0,80) : "United Kingdom",
      salary:      sal ? clean(sal[1]).substring(0,70) : "Competitive",
      sector, posted, source,
      url:         link,
      sponsorship: detectSponsorship(title, desc),
      expires_at:  new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
  }
  return jobs;
}

export default async function handler(req, res) {
  // Security: only allow Vercel Cron calls or manual trigger with secret
  const authHeader = req.headers["authorization"];
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: "Unauthorised" });
  }

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const log = [];
  let totalInserted = 0;
  let totalSkipped  = 0;

  try {
    // ── Step 1: Fetch all RSS feeds in parallel ─────────────────────────
    log.push(`[${new Date().toISOString()}] Starting job refresh...`);
    log.push(`Fetching ${RSS_FEEDS.length} RSS feeds...`);

    const settled = await Promise.allSettled(
      RSS_FEEDS.map(({ url, sector, source }) =>
        fetch(url, {
          headers: { "User-Agent": "Mentorgram AI (+https://mentorgramai.com)" },
          signal: AbortSignal.timeout(12000),
        })
          .then(r => r.ok ? r.text() : "")
          .then(xml => xml ? parseRSS(xml, sector, source) : [])
          .catch(() => [])
      )
    );

    let allJobs = settled
      .filter(r => r.status === "fulfilled")
      .flatMap(r => r.value);

    // Deduplicate by URL
    const seen = new Set();
    allJobs = allJobs.filter(j => {
      const k = j.url.split("?")[0];
      if (seen.has(k)) return false;
      seen.add(k); return true;
    });

    log.push(`Fetched ${allJobs.length} unique jobs from RSS feeds`);

    // ── Step 2: Upsert into Supabase in batches of 100 ─────────────────
    const BATCH = 100;
    for (let i = 0; i < allJobs.length; i += BATCH) {
      const batch = allJobs.slice(i, i + BATCH);
      const { error, count } = await supabase
        .from("jobs")
        .upsert(batch, {
          onConflict: "url",
          ignoreDuplicates: false,
          count: "exact",
        });
      if (error) {
        log.push(`Batch ${i/BATCH + 1} error: ${error.message}`);
        totalSkipped += batch.length;
      } else {
        totalInserted += batch.length;
        log.push(`Batch ${i/BATCH + 1}: inserted/updated ${batch.length} jobs`);
      }
    }

    // ── Step 3: Delete expired jobs ─────────────────────────────────────
    const { error: deleteError, count: deletedCount } = await supabase
      .from("jobs")
      .delete({ count: "exact" })
      .lt("expires_at", new Date().toISOString());

    if (!deleteError) {
      log.push(`Deleted ${deletedCount || 0} expired jobs`);
    }

    // ── Step 4: Get total count ─────────────────────────────────────────
    const { count: totalCount } = await supabase
      .from("jobs")
      .select("*", { count: "exact", head: true });

    log.push(`Total jobs in database: ${totalCount}`);
    log.push(`Refresh complete!`);

    return res.status(200).json({
      success: true,
      inserted: totalInserted,
      skipped: totalSkipped,
      total: totalCount,
      log,
    });

  } catch (err) {
    log.push(`FATAL ERROR: ${err.message}`);
    return res.status(500).json({ error: err.message, log });
  }
}
