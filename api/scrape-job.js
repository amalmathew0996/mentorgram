// /api/scrape-job.js — Extracts title, company, location from any job URL
// Response format: { success, title, company, location, description, source }
export const config = { runtime: "edge" };

export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ success: false, error: "Method not allowed" }), { status: 405 });
  }

  try {
    const { url } = await req.json();
    if (!url || !url.startsWith("http")) {
      return new Response(JSON.stringify({ success: false, error: "Invalid URL" }), {
        status: 200, headers: { "Content-Type": "application/json" }
      });
    }

    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-GB,en;q=0.9",
      },
      redirect: "follow",
    });

    if (!res.ok) {
      return new Response(JSON.stringify({ success: false, error: `Page returned ${res.status}` }),
        { status: 200, headers: { "Content-Type": "application/json" } });
    }

    const html = await res.text();
    const hostname = new URL(url).hostname.replace("www.", "");

    let title = "";
    let company = "";
    let location = "";
    let description = "";

    // ── 1. JSON-LD structured data (best source, used by most job boards) ──
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
              company = typeof item.hiringOrganization === "string"
                ? item.hiringOrganization
                : (item.hiringOrganization.name || "");
            }
            if (item.jobLocation) {
              const loc = Array.isArray(item.jobLocation) ? item.jobLocation[0] : item.jobLocation;
              if (loc?.address) {
                const addr = loc.address;
                location = [addr.addressLocality, addr.addressRegion, addr.addressCountry]
                  .filter(Boolean).slice(0, 2).join(", ");
              }
            }
            if (item.description) {
              // Strip HTML and limit to 300 chars
              description = item.description.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 300);
              if (description.length === 300) description += "...";
            }
            break;
          }
        }
        if (title && company) break;
      } catch { /* ignore JSON errors */ }
    }

    // ── 2. Open Graph fallbacks ──
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

    // ── 3. Clean & split "Title at Company" patterns ──
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

    // Remove trailing site names
    cleanTitle = cleanTitle.replace(
      /\s*[|\-·]\s*(LinkedIn|Indeed|Glassdoor|FindAPhD|jobs\.ac\.uk|Careers|Academic Positions|Reed\.co\.uk|Totaljobs|CV-Library).*$/i, ""
    ).trim();

    // Drop hostname from company if it accidentally captured it
    if (cleanCompany && cleanCompany.toLowerCase() === hostname) cleanCompany = "";

    const gotSomething = !!(cleanTitle || cleanCompany);

    return new Response(JSON.stringify({
      success: gotSomething,
      title: cleanTitle,
      company: cleanCompany,
      location: cleanLocation,
      description,
      source: hostname,
    }), { status: 200, headers: { "Content-Type": "application/json" } });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message || "Scrape failed" }),
      { status: 200, headers: { "Content-Type": "application/json" } });
  }
}
