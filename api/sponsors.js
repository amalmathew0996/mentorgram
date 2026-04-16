// Licensed Visa Sponsors — fetches from UK Home Office register
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
    const sector = url.searchParams.get("sector") || "All";
    const route = url.searchParams.get("route") || "All";
    const page = parseInt(url.searchParams.get("page") || "1");
    const pageSize = parseInt(url.searchParams.get("pageSize") || "50");

    // Fetch from UK Home Office register CSV
    const csvUrl = "https://assets.publishing.service.gov.uk/media/6615a5f8a3c2a6001af3b9a3/2024-04-Worker_and_Temporary_Worker.csv";
    const csvRes = await fetch(csvUrl, {
      headers: { "User-Agent": "Mozilla/5.0" },
      cf: { cacheTtl: 86400 }
    });

    if (!csvRes.ok) throw new Error("Could not fetch register");

    const csvText = await csvRes.text();
    const lines = csvText.split("\n").slice(1); // skip header

    let sponsors = lines
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

    // Filter
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
    const paginated = sponsors.slice((page - 1) * pageSize, page * pageSize);

    return new Response(JSON.stringify({ sponsors: paginated, total, page, pageSize }), {
      headers: cors
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message, sponsors: [], total: 0 }), {
      status: 500,
      headers: cors
    });
  }
}
