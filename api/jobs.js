export const config = { runtime: "edge" };

const SEARCHES = [
  "visa sponsorship software engineer UK",
  "visa sponsorship data scientist UK",
  "visa sponsorship NHS healthcare UK",
  "visa sponsorship finance analyst UK",
  "visa sponsorship mechanical engineer UK",
  "visa sponsorship marketing manager UK",
];

export default async function handler(req) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET",
    "Content-Type": "application/json",
  };

  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    // Pick a random search to keep variety
    const search = SEARCHES[Math.floor(Math.random() * SEARCHES.length)];

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "mcp-client-2025-04-04",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4000,
        mcp_servers: [
          { type: "url", url: "https://mcp.indeed.com/claude/mcp", name: "indeed-mcp" }
        ],
        system: `You are a job search assistant. Use the Indeed search tool with country_code "GB" and location "United Kingdom".
Run searches for these terms one at a time:
1. "visa sponsorship software engineer UK"
2. "visa sponsorship healthcare NHS UK"  
3. "visa sponsorship finance analyst UK"
4. "visa sponsorship engineer UK"

Collect all results and return ONLY a valid JSON array, no markdown, no explanation.
Format each job as: {"title":"...","company":"...","location":"...","salary":"...","sector":"...","posted":"...","url":"..."}
For sector, categorise each job as one of: Technology, AI & Data, Healthcare, Finance, Engineering, Business
If salary missing use "Competitive". Return up to 30 jobs total. No duplicates.`,
        messages: [{ role: "user", content: "Search for UK visa sponsorship jobs across all sectors and return JSON array." }]
      }),
    });

    const data = await res.json();
    const text = data.content?.filter(b => b.type === "text").map(b => b.text).join("") || "";
    const clean = text.replace(/```json|```/g, "").trim();
    const start = clean.indexOf("[");
    const end = clean.lastIndexOf("]");

    if (start === -1 || end === -1) throw new Error("No jobs found in response");

    const jobs = JSON.parse(clean.slice(start, end + 1));

    return new Response(JSON.stringify({ jobs, updatedAt: new Date().toISOString() }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message, jobs: [] }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}
