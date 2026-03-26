import { createClient } from "@supabase/supabase-js";

export const config = { runtime: "nodejs" };

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");

  const url      = new URL(req.url, "https://mentorgramai.com");
  const q        = (url.searchParams.get("q")          || "").trim();
  const loc      = (url.searchParams.get("location")   || "").trim();
  const sector   = (url.searchParams.get("sector")     || "");
  const visa     = (url.searchParams.get("visa")       || "");  // "true" | "false" | ""
  const page     = parseInt(url.searchParams.get("page") || "1");
  const pageSize = parseInt(url.searchParams.get("pageSize") || "150");

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
  );

  try {
    let query = supabase
      .from("jobs")
      .select("*", { count: "exact" })
      .gt("expires_at", new Date().toISOString());

    // Full-text search
    if (q) {
      query = query.or(
        `title.ilike.%${q}%,company.ilike.%${q}%,location.ilike.%${q}%,sector.ilike.%${q}%`
      );
    }

    // Location filter
    if (loc && loc.toLowerCase() !== "uk" && loc.toLowerCase() !== "united kingdom") {
      query = query.ilike("location", `%${loc}%`);
    }

    // Sector filter
    if (sector && sector !== "All") {
      query = query.eq("sector", sector);
    }

    // Visa sponsorship filter
    if (visa === "true")  query = query.eq("sponsorship", true);
    if (visa === "false") query = query.eq("sponsorship", false);

    // Sort: sponsored first, then newest
    query = query
      .order("sponsorship", { ascending: false, nullsLast: true })
      .order("created_at", { ascending: false });

    // Pagination
    const from = (page - 1) * pageSize;
    query = query.range(from, from + pageSize - 1);

    const { data: jobs, count, error } = await query;

    if (error) throw error;

    return res.status(200).json({
      jobs:      jobs || [],
      total:     count || 0,
      page,
      pageSize,
      pages:     Math.ceil((count || 0) / pageSize),
      updatedAt: new Date().toISOString(),
    });

  } catch (err) {
    return res.status(500).json({ error: err.message, jobs: [] });
  }
}
