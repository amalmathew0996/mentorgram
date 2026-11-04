export const config = { runtime: "edge" };

export default async function handler(req) {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const url = new URL(req.url);
    const latest = url.searchParams.get("latest") === "1";
    const latestLimit = Math.max(1, Math.min(Number.parseInt(url.searchParams.get("limit") || "8", 10) || 8, 20));

    if (latest) {
      const base = process.env.VITE_SUPABASE_URL?.replace(/\/$/, "");
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!base || !key) throw new Error("Sponsor directory is not configured");

      const headers = { apikey: key, Authorization: `Bearer ${key}` };
      const paths = [
        `sponsor_companies?is_current_sponsor=eq.true&select=id,organisation_name,town_city,county,type_rating,routes,first_seen_at&order=first_seen_at.desc.nullslast&limit=${latestLimit}`,
        `sponsor_companies?is_current_sponsor=eq.true&select=id,organisation_name,town_city,county,type_rating,routes,created_at&order=created_at.desc.nullslast&limit=${latestLimit}`,
      ];

      let rows;
      let usedFallback = false;

      for (let index = 0; index < paths.length; index += 1) {
        const response = await fetch(`${base}/rest/v1/${paths[index]}`, {
          headers,
          signal: AbortSignal.timeout(8000),
        });

        if (!response.ok) {
          if (index === 0 && response.status === 400) continue;
          throw new Error("Could not load recent sponsor additions");
        }

        rows = await response.json();
        usedFallback = index === 1;
        break;
      }

      if (!Array.isArray(rows)) throw new Error("Could not load recent sponsor additions");

      return new Response(JSON.stringify({
        sponsors: rows.map(row => ({
          id: row.id,
          name: String(row.organisation_name || "").replace(/\s+/g, " ").trim() || "Sponsor employer",
          location: [row.town_city, row.county]
            .filter(Boolean)
            .map(value => String(value).replace(/\s+/g, " ").trim())
            .filter(Boolean)
            .join(", ") || "UK",
          rating: String(row.type_rating || "").trim(),
          route: Array.isArray(row.routes) ? row.routes.join(" · ") : String(row.routes || "").trim(),
          added_at: row.first_seen_at || row.created_at || null,
        })),
        note: usedFallback
          ? "Dates show when Mentorgram first imported the sponsor."
          : "Dates show when Mentorgram first detected the sponsor in the official register.",
      }), {
        headers: {
          ...cors,
          "Cache-Control": "s-maxage=300, stale-while-revalidate=600",
        },
      });
    }

    const q = (url.searchParams.get("q") || "").toLowerCase().trim();
    const location = (url.searchParams.get("location") || "").toLowerCase().trim();
    const route = url.searchParams.get("route") || "All";
    const page = parseInt(url.searchParams.get("page") || "1");
    const perPage = parseInt(url.searchParams.get("perPage") || "20");

    const origin = url.origin;
    const csvRes = await fetch(origin + "/sponsors.csv");
    if (!csvRes.ok) throw new Error("Could not load sponsors.csv (" + csvRes.status + ")");

    const csvText = await csvRes.text();
    const lines = csvText.split("\n").slice(1);

    let sponsors = lines
      .filter(line => line.trim().length > 2)
      .map(line => {
        const parts = line.split(",");
        return {
          name: (parts[0] || "").replace(/"/g, "").trim(),
          town: (parts[1] || "").replace(/"/g, "").trim(),
          county: (parts[2] || "").replace(/"/g, "").trim(),
          type: (parts[3] || "").replace(/"/g, "").trim(),
          route: (parts[4] || "").replace(/"/g, "").trim(),
        };
      })
      .filter(s => s.name && s.name.length > 1);

    if (q) sponsors = sponsors.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.town.toLowerCase().includes(q)
    );

    if (location) sponsors = sponsors.filter(s =>
      s.town.toLowerCase().includes(location) ||
      s.county.toLowerCase().includes(location)
    );

    if (route && route !== "All" && route !== "All Routes") {
      sponsors = sponsors.filter(s =>
        s.route.toLowerCase().includes(route.toLowerCase())
      );
    }

    const total = sponsors.length;
    const totalPages = Math.ceil(total / perPage);
    const paginated = sponsors.slice((page - 1) * perPage, page * perPage);

    return new Response(JSON.stringify({
      sponsors: paginated,
      total,
      totalPages,
      page,
      perPage,
    }), { headers: cors });

  } catch (err) {
    return new Response(JSON.stringify({
      error: err.message,
      sponsors: [],
      total: 0,
      totalPages: 0,
    }), {
      status: 500,
      headers: cors,
    });
  }
}
