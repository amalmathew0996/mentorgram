export const config = { runtime: "nodejs", maxDuration: 10 };

const clean = value => typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed", sponsors: [] });
  }

  const base = process.env.VITE_SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) return res.status(503).json({ error: "Sponsor directory is not configured", sponsors: [] });

  const requested = Number.parseInt(String(req.query?.limit || "8"), 10);
  const limit = Number.isSafeInteger(requested) ? Math.max(1, Math.min(requested, 20)) : 8;
  const headers = { apikey: key, Authorization: `Bearer ${key}` };
  const paths = [
    // first_seen_at represents the first successful Mentorgram sync that saw
    // the company on the official register. It is not a claim about the exact
    // Home Office licence grant date.
    `sponsor_companies?is_current_sponsor=eq.true&select=id,organisation_name,town_city,county,type_rating,routes,first_seen_at&order=first_seen_at.desc.nullslast&limit=${limit}`,
    // Older installations may not have first_seen_at, but normally retain the
    // immutable creation timestamp from the initial register import.
    `sponsor_companies?is_current_sponsor=eq.true&select=id,organisation_name,town_city,county,type_rating,routes,created_at&order=created_at.desc.nullslast&limit=${limit}`,
  ];

  let rows;
  let usedFallback = false;
  try {
    for (let index = 0; index < paths.length; index += 1) {
      const response = await fetch(`${base}/rest/v1/${paths[index]}`, { headers, signal: AbortSignal.timeout(8000) });
      if (!response.ok) {
        if (index === 0 && response.status === 400) continue;
        throw new Error("Could not load recent sponsor additions");
      }
      rows = await response.json();
      usedFallback = index === 1;
      break;
    }
    if (!Array.isArray(rows)) throw new Error("Could not load recent sponsor additions");
  } catch (error) {
    return res.status(503).json({ error: error.message, sponsors: [] });
  }

  return res.status(200).json({
    sponsors: rows.map(row => ({
      id: row.id,
      name: clean(row.organisation_name) || "Sponsor employer",
      location: [clean(row.town_city), clean(row.county)].filter(Boolean).join(", ") || "UK",
      rating: clean(row.type_rating),
      route: Array.isArray(row.routes) ? row.routes.join(" · ") : clean(row.routes),
      added_at: row.first_seen_at || row.created_at || null,
    })),
    note: usedFallback ? "Dates show when Mentorgram first imported the sponsor." : "Dates show when Mentorgram first detected the sponsor in the official register.",
  });
}
