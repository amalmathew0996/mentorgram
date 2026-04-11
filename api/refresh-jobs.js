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
  { url: "https://www.totaljobs.com/jobs/healthcare/rss",                           sector: "Healthcare",    source: "Totaljobs" },
  { url: "https://www.totaljobs.com/jobs/it-jobs/rss",                              sector: "Technology",    source: "Totaljobs" },
  { url: "https://www.totaljobs.com/jobs/engineering/rss",                          sector: "Engineering",   source: "Totaljobs" },
  { url: "https://www.totaljobs.com/jobs/finance/rss",                              sector: "Finance",       source: "Totaljobs" },
  { url: "https://www.totaljobs.com/jobs/education/rss",                            sector: "Education",     source: "Totaljobs" },
  { url: "https://www.totaljobs.com/jobs/social-care/rss",                          sector: "Public Sector", source: "Totaljobs" },
  { url: "https://www.cwjobs.co.uk/jobs/it/rss",                                    sector: "Technology",    source: "CWJobs" },
  { url: "https://www.cwjobs.co.uk/jobs/data-science/rss",                          sector: "AI & Data",     source: "CWJobs" },
  { url: "https://www.cwjobs.co.uk/jobs/software-engineering/rss",                  sector: "Technology",    source: "CWJobs" },
  { url: "https://www.jobs.nhs.uk/xi/vacancy_feed/?pincode=&distance=50&vacancy_type=JOB&specialty=&job_type_code=&employer_type=1&hours=&pay_band=&orderby=publicationdate&pagenum=1", sector: "Healthcare", source: "NHS Jobs" },
  { url: "https://www.lgjobs.com/vacancies/rss",                                    sector: "Public Sector", source: "LG Jobs" },
  { url: "https://www.lgjobs.com/vacancies/rss?keyword=social+worker",              sector: "Public Sector", source: "LG Jobs" },
  { url: "https://www.lgjobs.com/vacancies/rss?keyword=housing",                    sector: "Public Sector", source: "LG Jobs" },
  { url: "https://www.lgjobs.com/vacancies/rss?keyword=planning",                   sector: "Public Sector", source: "LG Jobs" },
  { url: "https://www.lgjobs.com/vacancies/rss?keyword=finance",                    sector: "Finance",       source: "LG Jobs" },
  { url: "https://www.lgjobs.com/vacancies/rss?keyword=IT",                         sector: "Technology",    source: "LG Jobs" },
  { url: "https://www.civilservicejobs.service.gov.uk/csr/index.cgi?SID=b3duZXI9NTA3MDAwMCZvd25lcnR5cGU9ZmFpcg==&format=rss", sector: "Public Sector", source: "Civil Service" },
];

