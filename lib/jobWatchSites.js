import https from "node:https";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

export function publicAddress(address) {
  if (isIP(address) === 4) {
    const [a, b] = address.split(".").map(Number);
    return !(a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) || (a === 192 && [0, 168].includes(b)) ||
      (a === 198 && [18, 19, 51].includes(b)) || (a === 203 && b === 0));
  }
  // Only global unicast IPv6; exclude transition and special-purpose ranges.
  return isIP(address) === 6 && /^[23][0-9a-f]{3}:/i.test(address) && !/^(2001:|2002:|3fff:)/i.test(address);
}

export function siteURL(value) {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.username || url.password || (url.port && url.port !== "443") || value.length > 2000) throw new Error("Use a public HTTPS website or RSS feed URL.");
  url.hash = "";
  return url;
}

export async function readPublicPage(value, redirects = 0, deadline = Date.now() + 7000) {
  if (Date.now() >= deadline) throw new Error("Website timed out.");
  const url = siteURL(value);
  let dnsTimer;
  const addresses = await Promise.race([
    lookup(url.hostname.replace(/^\[|\]$/g, ""), { all: true }),
    new Promise((_, reject) => { dnsTimer = setTimeout(() => reject(new Error("Website lookup timed out.")), Math.min(1500, Math.max(1, deadline - Date.now()))); }),
  ]).finally(() => clearTimeout(dnsTimer));
  if (!addresses.length || addresses.some(a => !publicAddress(a.address))) throw new Error("Only public websites are supported.");
  const address = addresses[0];
  const response = await new Promise((resolve, reject) => {
    // Pin the connection to the checked address to prevent DNS rebinding.
    const request = https.get(url, {
      headers: { "User-Agent": "Mentorgram Job Watch", Accept: "text/html, application/rss+xml, application/atom+xml, application/xml" },
      lookup: (_host, options, callback) => options?.all ? callback(null, [address]) : callback(null, address.address, address.family),
    }, res => {
      let size = 0;
      const chunks = [];
      res.on("data", chunk => {
        size += chunk.length;
        if (size > 1500000) { res.destroy(); request.destroy(new Error("Page is too large. Try its RSS feed.")); return; }
        chunks.push(chunk);
      });
      res.on("error", reject);
      res.on("end", () => resolve({ status: res.statusCode, location: res.headers.location, text: Buffer.concat(chunks).toString("utf8") }));
    });
    const timer = setTimeout(() => request.destroy(new Error("Website timed out.")), Math.max(1, Math.min(5000, deadline - Date.now())));
    request.on("error", reject);
    request.on("close", () => clearTimeout(timer));
  });
  if ([301, 302, 303, 307, 308].includes(response.status)) {
    if (redirects >= 2 || !response.location) throw new Error("Too many redirects.");
    return readPublicPage(new URL(response.location, url).href, redirects + 1, deadline);
  }
  if (response.status !== 200) throw new Error(`Website returned ${response.status}.`);
  return { text: response.text, url: url.href };
}

const clean = value => String(value || "").replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/<[^>]*>/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
const safeLink = (value, base) => { try { const u = new URL(value, base); return ["https:", "http:"].includes(u.protocol) && !u.username && !u.password ? u.href : ""; } catch { return ""; } };

