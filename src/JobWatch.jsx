import { useEffect, useRef, useState } from "react";
import { splitTerms, matchJobs, jobSource } from "./jobWatchUtils.js";

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

async function supaFetch(path, opts = {}) {
  const res = await fetch(`${SUPA_URL}/rest/v1${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      apikey: SUPA_KEY,
      Authorization: `Bearer ${getToken() || SUPA_KEY}`,
      Prefer: "return=representation",
      ...(opts.headers || {}),
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err.message ||
      err.error_description ||
      "Request failed"
    );
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

// Keep URL identity consistent with jobWatchUtils so tracking links do not
// bring a dismissed listing back on the next search.
function jobKey(job) {
  try {
    const url = new URL(job.url);
    url.hash = "";
    for (const key of [...url.searchParams.keys()]) {
      if (/^utm_|^fbclid$|^gclid$/i.test(key)) url.searchParams.delete(key);
    }
    return url.href;
  } catch {
    return JSON.stringify([job.id, job.title, job.company, job.location]);
  }
}
function safeLink(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}
const jobsArray = value => Array.isArray(value) ? value.filter(job => job && typeof job === "object" && typeof job.title === "string") : [];
const termsArray = value => splitTerms((Array.isArray(value) ? value.filter(x => typeof x === "string") : []).join(","));
const sameTitle = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase();
function dateLabel(value, empty = "Not recorded") {
  return value && Number.isFinite(Date.parse(value)) ? new Date(value).toLocaleString() : empty;
}
function localDate(value) {
  if (!value || !Number.isFinite(Date.parse(value))) return "";
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export default function JobWatch({ user }) {
  if (!user?.id) return <p role="status">Sign in to use Job Watch.</p>;
  // Reset all account-specific state and cancel searches when the user changes.
  return <JobWatchAccount key={user.id} user={user} />;
}

function JobWatchAccount({ user }) {
  const [jobTitles, setJobTitles] = useState("");
  const [titleDraft, setTitleDraft] = useState("");
  const [removedTitles, setRemovedTitles] = useState([]);
  const [hiddenJobs, setHiddenJobs] = useState([]);
  const [profile, setProfile] = useState({});
  const [profileNotice, setProfileNotice] = useState("");
  const [locations, setLocations] = useState("");
  const [sponsorshipRequired, setSponsorshipRequired] = useState(false);
  const [sources, setSources] = useState(SOURCES.map(([key]) => key));
  const [isActive, setIsActive] = useState(true);
  const [frequency, setFrequency] = useState("daily");
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [nextRun, setNextRun] = useState("");
  const [nextRunEdited, setNextRunEdited] = useState(false);
  const [savedSchedule, setSavedSchedule] = useState(null);
  const [customSites, setCustomSites] = useState([]);
  const [newSite, setNewSite] = useState("");
  const [siteError, setSiteError] = useState("");
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState("");
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState(null);
  const [searchError, setSearchError] = useState("");
  const [warnings, setWarnings] = useState([]);
  const [lastRun, setLastRun] = useState("");
  const [page, setPage] = useState(1);
  const [resultKind, setResultKind] = useState("");
  const [searchSummary, setSearchSummary] = useState("");
  const [runStatus, setRunStatus] = useState("");
  const [storageNotice, setStorageNotice] = useState("");
  const runController = useRef(null);
  const resultsStarted = useRef(0);
  const mutationLock = useRef(false);
  const mounted = useRef(true);
  const requestVersion = useRef(0);
  const userFilter = `user_id=eq.${encodeURIComponent(user.id)}`;
  const titleList = () => splitTerms([jobTitles, titleDraft].filter(Boolean).join(","));
  const profileTitles = splitTerms(profile.job_title || "");
  const allTitles = splitTerms([profile.job_title, jobTitles].filter(Boolean).join(","));

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; runController.current?.abort(); };
  }, []);

  function edit(setter, value) {
    setter(value);
    setDirty(true);
    setSaved("");
  }

  async function loadPreferences() {
    setLoading(true);
    setReady(false);
    setError("");
    const loaded = await Promise.allSettled([
      supaFetch(`/job_watch_preferences?${userFilter}&select=*&limit=1`),
      supaFetch(`/profiles?${userFilter}&select=job_title,preferred_location&limit=1`),
    ]);
    if (!mounted.current) return;
    if (loaded[1].status === "fulfilled") {
      setProfile(loaded[1].value?.[0] || {});
      setProfileNotice("");
    } else setProfileNotice("Your profile could not be loaded. Its title and location may still be included by scheduled searches.");
    if (loaded[0].status === "fulfilled") {
      const pref = loaded[0].value?.[0];
      setSavedSchedule(pref || null);
      if (pref) {
        setJobTitles(termsArray(pref.additional_job_titles).join(", "));
        setRemovedTitles(termsArray(pref.removed_job_titles));
        setHiddenJobs(jobsArray(pref.hidden_jobs));
        setLocations(termsArray(pref.additional_locations).join(", "));
        setSponsorshipRequired(pref.sponsorship_required === true);
        setSources(Array.isArray(pref.sources) ? pref.sources : SOURCES.map(([key]) => key));
        setIsActive(pref.is_active !== false);
        setFrequency(pref.check_frequency || "daily");
        setScheduleEnabled(pref.schedule_enabled === true);
        setNextRun(pref.next_run_at || "");
      }
      let sites = pref?.custom_sites;
      if (!Array.isArray(sites)) {
        try { sites = JSON.parse(localStorage.getItem(`mg_job_watch_sites_${user.id}`) || "[]"); }
        catch { sites = []; }
      }
      setCustomSites(Array.isArray(sites) ? sites.filter(site => site && typeof site.url === "string").map(site => ({ ...site, enabled: site.enabled === true })) : []);
      setNextRunEdited(false);
      setDirty(false);
      setReady(true);
    } else setError(`Could not load preferences: ${loaded[0].reason.message}. Retry before making changes.`);
    setLoading(false);
  }

  useEffect(() => { loadPreferences(); }, [user.id]);

  useEffect(() => {
    let active = true;
    let inFlight = false;
    const refresh = async () => {
      if (inFlight || runController.current || mutationLock.current) return;
      inFlight = true;
      const version = requestVersion.current;
      try {
        const [latest, successful, prefs] = await Promise.all([
          supaFetch(`/job_watch_runs?${userFilter}&select=status,error,started_at,run_kind&order=started_at.desc&limit=1`),
          supaFetch(`/job_watch_runs?${userFilter}&status=eq.complete&select=*&order=started_at.desc&limit=1`),
          supaFetch(`/job_watch_preferences?${userFilter}&select=is_active,schedule_enabled,next_run_at,last_checked_at,check_frequency&limit=1`),
        ]);
        if (!active || runController.current || version !== requestVersion.current) return;
        setSavedSchedule(prefs?.[0] || null);
        const attempt = latest?.[0];
        setRunStatus(attempt?.status === "failed"
          ? `Last ${attempt.run_kind || "job"} search failed: ${attempt.error || "Please try again."} Previous successful results are shown below.`
          : attempt?.status === "running"
            ? (Date.now() - Date.parse(attempt.started_at) > 180000
              ? "The last search is still marked as running and may have been interrupted. Check the scheduler if it does not complete."
              : "A search is running. Saved results will update here.")
            : "");
        const run = successful?.[0];
        if (run && Date.parse(run.started_at) > resultsStarted.current) {
          setResults(jobsArray(run.jobs));
          setWarnings(Array.isArray(run.warnings) ? run.warnings.map(item => typeof item === "string" ? item : JSON.stringify(item)) : []);
          setSearchSummary(run.summary || "");
          setLastRun(run.completed_at || "");
          setResultKind(run.run_kind === "scheduled" ? "Scheduled" : "Manual");
          setPage(1);
          resultsStarted.current = Date.parse(run.started_at);
        }
      } catch {
        if (active) setStorageNotice("Saved results or schedule status could not be refreshed. Displayed information may be out of date; check your connection and database permissions.");
      } finally { inFlight = false; }
    };
    refresh();
    const interval = setInterval(refresh, 60000);
    return () => { active = false; clearInterval(interval); };
  }, [user.id]);

  // Patch only the changed fields, keeping scheduler locks/timestamps untouched.
  // Re-read before list edits so additions made in another tab are retained.
  async function persist(buildPatch) {
    if (mutationLock.current || !ready) return false;
    mutationLock.current = true;
    requestVersion.current += 1;
    setSaving(true);
    setError("");
    setSaved("");
    try {
      const rows = await supaFetch(`/job_watch_preferences?${userFilter}&select=*&limit=1`);
      const current = rows?.[0] || {};
      const patch = buildPatch(current);
      const payload = { ...patch, updated_at: new Date().toISOString() };
      const returned = await supaFetch(rows?.length ? `/job_watch_preferences?${userFilter}` : "/job_watch_preferences", {
        method: rows?.length ? "PATCH" : "POST",
        body: JSON.stringify(rows?.length ? payload : { user_id: user.id, ...payload }),
      });
      if (!returned?.[0]) throw new Error("The database did not confirm the change. Reload before trying again.");
      if (!mounted.current) return false;
      setSavedSchedule(returned[0]);
      setSaved("Saved to your account.");
      return returned[0];
    } catch (e) {
      if (mounted.current) setError(`Could not save: ${e.message}`);
      return false;
    } finally {
      mutationLock.current = false;
      requestVersion.current += 1;
      if (mounted.current) setSaving(false);
    }
  }

  async function changeRole(action, title) {
    const additions = action === "add" ? splitTerms(titleDraft) : [title];
    if (!additions.length) { setError("Enter a job title first."); return; }
    const row = await persist(current => {
      let titles = termsArray(current.additional_job_titles);
      let removed = termsArray(current.removed_job_titles);
      if (action === "remove") {
        if (profileTitles.some(item => sameTitle(item, title))) throw new Error("This title comes from your profile. Change it in your profile to stop monitoring it.");
        titles = titles.filter(item => !sameTitle(item, title));
        removed = splitTerms([...removed, title].join(","));
      } else {
        titles = splitTerms([...titles, ...additions].join(","));
        if (splitTerms([profile.job_title, ...titles].filter(Boolean).join(",")).length > 10) throw new Error("Use up to ten distinct titles, including your profile title.");
        removed = removed.filter(item => !additions.some(value => sameTitle(item, value)));
      }
      return { additional_job_titles: titles, removed_job_titles: removed };
    });
    if (row) {
      setJobTitles(termsArray(row.additional_job_titles).join(", "));
      setRemovedTitles(termsArray(row.removed_job_titles));
      if (action === "add") setTitleDraft("");
    }
  }

  async function changeHidden(job, hide) {
    const row = await persist(current => {
      const others = jobsArray(current.hidden_jobs).filter(item => jobKey(item) !== jobKey(job));
      return { hidden_jobs: hide ? [...others, job] : others };
    });
    if (row) {
      setHiddenJobs(jobsArray(row.hidden_jobs));
      setPage(1);
    }
  }

  function addSite(event) {
    event.preventDefault();
    try {
      const value = newSite.trim();
      const url = new URL(value.includes("://") ? value : `https://${value}`);
      if (url.protocol !== "https:" || url.username || url.password || (url.port && url.port !== "443") || url.href.length > 2000 || !url.hostname.includes(".")) throw new Error("Enter a public HTTPS careers page or RSS feed URL.");
      url.hash = "";
      if (customSites.some(site => site.url === url.href)) throw new Error("This site is already added.");
      if (customSites.length >= 5) throw new Error("You can add up to five sites.");
      edit(setCustomSites, [...customSites, { url: url.href, enabled: true }]);
      setNewSite("");
      setSiteError("");
    } catch (e) { setSiteError(e.message); }
  }

  async function savePreferences() {
    const row = await persist(current => {
      const titles = splitTerms([...termsArray(current.additional_job_titles), titleDraft].join(","));
      const combined = splitTerms([profile.job_title, ...titles].filter(Boolean).join(","));
      if (combined.length > 10) throw new Error("Use up to ten distinct titles, including your profile title.");
      if (isActive && scheduleEnabled && !combined.length && !profileNotice) throw new Error("Add a job title before enabling automatic searches.");
      if (isActive && scheduleEnabled && !sources.length && !customSites.some(site => site.enabled)) throw new Error("Choose at least one source before enabling automatic searches.");
      const patch = {
        additional_job_titles: titles,
        removed_job_titles: termsArray(current.removed_job_titles).filter(title => !titles.some(item => sameTitle(item, title))),
        additional_locations: splitTerms(locations), sponsorship_required: sponsorshipRequired,
        sources, is_active: isActive, schedule_enabled: isActive && scheduleEnabled,
        custom_sites: customSites, check_frequency: frequency,
      };
      // An untouched due time belongs to the scheduler, never to a stale form.
      if (!isActive || !scheduleEnabled) patch.next_run_at = null;
      else if (nextRunEdited) {
        if (!nextRun || !Number.isFinite(Date.parse(nextRun))) throw new Error("Choose a valid next run time.");
        patch.next_run_at = new Date(nextRun).toISOString();
      } else if (!current.next_run_at) {
        // Explicitly enabling a schedule requests a run at the next scheduler check.
        // The header only displays the database-returned value after saving.
        patch.next_run_at = new Date().toISOString();
      }
      return patch;
    });
    if (row) {
      setJobTitles(termsArray(row.additional_job_titles).join(", "));
      setRemovedTitles(termsArray(row.removed_job_titles));
      setTitleDraft("");
      setScheduleEnabled(row.schedule_enabled === true);
      setNextRun(row.next_run_at || "");
      setNextRunEdited(false);
      setDirty(false);
    }
  }
  async function runNow() {
    if (runController.current || mutationLock.current || !ready) return;

    if (!sources.length && !customSites.some(site => site.enabled)) { setSearchError("Select at least one job source."); return; }
    const startedAt = new Date().toISOString();
    const controller = new AbortController();
    runController.current = controller;
    const timeout = setTimeout(() => controller.abort(), 45000);
    setRunning(true);
    setSearchError("");
    setWarnings([]);
    setPage(1);

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
      if (!mounted.current) return;
      setProfile(profile);
      const titles = splitTerms([profile.job_title, ...titleList()].filter(Boolean).join(","));
      const places = splitTerms([profile.preferred_location, locations].filter(Boolean).join(","));
      if (!titles.length) throw new Error("Enter at least one job title, or add a target job title to your profile.");
      if (titles.length > 10) throw new Error("Use up to ten distinct job titles including your profile title.");
      const filters = { titles, locations: places, sources: [...sources], sponsorshipRequired, customSites: customSites.filter(site => site.enabled).map(site => site.url) };
      const readJobs = async path => {
        const response = await fetch(path, { signal: controller.signal, cache: "no-store", headers: getToken() ? { Authorization: `Bearer ${getToken()}` } : {} });
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
      if (!mounted.current) return;
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
        setStorageNotice("These results could not be saved to your account. They remain visible until you leave this page. Check your connection and database permissions.");
      }
    } catch (e) {
      setSearchError(controller.signal.aborted ? "Search timed out or was cancelled. Please try again." : e.message);
    } finally {
      clearTimeout(timeout);
      runController.current = null;
      setRunning(false);
    }
  }


  if (loading) return <p style={{ padding: "2rem" }} role="status">Loading Job Watch…</p>;
  const button = { padding: "10px 16px", border: "1px solid var(--color-border-secondary)", borderRadius: "8px", background: "var(--color-background-secondary)", color: "var(--color-text-primary)", cursor: "pointer", fontFamily: "inherit" };
  const muted = { color: "var(--color-text-secondary)", fontSize: "13px" };
  const busy = saving || running || !ready;
  const hiddenKeys = new Set(hiddenJobs.map(jobKey));
  const visibleJobs = (results || []).filter(job => !hiddenKeys.has(jobKey(job)));
  const pageSize = 6;
  const totalPages = Math.max(1, Math.ceil(visibleJobs.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const active = savedSchedule?.is_active !== false && savedSchedule?.schedule_enabled === true;
  const scheduleLabel = !savedSchedule ? "Not configured" : active ? "Active" : "Paused";

  function jobCard(job, removed = false) {
    const href = safeLink(job.url);
    return <article key={jobKey(job)} className="jw-card" style={card}>
      <h3>{job.title || "Job listing"}</h3>
      <p>{job.company || "Employer not supplied"} · {job.location || "Location not supplied"}</p>
      <p style={muted}>{job.salary || "Salary not supplied"} · {job.origin === "live" ? "Fetched live" : "Saved listing"}</p>
      <div className="jw-row jw-between">
        {href ? <a href={href} target="_blank" rel="noopener noreferrer">View job / Apply ↗</a> : <span style={muted}>Listing link unavailable</span>}
        <button style={button} disabled={busy} onClick={() => changeHidden(job, !removed)} aria-label={`${removed ? "Restore" : "Not interested in"} ${job.title}`}>{removed ? "Restore" : "Not interested"}</button>
      </div>
      <details style={{ ...muted, marginTop: "12px" }}><summary>Job details</summary>
        <p>Source: {(job.custom_site ? job.source : SOURCES.find(([key]) => key === jobSource(job))?.[1]) || job.source || "Not supplied"}</p>
        <p>Sponsorship: {job.sponsorship === true ? "Indicated — confirm with employer" : job.sponsorship === false ? "Not indicated" : "Unknown"}</p>
        <p>Closing: {job.closing_date || "Check listing"}</p>
      </details>
    </article>;
  }

  return <div className="jw" style={{ maxWidth: "1150px", width: "100%", minWidth: 0, margin: "0 auto", padding: "20px 16px", color: "var(--color-text-primary)" }}>
    <style>{`
      .jw, .jw * { box-sizing:border-box; }
      .jw { overflow-wrap:anywhere; }
      .jw section { margin:0 0 20px; min-width:0; }
      .jw h1 { font-size:1.7rem; margin:0 0 8px; }
      .jw h2 { font-size:1.15rem; margin:0 0 12px; }
      .jw h3 { font-size:1rem; margin:0 0 8px; }
      .jw p { margin:8px 0 12px; line-height:1.5; }
      .jw-row { display:flex; gap:10px; align-items:center; flex-wrap:wrap; min-width:0; }
      .jw-between { justify-content:space-between; }
      .jw-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; }
      .jw-grid > *, .jw-row > * { min-width:0; max-width:100%; }
      .jw .jw-card { padding:18px; min-width:0; }
      .jw label { font-size:14px; }
      .jw input:not([type=checkbox]), .jw select { min-width:0; max-width:100%; }
      .jw input[type=checkbox] { flex:0 0 auto; width:16px; height:16px; margin:0; }
      .jw button { white-space:normal; flex-shrink:0; }
      .jw a { color:#729fff; overflow-wrap:anywhere; }
      .jw summary { cursor:pointer; }
      .jw button:disabled, .jw fieldset:disabled { opacity:.6; }
      .jw button:disabled { cursor:default; }
      .jw fieldset { border:0; padding:0; margin:0; min-width:0; }
      .jw input:focus-visible, .jw select:focus-visible, .jw button:focus-visible, .jw a:focus-visible, .jw summary:focus-visible { outline:2px solid #729fff; outline-offset:3px; }
      .jw-item { padding:12px 0; border-bottom:1px solid var(--color-border-tertiary); }
      .jw-fill { flex:1 1 230px; min-width:0; }
      .jw-site { display:grid; grid-template-columns:20px minmax(0,1fr) auto; gap:10px; align-items:center; }
      .jw-notice { padding:12px; border:1px solid var(--color-border-secondary); border-radius:8px; }
      @media(max-width:650px) { .jw-grid { grid-template-columns:1fr; } .jw .jw-card { padding:14px; } }
      @media(max-width:380px) { .jw-site { grid-template-columns:20px minmax(0,1fr); } .jw-site button { grid-column:2; justify-self:start; } }
    `}</style>

    <section className="jw-card" style={card} aria-labelledby="jw-heading">
      <div className="jw-row jw-between">
        <div><h1 id="jw-heading">Job Watch</h1><p style={muted}>Your monitored roles, searches and saved results.</p></div>
        <button onClick={runNow} disabled={busy} style={{ ...button, background: "#1A3FA8", color: "white", borderColor: "#1A3FA8" }}>{running ? "Searching…" : "Run now"}</button>
      </div>
      <p><strong>Automatic searches: {scheduleLabel}</strong></p>
      <div className="jw-grid">
        <div><span style={muted}>Last checked (saved schedule)</span><p>{dateLabel(savedSchedule?.last_checked_at)}</p></div>
        <div><span style={muted}>Next scheduled (saved due time)</span><p>{dateLabel(savedSchedule?.next_run_at, "Not set")}{!active && savedSchedule?.next_run_at ? " — paused" : ""}</p></div>
      </div>
      <p style={muted}>Times are shown in your local timezone. A saved due time does not confirm the scheduler is running. Actual start time depends on the server schedule.</p>
      {(dirty || titleDraft.trim()) && <p role="status">You have unsaved settings. Run now uses the current fields; automatic searches use saved settings.</p>}
      {saved && <p role="status">{saved}</p>}
      {error && <p role="alert" className="jw-notice">{error}</p>}
      {!ready && <button style={button} onClick={loadPreferences}>Retry loading preferences</button>}
      {profileNotice && <p role="status" className="jw-notice">{profileNotice}</p>}
      {runStatus && <p role="status" className="jw-notice">{runStatus}</p>}
      {storageNotice && <p role="status" className="jw-notice">{storageNotice}</p>}
    </section>

    <section aria-labelledby="jw-results-heading" aria-busy={running}>
      <h2 id="jw-results-heading">Current jobs{results !== null ? ` (${visibleJobs.length})` : ""}</h2>
      <p style={muted}>Matches from your latest successful search, excluding jobs you marked Not interested.</p>
      <div aria-live="polite">
        {running && <p>Checking sources… this may take up to 45 seconds.</p>}
        {searchError && <p role="alert" className="jw-notice">{searchError}</p>}
        {lastRun && <p style={muted}>{resultKind} search completed: {dateLabel(lastRun)}{searchSummary ? ` · ${searchSummary}` : ""}</p>}
        {results === null && !running && <p>No saved results loaded yet. Add a role and use Run now, or wait for a successful scheduled search.</p>}
        {results !== null && !visibleJobs.length && <p>{results.length ? "All matches from this search are in Not interested below." : "No matches found. Try a broader title, another location or more sources. Sponsorship-only searches exclude unknown sponsorship."}</p>}
      </div>
      {warnings.length > 0 && <details open className="jw-notice" style={{ marginBottom: "12px" }}><summary>Source warnings ({warnings.length})</summary>{warnings.map((warning, i) => <p key={i}>{typeof warning === "string" ? warning : JSON.stringify(warning)}</p>)}</details>}
      <div className="jw-grid">{visibleJobs.slice((currentPage - 1) * pageSize, currentPage * pageSize).map(job => jobCard(job))}</div>
      {visibleJobs.length > pageSize && <nav className="jw-row" aria-label="Job results pages" style={{ justifyContent: "center", marginTop: "12px" }}>
        <button style={button} disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Previous</button>
        <span>Page {currentPage} of {totalPages}</span>
        <button style={button} disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)}>Next</button>
      </nav>}
    </section>

    <fieldset disabled={busy}>
      <section className="jw-card" style={card} aria-labelledby="jw-roles-heading">
        <h2 id="jw-roles-heading">Current monitored roles</h2>
        <p style={muted}>Saved roles for searches{!active ? "; automatic searches are paused or not configured" : ""}. Adding, removing and restoring roles saves immediately.</p>
        {!allTitles.length && <p>No monitored roles yet.</p>}
        {allTitles.map(title => {
          const fromProfile = profileTitles.some(item => sameTitle(item, title));
          return <div className="jw-row jw-between jw-item" key={title.toLowerCase()}>
            <span className="jw-fill">{title}{fromProfile && <small style={{ ...muted, display: "block" }}>From your profile — change it in My Profile to stop monitoring it.</small>}</span>
            {!fromProfile && <button style={button} onClick={() => changeRole("remove", title)} aria-label={`Remove role ${title}`}>Remove</button>}
          </div>;
        })}
        <form className="jw-row" onSubmit={e => { e.preventDefault(); changeRole("add"); }} style={{ marginTop: "16px" }}>
          <label className="jw-fill" htmlFor="jw-title">Add a role<input id="jw-title" style={{ ...inputStyle, marginTop: "6px" }} value={titleDraft} onChange={e => { setTitleDraft(e.target.value); setSaved(""); }} placeholder="e.g. Service Desk Analyst" /></label>
          <button type="submit" style={button}>Add role</button>
        </form>
        <p style={muted}>Up to ten distinct titles including your profile title. Separate multiple titles with commas.</p>
        <details style={{ marginTop: "16px" }} open={removedTitles.length ? true : undefined}>
          <summary>Removed / paused roles ({removedTitles.length})</summary>
          {!removedTitles.length && <p style={muted}>Removed additional roles will appear here.</p>}
          {removedTitles.map(title => <div className="jw-row jw-between jw-item" key={title.toLowerCase()}>
            <span className="jw-fill">{title}{profileTitles.some(item => sameTitle(item, title)) && <small style={{ ...muted, display: "block" }}>Also in your profile, so it is still monitored.</small>}</span>
            <button style={button} onClick={() => changeRole("restore", title)} aria-label={`Restore role ${title}`}>Restore</button>
          </div>)}
        </details>
      </section>

      <section className="jw-card" style={card} aria-labelledby="jw-settings-heading">
        <h2 id="jw-settings-heading">Locations and sponsorship</h2>
        <p style={muted}>Profile location: {profile.preferred_location || (profileNotice ? "Unavailable" : "Not set")}. This is included automatically.</p>
        <label htmlFor="jw-locations">Additional locations</label>
        <input id="jw-locations" style={{ ...inputStyle, margin: "6px 0 14px" }} value={locations} onChange={e => edit(setLocations, e.target.value)} placeholder="Leicester, Nottingham, Remote" />
        <label className="jw-row"><input type="checkbox" checked={sponsorshipRequired} onChange={e => edit(setSponsorshipRequired, e.target.checked)} />Sponsorship required</label>
        <p style={muted}>These settings take effect for automatic searches after you save.</p>
      </section>

      <section className="jw-card" style={card} aria-labelledby="jw-sources-heading">
        <h2 id="jw-sources-heading">Job sources</h2>
        <div className="jw-row">{SOURCES.map(([value, label]) => <label className="jw-row" key={value}><input type="checkbox" checked={sources.includes(value)} onChange={() => edit(setSources, sources.includes(value) ? sources.filter(item => item !== value) : [...sources, value])} />{label}</label>)}</div>
        <p style={muted}>Availability and coverage vary. Source warnings appear with your results.</p>
        <h3 style={{ marginTop: "20px" }}>Custom monitored sites</h3>
        <p style={muted}>Add a public HTTPS careers page or jobs feed, up to five sites. Save settings to include changes in automatic searches.</p>
        {customSites.map((site, index) => <div className="jw-site jw-item" key={`${site.url}-${index}`}>
          <input id={`jw-site-${index}`} type="checkbox" checked={site.enabled} onChange={e => edit(setCustomSites, customSites.map((item, i) => i === index ? { ...item, enabled: e.target.checked } : item))} />
          <label htmlFor={`jw-site-${index}`} style={{ overflowWrap: "anywhere" }}>{site.url}<small style={{ ...muted, display: "block" }}>{site.enabled ? "Enabled" : "Disabled"}</small></label>
          <button style={button} onClick={() => edit(setCustomSites, customSites.filter((_, i) => i !== index))} aria-label={`Remove site ${site.url}`}>Remove</button>
        </div>)}
        {!customSites.length && <p style={muted}>No custom sites added.</p>}
        <form className="jw-row" onSubmit={addSite} style={{ marginTop: "14px" }}>
          <label className="jw-fill">Site or feed URL<input style={{ ...inputStyle, marginTop: "6px" }} value={newSite} onChange={e => setNewSite(e.target.value)} placeholder="https://company.com/careers" required /></label>
          <button type="submit" style={button}>Add site</button>
        </form>
        {siteError && <p role="alert">{siteError}</p>}
        <p style={muted}>Supported feeds and structured job listings can be searched. Some websites are unsupported. Unknown location or sponsorship may exclude a listing from your results.</p>
      </section>

      <section className="jw-card" style={card} aria-labelledby="jw-schedule-heading">
        <h2 id="jw-schedule-heading">Schedule and settings</h2>
        <label className="jw-row"><input type="checkbox" checked={isActive} onChange={e => edit(setIsActive, e.target.checked)} />Job Watch active</label>
        <label className="jw-row" style={{ marginTop: "12px" }}><input type="checkbox" checked={scheduleEnabled} onChange={e => edit(setScheduleEnabled, e.target.checked)} />Enable automatic searches</label>
        <div className="jw-grid" style={{ marginTop: "16px" }}>
          <label>Frequency<select style={{ ...inputStyle, marginTop: "6px" }} value={frequency} onChange={e => edit(setFrequency, e.target.value)}>
            <option value="daily">Every day</option><option value="6_hours">Every 6 hours</option>
            {!["daily", "6_hours"].includes(frequency) && <option value={frequency}>{frequency} (saved value)</option>}
          </select></label>
          <label>Request a first / next run (local time)<input type="datetime-local" disabled={!scheduleEnabled} style={{ ...inputStyle, marginTop: "6px" }} value={localDate(nextRunEdited ? nextRun : savedSchedule?.next_run_at)} onChange={e => {
            const date = e.target.value ? new Date(e.target.value) : null;
            edit(setNextRun, date && Number.isFinite(date.getTime()) ? date.toISOString() : "");
            setNextRunEdited(true);
          }} /></label>
        </div>
        <p style={muted}>Both switches must be on for automatic searches. Pausing leaves manual Run now available. Enabling a schedule without a saved due time requests a run at the next server scheduler check. Changing frequency affects subsequent scheduling; change the requested time above if you also want to move the next run.</p>
        <div className="jw-row jw-between"><button style={{ ...button, background: "#1A3FA8", color: "white" }} onClick={savePreferences}>Save settings</button><span style={muted}>{dirty || titleDraft.trim() ? "Unsaved changes" : "No unsaved settings"}</span></div>
      </section>
    </fieldset>

    <section aria-labelledby="jw-hidden-heading">
      <h2 id="jw-hidden-heading">Removed / Not interested jobs ({hiddenJobs.length})</h2>
      <p style={muted}>Saved to your account and hidden from current and future results. Restore makes a listing eligible to appear again: it returns to Current jobs if it is in the latest search results, or when a later search finds it.</p>
      {!hiddenJobs.length && <p>No removed jobs.</p>}
      <div className="jw-grid">{hiddenJobs.map(job => jobCard(job, true))}</div>
    </section>
  </div>;
}
