export const config = { runtime: "edge" };

// Searches grouped — each one returns 10 jobs = ~100 total in 5 parallel batches
const DEFAULT_SEARCHES = [
  "software engineer developer IT support",
  "nurse doctor healthcare NHS care worker",
  "data scientist analyst machine learning",
  "finance accountant banking investment",
  "teacher lecturer education university",
  "engineer manufacturing civil electrical",
  "marketing sales manager business development",
  "chef hotel restaurant hospitality",
  "social worker council public sector officer",
  "project manager operations HR logistics",
];

const SPONSORSHIP_KEYWORDS = [
  "visa sponsor", "sponsorship", "skilled worker", "tier 2",
  "certificate of sponsorship", "right to work provided",
  "will sponsor", "visa provided", "work permit", "cos"
];

function detectSponsorship(title, company) {
  const text = `${title} ${company}`.toLowerCase();
  return SPONSORSHIP_KEYWORDS.some(kw => text.includes(kw));
}

function guessSector(title) {
  const t = title.toLowerCase();
  if (t.match(/software|developer|programmer|web|mobile|it |tech|cyber|devops|cloud|designer|ux|ui/)) return "Technology";
  if (t.match(/data|scientist|analyst|machine learning|ai |intelligence|mlops/)) return "AI & Data";
  if (t.match(/nurse|doctor|nhs|healthcare|medical|dental|care|clinical|therapist|pharmacist/)) return "Healthcare";
  if (t.match(/finance|financial|accountant|audit|banking|investment|payroll/)) return "Finance";
  if (t.match(/engineer|engineering|mechanical|civil|electrical|manufacturing/)) return "Engineering";
  if (t.match(/teacher|teaching|lecturer|education|school|university|academic/)) return "Education";
  if (t.match(/chef|cook|hotel|restaurant|hospitality|catering/)) return "Hospitality";
  if (t.match(/marketing|sales|business|manager|operations|hr|recruiter/)) return "Business";
  if (t.match(/prison|police|council|government|public sector|civil service/)) return "Public Sector";
  return "Other";
}

async function searchIndeed(apiKey, query, location) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
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
      mcp_servers: [
        { type: "url", url: "https://mcp.indeed.com/claude/mcp", name: "indeed-mcp" }
      ],
      system: `Search Indeed UK jobs. country_code "GB", location "${location}", search "${query}".
Return ONLY a JSON array. No markdown. No explanation.
Format: [{"title":"...","company":"...","location":"...","salary":"...","sector":"...","posted":"...","url":"...","sponsorship":false}]
Set sponsorship:true ONLY if the listing explicitly mentions visa sponsorship or skilled worker visa.
If salary missing use "Competitive". Sector: Technology/AI & Data/Healthcare/Finance/Engineering/Education/Hospitality/Business/Public Sector/Other.
Return exactly 10 jobs.`,
      messages: [{ role: "user", content: query }]
    })
  });
  const data = await res.json();
  const text = data.content?.filter(b => b.type === "text").map(b => b.text).join("") || "";
  const clean = text.replace(/```json|```/g, "").trim();
  const start = clean.indexOf("[");
  const end = clean.lastIndexOf("]");
  if (start === -1 || end === -1) return [];
  return JSON.parse(clean.slice(start, end + 1));
}

export default async function handler(req) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  try {
    const { searchParams } = new URL(req.url);
    const customQuery = searchParams.get("q");
    const location = searchParams.get("location") || "United Kingdom";
    const apiKey = process.env.ANTHROPIC_API_KEY;

    let searches = customQuery ? [customQuery] : DEFAULT_SEARCHES;

    // Run all searches in parallel with a 20s timeout per batch
    const results = await Promise.allSettled(
      searches.map(q =>
        Promise.race([
          searchIndeed(apiKey, q, location),
          new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 20000))
        ])
      )
    );

    const allJobs = [];
    const seen = new Set();

    for (const result of results) {
      if (result.status !== "fulfilled" || !Array.isArray(result.value)) continue;
      for (const job of result.value) {
        if (!job.title || !job.company) continue;
        const key = `${job.title}|${job.company}`.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        if (!job.sector || job.sector === "Other") job.sector = guessSector(job.title);
        if (!job.sponsorship) job.sponsorship = detectSponsorship(job.title, job.company);
        job.visaType = job.sponsorship ? "Visa Sponsorship" : "No Sponsorship Info";
        allJobs.push(job);
      }
    }

    if (allJobs.length === 0) throw new Error("No jobs found");

    // Sort: sponsored first
    allJobs.sort((a, b) => (b.sponsorship ? 1 : 0) - (a.sponsorship ? 1 : 0));

    return new Response(
      JSON.stringify({ jobs: allJobs, updatedAt: new Date().toISOString(), total: allJobs.length }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message, jobs: [] }),
      { status: 500, headers: corsHeaders }
    );
  }
}
