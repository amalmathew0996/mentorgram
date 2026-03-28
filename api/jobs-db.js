export const config = { runtime: "nodejs" };

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const anonKey     = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return res.status(500).json({ error: "Missing Supabase env vars", jobs: [] });
  }

  const url      = new URL(req.url, "https://mentorgramai.com");
  const q        = (url.searchParams.get("q")        || "").trim();
  const loc      = (url.searchParams.get("location") || "").trim();
  const sector   = (url.searchParams.get("sector")   || "");
  const visa     = (url.searchParams.get("visa")     || "");
  const pageSize = Math.min(parseInt(url.searchParams.get("pageSize") || "500"), 5000);

  try {
    const now = new Date().toISOString();
    const filters = [`expires_at=gt.${encodeURIComponent(now)}`];

    if (q) {
      // Search across title, company, location, sector
      filters.push(`or=(title.ilike.%25${encodeURIComponent(q)}%25,company.ilike.%25${encodeURIComponent(q)}%25,location.ilike.%25${encodeURIComponent(q)}%25,sector.ilike.%25${encodeURIComponent(q)}%25)`);
    }
    if (loc && loc.toLowerCase() !== "uk" && loc.toLowerCase() !== "united kingdom") {
      filters.push(`location=ilike.%25${encodeURIComponent(loc)}%25`);
    }
    if (sector && sector !== "All") {
      filters.push(`sector=eq.${encodeURIComponent(sector)}`);
    }
    if (visa === "true")  filters.push("sponsorship=eq.true");
    if (visa === "false") filters.push("sponsorship=eq.false");

    const queryStr = filters.join("&");
    const endpoint = `${supabaseUrl}/rest/v1/jobs?${queryStr}&order=sponsorship.desc.nullslast,created_at.desc&limit=${pageSize}&select=*`;

    const dbRes = await fetch(endpoint, {
      headers: {
        "apikey":        anonKey,
        "Authorization": `Bearer ${anonKey}`,
        "Prefer":        "count=exact",
        "Range":         `0-${pageSize - 1}`,
      },
    });

    if (!dbRes.ok) {
      const errText = await dbRes.text();
      throw new Error(`Supabase query failed: ${dbRes.status} ${errText}`);
    }

    const jobs = await dbRes.json();
    const contentRange = dbRes.headers.get("content-range") || "";
    const totalMatch = contentRange.match(/\/(\d+)/);
    const total = totalMatch ? parseInt(totalMatch[1]) : jobs.length;

    // Fix any expired Adzuna redirect URLs still in database
    const cleanedJobs = (Array.isArray(jobs) ? jobs : []).map(j => {
      if (j.source === "Adzuna" && j.url && (j.url.includes("clicks.adzuna") || j.url.includes("redirect"))) {
        j.url = `https://www.adzuna.co.uk/search?q=${encodeURIComponent(j.title || "")}&w=United+Kingdom`;
      }
      return j;
    });

    return res.status(200).json({
      jobs:      cleanedJobs,
      total,
      pages:     Math.ceil(total / 15),
      updatedAt: new Date().toISOString(),
    });

  } catch (err) {
    console.error("jobs-db error:", err.message);
    return res.status(500).json({ error: err.message, jobs: [] });
  }
}
