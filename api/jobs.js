export const config = { runtime: "edge" };

const SPONSORSHIP_KEYWORDS = [
  "visa sponsor", "sponsorship", "skilled worker", "tier 2",
  "certificate of sponsorship", "right to work provided",
  "will sponsor", "visa provided", "work permit", "cos"
];

function detectSponsorship(title = "", company = "", description = "") {
  const text = `${title} ${company} ${description}`.toLowerCase();
  return SPONSORSHIP_KEYWORDS.some(kw => text.includes(kw));
}

function guessSector(title = "") {
  const t = title.toLowerCase();
  if (t.match(/software|developer|programmer|web|mobile|it |tech|cyber|devops|cloud|designer|ux|ui/)) return "Technology";
  if (t.match(/data|scientist|analyst|machine learning|ai |intelligence/)) return "AI & Data";
  if (t.match(/nurse|doctor|nhs|healthcare|medical|dental|care|clinical|therapist|pharmacist/)) return "Healthcare";
  if (t.match(/finance|financial|accountant|audit|banking|investment|payroll/)) return "Finance";
  if (t.match(/engineer|engineering|mechanical|civil|electrical|manufacturing/)) return "Engineering";
  if (t.match(/teacher|teaching|lecturer|education|school|university|academic/)) return "Education";
  if (t.match(/chef|cook|hotel|restaurant|hospitality|catering/)) return "Hospitality";
  if (t.match(/marketing|sales|business|manager|operations|hr|recruiter/)) return "Business";
  if (t.match(/prison|police|council|government|public sector|civil service/)) return "Public Sector";
  return "Other";
}

function formatSalary(min, max) {
  if (!min && !max) return "Competitive";
  if (min && max) return `£${Math.round(min).toLocaleString()}–£${Math.round(max).toLocaleString()}`;
  if (min) return `From £${Math.round(min).toLocaleString()}`;
  return `Up to £${Math.round(max).toLocaleString()}`;
}

// ── Indeed via MCP ──────────────────────────────────────────────────────────
async function fetchFromIndeed(apiKey, query, location) {
  const searches = query
    ? [query]
    : ["software engineer developer", "NHS nurse healthcare", "data scientist analyst",
       "finance accountant", "teacher education", "engineer manufacturing", "marketing business manager"];

  const results = await Promise.allSettled(
    searches.map(q =>
      fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-beta": "mcp-client-2025-04-04",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1500,
          mcp_servers: [{ type: "url", url: "https://mcp.indeed.com/claude/mcp", name: "indeed-mcp" }],
          system: `Search Indeed UK. country_code "GB", location "${location}", search "${q}".
Return ONLY a JSON array. No markdown.
Format: [{"title":"...","company":"...","location":"...","salary":"...","sector":"...","posted":"...","url":"...","sponsorship":false}]
Set sponsorship:true ONLY if listing explicitly mentions visa sponsorship or skilled worker visa.
If salary missing use "Competitive". Return 10 jobs.`,
          messages: [{ role: "user", content: q }],
        }),
      })
        .then(r => r.json())
        .then(data => {
          const text = data.content?.filter(b => b.type === "text").map(b => b.text).join("") || "";
          const clean = text.replace(/```json|```/g, "").trim();
          const s = clean.indexOf("["), e = clean.lastIndexOf("]");
          if (s === -1 || e === -1) return [];
          return JSON.parse(clean.slice(s, e + 1)).map(j => ({ ...j, source: "Indeed" }));
        })
        .catch(() => [])
    )
  );
  return results.flatMap(r => (r.status === "fulfilled" ? r.value : []));
}

