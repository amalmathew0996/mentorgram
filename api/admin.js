export const config = { runtime: "nodejs", maxDuration: 30 };

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "mentorgram-admin-2026";

export default async function handler(req, res) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Handle stats API call (POST with password in header)
  if (req.method === "POST") {
    const auth = req.headers["x-admin-password"];
    if (auth !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: "Unauthorised" });
    }
    const { action } = req.body || {};

    if (action === "delete") {
      await fetch(`${supabaseUrl}/rest/v1/jobs?id=neq.00000000-0000-0000-0000-000000000000`, {
        method: "DELETE",
        headers: { "apikey": serviceKey, "Authorization": `Bearer ${serviceKey}`, "Prefer": "return=minimal" },
      });
      return res.status(200).json({ success: true });
    }

    // Default: return stats
    const headers = { "apikey": serviceKey, "Authorization": `Bearer ${serviceKey}` };
    const now = new Date();
    const todayStart = new Date(now); todayStart.setHours(0,0,0,0);
    const yesterdayStart = new Date(todayStart); yesterdayStart.setDate(yesterdayStart.getDate()-1);

    const [t, r, a, j, g, tod, yes, newest, exp] = await Promise.all([
      fetch(`${supabaseUrl}/rest/v1/jobs?select=id`, { headers: { ...headers, "Prefer": "count=exact", "Range": "0-0" } }),
      fetch(`${supabaseUrl}/rest/v1/jobs?select=id&source=eq.Reed`, { headers: { ...headers, "Prefer": "count=exact", "Range": "0-0" } }),
      fetch(`${supabaseUrl}/rest/v1/jobs?select=id&source=eq.Adzuna`, { headers: { ...headers, "Prefer": "count=exact", "Range": "0-0" } }),
      fetch(`${supabaseUrl}/rest/v1/jobs?select=id&source=eq.jobs.ac.uk`, { headers: { ...headers, "Prefer": "count=exact", "Range": "0-0" } }),
      fetch(`${supabaseUrl}/rest/v1/jobs?select=id&source=eq.Guardian+Jobs`, { headers: { ...headers, "Prefer": "count=exact", "Range": "0-0" } }),
      fetch(`${supabaseUrl}/rest/v1/jobs?select=id&created_at=gte.${todayStart.toISOString()}`, { headers: { ...headers, "Prefer": "count=exact", "Range": "0-0" } }),
      fetch(`${supabaseUrl}/rest/v1/jobs?select=id&created_at=gte.${yesterdayStart.toISOString()}&created_at=lt.${todayStart.toISOString()}`, { headers: { ...headers, "Prefer": "count=exact", "Range": "0-0" } }),
      fetch(`${supabaseUrl}/rest/v1/jobs?select=created_at&order=created_at.desc&limit=1`, { headers }),
      fetch(`${supabaseUrl}/rest/v1/jobs?select=id&expires_at=lt.${new Date(Date.now()+3*24*60*60*1000).toISOString()}`, { headers: { ...headers, "Prefer": "count=exact", "Range": "0-0" } }),
    ]);

    const getCount = r => { const m = (r.headers.get("content-range")||"").match(/\/(\d+)/); return m ? parseInt(m[1]) : 0; };
    const newestData = await newest.json();
    const lastRefresh = newestData?.[0]?.created_at || null;
    const nextRefresh = lastRefresh ? new Date(new Date(lastRefresh).getTime() + 2*60*60*1000).toISOString() : null;

    return res.status(200).json({
      total: getCount(t),
      bySource: { reed: getCount(r), adzuna: getCount(a), jobsac: getCount(j), guardian: getCount(g) },
      addedToday: getCount(tod), addedYesterday: getCount(yes),
      expiringSoon: getCount(exp), lastRefresh, nextRefresh,
      serverTime: now.toISOString(),
    });
  }

  // GET — serve the HTML dashboard
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Admin — Mentorgram</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#0f0f11;color:#f0eff4;min-height:100vh}
#login{display:flex;align-items:center;justify-content:center;min-height:100vh}
.card{background:#1a1a1f;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:2.5rem 2rem;width:100%;max-width:360px}
.card h1{font-size:1.2rem;font-weight:600;margin-bottom:6px}
.card p{font-size:13px;color:#8b8a94;margin-bottom:1.5rem}
label{font-size:12px;font-weight:500;color:#8b8a94;display:block;margin-bottom:6px}
input[type=password]{width:100%;padding:11px 14px;border-radius:8px;border:1px solid rgba(255,255,255,0.08);background:#242429;color:#f0eff4;font-size:14px;outline:none;font-family:inherit;margin-bottom:12px}
input[type=password]:focus{border-color:#1A3FA8}
.btn{padding:11px 20px;border-radius:8px;border:none;font-size:14px;font-weight:500;cursor:pointer;font-family:inherit}
.btn:disabled{opacity:0.5;cursor:not-allowed}
.btn-primary{background:#1A3FA8;color:#fff;width:100%}
.btn-sm{padding:7px 14px;font-size:13px}
.btn-secondary{background:#242429;color:#f0eff4;border:1px solid rgba(255,255,255,0.08)}
.btn-danger{background:rgba(226,75,74,0.15);color:#E24B4A;border:1px solid rgba(226,75,74,0.3)}
.btn-green{background:#16A34A;color:#fff}
#dash{display:none}
.topbar{background:#1a1a1f;border-bottom:1px solid rgba(255,255,255,0.08);padding:0 1.5rem;height:58px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:10}
.topbar h1{font-size:15px;font-weight:600;margin-left:8px}
.badge{font-size:11px;background:rgba(26,63,168,0.2);color:#6b8cef;padding:2px 8px;border-radius:20px;margin-left:8px}
.wrap{max-width:960px;margin:0 auto;padding:2rem 1.5rem}
.alert{padding:10px 16px;border-radius:8px;font-size:13px;font-weight:500;margin-bottom:1.5rem}
.alert-ok{background:rgba(22,163,74,0.15);color:#4ade80;border:1px solid rgba(22,163,74,0.3)}
.alert-err{background:rgba(226,75,74,0.15);color:#f87171;border:1px solid rgba(226,75,74,0.3)}
.timing{background:#1a1a1f;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:1.25rem 1.5rem;margin-bottom:1.5rem;display:flex;gap:2rem;flex-wrap:wrap;align-items:center}
.ti label{font-size:11px;color:#8b8a94;font-weight:500;text-transform:uppercase;letter-spacing:.05em;display:block;margin-bottom:4px}
.ti .v{font-size:16px;font-weight:600}
.ti .s{font-size:11px;color:#8b8a94;margin-top:2px}
.sep{width:1px;height:40px;background:rgba(255,255,255,0.08)}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:1rem;margin-bottom:1.5rem}
.sc{background:#1a1a1f;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:1.25rem}
.sc .sl{font-size:12px;color:#8b8a94;font-weight:500;margin-bottom:8px}
.sc .sv{font-size:26px;font-weight:700;line-height:1;margin-bottom:4px}
.sc .ss{font-size:12px;color:#8b8a94}
.panel{background:#1a1a1f;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:1.5rem;margin-bottom:1.5rem}
.panel h2{font-size:12px;font-weight:600;color:#8b8a94;text-transform:uppercase;letter-spacing:.05em;margin-bottom:1.25rem}
.sr{margin-bottom:14px}
.sr-top{display:flex;justify-content:space-between;font-size:13px;margin-bottom:5px}
.sr-top span:first-child{font-weight:500}
.sr-top span:last-child{color:#8b8a94}
.track{height:6px;background:#242429;border-radius:4px;overflow:hidden}
.fill{height:100%;border-radius:4px;transition:width .8s cubic-bezier(.4,0,.2,1)}
.day-grid{display:grid;grid-template-columns:1fr 1fr;gap:1.5rem}
.day-item p{font-size:12px;color:#8b8a94;margin-bottom:6px}
.day-item .big{font-size:28px;font-weight:700;margin-top:6px}
.actions{display:flex;gap:10px;flex-wrap:wrap;align-items:center}
.confirm{display:none;margin-top:12px;padding:10px 14px;background:rgba(226,75,74,0.08);border:1px solid rgba(226,75,74,0.25);border-radius:8px;align-items:center;gap:8px;flex-wrap:wrap}
.confirm span{font-size:13px;color:#E24B4A;font-weight:500}
.foot{font-size:12px;color:#8b8a94;margin-top:1rem;line-height:1.6}
.err{color:#f87171;font-size:12px;margin:-8px 0 10px;display:none}
@keyframes spin{to{transform:rotate(360deg)}}
.spin{display:inline-block;animation:spin 1s linear infinite}
</style>
</head>
<body>
<div id="login">
  <div class="card">
    <div style="text-align:center;margin-bottom:1.5rem">
      <div style="font-size:36px;margin-bottom:10px">🔐</div>
      <h1>Admin Dashboard</h1>
      <p>Mentorgram AI · Internal only</p>
    </div>
    <label>Password</label>
    <input type="password" id="pw" placeholder="Enter admin password" onkeydown="if(event.key==='Enter')login()"/>
    <p class="err" id="perr">Incorrect password</p>
    <button class="btn btn-primary" id="lbtn" onclick="login()">Sign in →</button>
  </div>
</div>

<div id="dash">
  <div class="topbar">
    <div style="display:flex;align-items:center">
      <span style="font-size:20px">⚙️</span>
      <h1>Admin Dashboard</h1>
      <span class="badge">Mentorgram AI</span>
    </div>
    <div style="display:flex;gap:8px">
      <button class="btn btn-sm btn-secondary" onclick="loadStats()">↻ Refresh</button>
      <button class="btn btn-sm btn-secondary" onclick="signOut()">Sign out</button>
    </div>
  </div>
  <div class="wrap">
    <div id="msg" style="display:none"></div>
    <div class="timing">
      <div class="ti"><label>Last refresh</label><div class="v" id="lr" style="color:#4ade80">—</div><div class="s" id="lrf">—</div></div>
      <div class="sep"></div>
      <div class="ti"><label>Next scheduled</label><div class="v" id="nr" style="color:#6b8cef">—</div><div class="s">Every 2 hours</div></div>
      <div class="sep"></div>
      <div class="ti"><label>Server time</label><div class="v" id="st">—</div><div class="s">UTC</div></div>
      <div style="margin-left:auto;text-align:right"><p style="font-size:11px;color:#8b8a94">Expiring in 3 days</p><p id="exp" style="font-size:18px;font-weight:700">—</p></div>
    </div>
    <div class="grid">
      <div class="sc"><div class="sl">💼 Total jobs</div><div class="sv" id="s0" style="color:#6b8cef">—</div><div class="ss">In Supabase now</div></div>
      <div class="sc"><div class="sl">📅 Added today</div><div class="sv" id="s1" style="color:#4ade80">—</div><div class="ss" id="s1s">Yesterday: —</div></div>
      <div class="sc"><div class="sl">🔴 Reed</div><div class="sv" id="s2" style="color:#f472b6">—</div><div class="ss" id="s2s">—</div></div>
      <div class="sc"><div class="sl">🟢 Adzuna</div><div class="sv" id="s3" style="color:#4ade80">—</div><div class="ss" id="s3s">—</div></div>
      <div class="sc"><div class="sl">📡 RSS feeds</div><div class="sv" id="s4" style="color:#fbbf24">—</div><div class="ss">jobs.ac.uk + Guardian</div></div>
    </div>
    <div class="panel">
      <h2>Jobs by source</h2>
      <div class="sr"><div class="sr-top"><span>Reed</span><span id="br">—</span></div><div class="track"><div class="fill" id="fr" style="width:0%;background:#f472b6"></div></div></div>
      <div class="sr"><div class="sr-top"><span>Adzuna</span><span id="ba">—</span></div><div class="track"><div class="fill" id="fa" style="width:0%;background:#4ade80"></div></div></div>
      <div class="sr"><div class="sr-top"><span>jobs.ac.uk</span><span id="bj">—</span></div><div class="track"><div class="fill" id="fj" style="width:0%;background:#6b8cef"></div></div></div>
      <div class="sr"><div class="sr-top"><span>Guardian Jobs</span><span id="bg">—</span></div><div class="track"><div class="fill" id="fg" style="width:0%;background:#fbbf24"></div></div></div>
    </div>
    <div class="panel">
      <h2>Jobs added</h2>
      <div class="day-grid">
        <div class="day-item"><p>Today</p><div class="track"><div class="fill" id="ft" style="width:0%;background:#4ade80"></div></div><div class="big" id="dt" style="color:#4ade80">—</div></div>
        <div class="day-item"><p>Yesterday</p><div class="track"><div class="fill" id="fy" style="width:0%;background:#6b8cef"></div></div><div class="big" id="dy" style="color:#6b8cef">—</div></div>
      </div>
    </div>
    <div class="panel">
      <h2>Actions</h2>
      <div class="actions">
        <button class="btn btn-green" id="rbtn" onclick="triggerRefresh()">↻ Trigger refresh now</button>
        <button class="btn btn-danger" onclick="document.getElementById('cdel').style.display='flex'">🗑 Delete all jobs</button>
      </div>
      <div class="confirm" id="cdel">
        <span id="ctxt">Are you sure?</span>
        <button class="btn btn-sm btn-danger" id="dbtn" onclick="deleteAll()">Yes, delete all</button>
        <button class="btn btn-sm btn-secondary" onclick="document.getElementById('cdel').style.display='none'">Cancel</button>
      </div>
      <p class="foot">Manual refresh runs the current rotation group (~20 Adzuna calls). Auto-refresh every 2 hours via Vercel cron. Daily budget: ~120 Adzuna calls (limit: 250).</p>
    </div>
    <p style="text-align:center;font-size:11px;color:#8b8a94;margin-top:1rem">Stats auto-refresh every 30s · Mentorgram Admin</p>
  </div>
</div>

<script>
const PW_KEY='mg_admin_pw';
let pw=sessionStorage.getItem(PW_KEY)||'';
let ticker=null;
if(pw)attempt(pw);
async function login(){
  const v=document.getElementById('pw').value.trim();
  if(!v)return;
  attempt(v);
}
async function attempt(p){
  const btn=document.getElementById('lbtn');
  btn.disabled=true;btn.textContent='Signing in...';
  try{
    const r=await fetch('/api/admin',{method:'POST',headers:{'Content-Type':'application/json','x-admin-password':p},body:JSON.stringify({action:'stats'})});
    if(r.status===401){
      document.getElementById('perr').style.display='block';
      sessionStorage.removeItem(PW_KEY);pw='';
      btn.disabled=false;btn.textContent='Sign in →';return;
    }
    const d=await r.json();
    pw=p;sessionStorage.setItem(PW_KEY,p);
    document.getElementById('login').style.display='none';
    document.getElementById('dash').style.display='block';
    render(d);
    ticker=setInterval(loadStats,30000);
  }catch(e){btn.disabled=false;btn.textContent='Sign in →';}
}
async function loadStats(){
  try{
    const r=await fetch('/api/admin',{method:'POST',headers:{'Content-Type':'application/json','x-admin-password':pw},body:JSON.stringify({action:'stats'})});
    if(r.status===401){signOut();return;}
    render(await r.json());
  }catch{}
}
function fmt(n){return(n||0).toLocaleString();}
function ago(iso){if(!iso)return'Never';const d=Date.now()-new Date(iso).getTime(),m=Math.floor(d/60000),h=Math.floor(d/3600000);if(m<1)return'Just now';if(m<60)return m+'m ago';if(h<24)return h+'h ago';return Math.floor(h/24)+'d ago';}
function until(iso){if(!iso)return'Unknown';const d=new Date(iso).getTime()-Date.now();if(d<0)return'Overdue';const m=Math.floor(d/60000),h=Math.floor(d/3600000);if(m<60)return'in '+m+'m';return'in '+h+'h '+Math.floor((d%3600000)/60000)+'m';}
function pct(n,t){return t>0?Math.round((n/t)*100):0;}
function render(s){
  const total=s.total||0,reed=s.bySource?.reed||0,az=s.bySource?.adzuna||0,jac=s.bySource?.jobsac||0,grd=s.bySource?.guardian||0,rss=jac+grd,tod=s.addedToday||0,yes=s.addedYesterday||0,mx=Math.max(tod,yes,1);
  document.getElementById('lr').textContent=ago(s.lastRefresh);
  document.getElementById('lrf').textContent=s.lastRefresh?new Date(s.lastRefresh).toLocaleString('en-GB'):'—';
  document.getElementById('nr').textContent=until(s.nextRefresh);
  document.getElementById('st').textContent=s.serverTime?new Date(s.serverTime).toLocaleTimeString('en-GB'):'—';
  document.getElementById('exp').textContent=fmt(s.expiringSoon);
  document.getElementById('s0').textContent=fmt(total);
  document.getElementById('s1').textContent=fmt(tod);
  document.getElementById('s1s').textContent='Yesterday: '+fmt(yes);
  document.getElementById('s2').textContent=fmt(reed);
  document.getElementById('s2s').textContent=pct(reed,total)+'% of total';
  document.getElementById('s3').textContent=fmt(az);
  document.getElementById('s3s').textContent=pct(az,total)+'% of total';
  document.getElementById('s4').textContent=fmt(rss);
  document.getElementById('br').textContent=fmt(reed)+' ('+pct(reed,total)+'%)';
  document.getElementById('ba').textContent=fmt(az)+' ('+pct(az,total)+'%)';
  document.getElementById('bj').textContent=fmt(jac)+' ('+pct(jac,total)+'%)';
  document.getElementById('bg').textContent=fmt(grd)+' ('+pct(grd,total)+'%)';
  document.getElementById('fr').style.width=pct(reed,total)+'%';
  document.getElementById('fa').style.width=pct(az,total)+'%';
  document.getElementById('fj').style.width=pct(jac,total)+'%';
  document.getElementById('fg').style.width=pct(grd,total)+'%';
  document.getElementById('dt').textContent=fmt(tod);
  document.getElementById('dy').textContent=fmt(yes);
  document.getElementById('ft').style.width=pct(tod,mx)+'%';
  document.getElementById('fy').style.width=pct(yes,mx)+'%';
  document.getElementById('ctxt').textContent='Are you sure? This deletes all '+fmt(total)+' jobs.';
}
async function triggerRefresh(){
  const btn=document.getElementById('rbtn');
  btn.disabled=true;btn.innerHTML='<span class="spin">⟳</span> Refreshing...';
  showMsg('','');
  try{
    const r=await fetch('/api/refresh-jobs',{headers:{'Authorization':'Bearer mg_cron_2026'}});
    const d=await r.json();
    if(d.success){showMsg('ok','✅ Done — '+d.inserted+' jobs inserted, '+d.total+' total');loadStats();}
    else showMsg('err','❌ Failed: '+(d.error||'Unknown'));
  }catch(e){showMsg('err','❌ '+e.message);}
  btn.disabled=false;btn.textContent='↻ Trigger refresh now';
}
async function deleteAll(){
  const btn=document.getElementById('dbtn');
  btn.disabled=true;btn.textContent='Deleting...';
  try{
    const r=await fetch('/api/admin',{method:'POST',headers:{'Content-Type':'application/json','x-admin-password':pw},body:JSON.stringify({action:'delete'})});
    const d=await r.json();
    if(d.success){showMsg('ok','✅ All jobs deleted');document.getElementById('cdel').style.display='none';loadStats();}
    else showMsg('err','❌ '+(d.error||'Unknown'));
  }catch(e){showMsg('err','❌ '+e.message);}
  btn.disabled=false;btn.textContent='Yes, delete all';
}
function showMsg(t,m){const el=document.getElementById('msg');if(!m){el.style.display='none';return;}el.className='alert alert-'+(t==='ok'?'ok':'err');el.textContent=m;el.style.display='block';setTimeout(()=>el.style.display='none',7000);}
function signOut(){sessionStorage.removeItem(PW_KEY);pw='';clearInterval(ticker);document.getElementById('dash').style.display='none';document.getElementById('login').style.display='flex';document.getElementById('pw').value='';}
</script>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html");
  return res.status(200).send(html);
}
