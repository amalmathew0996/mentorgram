export const config = { runtime: "nodejs" };

const FEEDS = [
  // ── jobs.ac.uk (24 categories) ─────────────────────────────────────────
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

  // ── Guardian Jobs RSS (9 categories) ───────────────────────────────────
  { url: "https://jobs.theguardian.com/jobs/technology/?format=rss",                sector: "Technology",   source: "Guardian Jobs" },
  { url: "https://jobs.theguardian.com/jobs/healthcare/?format=rss",                sector: "Healthcare",   source: "Guardian Jobs" },
  { url: "https://jobs.theguardian.com/jobs/finance/?format=rss",                   sector: "Finance",      source: "Guardian Jobs" },
  { url: "https://jobs.theguardian.com/jobs/engineering/?format=rss",               sector: "Engineering",  source: "Guardian Jobs" },
  { url: "https://jobs.theguardian.com/jobs/education/?format=rss",                 sector: "Education",    source: "Guardian Jobs" },
  { url: "https://jobs.theguardian.com/jobs/social-care/?format=rss",               sector: "Public Sector",source: "Guardian Jobs" },
  { url: "https://jobs.theguardian.com/jobs/marketing-pr/?format=rss",              sector: "Business",     source: "Guardian Jobs" },
  { url: "https://jobs.theguardian.com/jobs/charity/?format=rss",                   sector: "Public Sector",source: "Guardian Jobs" },
  { url: "https://jobs.theguardian.com/jobs/housing/?format=rss",                   sector: "Public Sector",source: "Guardian Jobs" },
];

const SPONSOR_KW = ["visa sponsor","sponsorship","skilled worker","tier 2","work permit","certificate of sponsorship","right to work provided","will sponsor","cos provided"];
const NO_SPONSOR_KW = ["no sponsorship","unable to sponsor","must have right to work","must already have","uk residency required","must be eligible to work"];

function detectSponsorship(title = "", desc = "") {
  const t = `${title} ${desc}`.toLowerCase();
  if (NO_SPONSOR_KW.some(k => t.includes(k))) return false;
  if (SPONSOR_KW.some(k => t.includes(k))) return true;
  return undefined;
}

function clean(str = "") {
  return str.replace(/<[^>]+>/g,"").replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&nbsp;/g," ").trim();
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
    const desc    = get("description") || get("summary") || "";
    if (!title || !link) continue;
    const orgMatch = desc.match(/(?:Organisation|Employer|Institution|Company):\s*([^\n<]+)/i) || desc.match(/<strong>([^<]+)<\/strong>/);
    const company  = orgMatch ? clean(orgMatch[1]).substring(0,80) : "UK Employer";
    const locMatch = desc.match(/(?:Location|Place of [Ww]ork|Based):\s*([^\n<,]+)/i);
    const location = locMatch ? clean(locMatch[1]).substring(0,80) : "United Kingdom";
    const salMatch = desc.match(/(?:Salary|Remuneration|Grade):\s*([^\n<]+)/i);
    const salary   = salMatch ? clean(salMatch[1]).substring(0,70) : "Competitive";
    let posted = "";
    if (pubDate) { try { posted = new Date(pubDate).toLocaleDateString("en-GB", { day:"numeric",month:"short",year:"numeric" }); } catch {} }
    jobs.push({ title, company, location, salary, sector, posted, url: link, source, sponsorship: detectSponsorship(title, desc) });
  }
  return jobs;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");
  const url = new URL(req.url, "https://mentorgramai.com");
  const q   = (url.searchParams.get("q") || "").toLowerCase().trim();
  const loc = (url.searchParams.get("location") || "").toLowerCase().trim();
  try {
    const settled = await Promise.allSettled(
      FEEDS.map(({ url: feedUrl, sector, source }) =>
        fetch(feedUrl, { headers: { "User-Agent": "Mentorgram AI (+https://mentorgramai.com)" }, signal: AbortSignal.timeout(10000) })
          .then(r => r.ok ? r.text() : "")
          .then(xml => xml ? parseRSS(xml, sector, source) : [])
          .catch(() => [])
      )
    );
    let jobs = settled.filter(r => r.status === "fulfilled").flatMap(r => r.value);
    const seen = new Set();
    jobs = jobs.filter(j => { const k = j.url.split("?")[0]; if (seen.has(k)) return false; seen.add(k); return true; });
    if (q) jobs = jobs.filter(j => j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q) || j.location.toLowerCase().includes(q) || j.sector.toLowerCase().includes(q));
    if (loc && loc !== "uk" && loc !== "united kingdom") jobs = jobs.filter(j => j.location.toLowerCase().includes(loc));
    jobs.sort((a, b) => { try { if (!a.posted) return 1; if (!b.posted) return -1; return new Date(b.posted) - new Date(a.posted); } catch { return 0; } });
    return res.status(200).json({ jobs, count: jobs.length, updatedAt: new Date().toISOString() });
  } catch (err) {
    return res.status(500).json({ error: err.message, jobs: [] });
  }
}
