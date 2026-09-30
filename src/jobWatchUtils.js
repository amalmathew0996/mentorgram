export const splitTerms = (value = "") => [...new Set(value.split(",").map(x => x.trim()).filter(Boolean))];

export function jobSource(job) {
  let host = "";
  try { host = new URL(job.url).hostname.toLowerCase(); } catch { return null; }
  const at = domain => host === domain || host.endsWith(`.${domain}`);
  if (at("jobs.nhs.scot") || at("apply.jobs.scot.nhs.uk")) return "nhs_scotland";
  if (at("jobs.nhs.uk")) return "nhs_jobs";
  if (at("trac.jobs") || at("healthjobsuk.com") || at("nursingnetuk.com")) return "trac";
  if (at("jobs.ac.uk")) return "jobs_ac_uk";
  return null;
}

export function matchJobs(jobs, { titles, locations, sources, sponsorshipRequired }, now = Date.now()) {
  const seen = new Set();
  return jobs.filter(job => {
    if (!job || typeof job.title !== "string") return false;
    let url;
    try { url = new URL(job.url); } catch { return false; }
    if (!["https:", "http:"].includes(url.protocol) || !sources.includes(jobSource(job))) return false;
    const expiry = job.closing_date || job.expires_at;
    let cutoff = /^\d{4}-\d{2}-\d{2}$/.test(expiry || "") ? `${expiry}T23:59:59.999Z` : expiry;
    if (job.closing_date && !/T\d{2}:/.test(job.closing_date) && Number.isFinite(Date.parse(job.closing_date))) {
      const end = new Date(job.closing_date);
      end.setUTCHours(23, 59, 59, 999);
      cutoff = end.toISOString();
    }
    if (cutoff && Date.parse(cutoff) < now) return false;
    const title = job.title.toLowerCase();
    if (titles.length && !titles.some(term => term.toLowerCase().split(/\s+/).every(word => title.includes(word)))) return false;
    const place = String(job.location || "").toLowerCase();
    if (locations.length && !locations.some(term => ["uk", "united kingdom", "anywhere"].includes(term.toLowerCase()) || place.includes(term.toLowerCase()))) return false;
    if (sponsorshipRequired && job.sponsorship !== true) return false;
    url.hash = "";
    for (const key of [...url.searchParams.keys()]) if (/^utm_|^fbclid$|^gclid$/i.test(key)) url.searchParams.delete(key);
    const key = url.href;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
