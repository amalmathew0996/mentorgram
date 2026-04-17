export const config = { runtime: "edge" };

export default async function handler(req) {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const url = new URL(req.url);
    const search = (url.searchParams.get("q") || "").toLowerCase().trim();
    const location = (url.searchParams.get("location") || "").toLowerCase().trim();
    const route = url.searchParams.get("route") || "All";
    const page = parseInt(url.searchParams.get("page") || "1");
    const pageSize = parseInt(url.searchParams.get("pageSize") || "50");

    // Load from local public folder CSV uploaded by user
    const baseUrl = new URL(req.url).origin;
    const csvRes = await fetch(baseUrl + "/sponsors.csv");

    if (!csvRes.ok) throw new Error("Could not load sponsors file");

    const csvText = await csvRes.text();
    if (!csvText || csvText.length < 100) throw new Error("Sponsors file is empty");

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

    if (search) sponsors = sponsors.filter(s =>
      s.name.toLowerCase().includes(search) ||
      s.town.toLowerCase().includes(search)
    );
    if (location) sponsors = sponsors.filter(s =>
      s.town.toLowerCase().includes(location) ||
      s.county.toLowerCase().includes(location)
    );
    if (route !== "All") sponsors = sponsors.filter(s =>
      s.route.toLowerCase().includes(route.toLowerCase())
    );

    const total = sponsors.length;
    const totalPages = Math.ceil(total / pageSize);
    const paginated = sponsors.slice((page - 1) * pageSize, page * pageSize);

    return new Response(JSON.stringify({ sponsors: paginated, total, totalPages, page, pageSize }), {
      headers: cors
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message, sponsors: [], total: 0 }), {
      status: 500,
      headers: cors
    });
  }
}
