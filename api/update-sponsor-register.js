import { createHash, timingSafeEqual } from 'node:crypto';

// Matches the existing refresh-jobs.js Vercel function conventions.
export const config = { runtime: 'nodejs', maxDuration: 60 };
export const PUBLICATION = 'https://www.gov.uk/government/publications/register-of-licensed-sponsors-workers';
const ASSET_HOST = 'assets.publishing.service.gov.uk';
const BATCH = 1000;
const sha256 = value => createHash('sha256').update(value).digest('hex');
export const clean = value => value.replace(/\s+/gu, ' ').trim();

function officialAsset(value) {
  const u = new URL(value);
  if (u.protocol !== 'https:' || u.hostname !== ASSET_HOST || u.port || u.username || u.password || !u.pathname.endsWith('.csv')) {
    throw new Error('Unexpected GOV.UK CSV URL');
  }
  return u.href;
}

export function discover(html) {
  const urls = new Set();
  for (const match of html.matchAll(/\bhref\s*=\s*["']([^"']+)["']/gi)) {
    const value = match[1].replace(/&amp;/g, '&');
    if (!/Worker_and_Temporary_Worker/i.test(value) || !/\.csv(?:[?#]|$)/i.test(value)) continue;
    const candidate = new URL(value, PUBLICATION);
    // GOV.UK's accessibility preview is HTML, not another download attachment.
    if (candidate.origin === 'https://www.gov.uk' && candidate.pathname.startsWith('/csv-preview/')) continue;
    urls.add(officialAsset(candidate.href));
  }
  if (urls.size !== 1) throw new Error(`Expected one official worker-register CSV; found ${urls.size}`);
  const source_url = [...urls][0];
  const date = decodeURIComponent(new URL(source_url).pathname).match(/(\d{4}-\d{2}-\d{2})\.csv$/)?.[1];
  if (!date || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date) {
    throw new Error('Cannot identify register date from the official attachment filename');
  }
  // Asset identity also detects a replacement attachment published on the same date.
  return { source_url, register_date: date, register_version: `${date}:${sha256(source_url).slice(0, 16)}` };
}

// Strict RFC-style CSV parser: BOM, quoted commas/newlines and escaped quotes.
// Reject malformed/truncated records instead of silently deactivating real sponsors.
export function parseRegister(text) {
  text = text.replace(/^\uFEFF/, '');
  const rows = []; let row = [], field = '', quoted = false, closed = false;
  const pushField = () => { row.push(field); field = ''; closed = false; };
  const pushRow = () => { pushField(); if (row.some(v => v !== '')) rows.push(row); row = []; };
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') { quoted = false; closed = true; }
      else field += c;
    } else if (c === '"') {
      if (field || closed) throw new Error('Invalid CSV quote');
      quoted = true;
    } else if (c === ',') pushField();
    else if (c === '\n' || c === '\r') { pushRow(); if (c === '\r' && text[i + 1] === '\n') i++; }
    else { if (closed) throw new Error('Unexpected text after CSV quote'); field += c; }
  }
  if (quoted) throw new Error('Unterminated CSV quote');
  if (field || row.length || closed) pushRow();
  const headers = rows.shift()?.map(clean);
  const expected = ['Organisation Name', 'Town/City', 'County', 'Type & Rating', 'Route'];
  if (!headers || headers.length !== expected.length || expected.some((h, i) => headers[i] !== h)) throw new Error('Unexpected CSV headers');
  const companies = new Map();
  for (const fields of rows) {
    if (fields.length !== 5) throw new Error('CSV record does not have five fields');
    const [organisation_name, town_city, county, rating, route] = fields.map(clean);
    if (!organisation_name || !rating || !route) throw new Error('CSV record is missing a required name, rating or route');
    const key = JSON.stringify([organisation_name, town_city, county].map(v => v.toLowerCase()));
    let company = companies.get(key);
    if (!company) {
      company = { organisation_name, town_city, county, ratings: new Set(), routes: new Set() };
      companies.set(key, company);
    }
    company.ratings.add(rating); company.routes.add(route);
  }
  return {
    total_source_rows: rows.length,
    companies: [...companies.entries()].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([, c]) => ({
      organisation_name: c.organisation_name, town_city: c.town_city, county: c.county,
      type_rating: [...c.ratings].sort().join(' | '), routes: [...c.routes].sort(),
    })),
  };
}

async function boundedText(url, maxBytes, timeout, fetcher) {
  const response = await fetcher(url, { redirect: 'error', signal: AbortSignal.timeout(timeout), headers: { 'User-Agent': 'Mentorgram Sponsor Register Sync' } });
  if (!response.ok) throw new Error(`Official source returned HTTP ${response.status}`);
  if (+response.headers.get('content-length') > maxBytes) throw new Error('Official source exceeds size limit');
  const chunks = []; let size = 0;
  for await (const chunk of response.body) {
    size += chunk.length;
    if (size > maxBytes) throw new Error('Official source exceeds size limit');
    chunks.push(chunk);
  }
  return new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks));
}

