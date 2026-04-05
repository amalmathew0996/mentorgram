export const config = { runtime: "nodejs" };

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const anonKey     = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return res.status(500).json({ error: "Missing Supabase env vars", jobs: [] });
  }

  const url    = new URL(req.url, "https://mentorgramai.com");
  const q      = (url.searchParams.get("q")        || "").trim();
  const loc    = (url.searchParams.get("location") || "").trim();
  const sector = (url.searchParams.get("sector")   || "");
  const visa   = (url.searchParams.get("visa")     || "");

  try {
    const now = new Date().toISOString();

    // ✅ FIXED: Include jobs where expires_at is NULL or in the future
    // Previously: expires_at=gt.now (excluded ~4,600 jobs with no expiry date)
    const filters = [
      `or=(expires_at.is.null,expires_at.gt.${encodeURIComponent(now)})`
    ];

    if (q) {
      filters.push(
        `or=(title.ilike.%25${encodeURIComponent(q)}%25,company.ilike.%25${encodeURIComponent(q)}%25,location.ilike.%25${encodeURIComponent(q)}%25,sector.ilike.%25${encodeURIComponent(q)}%25)`
      );
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

    const PAGE = 1000;
    const headers = {
      "apikey":        anonKey,
      "Authorization": `Bearer ${anonKey}`,
      "Prefer":        "count=exact",
    };

    // Get total count first
    const countRes = await fetch(
      `${supabaseUrl}/rest/v1/jobs?${queryStr}&select=id`,
      { headers: { ...headers, "Range": "0-0" } }
    );

    const contentRange = countRes.headers.get("content-range") || "";
    const totalMatch   = contentRange.match(/\/(\d+)/);
    const total        = totalMatch ? parseInt(totalMatch[1]) : 0;

    // ✅ FIXED: Raised cap from 5 pages (5,000 jobs) to 10 pages (10,000 jobs)
    // Previously capped at 5 pages which would have hidden jobs even after expiry fix
    const pagesNeeded = Math.min(Math.ceil(total / PAGE), 10);

    const responses = await Promise.all(
      Array.from({ length: pagesNeeded }, (_, i) => {
        const from = i * PAGE;
        const to   = from + PAGE - 1;
        return fetch(
          `${supabaseUrl}/rest/v1/jobs?${queryStr}&order=sponsorship.desc.nullslast,created_at.desc&select=*`,
          { headers: { ...headers, "Range": `${from}-${to}` } }
        )
          .then(r => r.ok ? r.json() : [])
          .catch(() => []);
      })
    );

    const jobs = responses.flat().filter(Boolean);

    return res.status(200).json({
      jobs,
      total,
      pages:     Math.ceil(total / 20),
      updatedAt: new Date().toISOString(),
    });

  } catch (err) {
    console.error("jobs-db error:", err.message);
    return res.status(500).json({ error: err.message, jobs: [] });
  }
}
