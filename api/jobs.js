export const config = { runtime: "edge" };

const DEFAULT_SEARCHES = [
  "visa sponsorship software engineer",
  "visa sponsorship healthcare NHS",
  "visa sponsorship finance analyst",
  "visa sponsorship engineer",
  "visa sponsorship data scientist",
  "visa sponsorship marketing manager",
  "visa sponsorship education teacher",
  "visa sponsorship hospitality restaurant",
];

const SECTOR_MAP = {
  "software": "Technology", "developer": "Technology", "engineer": "Technology",
  "IT": "Technology", "designer": "Technology", "tech": "Technology",
  "data": "AI & Data", "scientist": "AI & Data", "analyst": "AI & Data",
  "nurse": "Healthcare", "doctor": "Healthcare", "NHS": "Healthcare",
  "healthcare": "Healthcare", "medical": "Healthcare", "care": "Healthcare",
  "finance": "Finance", "accountant": "Finance", "banking": "Finance",
  "financial": "Finance", "investment": "Finance",
  "teacher": "Education", "teaching": "Education", "university": "Education",
  "school": "Education", "education": "Education", "lecturer": "Education",
  "hotel": "Hospitality", "restaurant": "Hospitality", "chef": "Hospitality",
  "hospitality": "Hospitality",
  "marketing": "Business", "sales": "Business", "manager": "Business",
  "business": "Business", "operations": "Business",
};

function guessSector(title) {
  const t = title.toLowerCase();
  for (const [keyword, sector] of Object.entries(SECTOR_MAP)) {
    if (t.includes(keyword.toLowerCase())) return sector;
  }
  return "Other";
}

export default async function handler(req) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET",
    "Content-Type": "application/json",
  };

  try {
    const { searchParams } = new URL(req.url);
    const customQuery = searchParams.get("q");
    const location = searchParams.get("location") || "United Kingdom";
    const apiKey = process.env.ANTHROPIC_API_KEY;

    // If user searched something specific, do a targeted fetch
    const searches = customQuery
      ? [`visa sponsorship ${customQuery}`]
      : DEFAULT_SEARCHES.slice(0, 4); // fetch 4 searches in parallel for default load

    const results = await Promise.allSettled(
      searches.map(search =>
        fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
            "anthropic-beta": "mcp-client-2025-04-04",
          },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 2000,
            mcp_servers: [
              { type: "url", url: "https://mcp.indeed.com/claude/mcp", name: "indeed-mcp" }
            ],
            system: `You are a job search assistant. Use the Indeed search tool with country_code "GB" and location "${location}".
Search for: "${search}".
Return ONLY a valid JSON array, no markdown, no explanation.
Format: [{"title":"...","company":"...","location":"...","salary":"...","sector":"...","visaType":"...","posted":"...","url":"..."}]
For visaType use "Health & Care" for NHS/care jobs, otherwise "Skilled Worker".
For sector use one of: Technology, AI & Data, Healthcare, Finance, Engineering, Business, Education, Hospitality, Public Sector, Other.
If salary missing use "Competitive". Return up to 8 results.`,
            messages: [{ role: "user", content: `Search Indeed UK for: ${search}` }]
          })
        }).then(r => r.json())
      )
    );

    // Collect all jobs from all searches
    const allJobs = [];
    const seen = new Set();

    for (const result of results) {
      if (result.status !== "fulfilled") continue;
      const data = result.value;
      const text = data.content?.filter(b => b.type === "text").map(b => b.text).join("") || "";
      const clean = text.replace(/```json|```/g, "").trim();
      const start = clean.indexOf("[");
      const end = clean.lastIndexOf("]");
      if (start === -1 || end === -1) continue;
      try {
        const jobs = JSON.parse(clean.slice(start, end + 1));
        for (const job of jobs) {
          // Deduplicate by title+company
          const key = `${job.title}|${job.company}`.toLowerCase();
          if (seen.has(key)) continue;
          seen.add(key);
          // Ensure sector is set
          if (!job.sector) job.sector = guessSector(job.title);
          if (!job.visaType) job.visaType = job.sector === "Healthcare" ? "Health & Care" : "Skilled Worker";
          allJobs.push(job);
        }
      } catch { continue; }
    }

    if (allJobs.length === 0) throw new Error("No jobs found");

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
