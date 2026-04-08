export const config = { runtime: "nodejs" };

// ✅ Curated data to enrich API results with extra detail
const CURATED = {
  "Technical University of Munich": {
    rank: "#1 DE", focus: "Engineering & Technology",
    tuition: "Free (€143/sem fee)", intl: "IELTS 6.5+ or German B2",
    scholarships: "DAAD, Deutschlandstipendium", type: "Public",
  },
  "Ludwig Maximilian University of Munich": {
    rank: "#2 DE", focus: "Medicine & Humanities",
    tuition: "Free (€143/sem fee)", intl: "IELTS 6.5+ or German C1",
    scholarships: "DAAD, LMU Excellence", type: "Public",
  },
  "LMU Munich": {
    rank: "#2 DE", focus: "Medicine & Humanities",
    tuition: "Free (€143/sem fee)", intl: "IELTS 6.5+ or German C1",
    scholarships: "DAAD, LMU Excellence", type: "Public",
  },
  "Ruprecht Karls University Heidelberg": {
    rank: "#3 DE", focus: "Life Sciences & Medicine",
    tuition: "Free (€185/sem fee)", intl: "IELTS 6.5+ or German C1",
    scholarships: "DAAD, Heidelberg Excellence", type: "Public",
  },
  "Heidelberg University": {
    rank: "#3 DE", focus: "Life Sciences & Medicine",
    tuition: "Free (€185/sem fee)", intl: "IELTS 6.5+ or German C1",
    scholarships: "DAAD, Heidelberg Excellence", type: "Public",
  },
  "Humboldt University of Berlin": {
    rank: "#4 DE", focus: "Research & Social Sciences",
    tuition: "Free (€315/sem fee)", intl: "IELTS 6.5+ or German C1",
    scholarships: "DAAD, Deutschlandstipendium", type: "Public",
  },
  "RWTH Aachen University": {
    rank: "#5 DE", focus: "Engineering & Natural Sciences",
    tuition: "Free (€275/sem fee)", intl: "IELTS 6.5+ or German B2",
    scholarships: "DAAD, RWTH Excellence", type: "Public",
  },
  "Free University of Berlin": {
    rank: "#6 DE", focus: "Politics & International Studies",
    tuition: "Free (€315/sem fee)", intl: "IELTS 6.5+ or German C1",
    scholarships: "DAAD, FU Excellence", type: "Public",
  },
  "Freie Universität Berlin": {
    rank: "#6 DE", focus: "Politics & International Studies",
    tuition: "Free (€315/sem fee)", intl: "IELTS 6.5+ or German C1",
    scholarships: "DAAD, FU Excellence", type: "Public",
  },
  "Constructor University Bremen": {
    rank: "Top Private", focus: "Engineering & Data Science",
    tuition: "€20,000/yr", intl: "IELTS 6.0+",
    scholarships: "Merit scholarships up to 100%", type: "Private",
  },
  "Jacobs University Bremen": {
    rank: "Top Private", focus: "International Sciences & Business",
    tuition: "€20,000/yr", intl: "IELTS 6.5+",
    scholarships: "Need & merit-based awards", type: "Private",
  },
  "EBS University": {
    rank: "Top Private", focus: "Business & Law",
    tuition: "€15,000–€22,000/yr", intl: "IELTS 6.5+",
    scholarships: "Partial merit scholarships", type: "Private",
  },
  "WHU - Otto Beisheim School of Management": {
    rank: "Top Private", focus: "Business & Management",
    tuition: "€25,000/yr", intl: "IELTS 7.0+",
    scholarships: "Competitive merit awards", type: "Private",
  },
};

// Known private universities in Germany (partial list for classification)
const KNOWN_PRIVATE = [
  "jacobs", "constructor", "ebs", "whu", "bsp", "escp", "iu internationale",
  "iubh", "sru", "srh", "hfwu", "hsd", "allensbach", "akad", "bits",
  "charlotte fresenius", "code university", "esb business", "hhl leipzig",
  "international school of management", "macromedia", "munich business school",
  "new european college", "touro", "university of applied sciences europe",
  "hertie", "bucerius", "zeppelin", "private hochschule", "privat",
];

function guessType(name) {
  const lower = name.toLowerCase();
  if (KNOWN_PRIVATE.some(p => lower.includes(p))) return "Private";
  return "Public"; // ~90% of German universities are public
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");

  try {
    const response = await fetch(
      "https://universities.hipolabs.com/search?country=Germany",
      { headers: { "Accept": "application/json" } }
    );

    if (!response.ok) throw new Error(`API responded ${response.status}`);

    const raw = await response.json();

    const enriched = raw.map(u => {
      // Try exact match first, then partial match
      const curatedKey = Object.keys(CURATED).find(k =>
        k.toLowerCase() === u.name.toLowerCase() ||
        u.name.toLowerCase().includes(k.toLowerCase()) ||
        k.toLowerCase().includes(u.name.toLowerCase())
      );
      const extra = curatedKey ? CURATED[curatedKey] : null;

      return {
        name: u.name,
        website: u.web_pages?.[0] || null,
        domain: u.domains?.[0] || null,
        type: extra?.type || guessType(u.name),
        tuition: extra?.tuition || "Free (small semester fee)",
        intl: extra?.intl || "Check university website",
        scholarships: extra?.scholarships || "DAAD, Deutschlandstipendium",
        focus: extra?.focus || "Various disciplines",
        rank: extra?.rank || null,
      };
    });

    // Sort: ranked (curated) first, then alphabetically
    enriched.sort((a, b) => {
      if (a.rank && !b.rank) return -1;
      if (!a.rank && b.rank) return 1;
      return a.name.localeCompare(b.name);
    });

    return res.status(200).json({ universities: enriched, total: enriched.length });

  } catch (err) {
    console.error("german-universities error:", err.message);
    return res.status(500).json({ error: err.message, universities: [] });
  }
}