export function parseSiteJobs(content, base, source) {
  const jobs = [];
  let supported = false;
  const add = job => { if (job.title && job.url && jobs.length < 200) jobs.push({ ...job, custom_site: source, source: new URL(source).hostname, origin: "live" }); };
  if (/<rss\b|<feed\b|<rdf:RDF\b/i.test(content)) {
    supported = true;
    for (const item of content.match(/<item\b[\s\S]*?<\/item>|<entry\b[\s\S]*?<\/entry>/gi) || []) {
      const field = tag => clean(item.match(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"))?.[1]);
      const href = field("link") || item.match(/<link\b[^>]*href=["']([^"']+)["']/i)?.[1] || field("guid");
      add({ title: field("title"), url: href ? safeLink(href, base) : "", company: field("author") || field("dc:creator"), location: field("job:location"), posted: field("pubDate") || field("updated"), sponsorship: null });
    }
  }
  function walk(node) {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) { node.forEach(walk); return; }
    if ([].concat(node["@type"] || []).some(type => type === "JobPosting" || type === "https://schema.org/JobPosting")) {
      supported = true;
      const place = [].concat(node.jobLocation || []).map(p => [p.address?.addressLocality, p.address?.addressRegion, p.address?.addressCountry?.name || p.address?.addressCountry].filter(x => typeof x === "string").join(", ")).filter(Boolean).join(" / ");
      add({ title: clean(node.title), url: safeLink(node.url || base, base), company: clean(node.hiringOrganization?.name), location: place || (node.jobLocationType === "TELECOMMUTE" ? "Remote" : ""), closing_date: node.validThrough || "", posted: node.datePosted || "", sponsorship: null });
    }
    Object.values(node).forEach(walk);
  }
  for (const script of content.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try { walk(JSON.parse(script[1])); } catch { /* Ignore malformed structured data. */ }
  }
  return { jobs, supported };
}

export async function fetchCustomSites(urls) {
  return Promise.all(urls.map(async source => {
    try {
      const page = await readPublicPage(source);
      const parsed = parseSiteJobs(page.text, page.url, source);
      return { available: parsed.supported, jobs: parsed.jobs, warning: !parsed.supported ? `${new URL(source).hostname}: no RSS feed or structured job listings found. Try its jobs RSS feed or a specific vacancy page; this site may need a separate connector.` : parsed.jobs.length === 0 ? `${new URL(source).hostname}: no listings returned.` : null };
    } catch (error) { return { jobs: [], warning: `${source}: ${error.message}` }; }
  }));
}

// Recognise only the two supported board homepages. A custom feed/vacancy URL
// retains its original meaning and is never broadened into a whole-board search.
export function boardHomepage(value) {
  try {
    const url = siteURL(value);
    if (url.pathname !== "/" || url.search) return null;
    const host = url.hostname.replace(/^www\./, "");
    return host === "jobs.ac.uk" ? "jobs_ac_uk" : host === "totaljobs.com" ? "totaljobs" : null;
  } catch { return null; }
}

// Read text from nested public result cards without executing page scripts.
function cardText(value = "") {
  return clean(value.replace(/<(script|style|svg)\b[^>]*>[\s\S]*?<\/\1>/gi, " "))
    .replace(/&#(x[0-9a-f]+|\d+);/gi, (_, code) => {
      const number = code[0].toLowerCase() === "x" ? parseInt(code.slice(1), 16) : Number(code);
      return number > 0 && number <= 0x10ffff ? String.fromCodePoint(number) : " ";
    });
}
function attribute(tag, name) {
  return tag.match(new RegExp(`\\b${name}\\s*=\\s*(["'])([\\s\\S]*?)\\1`, "i"))?.[2] || "";
}
function innerElement(html, opening) {
  const match = opening.exec(html);
  if (!match) return "";
  const tag = match[0].match(/^<([\w-]+)/)?.[1];
  if (!tag) return "";
  const start = match.index + match[0].length;
  const tokens = new RegExp(`<\\/?${tag}\\b[^>]*>`, "gi");
  tokens.lastIndex = start;
  let depth = 1;
  for (let token; (token = tokens.exec(html));) {
    depth += /^<\//.test(token[0]) ? -1 : /\/>$/.test(token[0]) ? 0 : 1;
    if (!depth) return html.slice(start, token.index);
  }
  return "";
}
function taggedField(html, field) {
  return cardText(innerElement(html, new RegExp(`<[a-z][^>]*\\bdata-at=["']${field}["'][^>]*>`, "i")));
}

