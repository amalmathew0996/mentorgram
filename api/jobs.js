export const config = { runtime: "edge" };

// 60 diverse searches × ~10 results = 500-600 unique jobs
const SEARCHES = [
  // ── Technology ──────────────────────────────────
  { q: "software engineer",            loc: "London" },
  { q: "software developer",           loc: "Manchester" },
  { q: "full stack developer",         loc: "Birmingham" },
  { q: "backend developer python",     loc: "London" },
  { q: "frontend developer react",     loc: "London" },
  { q: "mobile developer iOS android", loc: "United Kingdom" },
  { q: "DevOps engineer AWS cloud",    loc: "London" },
  { q: "cybersecurity analyst",        loc: "London" },
  { q: "network engineer IT",          loc: "Manchester" },
  { q: "UX UI designer",               loc: "London" },
  { q: "QA test automation engineer",  loc: "United Kingdom" },
  { q: "systems architect",            loc: "London" },
  // ── AI & Data ────────────────────────────────────
  { q: "data scientist",               loc: "London" },
  { q: "machine learning engineer",    loc: "London" },
  { q: "data engineer",                loc: "Manchester" },
  { q: "data analyst",                 loc: "Birmingham" },
  { q: "AI engineer",                  loc: "United Kingdom" },
  { q: "business intelligence analyst",loc: "London" },
  // ── Healthcare ───────────────────────────────────
  { q: "registered nurse",             loc: "London" },
  { q: "staff nurse NHS",              loc: "Manchester" },
  { q: "care worker",                  loc: "Birmingham" },
  { q: "healthcare support worker",    loc: "London" },
  { q: "doctor GP",                    loc: "United Kingdom" },
  { q: "pharmacist",                   loc: "London" },
  { q: "physiotherapist",              loc: "United Kingdom" },
  { q: "dentist dental nurse",         loc: "London" },
  { q: "radiographer",                 loc: "United Kingdom" },
  // ── Finance ──────────────────────────────────────
  { q: "financial analyst",            loc: "London" },
  { q: "accountant",                   loc: "Birmingham" },
  { q: "investment banker",            loc: "London" },
  { q: "risk compliance manager",      loc: "London" },
  { q: "audit manager",                loc: "Edinburgh" },
  { q: "payroll specialist",           loc: "United Kingdom" },
  // ── Engineering ──────────────────────────────────
  { q: "mechanical engineer",          loc: "Derby" },
  { q: "civil engineer",               loc: "London" },
  { q: "electrical engineer",          loc: "Manchester" },
  { q: "chemical engineer",            loc: "United Kingdom" },
  { q: "project manager",              loc: "London" },
  { q: "quantity surveyor",            loc: "London" },
  { q: "structural engineer",          loc: "Bristol" },
  // ── Business & Management ────────────────────────
  { q: "marketing manager",            loc: "London" },
  { q: "sales manager",                loc: "Manchester" },
  { q: "operations manager",           loc: "Birmingham" },
  { q: "product manager",              loc: "London" },
  { q: "HR manager",                   loc: "United Kingdom" },
  { q: "supply chain manager",         loc: "United Kingdom" },
  { q: "business analyst",             loc: "London" },
  // ── Education ────────────────────────────────────
  { q: "secondary school teacher",     loc: "London" },
  { q: "university lecturer",          loc: "United Kingdom" },
  { q: "primary teacher",              loc: "Birmingham" },
  // ── Hospitality ──────────────────────────────────
  { q: "chef head chef",               loc: "London" },
  { q: "hotel manager",                loc: "United Kingdom" },
  { q: "restaurant manager",           loc: "Manchester" },
  // ── Public Sector ────────────────────────────────
  { q: "social worker",                loc: "London" },
  { q: "probation officer",            loc: "United Kingdom" },
  // ── Other in-demand ──────────────────────────────
  { q: "architect",                    loc: "London" },
  { q: "solicitor lawyer",             loc: "London" },
  { q: "logistics coordinator",        loc: "United Kingdom" },
  { q: "electrician plumber",          loc: "London" },
];

const VISA_KW = ["visa sponsor","sponsorship","skilled worker","tier 2","certificate of sponsorship","will sponsor","work permit","cos ","visa provided","right to work provided"];

function isSponsored(title = "", description = "") {
  const t = `${title} ${description}`.toLowerCase();
  if (t.includes("no sponsorship") || t.includes("sponsorship not available") || t.includes("unable to sponsor")) return false;
  return VISA_KW.some(k => t.includes(k));
}