const ADZUNA_SEARCHES = [
  { q: "software engineer",          sector: "Technology",    group: 0 },
  { q: "software developer",         sector: "Technology",    group: 0 },
  { q: "data scientist",             sector: "AI & Data",     group: 0 },
  { q: "data engineer",              sector: "AI & Data",     group: 0 },
  { q: "machine learning engineer",  sector: "AI & Data",     group: 0 },
  { q: "DevOps engineer",            sector: "Technology",    group: 0 },
  { q: "web developer",              sector: "Technology",    group: 0 },
  { q: "cybersecurity analyst",      sector: "Technology",    group: 0 },
  { q: "network engineer",           sector: "Technology",    group: 0 },
  { q: "data analyst",               sector: "AI & Data",     group: 0 },
  { q: "NHS nurse",                  sector: "Healthcare",    group: 1 },
  { q: "registered nurse",           sector: "Healthcare",    group: 1 },
  { q: "staff nurse",                sector: "Healthcare",    group: 1 },
  { q: "NHS healthcare assistant",   sector: "Healthcare",    group: 1 },
  { q: "NHS doctor",                 sector: "Healthcare",    group: 1 },
  { q: "NHS pharmacist",             sector: "Healthcare",    group: 1 },
  { q: "NHS physiotherapist",        sector: "Healthcare",    group: 1 },
  { q: "NHS occupational therapist", sector: "Healthcare",    group: 1 },
  { q: "NHS radiographer",           sector: "Healthcare",    group: 1 },
  { q: "NHS mental health nurse",    sector: "Healthcare",    group: 1 },
  { q: "care worker",                sector: "Healthcare",    group: 2 },
  { q: "midwife",                    sector: "Healthcare",    group: 2 },
  { q: "paramedic",                  sector: "Healthcare",    group: 2 },
  { q: "dental nurse",               sector: "Healthcare",    group: 2 },
  { q: "NHS social worker",          sector: "Healthcare",    group: 2 },
  { q: "financial analyst",          sector: "Finance",       group: 2 },
  { q: "accountant",                 sector: "Finance",       group: 2 },
  { q: "mechanical engineer",        sector: "Engineering",   group: 2 },
  { q: "civil engineer",             sector: "Engineering",   group: 2 },
  { q: "electrical engineer",        sector: "Engineering",   group: 2 },
  { q: "project manager",            sector: "Business",      group: 3 },
  { q: "marketing manager",          sector: "Business",      group: 3 },
  { q: "business analyst",           sector: "Business",      group: 3 },
  { q: "product manager",            sector: "Business",      group: 3 },
  { q: "HR manager",                 sector: "Business",      group: 3 },
  { q: "operations manager",         sector: "Business",      group: 3 },
  { q: "social worker",              sector: "Public Sector", group: 3 },
  { q: "teacher",                    sector: "Education",     group: 3 },
  { q: "chef",                       sector: "Hospitality",   group: 3 },
  { q: "council social worker",      sector: "Public Sector", group: 0 },
  { q: "local authority planner",    sector: "Public Sector", group: 1 },
  { q: "council housing officer",    sector: "Public Sector", group: 2 },
  { q: "environmental health officer",sector:"Public Sector", group: 3 },
  { q: "council finance officer",    sector: "Finance",       group: 0 },
  { q: "council IT officer",         sector: "Technology",    group: 1 },
];

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
  { q: "full stack developer",        group: 0 },
  { q: "backend developer",           group: 0 },
  { q: "frontend developer",          group: 0 },
  { q: "React developer",             group: 0 },
  { q: "Python developer",            group: 0 },
  { q: "Java developer",              group: 1 },
  { q: "AWS engineer",                group: 1 },
  { q: "Azure engineer",              group: 1 },
  { q: "cloud architect",             group: 1 },
  { q: "infrastructure engineer",     group: 2 },
  { q: "site reliability engineer",   group: 2 },
  { q: "QA engineer",                 group: 2 },
  { q: "test automation engineer",    group: 2 },
  { q: "mobile developer",            group: 2 },
  { q: "iOS developer",               group: 3 },
  { q: "Android developer",           group: 3 },
  { q: "database administrator",      group: 3 },
  { q: "security engineer",           group: 3 },
  { q: "AI engineer",                 group: 3 },
  // ✅ Designers
  { q: "graphic designer",            group: 0 },
  { q: "UI designer",                 group: 0 },
  { q: "UX designer",                 group: 1 },
  { q: "UI UX designer",              group: 1 },
  { q: "web designer",                group: 2 },
  { q: "product designer",            group: 2 },
  { q: "creative designer",           group: 3 },
  { q: "visual designer",             group: 3 },
  { q: "brand designer",              group: 0 },
  // ✅ IT Technicians
  { q: "IT technician",               group: 0 },
  { q: "IT support technician",       group: 1 },
  { q: "desktop support technician",  group: 2 },
  { q: "helpdesk technician",         group: 3 },
  { q: "field service technician",    group: 0 },
  { q: "network technician",          group: 1 },
  { q: "IT support engineer",         group: 2 },
  // ✅ System Administrators
  { q: "system administrator",        group: 0 },
  { q: "Linux administrator",         group: 1 },
  { q: "Windows administrator",       group: 2 },
  { q: "network administrator",       group: 3 },
  { q: "cloud administrator",         group: 0 },
  // ✅ Systems Engineers
  { q: "systems engineer",            group: 1 },
  { q: "systems analyst",             group: 2 },
  { q: "solutions engineer",          group: 3 },
  { q: "platform engineer",           group: 0 },
  { q: "embedded systems engineer",   group: 1 },
  { q: "IT systems engineer",         group: 2 },
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

