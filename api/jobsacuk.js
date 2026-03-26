export const config = { runtime: "nodejs" };

// 60+ free RSS feeds — no API keys needed — targets 1000+ unique jobs
const FEEDS = [
  // ── jobs.ac.uk — ALL categories (24 feeds × ~20 jobs each = ~480 jobs) ──
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

  // ── jobs.ac.uk by LOCATION (adds different job listings) ─────────────────
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

  // ── Guardian Jobs (9 categories) ──────────────────────────────────────────
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

const SPONSOR_KW = ["visa sponsor","sponsorship","skilled worker","tier 2","work permit","certificate of sponsorship","will sponsor","cos provided","right to work provided"];
const NO_SPONSOR = ["no sponsorship","unable to sponsor","must have right to work","must already have the right","uk residency required","must be eligible to work in the uk"];

function detectSponsorship(title = "", desc = "") {
  const t = `${title} ${desc}`.toLowerCase();
  if (NO_SPONSOR.some(k => t.includes(k))) return false;
  if (SPONSOR_KW.some(k => t.includes(k))) return true;
  return null;
}

function clean(s = "") {
  return s.replace(/<[^>]+>/g,"").replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&nbsp;/g," ").trim();
}

function getSector(title = "", feedSector = "") {
  const t = title.toLowerCase();
  if (/software|developer|programmer|web|mobile|devops|cloud|cyber|network|sysadmin/.test(t)) return "Technology";
  if (/data|scientist|machine learning|ai |mlops|intelligence/.test(t)) return "AI & Data";
  if (/nurse|doctor|gp|nhs|healthcare|medical|dental|care|clinical|therapist|pharmacist/.test(t)) return "Healthcare";
  if (/finance|financial|accountant|audit|banking|investment|payroll|risk|compliance/.test(t)) return "Finance";
  if (/engineer|mechanical|civil|electrical|chemical|architect/.test(t)) return "Engineering";
  if (/teacher|teaching|lecturer|education|school|university|academic/.test(t)) return "Education";
  if (/chef|cook|hotel|restaurant|hospitality|catering/.test(t)) return "Hospitality";
  if (/social worker|probation|council|government|police|civil service|charity/.test(t)) return "Public Sector";
  if (/marketing|sales|hr |human resources|supply chain|product manager/.test(t)) return "Business";
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
    const sector = getSector(title, feedSector);
    const sponsorship = detectSponsorship(title, desc);
    jobs.push({
      title,
      company:     org ? clean(org[1]).substring(0,80) : "UK Employer",
      location:    loc ? clean(loc[1]).substring(0,80) : "United Kingdom",
      salary:      sal ? clean(sal[1]).substring(0,70) : "Competitive",
      sector, posted, url: link,
      source:      "jobs.ac.uk",
      sponsorship,
    });
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
      FEEDS.map(({ url: feedUrl, sector }) =>
        fetch(feedUrl, { headers: { "User-Agent": "Mentorgram AI (+https://mentorgramai.com)" }, signal: AbortSignal.timeout(10000) })
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
    jobs.sort((a, b) => { try { if (!a.posted) return 1; if (!b.posted) return -1; return new Date(b.posted) - new Date(a.posted); } catch { return 0; } });
    return res.status(200).json({ jobs, count: jobs.length, updatedAt: new Date().toISOString() });
  } catch (err) {
    return res.status(500).json({ error: err.message, jobs: [] });
  }
}