function sector(title = "") {
  const t = title.toLowerCase();
  if (/software|developer|programmer|web|mobile|devops|cloud|designer|ux|ui|cyber|network|sysadmin/.test(t)) return "Technology";
  if (/data|scientist|analyst|machine learning|ai |mlops|intelligence/.test(t)) return "AI & Data";
  if (/nurse|doctor|gp|nhs|healthcare|medical|dental|care|clinical|therapist|pharmacist|surgeon|radiograph|paramedic/.test(t)) return "Healthcare";
  if (/finance|financial|accountant|audit|banking|investment|payroll|actuar|risk|compliance/.test(t)) return "Finance";
  if (/engineer|mechanical|civil|electrical|chemical|aerospace|manufacturing|quantity surveyor|architect/.test(t)) return "Engineering";
  if (/teacher|teaching|lecturer|education|school|university|academic/.test(t)) return "Education";
  if (/chef|cook|hotel|restaurant|hospitality|catering/.test(t)) return "Hospitality";
  if (/marketing|sales|business|operations|product manager|hr |human resources|supply chain/.test(t)) return "Business";
  if (/social worker|probation|council|government|police|civil service/.test(t)) return "Public Sector";
  return "Other";
}

async function one(apiKey, q, loc) {
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "mcp-client-2025-04-04",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2000,
        mcp_servers: [{ type: "url", url: "https://mcp.indeed.com/claude/mcp", name: "indeed" }],
        system: `Search Indeed UK jobs. country_code GB, location "${loc}", query "${q}".
Return ONLY a valid JSON array. No text. No markdown. No explanation.
Schema per item: {"title":"","company":"","location":"","salary":"","posted":"","url":"","sponsorship":false}
Rules:
- sponsorship:true ONLY if listing explicitly says visa sponsorship/skilled worker/work permit
- sponsorship:false if it says "no sponsorship" or "sponsorship unavailable"
- salary: use "Competitive" if not stated
- Return exactly 10 jobs`,
        messages: [{ role: "user", content: q }],
      }),
    });
    const d = await r.json();
    const txt = (d.content || []).filter(b => b.type === "text").map(b => b.text).join("");
    const s = txt.indexOf("["), e = txt.lastIndexOf("]");
    if (s < 0 || e < 0) return [];
    const jobs = JSON.parse(txt.slice(s, e + 1));
    return Array.isArray(jobs) ? jobs : [];
  } catch { return []; }
}

export default async function handler(req) {
  const cors = { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" };
  const { searchParams } = new URL(req.url);
  const customQ = searchParams.get("q") || "";
  const customLoc = searchParams.get("location") || "United Kingdom";
  const apiKey = process.env.ANTHROPIC_API_KEY;

  try {
    // Custom user search — 5 parallel targeted searches
    const searches = customQ
      ? [
          { q: customQ, loc: customLoc },
          { q: `${customQ} visa sponsorship`, loc: customLoc },
          { q: customQ, loc: "London" },
          { q: customQ, loc: "Manchester" },
          { q: customQ, loc: "Birmingham" },
        ]
      : SEARCHES;

    // Run ALL searches in parallel with individual 25s timeout
    const withTimeout = (p) => Promise.race([p, new Promise(r => setTimeout(() => r([]), 25000))]);
    const batches = [];
    // Batch into groups of 20 to avoid overwhelming the edge runtime
    for (let i = 0; i < searches.length; i += 20) {
      const batch = searches.slice(i, i + 20);
      const results = await Promise.allSettled(batch.map(({ q, loc }) => withTimeout(one(apiKey, q, loc))));
      batches.push(...results);
    }

    // Deduplicate
    const seen = new Set();
    const jobs = [];
    for (const r of batches) {
      if (r.status !== "fulfilled" || !Array.isArray(r.value)) continue;
      for (const j of r.value) {
        if (!j.title || !j.company) continue;
        const key = `${j.title}||${j.company}`.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        j.sector = sector(j.title);
        j.sponsorship = j.sponsorship || isSponsored(j.title, j.description || "");
        j.salary = j.salary || "Competitive";
        jobs.push(j);
      }
    }

    if (jobs.length === 0) throw new Error("No jobs returned — check ANTHROPIC_API_KEY and Indeed MCP connection");

    // Sponsored first, then alphabetical by title
    jobs.sort((a, b) => {
      if (a.sponsorship && !b.sponsorship) return -1;
      if (!a.sponsorship && b.sponsorship) return 1;
      return (a.title || "").localeCompare(b.title || "");
    });

    return new Response(
      JSON.stringify({ jobs, total: jobs.length, updatedAt: new Date().toISOString() }),
      { status: 200, headers: cors }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message, jobs: [] }),
      { status: 500, headers: cors }
    );
  }
}