// ── Reed API ────────────────────────────────────────────────────────────────
async function fetchFromReed(apiKey, query, location) {
  const searches = query
    ? [query]
    : ["software engineer", "nurse healthcare", "data scientist", "finance analyst",
       "teacher", "civil engineer", "marketing manager", "chef hospitality"];

  const results = await Promise.allSettled(
    searches.map(async keywords => {
      const url = `https://www.reed.co.uk/api/1.0/search?keywords=${encodeURIComponent(keywords)}&locationName=${encodeURIComponent(location)}&resultsToTake=10&distanceFromLocation=15`;
      const encoded = btoa(`${apiKey}:`);
      const res = await fetch(url, { headers: { Authorization: `Basic ${encoded}`, Accept: "application/json" } });
      if (!res.ok) return [];
      const data = await res.json();
      return (data.results || []).map(job => ({
        title: job.jobTitle || "",
        company: job.employerName || "Unknown",
        location: job.locationName || location,
        salary: formatSalary(job.minimumSalary, job.maximumSalary),
        sector: guessSector(job.jobTitle),
        posted: job.date ? new Date(job.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "",
        url: job.jobUrl || "",
        source: "Reed",
        sponsorship: detectSponsorship(job.jobTitle, job.employerName, job.jobDescription || ""),
      }));
    })
  );
  return results.flatMap(r => (r.status === "fulfilled" ? r.value : []));
}

// ── Adzuna API ──────────────────────────────────────────────────────────────
async function fetchFromAdzuna(appId, appKey, query, location) {
  const searches = query
    ? [query]
    : ["software developer", "nurse care worker", "data analyst", "accountant finance",
       "teacher school", "mechanical engineer", "sales marketing", "chef hotel"];

  const results = await Promise.allSettled(
    searches.map(async what => {
      const url = `https://api.adzuna.com/v1/api/jobs/gb/search/1?app_id=${appId}&app_key=${appKey}&results_per_page=10&what=${encodeURIComponent(what)}&where=${encodeURIComponent(location)}&content-type=application/json`;
      const res = await fetch(url);
      if (!res.ok) return [];
      const data = await res.json();
      return (data.results || []).map(job => ({
        title: job.title || "",
        company: job.company?.display_name || "Unknown",
        location: job.location?.display_name || location,
        salary: formatSalary(job.salary_min, job.salary_max),
        sector: guessSector(job.title),
        posted: job.created ? new Date(job.created).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "",
        url: job.redirect_url || "",
        source: "Adzuna",
        sponsorship: detectSponsorship(job.title, job.company?.display_name || "", job.description || ""),
      }));
    })
  );
  return results.flatMap(r => (r.status === "fulfilled" ? r.value : []));
}

// ── Main handler ─────────────────────────────────────────────────────────────
export default async function handler(req) {
  const corsHeaders = { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" };

  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    const location = searchParams.get("location") || "United Kingdom";

    const [indeedJobs, reedJobs, adzunaJobs] = await Promise.all([
      process.env.ANTHROPIC_API_KEY
        ? fetchFromIndeed(process.env.ANTHROPIC_API_KEY, query, location).catch(() => [])
        : [],
      process.env.REED_API_KEY
        ? fetchFromReed(process.env.REED_API_KEY, query, location).catch(() => [])
        : [],
      process.env.ADZUNA_APP_ID && process.env.ADZUNA_APP_KEY
        ? fetchFromAdzuna(process.env.ADZUNA_APP_ID, process.env.ADZUNA_APP_KEY, query, location).catch(() => [])
        : [],
    ]);

    const seen = new Set();
    const allJobs = [];

    for (const job of [...indeedJobs, ...reedJobs, ...adzunaJobs]) {
      if (!job.title || !job.company) continue;
      const key = `${job.title}|${job.company}`.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      if (!job.sector || job.sector === "Other") job.sector = guessSector(job.title);
      allJobs.push(job);
    }

    if (allJobs.length === 0) throw new Error("No jobs found");

    allJobs.sort((a, b) => (b.sponsorship ? 1 : 0) - (a.sponsorship ? 1 : 0));

    return new Response(
      JSON.stringify({
        jobs: allJobs,
        updatedAt: new Date().toISOString(),
        total: allJobs.length,
        sources: { indeed: indeedJobs.length, reed: reedJobs.length, adzuna: adzunaJobs.length },
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message, jobs: [] }), { status: 500, headers: corsHeaders });
  }
}
