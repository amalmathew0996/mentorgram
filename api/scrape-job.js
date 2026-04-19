// /api/scrape-job.js — Extracts job info from any URL
// Strategy:
//   1. Try direct fetch + JSON-LD/Open Graph extraction (works for LinkedIn, Greenhouse, company pages)
//   2. If that fails (Indeed, Glassdoor block), fall back to:
//      - Parse signals from the URL itself (jobs.lever.co/COMPANY, title slugs)
//      - Fetch Google's search snippet for the URL
//      - Ask Groq LLM to extract job info from whatever fragments we have
//
// Response format: { success, title, company, location, description, source, method, confidence }

export const config = { runtime: "edge" };

const GROQ_API_KEY = process.env.GROQ_API_KEY;

export default async function handler(req) {
  if (req.method !== "POST") {
    return json({ success: false, error: "Method not allowed" }, 405);
  }

  try {
    const { url } = await req.json();
    if (!url || !url.startsWith("http")) {
      return json({ success: false, error: "Invalid URL" });
    }

    const hostname = safeHostname(url);

    // ───── Step 1: Try direct scraping ─────
    const directResult = await tryDirectScrape(url, hostname);
    if (directResult.success && directResult.title && directResult.company) {
      return json({ ...directResult, method: "direct" });
    }

    // ───── Step 2: AI fallback (for Indeed, Glassdoor, etc.) ─────
    if (!GROQ_API_KEY) {
      return json({ ...directResult, method: "direct_partial" });
    }

    const aiResult = await tryAIFallback(url, hostname, directResult);
    if (aiResult.success) {
      return json({ ...aiResult, method: "ai" });
    }

    return json({
      success: false,
      title: directResult.title || "",
      company: directResult.company || "",
      location: directResult.location || "",
      source: hostname,
      method: "failed",
      error: `${hostname} blocks auto-fill. Please enter details manually.`
    });

  } catch (err) {
    return json({ success: false, error: err.message || "Scrape failed" });
  }
}

