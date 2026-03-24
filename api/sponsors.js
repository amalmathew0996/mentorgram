export const config = { runtime: "edge" };

// Your GitHub CSV file — update this path when you upload the CSV
const CSV_URL = "https://raw.githubusercontent.com/amalmathew0996/mentorgram/main/public/sponsors.csv";

function guessSector(name = "", route = "") {
  const n = name.toLowerCase();
  if (n.includes("nhs") || n.includes("hospital") || n.includes("health") || n.includes("medical") || n.includes("care") || n.includes("dental") || n.includes("pharmacy") || n.includes("clinic") || n.includes("surgery") || n.includes("nursing")) return "Healthcare";
  if (n.includes("university") || n.includes("college") || n.includes("school") || n.includes("academy") || n.includes("education") || n.includes("learning") || n.includes("training")) return "Education";
  if (n.includes("bank") || n.includes("finance") || n.includes("capital") || n.includes("investment") || n.includes("insurance") || n.includes("accountant") || n.includes("audit") || n.includes("financial")) return "Finance";
  if (n.includes("tech") || n.includes("software") || n.includes("digital") || n.includes("computing") || n.includes("cyber") || n.includes("systems") || n.includes("solutions") || n.includes("data") || n.includes("cloud") || n.includes("ai ") || n.includes(" it ")) return "Technology";
  if (n.includes("engineering") || n.includes("engineer") || n.includes("construction") || n.includes("infrastructure") || n.includes("aerospace") || n.includes("manufacturing") || n.includes("energy")) return "Engineering";
  if (n.includes("hotel") || n.includes("hospitality") || n.includes("restaurant") || n.includes("catering") || n.includes("food") || n.includes("bar ") || n.includes("pub ")) return "Hospitality";
  if (n.includes("retail") || n.includes("supermarket") || n.includes("shop") || n.includes("store") || n.includes("wholesale") || n.includes("market")) return "Retail";
  if (n.includes("council") || n.includes("government") || n.includes("police") || n.includes("fire ") || n.includes("authority") || n.includes("ministry") || n.includes("department") || n.includes("prison")) return "Public Sector";
  if (route.toLowerCase().includes("health")) return "Healthcare";
  return "Other";
}

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];

  // Parse header row
  const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());

  // Find column indices by common header names used in the GOV.UK CSV
  const nameIdx   = headers.findIndex(h => h.includes("organisation name") || h === "name" || h.includes("org name") || h.includes("sponsor name"));
  const townIdx   = headers.findIndex(h => h.includes("town") || h.includes("city") || h === "location");
  const countyIdx = headers.findIndex(h => h.includes("county") || h.includes("region") || h.includes("county/region"));
  const ratingIdx = headers.findIndex(h => h.includes("rating") || h.includes("licence rating") || h.includes("sponsor rating"));
  const routeIdx  = headers.findIndex(h => h.includes("route") || h.includes("worker route") || h.includes("immigration route") || h.includes("sub tier"));
  const typeIdx   = headers.findIndex(h => h.includes("type") || h.includes("organisation type"));

  // Fallback: if headers not found, use positional (GOV.UK CSV format)
  // GOV.UK format: Organisation Name, Town/City, County, Type, Rating, Route
  const ni = nameIdx   >= 0 ? nameIdx   : 0;
  const ti = townIdx   >= 0 ? townIdx   : 1;
  const ci = countyIdx >= 0 ? countyIdx : 2;
  const yi = typeIdx   >= 0 ? typeIdx   : 3;
  const ri = ratingIdx >= 0 ? ratingIdx : 4;
  const wi = routeIdx  >= 0 ? routeIdx  : 5;

  const sponsors = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (cols.length < 2) continue;

    const name   = (cols[ni] || "").trim();
    const town   = (cols[ti] || "").trim();
    const county = (cols[ci] || "").trim();
    const type   = (cols[yi] || "").trim();
    const rating = (cols[ri] || "A").trim().toUpperCase();
    const route  = (cols[wi] || "Skilled Worker").trim();

    if (!name || name.length < 2) continue;

    sponsors.push({
      name,
      location: town || county || "United Kingdom",
      city: town || "",
      county: county || "",
      sector: guessSector(name, route),
      route: route.toLowerCase().includes("health") ? "Health & Care Worker" : "Skilled Worker",
      rating: rating.startsWith("A") ? "A" : "B",
      type: type || "",
    });
  }

  return sponsors;
}

function parseCSVLine(line) {
  const cols = [];
  let cur = "", inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      cols.push(cur.trim()); cur = "";
    } else {
      cur += ch;
    }
  }
  cols.push(cur.trim());
  return cols;
}

export default async function handler(req) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
    "Cache-Control": "s-maxage=3600",
  };

  const { searchParams } = new URL(req.url);
  const q        = (searchParams.get("q") || "").toLowerCase().trim();
  const location = (searchParams.get("location") || "").toLowerCase().trim();
  const sector   = searchParams.get("sector") || "All";
  const route    = searchParams.get("route") || "All Routes";
  const page     = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const perPage  = Math.min(50, parseInt(searchParams.get("perPage") || "20"));

  try {
    const res = await fetch(CSV_URL, {
      headers: {
        "User-Agent": "Mentorgram/1.0",
        "Cache-Control": "no-cache",
      },
    });

    if (!res.ok) throw new Error(`Could not load CSV from GitHub (${res.status}). Make sure sponsors.csv is uploaded to: public/sponsors.csv in your GitHub repo.`);

    const csvText = await res.text();
    let all = parseCSV(csvText);

    if (all.length === 0) throw new Error("CSV file is empty or could not be parsed. Check the file format.");

    // Apply filters
    if (q)       all = all.filter(s => s.name.toLowerCase().includes(q) || s.sector.toLowerCase().includes(q));
    if (location) all = all.filter(s => s.location.toLowerCase().includes(location) || s.city.toLowerCase().includes(location) || s.county.toLowerCase().includes(location));
    if (sector !== "All") all = all.filter(s => s.sector === sector);
    if (route !== "All Routes") all = all.filter(s => s.route === route);

    // Sort: A-rated first, then alphabetically
    all.sort((a, b) => {
      if (a.rating === "A" && b.rating !== "A") return -1;
      if (b.rating === "A" && a.rating !== "A") return 1;
      return a.name.localeCompare(b.name);
    });

    const total      = all.length;
    const totalPages = Math.ceil(total / perPage);
    const paginated  = all.slice((page - 1) * perPage, page * perPage);

    return new Response(JSON.stringify({
      sponsors: paginated,
      total,
      totalPages,
      page,
      perPage,
      source: "GOV.UK Home Office Register — via GitHub",
    }), { status: 200, headers: corsHeaders });

  } catch (err) {
    return new Response(JSON.stringify({
      error: err.message,
      sponsors: [],
      total: 0,
      totalPages: 0,
    }), { status: 500, headers: corsHeaders });
  }
}
