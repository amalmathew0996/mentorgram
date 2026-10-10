import {createHash,timingSafeEqual} from 'node:crypto';
export const config={runtime:'nodejs',maxDuration:60};
export const SOURCES=[
  {
    "id": 7314,
    "name": "Amplitude Analytics Limited",
    "careers_url": "https://amplitude.com/careers",
    "platform": "ashby",
    "board": "amplitude",
    "brand": "Amplitude"
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
    "id": 20787,
    "name": "Canonical UK Limited",
    "careers_url": "https://canonical.com/careers",
    "platform": "greenhouse",
    "board": "canonical",
    "brand": "Canonical"
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
    "id": 25081,
    "name": "Cleo AI Ltd",
    "careers_url": "https://web.meetcleo.com/careers",
    "platform": "ashby",
    "board": "cleo-2",
    "brand": "Cleo"
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
    "id": 74493,
    "name": "Monzo Bank Ltd",
    "careers_url": "https://monzo.com/careers",
    "platform": "greenhouse",
    "board": "monzo",
    "brand": "Monzo"
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
  }
];
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
 if(url.protocol!=='https:'||!['boards.greenhouse.io','job-boards.greenhouse.io'].includes(url.hostname)||url.username||url.password||url.pathname!==`/${c.board}/jobs/${id}`)throw Error('Unexpected Greenhouse job URL');
 // Keep the exact URL convention used by the original bulk import, including Figma's query.
 return c.board==='figma'?`https://boards.greenhouse.io/figma/jobs/${id}?gh_jid=${id}`:`https://job-boards.greenhouse.io/${c.board}/jobs/${id}`;
}
export function normalize(c,data,now=Date.now()){
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
  if(c.platform==='greenhouse'&&j.company_name!==c.brand)throw Error('Source brand changed');
  const title=clean(j.title);if(!title||title.length>500)throw Error('Invalid title');
  const deadline=c.platform==='greenhouse'?date(j.application_deadline):null;
  if(deadline!==null&&deadline<=now){closed.push(url);continue;}
  if(/talent (?:pool|community|network)|general application|expression of interest|future opportunit/i.test(title))continue;
  let locations=[];
  if(c.platform==='ashby'){
   if(!Array.isArray(j.secondaryLocations))throw Error('Missing secondary locations');
   for(const l of [{location:j.location,address:j.address},...j.secondaryLocations]){
    const a=l.address?.postalAddress||l.address||{};
    if(country(a.addressCountry))locations.push(clean(l.location)||'United Kingdom');
   }
  }else{
   if(typeof j.location?.name!=='string')throw Error('Missing location');
   locations=j.location.name.split(/;| • /).filter(ukText).map(clean);
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
export function makeHandler({fetchImpl=fetch,env=process.env,now=()=>Date.now()}={}){
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
   const feed=c.platform==='ashby'?`https://api.ashbyhq.com/posting-api/job-board/${c.board}`:`https://boards-api.greenhouse.io/v1/boards/${c.board}/jobs?content=true`;
   const result=normalize(c,await request(feed),now());
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
export default makeHandler();
