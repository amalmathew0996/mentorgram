import { createHash, timingSafeEqual } from 'node:crypto';
export const config = { runtime: 'nodejs', maxDuration: 60 };
const BOARD = 'https://miiro.talosats-careers.com';
const API = 'https://api-careers-sites.talos360.com';
const COMPANY = 'Hotel Templeton Garden Limited';
const SOURCE = 'Templeton Garden (official)';
const hash = x => createHash('sha256').update(JSON.stringify(x)).digest('hex');
const clean = x => typeof x === 'string' ? x.replace(/<[^>]*>/g, ' ').replace(/&nbsp;|&#160;/g, ' ').replace(/\s+/g, ' ').trim() : '';
const uk = x => ['united kingdom', 'gb', 'uk'].includes(clean(x).toLowerCase());
const postcode = x => clean(x).replace(/\s/g, '').toUpperCase();
export function parseJob(html, id, now = Date.now(), includeExpired = false) {
  const jobs = [];
  function walk(x) {
    if (Array.isArray(x)) return x.forEach(walk);
    if (!x || typeof x !== 'object') return;
    if (x['@type'] === 'JobPosting') jobs.push(x);
    if (x['@graph']) walk(x['@graph']);
  }
  for (const m of html.matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) walk(JSON.parse(m[1]));
  if (jobs.length !== 1) throw new Error('Expected one structured job; source format changed');
  const j = jobs[0], a = j.jobLocation?.address;
  if (!a || !uk(a.addressCountry) || postcode(a.postalCode) !== 'SW59NB' ||
      !/\bTempleton Garden\b/i.test(clean(j.title) + ' ' + clean(j.description)) ||
      clean(j.hiringOrganization?.name) !== 'Miiro') return null;
  const expires = Date.parse(j.validThrough), posted = Date.parse(j.datePosted);
  if (!Number.isFinite(expires) || !Number.isFinite(posted)) throw new Error('Missing or invalid job dates');
  if (posted > now) throw new Error('Unexpected future publication date');
  if (expires <= now && !includeExpired) return null;
  if (!clean(j.title) || !/^\d+$/.test(String(id))) throw new Error('Invalid job identity');
  return { title: clean(j.title), company: COMPANY, location: 'London, SW5 9NB',
    salary: null, sector: 'Hospitality', posted: new Date(posted).toLocaleDateString('en-GB', {day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}),
    url: `${BOARD}/job/${id}`, source: SOURCE, sponsorship: null,
    expires_at: new Date(expires).toISOString() };
}
export async function collect(fetcher = fetch, now = Date.now(), knownUrls = []) {
  const cfg = await (await fetcher(`${API}/api/careerssites/site/config/get?host=miiro.talosats-careers.com`)).json();
  const c = cfg.siteConfig;
  if (c?.domain !== 'miiro.talosats-careers.com' || c.siteType !== 'External' || !c.obfuscatedId) throw new Error('Unexpected careers site configuration');
  const data = await (await fetcher(`${API}/api/careerssite/vacancies/search`, {
    method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({careersSiteObfuscatedId:c.obfuscatedId,whatCriteria:null,whereCriteria:null,metadataFilters:[],preFilters:[],siteType:c.siteType})
  })).json();
  const rows = data.careersSiteVacancies;
  if (!Array.isArray(rows) || rows.length > 100) throw new Error('Unexpected vacancy feed or pilot limit exceeded');
  const candidates = [...new Set(rows.filter(j => uk(j.country) && postcode(j.postcode) === 'SW59NB').map(j => String(j.jobPostId)))].sort();
  if (candidates.length > 30 || candidates.some(id => !/^\d+$/.test(id))) throw new Error('Unexpected vacancy IDs or pilot limit exceeded');
  if (knownUrls.length > 30 || knownUrls.some(u => !/^https:\/\/miiro\.talosats-careers\.com\/job\/\d+$/.test(u))) throw new Error('Unexpected stored source URLs');
  const ids = [...new Set([...candidates, ...knownUrls.map(u => u.split('/').pop())])].sort();
  if (ids.length > 30) throw new Error('Pilot detail limit exceeded');
  const accepted = [], missing_urls = [], closed_urls = [];
  const known = new Set(knownUrls);
  // Small concurrent groups keep the pilot inside the function deadline.
  for (let i=0; i<ids.length; i+=4) {
    const group = await Promise.all(ids.slice(i,i+4).map(async id => {
      const url = `${BOARD}/job/${id}`;
      const r = await fetcher(url);
      if ([404,410].includes(r.status)) {
        if (!known.has(url)) throw new Error('Listed job unavailable; retry later');
        missing_urls.push(url); return null;
      }
      const job = parseJob(await r.text(), id, now, true);
      if (!job) {
        if (known.has(url)) throw new Error('Stored job identity changed; manual review required');
        return null;
      }
      if (Date.parse(job.expires_at) <= now) {
        if (known.has(url)) closed_urls.push(url);
        return null;
      }
      return job;
    }));
    accepted.push(...group.filter(Boolean));
  }
  accepted.sort((a,b)=>a.url.localeCompare(b.url));
  missing_urls.sort(); closed_urls.sort();
  return {feed_rows: rows.length, checked: ids.length, jobs: accepted, missing_urls, closed_urls};
}
export function makeHandler({ fetchImpl = fetch, env = process.env, now = () => Date.now() } = {}) {
  return async (req,res) => {
    res.setHeader('Cache-Control','no-store');
    const secret = env.CRON_SECRET;
    if (!secret || secret.trim() !== secret) return res.status(500).json({error:'CRON_SECRET is missing or invalid'});
    const actual = Buffer.from(req.headers.authorization || ''), expected = Buffer.from(`Bearer ${secret}`);
    if (actual.length !== expected.length || !timingSafeEqual(actual,expected)) return res.status(401).json({error:'Unauthorised'});
    if (req.method !== 'POST') return res.status(405).json({error:'Use POST'});
    let body;
    try { body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {}; } catch { return res.status(400).json({error:'Invalid JSON'}); }
    if (!['preview','import'].includes(body.mode)) return res.status(400).json({error:'Choose preview or import mode'});
    if (body.mode === 'import' && !/^[a-f0-9]{64}$/.test(body.preview_token || '')) return res.status(400).json({error:'Preview token required'});
    const start = now();
    const request = async (url,options={}) => {
      const remaining = 48000-(now()-start);
      if (remaining < 1000) throw new Error('Pilot deadline reached; no complete result');
      const r = await fetchImpl(url,{...options,redirect:'error',signal:AbortSignal.timeout(Math.min(10000,remaining))});
      if (!r.ok && !(String(url).startsWith(`${BOARD}/job/`) && [404,410].includes(r.status))) throw new Error(`Upstream request failed (HTTP ${r.status})`);
      return r;
    };
    try {
      const base = new URL(env.VITE_SUPABASE_URL);
      if (base.protocol !== 'https:' || base.username || base.password || base.search || base.hash || !env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Invalid Supabase configuration');
      const headers = {apikey:env.SUPABASE_SERVICE_ROLE_KEY,Authorization:`Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`};
      const sponsor = await (await request(`${base.origin}/rest/v1/sponsor_companies?id=eq.47&select=id,organisation_name,is_current_sponsor,careers_url,careers_platform`,{headers})).json();
      if (sponsor.length !== 1 || sponsor[0].organisation_name !== COMPANY || sponsor[0].is_current_sponsor !== true || sponsor[0].careers_url !== `${BOARD}/vacancies` || sponsor[0].careers_platform !== 'talos') throw new Error('Sponsor source is not configured or no longer current');
      const stored = await (await request(`${base.origin}/rest/v1/jobs?source=eq.${encodeURIComponent(SOURCE)}&company=eq.${encodeURIComponent(COMPANY)}&select=url&limit=31`,{headers})).json();
      if (!Array.isArray(stored) || stored.length>30) throw new Error('Stored-job pilot limit exceeded');
      const observed_at = new Date(start).toISOString();
      const result = await collect(request,now(),stored.map(j=>j.url));
      const args = {p_jobs:result.jobs,p_missing_urls:result.missing_urls,p_closed_urls:result.closed_urls,p_observed_at:observed_at,p_preview:true};
      const rpc = async data => (await request(`${base.origin}/rest/v1/rpc/sync_templeton_jobs`,{
        method:'POST',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify(data)
      })).json();
      const changes = await rpc(args);
      if (!changes || !['inserted','updated','expired','pending_missing'].every(k=>Number.isInteger(changes[k])&&changes[k]>=0)) throw new Error('Unexpected sync result');
      const preview_token = hash({version:2,jobs:result.jobs,missing_urls:result.missing_urls,closed_urls:result.closed_urls,changes});
      if (body.mode === 'preview') return res.status(200).json({status:'preview',version:2,writes:0,...result,changes,preview_token});
      if (body.preview_token !== preview_token) return res.status(409).json({error:'Source or database changed. Run and review a new preview.'});
      if (now()-start > 38000) throw new Error('Not enough time to start transaction; retry');
      const applied = await rpc({...args,p_preview:false});
      return res.status(200).json({status:'completed',version:2,...applied});
    } catch {
      // Do not expose upstream bodies or credentials. An interrupted insert may have committed;
      // URL uniqueness makes retry safe. Never delete jobs after an incomplete source read.
      return res.status(502).json({error:'Sync could not complete. Check the SQL migration, source availability and configuration, then retry a fresh preview. No partial transaction is committed; an interrupted response may follow a completed transaction.'});
    }
  };
}
export default makeHandler();
