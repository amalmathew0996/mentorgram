import { useEffect, useRef, useState } from "react";
import { splitTerms, matchJobs, jobSource } from "./jobWatchUtils.js";

import { jobKey, countdown, nextScheduleTime, recordDiscovery } from "./jobWatchDisplay.js";

const SUPA_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPA_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

function getToken() {
  try {
    return JSON.parse(
      localStorage.getItem("mg_session") || "{}"
    ).access_token;
  } catch {
    return null;
  }
}

let refreshPromise;
async function refreshSession(failedToken) {
  if (getToken() && getToken() !== failedToken) return;
  if (!refreshPromise) {
    refreshPromise = (async () => {
      let session;
      try { session = JSON.parse(localStorage.getItem("mg_session") || "{}"); } catch { session = {}; }
      if (!session.refresh_token) throw new Error("Your session expired. Please sign out and sign in again, then retry.");
      const response = await fetch(`${SUPA_URL}/auth/v1/token?grant_type=refresh_token`, {
        method: "POST", headers: { apikey: SUPA_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: session.refresh_token }), signal: AbortSignal.timeout(10000),
      });
      const data = await response.json();
      if (!response.ok || !data.access_token) throw new Error("Your session expired. Please sign out and sign in again, then retry.");
      const current = JSON.parse(localStorage.getItem("mg_session") || "{}");
      if (current.refresh_token !== session.refresh_token) throw new Error("Your login changed. Reload this page before continuing.");
      localStorage.setItem("mg_session", JSON.stringify({ ...session, ...data }));
    })().finally(() => { refreshPromise = null; });
  }
  await refreshPromise;
}
async function authorizedFetch(url, opts = {}) {
  const token = getToken();
  const send = () => fetch(url, { ...opts, headers: { ...opts.headers, Authorization: `Bearer ${getToken() || SUPA_KEY}` } });
  let response = await send();
  if (response.status === 401) { await refreshSession(token); response = await send(); }
  return response;
}
async function supaFetch(path, opts = {}) {
  const res = await authorizedFetch(`${SUPA_URL}/rest/v1${path}`, {
    ...opts, headers: { "Content-Type": "application/json", apikey: SUPA_KEY, Prefer: "return=representation", ...(opts.headers || {}) },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(res.status === 401 ? "Your session expired. Please sign out and sign in again." : err.message || err.error_description || "Request failed");
  }
  return res.status === 204 ? null : res.json();
}

const SOURCES = [
  ["nhs_jobs", "NHS Jobs"],
  ["trac", "Trac Jobs"],
  ["nhs_scotland", "NHS Scotland"],
  ["jobs_ac_uk", "jobs.ac.uk"],
];

const card = {
  background: "var(--color-background-primary)",
  border: "0.5px solid var(--color-border-tertiary)",
  borderRadius: "var(--border-radius-lg)",
  padding: "1.5rem",
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "11px 14px",
  borderRadius: "var(--border-radius-md)",
  border: "0.5px solid var(--color-border-secondary)",
  background: "var(--color-background-secondary)",
  color: "var(--color-text-primary)",
  fontSize: "14px",
  fontFamily: "inherit",
  outline: "none",
};

export default function JobWatch({ user }) {
  const [clockNow, setClockNow] = useState(Date.now());
  const [removedKeys, setRemovedKeys] = useState([]);
  const [newKeys, setNewKeys] = useState([]);
  const [showRemoved, setShowRemoved] = useState(false);
  const [jobNotice, setJobNotice] = useState("");
  const seenJobs = useRef({});
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(`mg_job_watch_display_${user.id}`) || "{}");
      setRemovedKeys(Array.isArray(saved.removed) ? saved.removed : []);
      seenJobs.current = saved.seen && typeof saved.seen === "object" ? saved.seen : {};
    } catch { seenJobs.current = {}; setRemovedKeys([]); }
    const timer = setInterval(() => setClockNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [user.id]);
  function storeDisplay(removed, seen) {
    try { localStorage.setItem(`mg_job_watch_display_${user.id}`, JSON.stringify({ removed, seen })); }
    catch { setJobNotice("Changes could not be saved in this browser and may reset after refresh."); }
  }
  function discoverJobs(jobs, run, previous = []) {
    const discovery = recordDiscovery(seenJobs.current, jobs, run, previous);
    seenJobs.current = discovery.seen;
    setNewKeys(discovery.newKeys);
    let removed = [];
    try { removed = JSON.parse(localStorage.getItem(`mg_job_watch_display_${user.id}`) || "{}").removed || []; } catch {}
    storeDisplay(removed, discovery.seen);
  }
  function removeJob(job, restore = false) {
    const key = jobKey(job);
    const next = restore ? removedKeys.filter(item => item !== key) : [...new Set([...removedKeys, key])];
    setRemovedKeys(next); storeDisplay(next, seenJobs.current);
    setJobNotice(restore ? "Job restored." : "Job removed. Find it under Removed jobs to restore it.");
  }
  const [jobTitles, setJobTitles] = useState("");
  const [titleDraft, setTitleDraft] = useState("");
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [nextRun, setNextRun] = useState("");
  const [savedSchedule, setSavedSchedule] = useState(null);
  const [runStatus, setRunStatus] = useState("");
  const [resultKind, setResultKind] = useState("");
  const [storageNotice, setStorageNotice] = useState("");
  const resultsStarted = useRef(0);
  const titleList = () => splitTerms([jobTitles, titleDraft].filter(Boolean).join(","));
  function addTitles() {
    const values = titleList();
    if (values.length > 10) { setError("Add up to ten job titles, including your profile title."); return; }
    setJobTitles(values.join(", "));
    setTitleDraft("");
    setError("");
  }
  const [locations, setLocations] = useState("");
  const [sponsorshipRequired, setSponsorshipRequired] =
    useState(false);

  const [sources, setSources] = useState([
    "nhs_jobs",
    "trac",
    "nhs_scotland",
    "jobs_ac_uk",
  ]);

  const [isActive, setIsActive] = useState(true);
  const [frequency, setFrequency] = useState("daily");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [running, setRunning] = useState(false);
  const [results, setResults] = useState(null);
  const [searchError, setSearchError] = useState("");
  const [warnings, setWarnings] = useState([]);
  const [lastRun, setLastRun] = useState("");
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState("results");
  const [searchSummary, setSearchSummary] = useState("");
  const runController = useRef(null);
  const [customSites, setCustomSites] = useState([]);
  const [newSite, setNewSite] = useState("");
  const [siteError, setSiteError] = useState("");
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(`mg_job_watch_sites_${user.id}`) || "[]");
      setCustomSites(Array.isArray(stored) ? stored.filter(site => {
        try { const url = new URL(site.url); return url.protocol === "https:" && !url.username && !url.password; } catch { return false; }
      }).slice(0, 5) : []);
    } catch { setCustomSites([]); }
  }, [user.id]);
  function updateSites(next) {
    try {
      localStorage.setItem(`mg_job_watch_sites_${user.id}`, JSON.stringify(next));
      setCustomSites(next);
      setSiteError("");
      return true;
    } catch { setSiteError("Your browser could not save these sites. Check its storage settings."); return false; }
  }
  function addSite(event) {
    event.preventDefault();
    try {
      const url = new URL(newSite.trim().includes("://") ? newSite.trim() : `https://${newSite.trim()}`);
      if (url.protocol !== "https:" || url.username || url.password || (url.port && url.port !== "443") || url.href.length > 2000 || !url.hostname.includes(".")) throw new Error("Enter a public HTTPS careers page or RSS feed URL.");
      url.hash = "";
      if (customSites.some(site => site.url === url.href)) throw new Error("This site is already added.");
      if (customSites.length >= 5) throw new Error("You can add up to five sites. Remove one before adding another.");
      if (updateSites([...customSites, { url: url.href, enabled: true }])) setNewSite("");
    } catch (error) { setSiteError(error.message); }
  }


  useEffect(() => () => runController.current?.abort(), [user?.id]);

  async function runNow() {
    if (runController.current) return;
    setTab("results");
    if (!sources.length && !customSites.some(site => site.enabled)) { setSearchError("Select at least one job source."); return; }
    const startedAt = new Date().toISOString();
    const controller = new AbortController();
    runController.current = controller;
    const timeout = setTimeout(() => controller.abort(), 45000);
    setRunning(true);
    setSearchError("");
    setWarnings([]);
    setPage(1);
    setTab("results");
    try {
      let profile = {};
      const notices = [];
      try {
        const rows = await supaFetch(`/profiles?user_id=eq.${encodeURIComponent(user.id)}&select=job_title,preferred_location`, { signal: controller.signal });
        profile = rows?.[0] || {};
      } catch {
        if (controller.signal.aborted) throw new Error("Search timed out. Please try again.");
        notices.push("Your profile could not be loaded. This search uses the fields below only.");
      }
      const titles = splitTerms([profile.job_title, ...titleList()].filter(Boolean).join(","));
      const places = splitTerms([profile.preferred_location, locations].filter(Boolean).join(","));
      if (!titles.length) throw new Error("Enter at least one job title, or add a target job title to your profile.");
      if (titles.length > 10) throw new Error("Use up to ten distinct job titles including your profile title.");
      const filters = { titles, locations: places, sources: [...sources], sponsorshipRequired, customSites: customSites.filter(site => site.enabled).map(site => site.url) };
      const readJobs = async path => {
        const response = await authorizedFetch(path, { signal: controller.signal, cache: "no-store", headers: getToken() ? { Authorization: `Bearer ${getToken()}` } : {} });
        if (!response.ok) throw new Error("Search service unavailable");
        const data = await response.json();
        if (data.error || !Array.isArray(data.jobs)) throw new Error(data.error || "Invalid search response");
        return data;
      };
      const queries = await Promise.allSettled([
        readJobs(`/api/live-jobs?source=job-watch&sources=${encodeURIComponent(filters.sources.join(","))}&titles=${encodeURIComponent(titles.join(","))}&sites=${encodeURIComponent(JSON.stringify(filters.customSites))}`),
        readJobs("/api/jobs-db"),
      ]);
      if (controller.signal.aborted) throw new Error("Search timed out. Please try again.");
      if (queries.every(r => r.status === "rejected")) throw new Error("Job search is unavailable right now. Please try again.");
      const jobs = [];
      queries.forEach((result, index) => {
        if (result.status === "fulfilled") {
          jobs.push(...result.value.jobs.map(job => ({ ...job, origin: index === 0 ? "live" : "stored" })));
          notices.push(...(result.value.warnings || []));
          if (index === 1 && result.value.total > result.value.jobs.length) notices.push("Only part of the stored jobs database was returned; results may be incomplete.");
        } else notices.push(index === 0 ? `Live search failed: ${result.reason.message}. Showing stored listings only.` : "Stored listings are unavailable. Showing live results only.");
      });
      const matches = matchJobs(jobs, filters);
      if (matches.length > 200) notices.push("Showing the first 200 matches. Narrow your titles or locations for fewer results.");
      const summary = `${titles.join(", ")} · ${places.join(", ") || "All locations"}${sponsorshipRequired ? " · Sponsorship indicated only" : ""}`;
      const completedAt = new Date().toISOString();
      discoverJobs(matches.slice(0, 200), startedAt, results || []);
      setResults(matches.slice(0, 200));
      setWarnings(notices);
      setSearchSummary(summary);
      setLastRun(completedAt);
      setResultKind("Manual");
      resultsStarted.current = Date.parse(startedAt);
      try {
        await supaFetch("/job_watch_runs", { method: "POST", body: JSON.stringify({ user_id: user.id, run_kind: "manual", status: "complete", started_at: startedAt, completed_at: completedAt, jobs: matches.slice(0, 200), warnings: notices, summary }) });
        setStorageNotice("");
      } catch {
        setStorageNotice("Results are visible here but could not be saved. Complete the scheduling database setup to keep them after refresh.");
      }
    } catch (e) {
      setSearchError(controller.signal.aborted ? "Search timed out or was cancelled. Please try again." : e.message);
    } finally {
      clearTimeout(timeout);
      runController.current = null;
      setRunning(false);
    }
  }

  useEffect(() => {
    if (user?.id) {
      loadPreferences();
    }
  }, [user?.id]);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      if (runController.current) return;
      try {
        const [latest, successful, prefs] = await Promise.all([
          supaFetch(`/job_watch_runs?user_id=eq.${user.id}&select=status,error,started_at,run_kind&order=started_at.desc&limit=1`),
          supaFetch(`/job_watch_runs?user_id=eq.${user.id}&status=eq.complete&select=*&order=started_at.desc&limit=2`),
          supaFetch(`/job_watch_preferences?user_id=eq.${user.id}&select=schedule_enabled,next_run_at,check_frequency&limit=1`),
        ]);
        if (!active || runController.current) return;
        setSavedSchedule(prefs?.[0] || null);
        const attempt = latest?.[0];
        setRunStatus(attempt?.status === "failed" ? `Last ${attempt.run_kind} search failed: ${attempt.error || "Please try again."}` : attempt?.status === "running" ? (Date.now() - Date.parse(attempt.started_at) > 180000 ? "The last scheduled search was interrupted. It will be retried automatically." : "A scheduled search is running. Results will update here.") : "");
        const run = successful?.[0];
        if (run && Date.parse(run.started_at) > resultsStarted.current) {
          discoverJobs(run.jobs || [], run.started_at, successful?.[1]?.jobs || []);
          setResults(run.jobs || []);
          setWarnings(run.warnings || []);
          setSearchSummary(run.summary || "");
          setLastRun(run.completed_at);
          setResultKind(run.run_kind === "scheduled" ? "Scheduled" : "Manual");
          setPage(1);
          resultsStarted.current = Date.parse(run.started_at);
        }
      } catch {
        if (active) setStorageNotice("Saved results and schedules are unavailable. Complete the one-time Supabase setup, or check your connection.");
      }
    };
    refresh();
    const interval = setInterval(refresh, 60000);
    return () => { active = false; clearInterval(interval); };
  }, [user.id]);

  async function loadPreferences() {
    setLoading(true);
    setError("");

    try {
      const data = await supaFetch(
        `/job_watch_preferences?user_id=eq.${user.id}&select=*`
      );

      if (data?.length) {
        const pref = data[0];

        setJobTitles(
          (pref.additional_job_titles || []).join(", ")
        );

        setLocations(
          (pref.additional_locations || []).join(", ")
        );

        setSponsorshipRequired(
          pref.sponsorship_required || false
        );

        setSources(
          pref.sources || [
            "nhs_jobs",
            "trac",
            "nhs_scotland",
            "jobs_ac_uk",
          ]
        );

        setIsActive(pref.is_active !== false);
        setFrequency(pref.check_frequency || "daily");
        setScheduleEnabled(pref.schedule_enabled === true);
        setNextRun(pref.next_run_at || "");
        setSavedSchedule({ schedule_enabled: pref.schedule_enabled, next_run_at: pref.next_run_at, check_frequency: pref.check_frequency });
        if (Array.isArray(pref.custom_sites)) setCustomSites(pref.custom_sites);
      }
    } catch (e) {
      setError(e.message);
    }

    setLoading(false);
  }

  function toggleSource(source) {
    setSources((current) =>
      current.includes(source)
        ? current.filter((item) => item !== source)
        : [...current, source]
    );
  }

  async function savePreferences() {
    if (titleList().length > 10) { setError("Use up to ten job titles."); return; }
    if (scheduleEnabled && !sources.length && !customSites.some(site => site.enabled)) { setError("Choose at least one source before enabling your schedule."); return; }
    setSaving(true);
    setSaved(false);
    setError("");

    const payload = {
      user_id: user.id,

      additional_job_titles: titleList(),

      additional_locations: splitTerms(locations),

      sponsorship_required: sponsorshipRequired,
      sources,
      is_active: isActive,
      schedule_enabled: scheduleEnabled,
      custom_sites: customSites,
      next_run_at: nextScheduleTime(scheduleEnabled, frequency, nextRun, savedSchedule),
      check_frequency: frequency,
      updated_at: new Date().toISOString(),
    };

    try {
      const existing = await supaFetch(
        `/job_watch_preferences?user_id=eq.${user.id}&select=id`
      );

      if (existing?.length) {
        await supaFetch(
          `/job_watch_preferences?user_id=eq.${user.id}`,
          {
            method: "PATCH",
            body: JSON.stringify(payload),
          }
        );
      } else {
        await supaFetch("/job_watch_preferences", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      setSaved(true);
      setJobTitles(titleList().join(", "));
      setTitleDraft("");
      setNextRun(payload.next_run_at || "");
      setSavedSchedule({ schedule_enabled: scheduleEnabled, next_run_at: payload.next_run_at, check_frequency: frequency });
      setStorageNotice("");

      setTimeout(() => {
        setSaved(false);
      }, 3000);
    } catch (e) {
      setError(e.message);
    }

    setSaving(false);
  }

  const displayedJobs = (results || []).filter(job => showRemoved ? removedKeys.includes(jobKey(job)) : !removedKeys.includes(jobKey(job)));
  const visibleNewCount = (results || []).filter(job => !removedKeys.includes(jobKey(job)) && newKeys.includes(jobKey(job))).length;
  const currentTotalPages = Math.max(1, Math.ceil(displayedJobs.length / 6));
  useEffect(() => { setPage(p => Math.min(p, currentTotalPages)); }, [currentTotalPages]);

  if (loading) {
    return (
      <div
        style={{
          padding: "4rem",
          textAlign: "center",
          color: "var(--color-text-secondary)",
        }}
      >
        Loading Job Watch...
      </div>
    );
  }

  const button = { padding: "10px 16px", border: "1px solid var(--color-border-secondary)", borderRadius: "8px", background: "var(--color-background-secondary)", color: "var(--color-text-primary)", cursor: "pointer", fontFamily: "inherit" };
  const pageSize = 6;
  const totalPages = currentTotalPages;
  return (
    <div className="jw" style={{ maxWidth: "1150px", margin: "0 auto", padding: "20px 16px" }}>
      <style>{`
        .jw-row { display:flex; gap:10px; align-items:center; flex-wrap:wrap; }
        .jw-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; }
        .jw label { font-size:13px; }
        .jw summary { cursor:pointer; }
        .jw button:disabled, .jw input:disabled { opacity:.45; cursor:not-allowed; }
        .jw input:focus-visible, .jw button:focus-visible, .jw a:focus-visible { outline:2px solid #729fff; outline-offset:3px; }
        @media(max-width:650px) { .jw-grid { grid-template-columns:1fr; } }
      `}</style>
      <div className="jw-row" style={{ justifyContent: "space-between", marginBottom: "14px" }}>
        <div><h1 style={{ fontSize: "1.6rem" }}>Job Watch</h1><p style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>Find jobs and open the listings here.</p></div>
        <button onClick={runNow} disabled={running} style={{ ...button, background: "#1A3FA8", color: "white", borderColor: "#1A3FA8" }}>{running ? "Searching…" : "Run now"}</button>
      </div>
      <div className="jw-grid" style={{ marginBottom: "12px" }}>
        <div>
          <label htmlFor="jw-title">Job titles — add more than one</label>
          <div className="jw-row" style={{ marginTop: "4px", flexWrap: "nowrap" }}><input id="jw-title" style={inputStyle} value={titleDraft} onChange={e => setTitleDraft(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTitles(); } }} placeholder="IT Support, Service Desk Analyst" /><button style={button} onClick={addTitles}>Add</button></div>
          <div className="jw-row" style={{ marginTop: "6px", gap: "5px" }}>{splitTerms(jobTitles).map(title => <button key={title} style={{ ...button, padding: "4px 8px", fontSize: "12px" }} aria-label={`Remove title ${title}`} onClick={() => setJobTitles(splitTerms(jobTitles).filter(t => t !== title).join(", "))}>{title} ×</button>)}</div>
        </div>
        <label>Additional locations<input style={{ ...inputStyle, marginTop: "4px" }} value={locations} onChange={e => setLocations(e.target.value)} placeholder="Leicester, Nottingham, Remote" /></label>
      </div>
      <div className="jw-row" style={{ marginBottom: "14px", justifyContent: "space-between" }}>
        <label className="jw-row"><input type="checkbox" checked={sponsorshipRequired} onChange={e => setSponsorshipRequired(e.target.checked)} />Sponsorship required</label>
        <button onClick={savePreferences} disabled={saving} style={button}>{saving ? "Saving…" : saved ? "✓ Saved" : "Save preferences"}</button>
      </div>
      {error && <p role="alert" style={{ marginBottom: "12px", color: "#e06060" }}>{error}</p>}
      <div className="jw-row" role="tablist" aria-label="Job Watch" style={{ borderBottom: "1px solid var(--color-border-tertiary)", paddingBottom: "10px", marginBottom: "14px" }}>
        {[["results", "Jobs"], ["schedule", "Schedule"], ["sources", "Sites & settings"]].map(([id, label]) => <button key={id} id={`jw-tab-${id}`} role="tab" aria-selected={tab === id} aria-controls={`jw-panel-${id}`} onClick={() => setTab(id)} style={{ ...button, background: tab === id ? "#1A3FA8" : button.background, color: tab === id ? "white" : button.color }}>{label}{id === "results" && results ? ` (${(results || []).filter(job => !removedKeys.includes(jobKey(job))).length})` : ""}</button>)}
      </div>
      <section id="jw-panel-sources" role="tabpanel" aria-labelledby="jw-tab-sources" hidden={tab !== "sources"}>
        <div style={{ ...card, padding: "16px" }}>
          <h2 style={{ fontSize: "1.1rem", marginBottom: "12px" }}>Job sources</h2>
          <div className="jw-row">{SOURCES.map(([value, label]) => <label className="jw-row" key={value}><input type="checkbox" checked={sources.includes(value)} onChange={() => toggleSource(value)} />{label}</label>)}</div>
          <p style={{ marginTop: "12px", fontSize: "13px", color: "var(--color-text-secondary)" }}>NHS Jobs and jobs.ac.uk are searched live when available. Trac and NHS Scotland use stored listings.</p>
        </div>
        <div style={{ ...card, padding: "16px", marginTop: "12px" }}>
          <h2 style={{ fontSize: "1.1rem", marginBottom: "8px" }}>Your sites</h2>
          <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", marginBottom: "12px" }}>Add a careers page or jobs RSS feed. Supported listings join your results when you click Run now. Click Save preferences to include these sites in automatic searches and sync them with your account.</p>
          <form className="jw-row" onSubmit={addSite}>
            <label style={{ flex: "1 1 250px" }}>Site or feed URL<input style={{ ...inputStyle, marginTop: "4px" }} value={newSite} onChange={e => setNewSite(e.target.value)} placeholder="https://company.com/careers" required /></label>
            <button type="submit" style={button}>Add site</button>
          </form>
          {siteError && <p role="alert" style={{ color: "#e06060", marginTop: "8px" }}>{siteError}</p>}
          {customSites.map(site => <div key={site.url} className="jw-row" style={{ marginTop: "12px", justifyContent: "space-between" }}>
            <label className="jw-row" style={{ minWidth: 0, flex: "1 1 220px", overflowWrap: "anywhere" }}><input type="checkbox" checked={site.enabled} onChange={e => updateSites(customSites.map(item => item.url === site.url ? { ...item, enabled: e.target.checked } : item))} /><span style={{ minWidth: 0 }}>{site.url}</span></label>
            <button style={button} onClick={() => updateSites(customSites.filter(item => item.url !== site.url))} aria-label={`Remove ${site.url}`}>Remove</button>
          </div>)}
          <p style={{ fontSize: "12px", marginTop: "12px", color: "var(--color-text-secondary)" }}>Up to five sites. RSS/Atom feeds and structured JobPosting data are supported. Some websites need a separate connector. Added-site listings with unknown location or sponsorship may be excluded by your filters.</p>
        </div>

      </section>
      <section id="jw-panel-schedule" role="tabpanel" aria-labelledby="jw-tab-schedule" hidden={tab !== "schedule"}>
        <div style={{ ...card, padding: "16px" }}>
          <h2 style={{ fontSize: "1.1rem", marginBottom: "12px" }}>Automatic searches</h2>
          <label className="jw-row"><input type="checkbox" checked={scheduleEnabled} onChange={e => { setScheduleEnabled(e.target.checked); if (e.target.checked && !nextRun) setNextRun(new Date(Date.now() + 300000).toISOString()); }} />Run searches automatically, even when this page is closed</label>
          <div className="jw-grid" style={{ marginTop: "12px" }}>
            <label>How often<select style={{ ...inputStyle, marginTop: "4px" }} value={frequency} onChange={e => { setFrequency(e.target.value); if (e.target.value === "6_hours") setNextRun(new Date(Date.now() + 21600000).toISOString()); }}><option value="daily">Every day</option><option value="6_hours">Every 6 hours</option></select></label>
            <label>First / next run (your local time)<input type="datetime-local" disabled={!scheduleEnabled || frequency === "6_hours"} style={{ ...inputStyle, marginTop: "4px" }} value={nextRun ? new Date(Date.parse(nextRun) - new Date(nextRun).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ""} onChange={e => setNextRun(e.target.value ? new Date(e.target.value).toISOString() : "")} /></label>
          </div>
          {frequency === "6_hours" && <p style={{ marginTop: "8px", fontSize: "13px" }}>The first run is set automatically to six hours after enabling this schedule. Saving other preferences keeps the existing next run.</p>}
          <p style={{ fontSize: "13px", marginTop: "12px" }}>{countdown(savedSchedule, clockNow)}</p>
          <p style={{ fontSize: "13px", margin: "12px 0" }}>Uses all saved titles, locations and selected sites. Results are combined in the Jobs tab and remain there after you return. Runs start within about five minutes of the requested time; daily means every 24 hours.</p>
          <button style={button} onClick={savePreferences} disabled={saving}>{saving ? "Saving…" : saved ? "✓ Schedule & preferences saved" : "Save schedule & preferences"}</button>
          {error && <p role="alert" style={{ color: "#e06060", marginTop: "10px" }}>{error}</p>}
          <p style={{ fontSize: "12px", marginTop: "12px", color: "var(--color-text-secondary)" }}>Automatic runs require the one-time server and Supabase scheduler setup supplied with this update.</p>
        </div>
      </section>
      <section id="jw-panel-results" role="tabpanel" aria-labelledby="jw-tab-results" hidden={tab !== "results"}>
        <div aria-live="polite" aria-busy={running}>
          {savedSchedule?.schedule_enabled && <p style={{ fontSize: "12px", marginBottom: "8px" }}>{countdown(savedSchedule, clockNow)} · Schedule: {savedSchedule.check_frequency === "6_hours" ? "every 6 hours" : "daily"} · Next due: {savedSchedule.next_run_at ? new Date(savedSchedule.next_run_at).toLocaleString() : "not set"}</p>}
          {runStatus && <p role="status" style={{ marginBottom: "8px" }}>{runStatus}</p>}
          {storageNotice && <p role="status" style={{ marginBottom: "8px", fontSize: "13px" }}>{storageNotice}</p>}
          {running && <p>Checking sources… this may take up to 45 seconds.</p>}
          {searchError && <p role="alert" style={{ color: "#e06060" }}>{searchError}</p>}
          {lastRun && <p style={{ fontSize: "12px", marginBottom: "10px", color: "var(--color-text-secondary)" }}>{resultKind} search: {new Date(lastRun).toLocaleString()} · {searchSummary}</p>}
          {results === null && !running && !searchError && <p>Choose your job titles and click Run now. Matches appear here.</p>}
          {results?.length === 0 && <p>No matches found. Try a broader title, another location, or more sources. Sponsorship-only searches exclude unknown sponsorship.</p>}
        </div>
        {results && <div className="jw-row" style={{ marginTop: "10px" }}>
          <strong style={{ fontSize: "13px" }}>{visibleNewCount} new in this search</strong>
          <button style={button} onClick={() => { setShowRemoved(value => !value); setPage(1); }}>{showRemoved ? "Back to jobs" : "Removed jobs"}</button>
          <span style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>Removed jobs stay hidden on this browser, including future searches.</span>
        </div>}
        {jobNotice && <p role="status" style={{ marginTop: "8px", fontSize: "13px" }}>{jobNotice}</p>}
        {results?.length > 0 && displayedJobs.length === 0 && <p style={{ marginTop: "12px" }}>{showRemoved ? "No removed jobs in these results." : "All jobs in these results have been removed."}</p>}
        {warnings.length > 0 && <details style={{ margin: "10px 0", fontSize: "13px" }}><summary>Source notices ({warnings.length})</summary>{warnings.map((warning, i) => <p key={i} style={{ marginTop: "8px" }}>{warning}</p>)}</details>}
        <div className="jw-grid" style={{ marginTop: "12px" }}>
          {displayedJobs.slice((page - 1) * pageSize, page * pageSize).map((job, i) => <article key={`${job.url}-${i}`} style={{ ...card, padding: "14px", overflowWrap: "anywhere" }}>
            <h3 style={{ fontSize: "1rem", marginBottom: "6px" }}>{job.title} {newKeys.includes(jobKey(job)) && !showRemoved && <span style={{ fontSize: "11px", background: "#145c3d", color: "#fff", padding: "3px 7px", borderRadius: "6px", marginLeft: "6px" }}>New</span>}</h3>
            <p style={{ fontSize: "13px" }}>{job.company || "Employer not supplied"} · {job.location || "Location not supplied"}</p>
            <p style={{ fontSize: "12px", marginTop: "6px", color: "var(--color-text-secondary)" }}>{job.salary || "Salary not supplied"} · {job.origin === "live" ? "Fetched live" : "Stored listing"}</p>
            <div className="jw-row" style={{ justifyContent: "space-between", marginTop: "10px" }}>
              <a href={job.url} target="_blank" rel="noopener noreferrer" style={{ color: "#729fff", fontSize: "13px" }}>View job / Apply ↗</a>
              <button style={{ ...button, padding: "5px 9px", fontSize: "12px" }} onClick={() => removeJob(job, showRemoved)} aria-label={`${showRemoved ? "Restore" : "Remove"} job ${job.title}`}>{showRemoved ? "Restore" : "Remove"}</button>
              <details style={{ fontSize: "12px" }}><summary>Details</summary><p>{job.custom_site ? job.source : SOURCES.find(([key]) => key === jobSource(job))?.[1]}</p><p>Sponsorship: {job.sponsorship === true ? "Indicated — confirm with employer" : job.sponsorship === false ? "Not indicated" : "Unknown"}</p><p>Closing: {job.closing_date || "Check listing"}</p></details>
            </div>
          </article>)}
        </div>
        {displayedJobs.length > 0 && <div className="jw-row" style={{ justifyContent: "center", marginTop: "12px" }}><button style={button} disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</button><span style={{ fontSize: "13px" }}>Page {page} of {totalPages}</span><button style={button} disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</button></div>}
        <p style={{ marginTop: "12px", fontSize: "12px", color: "var(--color-text-secondary)" }}>Search uses current fields plus your profile title and location. Coverage varies by source.</p>
      </section>
    </div>
  );
}
