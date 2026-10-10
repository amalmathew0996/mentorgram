import {createHash,timingSafeEqual} from 'node:crypto';
export const config={runtime:'nodejs',maxDuration:60};
const templeton=(()=>{
const BOARD = 'https://miiro.talosats-careers.com';
const API = 'https://api-careers-sites.talos360.com';
const COMPANY = 'Hotel Templeton Garden Limited';
const SOURCE = 'Templeton Garden (official)';
const hash = x => createHash('sha256').update(JSON.stringify(x)).digest('hex');
const clean = x => typeof x === 'string' ? x.replace(/<[^>]*>/g, ' ').replace(/&nbsp;|&#160;/g, ' ').replace(/\s+/g, ' ').trim() : '';
const uk = x => ['united kingdom', 'gb', 'uk'].includes(clean(x).toLowerCase());
const postcode = x => clean(x).replace(/\s/g, '').toUpperCase();
function parseJob(html, id, now = Date.now(), includeExpired = false) {
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
async function collect(fetcher = fetch, now = Date.now(), knownUrls = []) {
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
function makeHandler({ fetchImpl = fetch, env = process.env, now = () => Date.now() } = {}) {
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
return {makeHandler,parseJob,collect};
})();
const bulk=(()=>{
const SOURCES=[
  {
    "id": 2849,
    "name": "AccuRx Limited",
    "careers_url": "https://www.accurx.com/careers",
    "platform": "ashby",
    "board": "accurx",
    "brand": "Accurx"
  },
  {
    "id": 4816,
    "name": "Airwallex (UK) Limited",
    "careers_url": "https://careers.airwallex.com/",
    "platform": "ashby",
    "board": "airwallex",
    "brand": "Airwallex"
  },
  {
    "id": 5807,
    "name": "Algolia Limited",
    "careers_url": "https://www.algolia.com/careers",
    "platform": "greenhouse",
    "board": "algolia",
    "brand": "Algolia"
  },
  {
    "id": 7314,
    "name": "Amplitude Analytics Limited",
    "careers_url": "https://amplitude.com/careers",
    "platform": "ashby",
    "board": "amplitude",
    "brand": "Amplitude"
  },
  {
    "id": 8097,
    "name": "Anthropic Limited",
    "careers_url": "https://www.anthropic.com/careers",
    "platform": "greenhouse",
    "board": "anthropic",
    "brand": "Anthropic"
  },
  {
    "id": 9841,
    "name": "Asana Software UK Limited",
    "careers_url": "https://asana.com/jobs",
    "platform": "greenhouse",
    "board": "asana",
    "brand": "Asana"
  },
  {
    "id": 13926,
    "name": "Beamery Ltd",
    "careers_url": "https://careers.beamery.com/",
    "platform": "ashby",
    "board": "beamery",
    "brand": "Beamery"
  },
  {
    "id": 15732,
    "name": "Birdie Care Services Limited",
    "careers_url": "https://www.birdie.care/join-us",
    "platform": "ashby",
    "board": "birdie",
    "brand": "Birdie"
  },
  {
    "id": 17918,
    "name": "Braze Limited",
    "careers_url": "https://www.braze.com/company/careers",
    "platform": "greenhouse",
    "board": "braze",
    "brand": "Braze"
  },
  {
    "id": 20787,
    "name": "Canonical UK Limited",
    "careers_url": "https://canonical.com/careers",
    "platform": "greenhouse",
    "board": "canonical",
    "brand": "Canonical"
  },
  {
    "id": 20822,
    "name": "CANVA UK OPERATIONS LIMITED",
    "careers_url": "https://www.lifeatcanva.com/en/locations/united-kingdom/",
    "platform": "smartrecruiters",
    "board": "canva",
    "brand": "Canva"
  },
  {
    "id": 21757,
    "name": "carwow Ltd.",
    "careers_url": "https://www.carwow.co.uk/jobs.html",
    "platform": "ashby",
    "board": "Carwow",
    "brand": "Carwow"
  },
  {
    "id": 23297,
    "name": "CHECKOUT LTD",
    "careers_url": "https://www.checkout.com/careers",
    "platform": "ashby",
    "board": "checkout.com",
    "brand": "Checkout.com"
  },
  {
    "id": 25081,
    "name": "Cleo AI Ltd",
    "careers_url": "https://web.meetcleo.com/careers",
    "platform": "ashby",
    "board": "cleo-2",
    "brand": "Cleo"
  },
  {
    "id": 25344,
    "name": "Cloudflare Limited",
    "careers_url": "https://www.cloudflare.com/careers/jobs/",
    "platform": "greenhouse",
    "board": "cloudflare",
    "brand": "Cloudflare"
  },
  {
    "id": 26841,
    "name": "CONTENTFUL (UK) LIMITED",
    "careers_url": "https://www.contentful.com/careers/",
    "platform": "greenhouse",
    "board": "contentful",
    "brand": "Contentful"
  },
  {
    "id": 29912,
    "name": "Databricks UK Limited",
    "careers_url": "https://www.databricks.com/company/careers",
    "platform": "greenhouse",
    "board": "databricks",
    "brand": "Databricks"
  },
  {
    "id": 35698,
    "name": "Elasticsearch Limited",
    "careers_url": "https://www.elastic.co/careers",
    "platform": "greenhouse",
    "board": "elastic",
    "brand": "Elastic"
  },
  {
    "id": 40368,
    "name": "Figma UK Limited",
    "careers_url": "https://www.figma.com/careers/",
    "platform": "greenhouse",
    "board": "figma",
    "brand": "Figma"
  },
  {
    "id": 41310,
    "name": "Flo Health UK Limited",
    "careers_url": "https://flo.health/careers",
    "platform": "greenhouse",
    "board": "flohealth",
    "brand": "Flo Health"
  },
  {
    "id": 42994,
    "name": "FUNDING CIRCLE LTD",
    "careers_url": "https://www.fundingcircle.com/uk/careers/",
    "platform": "ashby",
    "board": "fundingcircle",
    "brand": "Funding Circle"
  },
  {
    "id": 45807,
    "name": "GoCardless Limited",
    "careers_url": "https://gocardless.com/about/careers",
    "platform": "greenhouse",
    "board": "gocardless",
    "brand": "GoCardless"
  },
  {
    "id": 46540,
    "name": "Grafana Labs Ltd",
    "careers_url": "https://grafana.com/careers/",
    "platform": "greenhouse",
    "board": "grafanalabs",
    "brand": "Grafana Labs"
  },
  {
    "id": 55710,
    "name": "Intercom Software UK Limited",
    "careers_url": "https://fin.ai/careers",
    "platform": "greenhouse",
    "board": "intercom",
    "brand": "Fin"
  },
  {
    "id": 62067,
    "name": "Klaviyo Ltd",
    "careers_url": "https://www.klaviyo.com/careers",
    "platform": "greenhouse",
    "board": "klaviyo",
    "brand": "Klaviyo"
  },
  {
    "id": 64741,
    "name": "Lendable Operations Ltd",
    "careers_url": "https://careers.lendable.com/",
    "platform": "ashby",
    "board": "lendable",
    "brand": "Lendable"
  },
  {
    "id": 74333,
    "name": "MongoDB UK Limited",
    "careers_url": "https://www.mongodb.com/company/careers",
    "platform": "greenhouse",
    "board": "mongodb",
    "brand": "MongoDB"
  },
  {
    "id": 74493,
    "name": "Monzo Bank Ltd",
    "careers_url": "https://monzo.com/careers",
    "platform": "greenhouse",
    "board": "monzo",
    "brand": "Monzo"
  },
  {
    "id": 76014,
    "name": "Multiverse Group Limited",
    "careers_url": "https://www.multiverse.io/careers/were-hiring",
    "platform": "ashby",
    "board": "multiverse",
    "brand": "Multiverse"
  },
  {
    "id": 80828,
    "name": "OakNorth Bank Plc",
    "careers_url": "https://oaknorth.co.uk/about/careers/",
    "platform": "ashby",
    "board": "oaknorth",
    "brand": "OakNorth"
  },
  {
    "id": 81092,
    "name": "Octopus Energy Limited",
    "careers_url": "https://octopus.energy/careers/",
    "platform": "lever",
    "board": "octoenergy",
    "brand": "Octopus Energy",
    "department": "Octopus Energy UK \ud83c\uddec\ud83c\udde7"
  },
  {
    "id": 82113,
    "name": "OpenAI UK Ltd",
    "careers_url": "https://openai.com/careers/search/",
    "platform": "ashby",
    "board": "openai",
    "brand": "OpenAI"
  },
  {
    "id": 83518,
    "name": "Paddle.com Market Limited",
    "careers_url": "https://www.paddle.com/careers",
    "platform": "ashby",
    "board": "paddle",
    "brand": "Paddle"
  },
  {
    "id": 90217,
    "name": "Quantexa Ltd",
    "careers_url": "https://www.quantexa.com/careers/",
    "platform": "ashby",
    "board": "quantexa",
    "brand": "Quantexa"
  },
  {
    "id": 93992,
    "name": "Rippling UK Limited",
    "careers_url": "https://www.rippling.com/careers",
    "platform": "rippling",
    "board": "rippling",
    "brand": "Rippling"
  },
  {
    "id": 94990,
    "name": "Roofoods Ltd t/a Deliveroo",
    "careers_url": "https://careers.deliveroo.co.uk/join-the-team/",
    "platform": "greenhouse",
    "board": "deliveroo",
    "brand": "Deliveroo"
  },
  {
    "id": 103292,
    "name": "Snyk Limited",
    "careers_url": "https://snyk.io/careers/",
    "platform": "ashby",
    "board": "98cd1a00-2706-4aa8-ab72-38a7b8c9c20c",
    "brand": "Snyk"
  },
  {
    "id": 106413,
    "name": "STARLING BANK LIMITED",
    "careers_url": "https://www.starlingbank.com/careers/",
    "platform": "workable",
    "board": "starling-bank",
    "brand": "Starling Bank",
    "feed_brand": "Starling"
  },
  {
    "id": 107328,
    "name": "Stripe Payments UK Ltd",
    "careers_url": "https://stripe.com/gb/careers",
    "platform": "greenhouse",
    "board": "stripe",
    "brand": "Stripe"
  },
  {
    "id": 109238,
    "name": "Synthesia Limited",
    "careers_url": "https://www.synthesia.io/careers",
    "platform": "ashby",
    "board": "synthesia",
    "brand": "Synthesia"
  },
  {
    "id": 115459,
    "name": "Thought Machine Group Limited",
    "careers_url": "https://www.thoughtmachine.net/careers",
    "platform": "ashby",
    "board": "thought-machine",
    "brand": "Thought Machine"
  },
  {
    "id": 116864,
    "name": "TRACTABLE LTD",
    "careers_url": "https://tractable.ai/careers/",
    "platform": "ashby",
    "board": "tractable",
    "brand": "Tractable"
  },
  {
    "id": 116975,
    "name": "Trainline.com Ltd",
    "careers_url": "https://www.trainlinegroup.com/careers/",
    "platform": "ashby",
    "board": "trainline",
    "brand": "Trainline"
  },
  {
    "id": 117722,
    "name": "TrueLayer Limited",
    "careers_url": "https://truelayer.com/careers/",
    "platform": "greenhouse",
    "board": "truelayer",
    "brand": "TrueLayer",
    "greenhouse_host": "job-boards.eu.greenhouse.io"
  },
  {
    "id": 117805,
    "name": "Trustpilot Ltd",
    "careers_url": "https://corporate.trustpilot.com/careers",
    "platform": "greenhouse",
    "board": "trustpilot",
    "brand": "Trustpilot"
  },
  {
    "id": 123164,
    "name": "Wayve Technologies Ltd",
    "careers_url": "https://wayve.ai/careers/",
    "platform": "ashby",
    "board": "wayve",
    "brand": "Wayve"
  },
  {
    "id": 125020,
    "name": "Wise Payments Limited",
    "careers_url": "https://wise.jobs/jobs",
    "platform": "smartrecruiters",
    "board": "wise",
    "brand": "Wise"
  },
  {
    "id": 127821,
    "name": "Zopa Bank Limited",
    "careers_url": "https://careers.zopa.com/",
    "platform": "lever",
    "board": "zopa",
    "brand": "Zopa"
  }
];
async function collectBulkFeed(c,request){
 if(c.platform==='ashby')return request(`https://api.ashbyhq.com/posting-api/job-board/${c.board}`);
 if(c.platform==='greenhouse')return request(`https://boards-api.greenhouse.io/v1/boards/${c.board}/jobs?content=true`);
 if(c.platform==='lever')return request(`https://api.lever.co/v0/postings/${c.board}?mode=json&limit=3001`);
 if(c.platform==='workable')return request(`https://apply.workable.com/api/v1/widget/accounts/${c.board}`);
 if(c.platform==='rippling')return request(`https://api.rippling.com/platform/api/ats/v1/board/${c.board}/jobs`);
 if(c.platform==='smartrecruiters'){
  const url=`https://api.smartrecruiters.com/v1/companies/${c.board}/postings?limit=100`;
  const first=await request(url);const total=first.totalFound;
  if(!Number.isInteger(total)||total<0||total>3000||first.offset!==0||!Array.isArray(first.content)||first.content.length!==Math.min(100,total))throw Error('Invalid posting pagination');
  const content=[...first.content];
  for(let offset=100;offset<total;offset+=100){
   const page=await request(`${url}&offset=${offset}`);
   if(page.totalFound!==total||page.offset!==offset||!Array.isArray(page.content)||page.content.length!==Math.min(100,total-offset))throw Error('Incomplete posting pagination');
   content.push(...page.content);
  }
  return {...first,content,complete:true};
 }
 throw Error('Unsupported source');
}
function normalizeAdditional(c,data,now){
 let raw;
 if(c.platform==='smartrecruiters'){
  if(data.complete!==true||!Array.isArray(data.content)||data.totalFound!==data.content.length)throw Error('Incomplete SmartRecruiters feed');raw=data.content;
 }else if(c.platform==='workable'){
  if(clean(data.name)!==(c.feed_brand||c.brand)||!Array.isArray(data.jobs))throw Error('Workable brand or feed changed');raw=data.jobs;
 }else{if(!Array.isArray(data))throw Error('Invalid source list');raw=data;}
 if(raw.length>3000)throw Error('Feed size limit');
 const feedRows=raw.length;
 if(c.platform==='workable'){
  const grouped=new Map();
  for(const j of raw){
   if(!Array.isArray(j.locations))throw Error('Missing Workable locations');
   const previous=grouped.get(j.shortcode);
   if(previous){
    if(previous.title!==j.title||previous.url!==j.url||previous.department!==j.department||previous.published_on!==j.published_on)throw Error('Conflicting Workable identity');
    previous.locations.push(...j.locations);
   }else grouped.set(j.shortcode,{...j,locations:[...j.locations]});
  }
  raw=[...grouped.values()];
 }
 if(c.platform==='rippling'){
  const grouped=new Map();
  for(const j of raw){
   if(typeof j.workLocation?.label!=='string')throw Error('Missing Rippling location');
   const previous=grouped.get(j.uuid);
   if(previous){
    if(previous.name!==j.name||previous.url!==j.url||previous.department?.id!==j.department?.id)throw Error('Conflicting Rippling identity');
    previous.workLocations.push(j.workLocation.label);
   }else grouped.set(j.uuid,{...j,workLocations:[j.workLocation.label]});
  }
  raw=[...grouped.values()];
 }
 const jobs=[],seen=[],closed=[];const ttl=Date.UTC(new Date(now).getUTCFullYear(),new Date(now).getUTCMonth(),new Date(now).getUTCDate()+7);
 const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
 for(const j of raw){
  let title,url,locations=[],published=null;
  if(c.platform==='lever'){
   if(!uuid.test(j.id)||j.hostedUrl!==`https://jobs.lever.co/${c.board}/${j.id}`)throw Error('Unexpected Lever identity');
   url=j.hostedUrl;title=clean(j.text);
   if(typeof j.categories?.location!=='string')throw Error('Missing Lever location');
   // This board includes separate Octopus businesses. Only the UK supply team is connected here.
   if(c.department&&j.categories.department!==c.department)continue;
   if(country(j.country)||(!clean(j.country)&&ukText(j.categories.location)))locations=[clean(j.categories.location)];
  }else if(c.platform==='workable'){
   if(!/^[A-F0-9]+$/.test(j.shortcode)||j.url!==`https://apply.workable.com/j/${j.shortcode}`)throw Error('Unexpected Workable identity');url=j.url;title=clean(j.title);
   if(!Array.isArray(j.locations))throw Error('Missing Workable locations');
   locations=j.locations.filter(l=>l.hidden===false&&country(l.countryCode||l.country)).map(l=>[clean(l.city),clean(l.region),'United Kingdom'].filter(Boolean).join(', '));
   // published_on is source publication; absent dates remain unknown.
   published=date(j.published_on);
  }else if(c.platform==='smartrecruiters'){
   if(!/^\d+$/.test(j.id)||j.company?.identifier?.toLowerCase()!==c.board||clean(j.company?.name)!==c.brand||typeof j.location?.country!=='string')throw Error('Unexpected SmartRecruiters identity');
   url=`https://jobs.smartrecruiters.com/${c.board}/${j.id}`;title=clean(j.name);
   if(country(j.location.country))locations=[[clean(j.location.city),clean(j.location.region),'United Kingdom'].filter(Boolean).join(', ')];
  }else if(c.platform==='rippling'){
   if(!uuid.test(j.uuid)||j.url!==`https://ats.rippling.com/${c.board}/jobs/${j.uuid}`||typeof j.workLocation?.label!=='string')throw Error('Unexpected Rippling identity');url=j.url;title=clean(j.name);
   locations=j.workLocations.filter(ukText).map(clean);
  }else throw Error('Unsupported source');
  seen.push(url);
  if(!title||title.length>500)throw Error('Invalid title');
  if(!locations.length||/talent (?:pool|community|network)|general application|speculative|expression of interest|future opportunit/i.test(title))continue;
  if(published!==null&&published>now)continue;
  jobs.push({title,company:c.brand,location:[...new Set(locations)].join('; '),salary:null,sector:'Other',posted:published===null?null:new Date(published).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric',timeZone:'UTC'}),url,source:`${c.brand} (official careers)`,sponsorship:null,expires_at:new Date(ttl).toISOString()});
 }
 if(new Set(seen).size!==seen.length)throw Error('Duplicate source identities');
 jobs.sort((a,b)=>a.url.localeCompare(b.url));seen.sort();
 return {jobs,seen_urls:seen,closed_urls:closed,feed_rows:feedRows};
}

const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const clean=x=>typeof x==='string'?x.replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#(?:39|x27);/gi,"'").replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim():'';
const country=x=>['gb','gbr','uk','united kingdom','great britain'].includes(clean(x).toLowerCase());
const ukText=x=>/\b(UK|United Kingdom|England|Scotland|Wales|Northern Ireland)\b/i.test(x.replace(/New England|New South Wales/gi,''));
function date(x){if(x==null)return null;const n=Date.parse(x);if(!Number.isFinite(n))throw Error('Invalid source date');return n;}
function identity(c,j){
 const id=String(j.id||'');
 if(c.platform==='ashby'){
  if(!/^[a-f0-9]{8}-[a-f0-9-]{27}$/.test(id))throw Error('Invalid Ashby identity');
  const expected=`https://jobs.ashbyhq.com/${c.board}/${id}`;
  if(j.jobUrl!==expected)throw Error('Unexpected Ashby job URL');
  return expected;
 }
 if(!/^\d+$/.test(id))throw Error('Invalid Greenhouse identity');
 const url=new URL(j.absolute_url);
 const custom={asana:['www.asana.com',`/jobs/apply/${id}`],klaviyo:['www.klaviyo.com',`/careers/jobs/${id}`],
  databricks:['databricks.com','/company/careers/open-positions/job'],elastic:['jobs.elastic.co','/jobs'],
  stripe:['stripe.com','/jobs/search'],trustpilot:['corporate.trustpilot.com',`/careers/job/${id}`],mongodb:['www.mongodb.com','/careers/job/']}[c.board];
 const hosted=(c.greenhouse_host?[c.greenhouse_host]:['boards.greenhouse.io','job-boards.greenhouse.io']).includes(url.hostname)&&url.pathname===`/${c.board}/jobs/${id}`;
 const customMatches=custom&&url.hostname===custom[0]&&url.pathname===custom[1]&&url.searchParams.getAll('gh_jid').length>0&&url.searchParams.getAll('gh_jid').every(v=>v===id);
 if(url.protocol!=='https:'||url.username||url.password||(!hosted&&!customMatches))throw Error('Unexpected Greenhouse job URL');
 // Keep the exact URL convention used by the original bulk import, including Figma's query.
 return c.board==='figma'?`https://boards.greenhouse.io/figma/jobs/${id}?gh_jid=${id}`:`https://${c.greenhouse_host||'job-boards.greenhouse.io'}/${c.board}/jobs/${id}`;
}
function normalize(c,data,now=Date.now()){
 if(!['ashby','greenhouse'].includes(c.platform))return normalizeAdditional(c,data,now);
 if(!Array.isArray(data.jobs)||data.jobs.length>3000)throw Error('Feed shape or size changed');
 if(c.platform==='greenhouse'&&data.meta?.total!==data.jobs.length)throw Error('Incomplete Greenhouse feed');
 if(c.platform==='ashby'&&data.apiVersion!=='1')throw Error('Unsupported Ashby version');
 const jobs=[],seen=[],closed=[];
 const ttl=Date.UTC(new Date(now).getUTCFullYear(),new Date(now).getUTCMonth(),new Date(now).getUTCDate()+7);
 for(const j of data.jobs){
  if(c.platform==='ashby'&&typeof j.isListed!=='boolean')throw Error('Missing publication status');
  if(c.platform==='ashby'&&!j.isListed)continue;
  if(c.platform==='greenhouse'&&j.internal_job_id==null)continue;
  const url=identity(c,j);seen.push(url);
  if(c.platform==='greenhouse'&&clean(j.company_name)!==c.brand)throw Error('Source brand changed');
  const title=clean(j.title);if(!title||title.length>500)throw Error('Invalid title');
  const deadline=c.platform==='greenhouse'?date(j.application_deadline):null;
  if(deadline!==null&&deadline<=now){closed.push(url);continue;}
  if(/talent (?:pool|community|network)|general application|expression of interest|future opportunit/i.test(title))continue;
  let locations=[];
  if(c.platform==='ashby'){
   if(!Array.isArray(j.secondaryLocations))throw Error('Missing secondary locations');
   for(const l of [{location:j.location,address:j.address},...j.secondaryLocations]){
    const a=l.address?.postalAddress||l.address||{};
    // A stated foreign country takes precedence over location text.
    if(country(a.addressCountry)||(!clean(a.addressCountry)&&ukText(clean(l.location))))locations.push(clean(l.location)||'United Kingdom');
   }
  }else{
   if(typeof j.location?.name!=='string')throw Error('Missing location');
   locations=j.location.name.split(/;| • /).filter(ukText).map(clean);
   // Greenhouse's job-associated offices can disambiguate a bare city name.
   if(!locations.length&&Array.isArray(j.offices)){
    locations=j.offices.filter(o=>typeof o.location==='string'&&ukText(o.location)).map(o=>clean(o.location));
   }
  }
  if(!locations.length)continue;
  // Greenhouse first_published is original publication. Ashby publishedAt is last publication.
  const published=c.platform==='greenhouse'?date(j.first_published):null;
  if(published!==null&&published>now)continue;
  jobs.push({title,company:c.brand,location:[...new Set(locations)].join('; '),salary:null,sector:'Other',
   posted:published===null?null:new Date(published).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric',timeZone:'UTC'}),
   url,source:`${c.brand} (official careers)`,sponsorship:null,expires_at:new Date(Math.min(ttl,deadline??ttl)).toISOString()});
 }
 if(new Set(seen).size!==seen.length)throw Error('Duplicate source identities');
 jobs.sort((a,b)=>a.url.localeCompare(b.url));seen.sort();closed.sort();
 return {jobs,seen_urls:seen,closed_urls:closed,feed_rows:data.jobs.length};
}
function makeHandler({fetchImpl=fetch,env=process.env,now=()=>Date.now()}={}){
 return async(req,res)=>{
  res.setHeader('Cache-Control','no-store');
  const secret=env.CRON_SECRET;
  if(!secret||/\s/.test(secret))return res.status(500).json({error:'Server secret configuration invalid'});
  const a=Buffer.from(req.headers.authorization||''),b=Buffer.from(`Bearer ${secret}`);
  if(a.length!==b.length||!timingSafeEqual(a,b))return res.status(401).json({error:'Unauthorised'});
  if(req.method!=='POST')return res.status(405).json({error:'Use POST'});
  let body;try{body=typeof req.body==='string'?JSON.parse(req.body):req.body||{};}catch{return res.status(400).json({error:'Invalid JSON'});}
  const c=SOURCES.find(c=>c.id===body.sponsor_id);
  if(!c||!['preview','import'].includes(body.mode))return res.status(400).json({error:'Unknown source or mode'});
  if(body.mode==='import'&&!/^[a-f0-9]{64}$/.test(body.preview_token||''))return res.status(400).json({error:'Preview token required'});
  const start=now();
  const request=async(url,options={})=>{
   const remaining=45000-(now()-start);if(remaining<1000)throw Error('Deadline reached');
   const r=await fetchImpl(url,{...options,redirect:'error',signal:AbortSignal.timeout(Math.min(12000,remaining))});
   if(!r.ok)throw Error('Upstream request failed');return r.json();
  };
  try{
   const base=new URL(env.VITE_SUPABASE_URL);
   if(base.protocol!=='https:'||base.username||base.password||base.search||base.hash||!env.SUPABASE_SERVICE_ROLE_KEY)throw Error('Database configuration invalid');
   const result=normalize(c,await collectBulkFeed(c,request),now());
   const args={p_sponsor_id:c.id,p_jobs:result.jobs,p_seen_urls:result.seen_urls,p_closed_urls:result.closed_urls,p_feed_rows:result.feed_rows,p_observed_at:new Date(start).toISOString(),p_preview:true};
   const rpc=data=>request(`${base.origin}/rest/v1/rpc/sync_bulk_employer_jobs`,{method:'POST',headers:{apikey:env.SUPABASE_SERVICE_ROLE_KEY,Authorization:`Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,'Content-Type':'application/json'},body:JSON.stringify(data)});
   const changes=await rpc(args);
   const valid=x=>['inserted','updated','expired','pending_missing','conflicts'].every(k=>Number.isInteger(x?.[k])&&x[k]>=0);
   if(!valid(changes))throw Error('Invalid database response');
   const token=hash({version:1,sponsor_id:c.id,...result,changes});
   if(body.mode==='preview')return res.status(200).json({status:'preview',version:1,sponsor_id:c.id,writes:0,feed_rows:result.feed_rows,jobs:result.jobs,changes,preview_token:token});
   if(body.preview_token!==token)return res.status(409).json({error:'Source or database changed; refresh preview'});
   if(now()-start>32000)throw Error('Insufficient transaction time');
   const applied=await rpc({...args,p_preview:false});if(!valid(applied))throw Error('Invalid database response');
   return res.status(200).json({status:'completed',version:1,sponsor_id:c.id,...applied});
  }catch{return res.status(502).json({error:'Source sync did not confirm completion. Check source configuration, feed health and database audit. Retry with a fresh preview; an interrupted response may follow a committed transaction.'});}
 };
}
return {makeHandler,normalize,SOURCES,collectBulkFeed};
})();
export const {parseJob,collect}=templeton;
export const {normalize,SOURCES,collectBulkFeed}=bulk;
export function makeHandler(options={}) {
 const templetonHandler=templeton.makeHandler(options);
 const bulkHandler=bulk.makeHandler(options);
 return (req,res)=>{
  let body;
  try {body=typeof req.body==='string'?JSON.parse(req.body):req.body;} catch {return templetonHandler(req,res);}
  // Existing Templeton requests have no sponsor_id. Bulk requests include it.
  return body && typeof body==='object' && Object.hasOwn(body,'sponsor_id')
   ? bulkHandler(req,res) : templetonHandler(req,res);
 };
}
export default makeHandler();
