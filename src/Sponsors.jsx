export const config = { runtime: "nodejs", maxDuration: 30 };
import { readFileSync } from "fs";
import { join } from "path";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");

  if (req.method === "OPTIONS") return res.status(200).json({ ok: true });

  try {
    const q = (req.query.q || "").toLowerCase().trim();
    const location = (req.query.location || "").toLowerCase().trim();
    const route = req.query.route || "All";
    const page = parseInt(req.query.page || "1");
    const pageSize = parseInt(req.query.pageSize || "50");

    // Read CSV from public folder
    const csvPath = join(process.cwd(), "public", "sponsors.csv");
    const csvText = readFileSync(csvPath, "utf8");

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
    if (route !== "All") sponsors = sponsors.filter(s =>
      s.route.toLowerCase().includes(route.toLowerCase())
    );

    const total = sponsors.length;
    const totalPages = Math.ceil(total / pageSize);
    const paginated = sponsors.slice((page - 1) * pageSize, page * pageSize);

    return res.status(200).json({ sponsors: paginated, total, totalPages, page, pageSize });

  } catch (err) {
    return res.status(500).json({ error: err.message, sponsors: [], total: 0 });
  }
}
