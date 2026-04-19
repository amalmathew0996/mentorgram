// /api/phd-feed.js — Parses live PhD listings from jobs.ac.uk RSS feeds
// Returns clean JSON suitable for display in the PhD Finder tab.
// Cached in-memory for 1 hour (the RSS only updates a few times a day).

export const config = { runtime: "edge" };

// Feed URLs we pull from. jobs.ac.uk has a dedicated PhDs feed — we use that as the primary.
// Additional subject feeds can be added to broaden coverage.
const FEEDS = [
  { url: "https://www.jobs.ac.uk/jobs/phds/", label: "All PhDs" },
];

// Simple in-memory cache (Edge runtime keeps warm instances ~15 min typically).
// On cold start, we'll refetch — that's fine.
let CACHE = null;
let CACHE_AT = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export default async function handler(req) {
  try {
    const now = Date.now();
    if (CACHE && (now - CACHE_AT) < CACHE_TTL_MS) {
      return json({ ok: true, cached: true, count: CACHE.length, items: CACHE });
    }

    const all = [];
    for (const feed of FEEDS) {
      try {
        const items = await fetchAndParse(feed.url);
        all.push(...items);
      } catch (err) {
        // Don't fail the whole request if one feed errors
        console.error("Feed failed:", feed.url, err.message);
      }
    }

    // De-dupe by link
    const seen = new Set();
    const unique = all.filter(it => {
      if (seen.has(it.url)) return false;
      seen.add(it.url);
      return true;
    });

    CACHE = unique;
    CACHE_AT = now;

    return json({ ok: true, cached: false, count: unique.length, items: unique });
  } catch (err) {
    return json({ ok: false, error: err.message || "Feed fetch failed", items: [] }, 500);
  }
}

// ─────────────────────────────────────────────────────────────────
// RSS fetch + parse
// ─────────────────────────────────────────────────────────────────
async function fetchAndParse(baseUrl) {
  const url = baseUrl + "?format=rss";
  const res = await fetch(url, {
    headers: {
      "User-Agent": "MentorgramAI/1.0 (+https://mentorgramai.com)",
      "Accept": "application/rss+xml, application/xml, text/xml",
    },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`${url} returned ${res.status}`);
  const xml = await res.text();
  return parseRSS(xml);
}

function parseRSS(xml) {
  const items = [];
  const itemBlocks = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];

  for (const block of itemBlocks) {
    const title = extractTag(block, "title");
    const link = extractTag(block, "link");
    const description = extractTag(block, "description");
    const pubDate = extractTag(block, "pubDate");

    if (!title || !link) continue;

    // Description format on jobs.ac.uk: "UNIVERSITY - DEPARTMENT<br />Salary: ..."
    // Parse out university, department, and stipend/salary.
    const descPlain = decodeHTML(description || "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const lines = descPlain.split(/\s*\n\s*|\s*(?=Salary:)/).map(s => s.trim()).filter(Boolean);

    // First chunk is the "Organisation - Department" line
    let uni = lines[0] || "";
    let department = "";
    const orgDashIdx = uni.indexOf(" - ");
    if (orgDashIdx > -1) {
      department = uni.slice(orgDashIdx + 3).trim();
      uni = uni.slice(0, orgDashIdx).trim();
    }

    // Find salary/stipend
    let stipend = "";
    for (const line of lines) {
      const salaryMatch = line.match(/^Salary:\s*(.+)/i);
      if (salaryMatch) { stipend = salaryMatch[1].trim(); break; }
    }

    // Heuristic: funded vs self-funded
    const fundedClues = /£\d|€\d|\$\d|stipend|scholarship|fully\s*funded|bursary|funded/i;
    const selfFundedClues = /self[- ]?fund|not\s+funded|unfunded/i;
    let funded = false;
    if (selfFundedClues.test(stipend) || selfFundedClues.test(descPlain)) funded = false;
    else if (fundedClues.test(stipend) || fundedClues.test(descPlain)) funded = true;

    // Country heuristic (jobs.ac.uk is predominantly UK, but some listings include EU/international)
    let country = "UK";
    const lowerDesc = descPlain.toLowerCase();
    if (/germany|deutsch|munich|berlin|heidelberg|aachen|hamburg/.test(lowerDesc) || /\beur\b|€/.test(stipend)) country = "Germany";
    else if (/united\s*states|usa|california|massachusetts|new\s*york/.test(lowerDesc) || /\busd\b|\$/.test(stipend)) country = "USA";
    else if (/netherlands|dutch|amsterdam|delft|maastricht|leiden/.test(lowerDesc)) country = "Netherlands";
    else if (/china|ningbo|beijing|shanghai/.test(lowerDesc)) country = "China";
    else if (/france|paris|lyon/.test(lowerDesc)) country = "France";

    // Field guess from title keywords (so we can show a badge)
    const field = guessField(title);

    items.push({
      title: decodeHTML(title).trim(),
      url: link.trim(),
      uni: uni || "University",
      department,
      stipend: stipend || "Contact for details",
      funded,
      country,
      field,
      pubDate: pubDate ? parseDate(pubDate) : null,
    });
  }

  return items;
}

function extractTag(block, tag) {
  // Handle both <tag>val</tag> and <tag><![CDATA[val]]></tag>
  const cdataRe = new RegExp(`<${tag}>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*<\\/${tag}>`, "i");
  const plainRe = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i");
  const cdataMatch = block.match(cdataRe);
  if (cdataMatch) return cdataMatch[1];
  const plainMatch = block.match(plainRe);
  return plainMatch ? plainMatch[1] : "";
}

function decodeHTML(s) {
  return (s || "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#8211;/g, "–")
    .replace(/&#8212;/g, "—")
    .replace(/&#8216;|&#8217;/g, "'")
    .replace(/&#8220;|&#8221;/g, '"');
}

function parseDate(s) {
  try {
    const d = new Date(s);
    if (isNaN(d.getTime())) return null;
    return d.toISOString();
  } catch {
    return null;
  }
}

function guessField(title) {
  const t = title.toLowerCase();
  if (/\bai\b|artificial\s*intel|machine\s*learn|deep\s*learn|neural/.test(t)) return "AI / Machine Learning";
  if (/data\s*sci|data\s*anal|big\s*data/.test(t)) return "Data Science";
  if (/computer|software|comput/.test(t)) return "Computer Science";
  if (/cyber|security|cryptography/.test(t)) return "Cybersecurity";
  if (/biolog|biotech|genetic|genom|molecular/.test(t)) return "Biology";
  if (/medic|clinical|health|nursing|pharma/.test(t)) return "Medicine & Health";
  if (/neuro|brain|cognit/.test(t)) return "Neuroscience";
  if (/chem|catalys|polymer/.test(t)) return "Chemistry";
  if (/phys|quantum|particle/.test(t)) return "Physics";
  if (/math|statist|applied\s*math/.test(t)) return "Mathematics";
  if (/engineer|mechanical|electrical|civil|aerospace|robotics/.test(t)) return "Engineering";
  if (/climate|environment|ecolog|sustain|renewable/.test(t)) return "Environmental Science";
  if (/econom|business|finance|management/.test(t)) return "Business & Economics";
  if (/psycholog|sociolog|anthropolog/.test(t)) return "Social Sciences";
  if (/history|philosoph|literat|linguis/.test(t)) return "Humanities";
  if (/educat|teach|pedag/.test(t)) return "Education";
  if (/law|legal/.test(t)) return "Law";
  return "Research";
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
