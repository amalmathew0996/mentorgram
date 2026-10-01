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

async function readPublicPage(value, redirects = 0) {
  const url = siteURL(value);
  let dnsTimer;
  const addresses = await Promise.race([
    lookup(url.hostname.replace(/^\[|\]$/g, ""), { all: true }),
    new Promise((_, reject) => { dnsTimer = setTimeout(() => reject(new Error("Website lookup timed out.")), 1500); }),
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
    const timer = setTimeout(() => request.destroy(new Error("Website timed out.")), 5000);
    request.on("error", reject);
    request.on("close", () => clearTimeout(timer));
  });
  if ([301, 302, 303, 307, 308].includes(response.status)) {
    if (redirects >= 2 || !response.location) throw new Error("Too many redirects.");
    return readPublicPage(new URL(response.location, url).href, redirects + 1);
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
