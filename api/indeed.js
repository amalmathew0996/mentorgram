export const config = { runtime: "edge" };

// ✅ JSearch API via RapidAPI — aggregates Indeed, LinkedIn, Glassdoor
// Free tier: 200 requests/month at rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch

export default async function handler(req) {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Content-Type": "application/json",
  };

  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const url = new URL(req.url);
    const q   = url.searchParams.get("q")        || "software engineer";
    const loc = url.searchParams.get("location") || "United Kingdom";

    const apiKey = process.env.RAPIDAPI_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ jobs: [], error: "Missing RAPIDAPI_KEY" }), { status: 200, headers: cors });
    }

    const searchQuery = q + " visa sponsorship " + loc;

    const apiRes = await fetch(
      "https://jsearch.p.rapidapi.com/search?query=" + encodeURIComponent(searchQuery) + "&page=1&num_pages=2&country=gb&date_posted=month",
      {
        method: "GET",
        headers: {
          "x-rapidapi-host": "jsearch.p.rapidapi.com",
          "x-rapidapi-key": apiKey,
        },
      }
    );

    if (!apiRes.ok) {
      const err = await apiRes.text();
      console.error("JSearch error:", apiRes.status, err.slice(0, 200));
      return new Response(JSON.stringify({ jobs: [] }), { status: 200, headers: cors });
    }

    const data = await apiRes.json();
    const raw = data.data || [];

    const jobs = raw.map(j => ({
      id:          "indeed-" + (j.job_id || Math.random().toString(36).slice(2)),
      title:       j.job_title || "",
      company:     j.employer_name || "",
      location:    j.job_city ? j.job_city + ", " + (j.job_country || "UK") : (j.job_country || "United Kingdom"),
      salary:      j.job_min_salary && j.job_max_salary
                     ? "GBP " + Math.round(j.job_min_salary).toLocaleString() + " - " + Math.round(j.job_max_salary).toLocaleString() + "/yr"
                     : j.job_salary_period ? "Competitive" : "Competitive",
      sector:      j.job_required_skills?.[0] || mapJobType(j.job_title),
      sponsorship: detectSponsorship(j.job_description || "", j.job_title || ""),
      url:         j.job_apply_link || j.job_google_link || "",
      posted:      j.job_posted_at_datetime_utc ? formatDate(j.job_posted_at_datetime_utc) : "Recently",
      source:      "Indeed",
      description: (j.job_description || "").slice(0, 300),
    })).filter(j => j.url); // only include jobs with a valid apply link

    return new Response(JSON.stringify({ jobs, total: jobs.length }), { status: 200, headers: cors });

  } catch (err) {
    console.error("Indeed handler error:", err.message);
    return new Response(JSON.stringify({ jobs: [] }), { status: 200, headers: cors });
  }
}

function detectSponsorship(description, title) {
  const text = (description + " " + title).toLowerCase();
  return text.includes("visa sponsor") ||
         text.includes("sponsorship") ||
         text.includes("skilled worker") ||
         text.includes("tier 2") ||
         text.includes("work visa") ||
         text.includes("right to work");
}

function mapJobType(title) {
  const t = (title || "").toLowerCase();
  if (t.includes("nurse") || t.includes("doctor") || t.includes("care") || t.includes("health")) return "Healthcare";
  if (t.includes("engineer") || t.includes("developer") || t.includes("software") || t.includes("tech")) return "Technology";
  if (t.includes("data") || t.includes("analyst") || t.includes("ai") || t.includes("machine")) return "AI & Data";
  if (t.includes("finance") || t.includes("account") || t.includes("banking")) return "Finance";
  if (t.includes("teach") || t.includes("lecturer") || t.includes("professor")) return "Education";
  if (t.includes("market") || t.includes("sales") || t.includes("business")) return "Business";
  return "General";
}

function formatDate(dateStr) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return "Recently";
  }
}