export function parseBoardJobs(html, board) {
  const jobs = [];
  let supported = false;
  if (board === "jobs_ac_uk") {
    const count = html.match(/class=["'][^"']*\bjob-count\b[^"']*["'][^>]*>\s*([\d,]+)/i);
    const blocks = html.split(/<div\b[^>]*class=["'][^"']*\bj-search-result__result(?:\s|["'])[^>]*>/i).slice(1);
    supported = Boolean(count) && (Number(count[1].replace(/,/g, "")) === 0 || blocks.length > 0);
    for (const block of blocks) {
      const link = block.match(/<a\b[^>]*href=["'](\/job\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/i);
      if (!link) continue;
      const company = innerElement(block, /<div\b[^>]*class=["'][^"']*\bj-search-result__employer\b[^"']*["'][^>]*>/i);
      const salary = innerElement(block, /<div\b[^>]*class=["'][^"']*\bj-search-result__info\b[^"']*["'][^>]*>/i);
      jobs.push({ title: cardText(link[2]), url: new URL(clean(link[1]), "https://www.jobs.ac.uk").href,
        company: cardText(company), location: cardText(block.match(/<div\b[^>]*>\s*Location:\s*([\s\S]*?)<\/div>/i)?.[1]),
        salary: cardText(salary).replace(/^Salary:\s*/i, ""), posted: cardText(block.match(/<strong[^>]*>\s*Date Placed:\s*<\/strong>([^<]*)/i)?.[1]),
        // Search cards show day/month without a year. Do not invent an expiry.
        source: "jobs.ac.uk", sponsorship: null, origin: "live" });
    }
  } else if (board === "totaljobs") {
    const blocks = html.split(/<article\b[^>]*data-at=["']job-item["'][^>]*>/i).slice(1);
    const count = taggedField(html, "search-jobs-count");
    supported = blocks.length > 0 || /^0\b/.test(count);
    for (const raw of blocks) {
      const block = raw.split(/<\/article>/i)[0];
      const link = block.match(/<a\b[^>]*data-at=["']job-item-title["'][^>]*>/i);
      if (!link) continue;
      const url = safeLink(clean(attribute(link[0], "href")), "https://www.totaljobs.com");
      if (!url || !["totaljobs.com", "www.totaljobs.com"].includes(new URL(url).hostname) || !new URL(url).pathname.startsWith("/job/")) continue;
      jobs.push({ title: taggedField(block, "job-item-title"), url,
        company: taggedField(block, "job-item-company-name"), location: taggedField(block, "job-item-location"),
        salary: taggedField(block, "job-item-salary-info"), posted: taggedField(block, "job-item-timeago"),
        source: "Totaljobs", sponsorship: null, origin: "live" });
    }
  }
  const valid = jobs.filter(job => job.title && job.url);
  // A page containing cards that we cannot parse is a source failure, not an
  // empty successful search. Keep explicit zero-result pages valid.
  if (!valid.length && /data-at=["']job-item["']|j-search-result__result[\s"']/.test(html)) supported = false;
  return { supported, jobs: valid };
}

export async function fetchBoardJobs(board, titles, { customSite, readPage = readPublicPage } = {}) {
  const name = board === "jobs_ac_uk" ? "jobs.ac.uk" : "Totaljobs";
  const terms = [...new Set(titles.filter(title => typeof title === "string").map(title => title.trim()).filter(Boolean))].slice(0, 10);
  if (!terms.length) return { available: false, jobs: [], warnings: [`${name}: enter a target role before searching.`] };
  const pages = [];
  let next = 0;
  // Bound concurrency and response size. Each read has one total time budget,
  // including redirects, so ten roles fit within the existing route timeout.
  await Promise.all(Array.from({ length: Math.min(5, terms.length) }, async () => {
    while (next < terms.length) {
      const title = terms[next++];
      try {
        const url = board === "jobs_ac_uk"
          ? `https://www.jobs.ac.uk/search/?${new URLSearchParams({ keywords: title })}`
          : `https://www.totaljobs.com/jobs/${encodeURIComponent(title.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, ""))}`;
        const page = await readPage(url);
        const parsed = parseBoardJobs(page.text, board);
        if (!parsed.supported) throw new Error("The search page format was not recognised (it may be an access-check page).");
        pages.push({ ok: true, jobs: parsed.jobs });
      } catch (error) { pages.push({ ok: false, jobs: [], error: `${title}: ${error.message}` }); }
    }
  }));
  const seen = new Set();
  const jobs = pages.flatMap(page => page.jobs).filter(job => {
    if (seen.has(job.url)) return false;
    seen.add(job.url); return true;
  }).map(job => customSite ? { ...job, custom_site: customSite } : job);
  const failures = pages.filter(page => !page.ok);
  const warnings = [`${name}: fetched ${jobs.length} listings before your filters; checks only the first search page for each of ${terms.length} role(s).`];
  if (failures.length) warnings.push(`${name}: ${failures.length}/${terms.length} searches failed. ${failures.slice(0, 2).map(page => page.error).join(" ")}`);
  if (jobs.length) warnings.push(`${name}: these search cards do not confirm sponsorship; sponsorship-only filtering excludes them. Check the original adverts for closing dates.`);
  return { available: pages.some(page => page.ok), jobs, warnings };
}