// ─────────────────────────────────────────────────────────────────
// STEP 1: Direct scraping (fast path)
// ─────────────────────────────────────────────────────────────────
async function tryDirectScrape(url, hostname) {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-GB,en;q=0.9",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      return { success: false, title: "", company: "", location: "", description: "", source: hostname };
    }

    const html = await res.text();
    let title = "", company = "", location = "", description = "";

    // JSON-LD structured data (best source)
    const jsonLdMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
    for (const block of jsonLdMatches) {
      try {
        const jsonStr = block.replace(/<script[^>]*>/i, "").replace(/<\/script>/i, "").trim();
        const data = JSON.parse(jsonStr);
        const items = Array.isArray(data) ? data : (data["@graph"] ? data["@graph"] : [data]);
        for (const item of items) {
          const type = item["@type"];
          const isJob = type === "JobPosting" || (Array.isArray(type) && type.includes("JobPosting"));
          if (isJob) {
            if (item.title) title = item.title;
            if (item.hiringOrganization) {
              company = typeof item.hiringOrganization === "string" ? item.hiringOrganization : (item.hiringOrganization.name || "");
            }
            if (item.jobLocation) {
              const loc = Array.isArray(item.jobLocation) ? item.jobLocation[0] : item.jobLocation;
              if (loc?.address) {
                const addr = loc.address;
                location = [addr.addressLocality, addr.addressRegion, addr.addressCountry].filter(Boolean).slice(0, 2).join(", ");
              }
            }
            if (item.description) {
              description = item.description.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 300);
              if (description.length === 300) description += "...";
            }
            break;
          }
        }
        if (title && company) break;
      } catch { /* skip malformed JSON */ }
    }

    // Open Graph fallbacks
    if (!title) {
      const m = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
      if (m) title = m[1];
    }
    if (!title) {
      const m = html.match(/<title>([^<]+)<\/title>/i);
      if (m) title = m[1];
    }
    if (!company) {
      const m = html.match(/<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']+)["']/i);
      if (m) company = m[1];
    }
    if (!description) {
      const m = html.match(/<meta[^>]*(?:property|name)=["'](?:og:description|description)["'][^>]*content=["']([^"']+)["']/i);
      if (m) description = m[1].replace(/\s+/g, " ").trim().slice(0, 300);
    }

    return cleanResult({ title, company, location, description }, hostname);

  } catch (err) {
    return { success: false, title: "", company: "", location: "", description: "", source: hostname };
  }
}

// ─────────────────────────────────────────────────────────────────
// STEP 2: AI fallback (for blocked sites like Indeed)
// ─────────────────────────────────────────────────────────────────
async function tryAIFallback(url, hostname, directResult) {
  const urlPath = decodeURIComponent(new URL(url).pathname);
  const urlHints = extractURLHints(url);
  const googleSnippet = await fetchGoogleSnippet(url);

  const context = [
    `URL: ${url}`,
    `Hostname: ${hostname}`,
    `URL path: ${urlPath}`,
    urlHints ? `URL signals: ${urlHints}` : null,
    directResult.title ? `Partial title from page: ${directResult.title}` : null,
    directResult.company ? `Partial company from page: ${directResult.company}` : null,
    googleSnippet ? `Google search snippet: ${googleSnippet}` : null,
  ].filter(Boolean).join("\n");

  const prompt = `You are extracting job details from a job posting URL that couldn't be fully scraped.

${context}

Based on the information above, extract the job details. Be conservative — only fill a field if you're reasonably confident.

Return ONLY valid JSON in this exact format (no markdown, no commentary):
{
  "title": "the job title or empty string",
  "company": "the hiring company name or empty string",
  "location": "city/region or empty string",
  "confidence": "high" | "medium" | "low"
}

Common hostname-to-company mappings you know:
- jobs.lever.co/COMPANY/... → company is COMPANY (cleaned up)
- COMPANY.greenhouse.io → COMPANY
- COMPANY.workable.com → COMPANY
- boards.greenhouse.io/COMPANY → COMPANY

For Indeed, Glassdoor, LinkedIn: the company name is NOT the hostname. Use the page snippets/title to infer it, or leave empty.

Return only the JSON object.`;

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        max_tokens: 300,
        response_format: { type: "json_object" },
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return { success: false };

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || "";

    let parsed;
    try { parsed = JSON.parse(text); }
    catch { return { success: false }; }

    const hasTitle = parsed.title && parsed.title.length > 3;
    const hasCompany = parsed.company && parsed.company.length > 1;
    if (!hasTitle && !hasCompany) return { success: false };

    return cleanResult({
      title: parsed.title || directResult.title || "",
      company: parsed.company || directResult.company || "",
      location: parsed.location || directResult.location || "",
      description: directResult.description || "",
      confidence: parsed.confidence || "low",
    }, hostname);

  } catch (err) {
    return { success: false };
  }
}

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────
async function fetchGoogleSnippet(url) {
  try {
    const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(url)}`;
    const res = await fetch(googleUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const html = await res.text();

    const stripped = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/\s+/g, " ")
      .trim();

    const urlIdx = stripped.indexOf(url);
    if (urlIdx > 0) {
      const start = Math.max(0, urlIdx - 50);
      const end = Math.min(stripped.length, urlIdx + 400);
      return stripped.slice(start, end);
    }
    return stripped.slice(0, 400);
  } catch {
    return null;
  }
}

function extractURLHints(url) {
  try {
    const u = new URL(url);
    const host = u.hostname.replace("www.", "");
    const path = decodeURIComponent(u.pathname);
    const hints = [];

    if (host.endsWith(".greenhouse.io")) hints.push(`company=${host.split(".")[0]} (greenhouse)`);
    else if (host.endsWith(".workable.com")) hints.push(`company=${host.split(".")[0]} (workable)`);
    else if (host.endsWith(".lever.co")) hints.push(`company=${host.split(".")[0]} (lever)`);
    else if (host === "jobs.lever.co") {
      const parts = path.split("/").filter(Boolean);
      if (parts[0]) hints.push(`company=${parts[0]} (lever)`);
    }
    else if (host === "boards.greenhouse.io") {
      const parts = path.split("/").filter(Boolean);
      if (parts[0]) hints.push(`company=${parts[0]} (greenhouse)`);
    }

    const slug = path.split("/").filter(Boolean).find(p => /^[a-z][a-z\-]+[a-z]$/i.test(p) && p.length > 8);
    if (slug) {
      const guessed = slug.replace(/-/g, " ");
      hints.push(`possible-title-slug=${guessed}`);
    }

    return hints.length ? hints.join("; ") : null;
  } catch {
    return null;
  }
}

function cleanResult({ title, company, location, description, confidence }, hostname) {
  const clean = s => s ? s.replace(/\s+/g, " ")
    .replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim() : "";

  let cleanTitle = clean(title);
  let cleanCompany = clean(company);
  let cleanLocation = clean(location);

  if (cleanTitle && !cleanCompany) {
    const patterns = [
      /^(.+?)\s+at\s+(.+?)(?:\s*[|\-·].+)?$/i,
      /^(.+?)\s+[|\-·]\s+(.+?)(?:\s*[|\-·].+)?$/,
    ];
    for (const p of patterns) {
      const m = cleanTitle.match(p);
      if (m) { cleanTitle = m[1].trim(); cleanCompany = m[2].trim(); break; }
    }
  }

  cleanTitle = cleanTitle.replace(
    /\s*[|\-·]\s*(LinkedIn|Indeed|Glassdoor|FindAPhD|jobs\.ac\.uk|Careers|Academic Positions|Reed\.co\.uk|Totaljobs|CV-Library).*$/i, ""
  ).trim();

  if (cleanCompany && cleanCompany.toLowerCase() === hostname) cleanCompany = "";

  return {
    success: !!(cleanTitle || cleanCompany),
    title: cleanTitle,
    company: cleanCompany,
    location: cleanLocation,
    description: description || "",
    source: hostname,
    confidence: confidence || null,
  };
}

function safeHostname(url) {
  try { return new URL(url).hostname.replace("www.", ""); } catch { return ""; }
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