// ✅ JSearch (Indeed) searches — 5 per group, 200 req/month free tier
// 5 searches × 4 groups × 6 runs/day = 120 calls/day — but we cap at 1 run/day for Indeed
// to stay well within the 200/month free limit
const JSEARCH_SEARCHES = [
  { q: "software engineer visa sponsorship United Kingdom",  sector: "Technology",    group: 0 },
  { q: "data scientist visa sponsorship United Kingdom",     sector: "AI & Data",     group: 0 },
  { q: "graphic designer visa sponsorship United Kingdom",   sector: "Business",      group: 0 },
  { q: "NHS nurse visa sponsorship United Kingdom",          sector: "Healthcare",    group: 1 },
  { q: "registered nurse sponsorship United Kingdom",        sector: "Healthcare",    group: 1 },
  { q: "UI UX designer visa sponsorship United Kingdom",     sector: "Technology",    group: 1 },
  { q: "mechanical engineer visa sponsorship UK",            sector: "Engineering",   group: 2 },
  { q: "civil engineer sponsorship United Kingdom",          sector: "Engineering",   group: 2 },
  { q: "web designer visa sponsorship United Kingdom",       sector: "Technology",    group: 2 },
  { q: "project manager visa sponsorship UK",                sector: "Business",      group: 3 },
  { q: "social worker visa sponsorship United Kingdom",      sector: "Public Sector", group: 3 },
  { q: "creative designer visa sponsorship United Kingdom",  sector: "Business",      group: 3 },
  // ✅ Extra IT JSearch searches
  { q: "full stack developer visa sponsorship United Kingdom",  sector: "Technology",  group: 0 },
  { q: "Python developer visa sponsorship UK",                  sector: "Technology",  group: 0 },
  { q: "React developer visa sponsorship United Kingdom",       sector: "Technology",  group: 1 },
  { q: "AWS cloud engineer visa sponsorship UK",                sector: "Technology",  group: 1 },
  { q: "DevOps engineer visa sponsorship United Kingdom",       sector: "Technology",  group: 2 },
  { q: "cybersecurity engineer visa sponsorship UK",            sector: "Technology",  group: 2 },
  { q: "Java developer visa sponsorship United Kingdom",        sector: "Technology",  group: 3 },
  { q: "data engineer visa sponsorship UK",                     sector: "AI & Data",   group: 3 },
  // ✅ Designers
  { q: "graphic designer visa sponsorship United Kingdom",      sector: "Business",    group: 0 },
  { q: "UI UX designer visa sponsorship UK",                    sector: "Technology",  group: 1 },
  { q: "web designer visa sponsorship United Kingdom",          sector: "Technology",  group: 2 },
  { q: "product designer visa sponsorship UK",                  sector: "Technology",  group: 3 },
  // ✅ IT Technicians
  { q: "IT technician visa sponsorship United Kingdom",         sector: "Technology",  group: 0 },
  { q: "IT support engineer visa sponsorship UK",               sector: "Technology",  group: 1 },
  { q: "helpdesk technician visa sponsorship United Kingdom",   sector: "Technology",  group: 2 },
  // ✅ System Administrators & Engineers
  { q: "system administrator visa sponsorship United Kingdom",  sector: "Technology",  group: 0 },
  { q: "Linux administrator visa sponsorship UK",               sector: "Technology",  group: 1 },
  { q: "systems engineer visa sponsorship United Kingdom",      sector: "Technology",  group: 2 },
  { q: "network administrator visa sponsorship UK",             sector: "Technology",  group: 3 },
  { q: "solutions engineer visa sponsorship United Kingdom",    sector: "Technology",  group: 0 },
  { q: "platform engineer visa sponsorship UK",                 sector: "Technology",  group: 1 },
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
  if (/system.admin|sysadmin|systems admin|network admin|linux admin|windows admin|cloud admin|active.directory/.test(t)) return "Technology";
  if (/it.technician|it.support|helpdesk|desktop.support|field.service.tech|network.tech|hardware.tech/.test(t)) return "Technology";
  if (/systems engineer|systems analyst|solutions engineer|platform engineer|embedded.system|it.system/.test(t)) return "Technology";
  if (/ui.designer|ux.designer|web.designer|product.designer|graphic.designer|visual.designer|brand.designer|motion.graphic|creative.designer/.test(t)) return "Business";
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
          if (d > new Date()) return '';
          return d.toLocaleDateString('en-GB', {day:'numeric', month:'short', year:'numeric'});
        } catch { return ''; }
      })(),
      url:         (() => {
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

// ✅ NEW: Fetch from JSearch (Indeed/LinkedIn aggregator)
async function fetchJSearch(rapidApiKey, q, sector) {
  try {
    const expiresAt = new Date(Date.now() + 7*24*60*60*1000).toISOString(); // 7 days — Indeed listings move fast
    const url = "https://jsearch.p.rapidapi.com/search?query=" +
      encodeURIComponent(q) +
      "&page=1&num_pages=1&country=gb&date_posted=week";

    const r = await fetch(url, {
      method: "GET",
      headers: {
        "x-rapidapi-host": "jsearch.p.rapidapi.com",
        "x-rapidapi-key":  rapidApiKey,
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!r.ok) {
      console.error("JSearch error:", r.status);
      return [];
    }

    const data = await r.json();
    const raw  = data.data || [];

    return raw.map(j => ({
      title:       (j.job_title || "").substring(0, 120),
      company:     (j.employer_name || "UK Employer").substring(0, 80),
      location:    j.job_city
        ? (j.job_city + ", " + (j.job_country || "UK")).substring(0, 80)
        : "United Kingdom",
      salary:      j.job_min_salary && j.job_max_salary
        ? "GBP " + Math.round(j.job_min_salary).toLocaleString() + " - " + Math.round(j.job_max_salary).toLocaleString() + "/yr"
        : "Competitive",
      sector:      getSector(j.job_title || "", sector),
      posted:      j.job_posted_at_datetime_utc
        ? (() => { try { return new Date(j.job_posted_at_datetime_utc).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"}); } catch { return "Recently"; } })()
        : "Recently",
      // ✅ Use apply link directly — Indeed apply links stay live
      url:         j.job_apply_link || j.job_google_link || "",
      source:      "Indeed",
      sponsorship: detectSponsorship(j.job_title || "", j.job_description || ""),
      expires_at:  expiresAt,
    })).filter(j => j.url && j.title);
  } catch (err) {
    console.error("JSearch fetch error:", err.message);
    return [];
  }
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

  const group = new Date().getHours() % 4;
  const log   = [`Rotation group ${group} | ${new Date().toISOString()}`];

  try {
    const appId        = process.env.ADZUNA_APP_ID;
    const appKey       = process.env.ADZUNA_APP_KEY;
    const reedKey      = process.env.REED_API_KEY;
    const rapidApiKey  = process.env.RAPIDAPI_KEY; // ✅ JSearch key

    const adzunaGroup  = ADZUNA_SEARCHES.filter(s => s.group === group);
    const reedGroup    = REED_SEARCHES.filter(s => s.group === group);
    // ✅ Only run JSearch for this group's searches — saves quota
    const jsearchGroup = JSEARCH_SEARCHES.filter(s => s.group === group);

    log.push(`RSS: ${ALL_FEEDS.length} feeds | Adzuna: ${adzunaGroup.length} | Reed: ${reedGroup.length} | Indeed: ${jsearchGroup.length}`);

    const [rssSettled, adzunaSettled, reedSettled, jsearchSettled] = await Promise.all([
      // RSS — all feeds every run (free)
      Promise.allSettled(
        ALL_FEEDS.map((feed) =>
          fetch(feed.url, { headers: { "User-Agent": "Mentorgram AI (+https://mentorgramai.com)" }, signal: AbortSignal.timeout(12000) })
            .then(r => r.ok ? r.text() : "")
            .then(xml => xml ? parseRSS(xml, feed.sector, feed.source) : [])
            .catch(() => [])
        )
      ),
      // Adzuna
      appId && appKey
        ? Promise.allSettled(adzunaGroup.map(({ q, sector }) => fetchAdzuna(appId, appKey, q, sector)))
        : Promise.resolve([]),
      // Reed
      reedKey
        ? Promise.allSettled(reedGroup.map(({ q }) => fetchReed(reedKey, q)))
        : Promise.resolve([]),
      // ✅ JSearch (Indeed) — only if key exists, graceful if missing
      rapidApiKey && jsearchGroup.length > 0
        ? Promise.allSettled(jsearchGroup.map(({ q, sector }) => fetchJSearch(rapidApiKey, q, sector)))
        : Promise.resolve([]),
    ]);

    const rssJobs     = rssSettled.filter(r => r.status === "fulfilled").flatMap(r => r.value);
    const adzunaJobs  = Array.isArray(adzunaSettled) ? adzunaSettled.filter(r => r.status === "fulfilled").flatMap(r => r.value) : [];
    const reedJobs    = Array.isArray(reedSettled)   ? reedSettled.filter(r => r.status === "fulfilled").flatMap(r => r.value)   : [];
    const indeedJobs  = Array.isArray(jsearchSettled) ? jsearchSettled.filter(r => r.status === "fulfilled").flatMap(r => r.value) : [];

    let jobs = [...rssJobs, ...adzunaJobs, ...reedJobs, ...indeedJobs];

    // Deduplicate by URL
    const seen = new Set();
    jobs = jobs.filter(j => {
      if (!j.url || j.url.length < 10) return false;
      if (seen.has(j.url)) return false;
      seen.add(j.url);
      return true;
    });

    log.push(`RSS: ${rssJobs.length} | Adzuna: ${adzunaJobs.length} | Reed: ${reedJobs.length} | Indeed: ${indeedJobs.length} | Unique: ${jobs.length}`);

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

    await supabaseDeleteExpired(supabaseUrl, serviceKey);

    const total = await supabaseCount(supabaseUrl, serviceKey);
    log.push(`Total in database: ${total}`);
    log.push("Done!");

    return res.status(200).json({ success: true, inserted: jobs.length, total, log });
  } catch (err) {
    return res.status(500).json({ error: err.message, log });
  }
}
