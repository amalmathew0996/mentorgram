export const config = { runtime: "edge" };

export default async function handler(req) {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const url = new URL(req.url);
    const q = (url.searchParams.get("q") || "").toLowerCase().trim();
    const location = (url.searchParams.get("location") || "").toLowerCase().trim();
    const route = url.searchParams.get("route") || "All";
    const page = parseInt(url.searchParams.get("page") || "1");
    const perPage = parseInt(url.searchParams.get("perPage") || "20");

    // Fetch CSV from public folder via the site's own URL
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

    return new Response(JSON.stringify({ sponsors: paginated, total, totalPages, page, perPage }), {
      headers: cors
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message, sponsors: [], total: 0, totalPages: 0 }), {
      status: 500, headers: cors
    });
  }
}
