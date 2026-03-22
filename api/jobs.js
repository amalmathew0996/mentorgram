export const config = { runtime: "edge" };

export default async function handler(req) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET",
    "Content-Type": "application/json",
  };

  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "visa sponsorship UK";
    const location = searchParams.get("location") || "United Kingdom";
    const apiKey = process.env.ANTHROPIC_API_KEY;

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
        max_tokens: 3000,
        mcp_servers: [
          { type: "url", url: "https://mcp.indeed.com/claude/mcp", name: "indeed-mcp" }
        ],
        system: `You are a job search assistant for UK visa sponsorship roles.
Use the Indeed search tool with country_code "GB" and location "${location}".
Search for: "${query} visa sponsorship".
Return ONLY a valid JSON array, no markdown, no explanation, nothing else.
Format: [{"title":"...","company":"...","location":"...","salary":"...","sector":"...","posted":"...","url":"..."}]
Categorise sector as one of: Technology, AI & Data, Healthcare, Finance, Engineering, Business, Other.
If salary missing use "Competitive". Return up to 12 results.`,
        messages: [{ role: "user", content: `Search Indeed UK for: ${query} visa sponsorship in ${location}` }]
      }),
    });

    const data = await res.json();
    const text = data.content?.filter(b => b.type === "text").map(b => b.text).join("") || "";
    const clean = text.replace(/```json|```/g, "").trim();
    const start = clean.indexOf("[");
    const end = clean.lastIndexOf("]");
    if (start === -1 || end === -1) throw new Error("No results");
    const jobs = JSON.parse(clean.slice(start, end + 1));

    return new Response(JSON.stringify({ jobs, updatedAt: new Date().toISOString(), query }), {
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
