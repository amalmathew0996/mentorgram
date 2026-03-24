export const config = { runtime: "edge" };

// Official Home Office Register of Licensed Sponsors - Workers
const GOV_CSV_URL = "https://assets.publishing.service.gov.uk/media/67dc5f2f1c8f92e80c3a1f5b/2025-03-20_-_Worker_and_Temporary_Worker.csv";

// Fallback URL pattern (GOV.UK updates this regularly)
const GOV_PAGE_URL = "https://www.gov.uk/government/publications/register-of-licensed-sponsors-workers";

function guessSector(name = "", route = "") {
  const n = name.toLowerCase();
  if (n.includes("nhs") || n.includes("hospital") || n.includes("health") || n.includes("medical") || n.includes("care") || n.includes("dental") || n.includes("pharmacy") || n.includes("clinic")) return "Healthcare";
  if (n.includes("university") || n.includes("college") || n.includes("school") || n.includes("academy") || n.includes("education") || n.includes("learning")) return "Education";
  if (n.includes("bank") || n.includes("finance") || n.includes("capital") || n.includes("investment") || n.includes("insurance") || n.includes("accountant") || n.includes("audit")) return "Finance";
  if (n.includes("tech") || n.includes("software") || n.includes("digital") || n.includes("it ") || n.includes(" it") || n.includes("computing") || n.includes("data") || n.includes("cyber") || n.includes("systems")) return "Technology";
  if (n.includes("engineering") || n.includes("engineer") || n.includes("construction") || n.includes("infrastructure") || n.includes("aerospace") || n.includes("manufacturing")) return "Engineering";
  if (n.includes("hotel") || n.includes("hospitality") || n.includes("restaurant") || n.includes("catering") || n.includes("food") || n.includes("beverage")) return "Hospitality";
  if (n.includes("retail") || n.includes("supermarket") || n.includes("shop") || n.includes("store") || n.includes("wholesale")) return "Retail";
  if (n.includes("council") || n.includes("government") || n.includes("police") || n.includes("fire") || n.includes("authority") || n.includes("ministry") || n.includes("department")) return "Public Sector";
  if (route.toLowerCase().includes("health")) return "Healthcare";
  return "Other";
}

function parseCSV(text) {
  const lines = text.split("\n").filter(l => l.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, "").toLowerCase());

  // Find column indices
  const nameIdx = headers.findIndex(h => h.includes("organisation") || h.includes("name") || h === "name");
  const townIdx = headers.findIndex(h => h.includes("town") || h.includes("city") || h.includes("location"));
  const countyIdx = headers.findIndex(h => h.includes("county") || h.includes("region"));
  const typeIdx = headers.findIndex(h => h.includes("type") || h.includes("organisation type"));
  const ratingIdx = headers.findIndex(h => h.includes("rating") || h.includes("licence rating"));
  const routeIdx = headers.findIndex(h => h.includes("route") || h.includes("worker route"));

  const sponsors = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    // Parse CSV properly handling quoted fields
    const cols = [];
    let cur = "", inQuotes = false;
    for (const ch of line) {
      if (ch === '"') { inQuotes = !inQuotes; }
      else if (ch === "," && !inQuotes) { cols.push(cur.trim()); cur = ""; }
      else { cur += ch; }
    }
    cols.push(cur.trim());

    const name = (cols[nameIdx] || "").replace(/^"|"$/g, "").trim();
    const town = (cols[townIdx] || "").replace(/^"|"$/g, "").trim();
    const county = (cols[countyIdx] || "").replace(/^"|"$/g, "").trim();
    const type = (cols[typeIdx] || "").replace(/^"|"$/g, "").trim();
    const rating = (cols[ratingIdx] || "A").replace(/^"|"$/g, "").trim();
    const route = (cols[routeIdx] || "Skilled Worker").replace(/^"|"$/g, "").trim();

    if (!name || name.length < 2) continue;

    sponsors.push({
      name,
      location: town || county || "United Kingdom",
      city: town || county || "",
      sector: guessSector(name, route),
      route: route.includes("Health") ? "Health & Care Worker" : "Skilled Worker",
      rating: rating.includes("A") ? "A" : "B",
      type,
    });
  }

  return sponsors;
}

export default async function handler(req) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
    "Cache-Control": "s-maxage=3600", // Cache for 1 hour
  };

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").toLowerCase();
  const location = (searchParams.get("location") || "").toLowerCase();
  const sector = searchParams.get("sector") || "All";
  const route = searchParams.get("route") || "All Routes";
  const page = parseInt(searchParams.get("page") || "1");
  const perPage = parseInt(searchParams.get("perPage") || "20");

  try {
    // Fetch the official GOV.UK CSV
    const res = await fetch(GOV_CSV_URL, {
      headers: { "User-Agent": "Mentorgram/1.0 (mentorgramai.com)" },
    });

    if (!res.ok) throw new Error(`CSV fetch failed: ${res.status}`);

    const csvText = await res.text();
    let sponsors = parseCSV(csvText);

    if (sponsors.length === 0) throw new Error("No sponsors parsed from CSV");

    // Filter
    if (q) sponsors = sponsors.filter(s => s.name.toLowerCase().includes(q) || s.sector.toLowerCase().includes(q));
    if (location) sponsors = sponsors.filter(s => s.location.toLowerCase().includes(location) || s.city.toLowerCase().includes(location));
    if (sector !== "All") sponsors = sponsors.filter(s => s.sector === sector);
    if (route !== "All Routes") sponsors = sponsors.filter(s => s.route === route);

    // Sort: A-rated first, then alphabetical
    sponsors.sort((a, b) => {
      if (a.rating === "A" && b.rating !== "A") return -1;
      if (b.rating === "A" && a.rating !== "A") return 1;
      return a.name.localeCompare(b.name);
    });

    const total = sponsors.length;
    const totalPages = Math.ceil(total / perPage);
    const paginated = sponsors.slice((page - 1) * perPage, page * perPage);

    return new Response(JSON.stringify({
      sponsors: paginated,
      total,
      totalPages,
      page,
      perPage,
      source: "GOV.UK Home Office Register of Licensed Sponsors",
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