export function createHandler({ fetcher = fetch, env = process.env, now = Date.now } = {}) {
  return async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    if (!['GET', 'POST'].includes(req.method)) { res.setHeader('Allow', 'GET, POST'); return res.status(405).json({ error: 'Method not allowed' }); }
    const secret = env.CRON_SECRET;
    if (!secret) return res.status(503).json({ error: 'CRON_SECRET is not configured' });
    const supplied = Buffer.from(req.headers.authorization || '');
    const expected = Buffer.from(`Bearer ${secret}`);
    if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return res.status(401).json({ error: 'Unauthorised' });
    if (!env.VITE_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return res.status(503).json({ error: 'Missing Supabase environment variables' });
    const deadline = now() + 45000;
    let version;
    let auditErrors = false;
    const rpc = async (op, values = {}, timeout = 10000) => {
      const response = await fetcher(`${env.VITE_SUPABASE_URL.replace(/\/$/, '')}/rest/v1/rpc/sponsor_register_sync`, {
        method: 'POST', redirect: 'error', signal: AbortSignal.timeout(timeout),
        headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ p_op: op, p_data: values }),
      });
      if (!response.ok) {
        // Never return upstream bodies, which may contain credentials or row data.
        const body = await response.json().catch(() => ({}));
        const safeMessages = new Set([
          'Source changed during upload; do not mix snapshots',
          'Snapshot safety guard: excessive shrinkage or removals; investigate before proceeding',
          'Refusing an older register',
          'Incomplete staged snapshot',
          'Deactivation count changed; investigate concurrent register writes',
          'This version was abandoned; operator review required',
        ]);
        if (body.code === 'P0001' && safeMessages.has(body.message)) throw new Error(body.message);
        throw new Error(`Database operation ${op} failed (HTTP ${response.status}, code ${String(body.code || 'unknown').slice(0, 20)})`);
      }
      return response.json();
    };
    try {
      const dryRun = req.query?.dryRun === '1';
      if (req.query?.dryRun !== undefined && !['0', '1'].includes(req.query.dryRun)) return res.status(400).json({ error: 'dryRun must be 0 or 1' });
      let state = await rpc('status');
      if (req.query?.status === '1') return res.status(200).json(state);
      if (!state.active || dryRun) {
        const meta = discover(await boundedText(PUBLICATION, 3000000, 12000, fetcher));
        version = meta.register_version;
        if (dryRun) {
          const csv = await boundedText(meta.source_url, 40000000, Math.max(1000, Math.min(20000, deadline - now())), fetcher);
          const parsed = parseRegister(csv);
          return res.status(200).json({ status: 'dry_run', ...meta, sha256: sha256(csv), total_source_rows: parsed.total_source_rows, total_companies: parsed.companies.length, database: state, writes: 0 });
        }
        auditErrors = true;
        state = await rpc('begin', meta);
        if (state.status === 'completed') return res.status(200).json({ ...state, skipped: true });
      }
      version = state.register_version;
      auditErrors = true;
      if (state.phase === 'loading') {
        const csv = await boundedText(officialAsset(state.source_url), 40000000, Math.max(1000, Math.min(20000, deadline - now())), fetcher);
        const parsed = parseRegister(csv);
        if (parsed.total_source_rows < 100000 || parsed.companies.length < 100000) throw new Error('Register is unexpectedly small; refusing to synchronize');
        if (now() >= deadline - 11000) return res.status(202).json({ ...state, resume_required: true });
        const digest = sha256(csv);
        state = await rpc('manifest', { register_version: version, sha256: digest, total_source_rows: parsed.total_source_rows, total_companies: parsed.companies.length });
        // A competing request may have advanced this run while we downloaded.
        for (let n = 0; n < 10 && state.phase === 'loading' && now() < deadline - 11000; n++) {
          if (state.staged_rows === parsed.companies.length) {
            state = await rpc('seal', { register_version: version }); break;
          }
          state = await rpc('stage', { register_version: version, offset: state.staged_rows, sha256: digest, rows: parsed.companies.slice(state.staged_rows, state.staged_rows + BATCH) });
        }
      } else {
        for (let n = 0; n < 10 && state.status !== 'completed' && now() < deadline - 11000; n++) {
          state = await rpc('step', { register_version: version });
        }
      }
      return res.status(state.status === 'completed' ? 200 : 202).json({ ...state, resume_required: state.status !== 'completed' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown sync error';
      console.error('Sponsor register sync:', message);
      if (version && auditErrors) {
        try { await rpc('error', { register_version: version, message }, 3000); }
        catch { console.error('Could not persist sync error; inspect function logs and saved progress'); }
      }
      return res.status(503).json({ error: message, register_version: version, retryable: true });
    }
  };
}
export default createHandler();
