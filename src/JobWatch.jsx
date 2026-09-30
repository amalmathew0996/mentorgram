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

export default function JobWatch({ user }) {
  const [jobTitles, setJobTitles] = useState("");
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
    if (!sources.length && !customSites.some(site => site.enabled)) { setSearchError("Select at least one job source."); return; }
    const controller = new AbortController();
    runController.current = controller;
    const timeout = setTimeout(() => controller.abort(), 45000);
    setRunning(true);
    setSearchError("");
    setWarnings([]);
    setResults(null);
    setLastRun("");
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
      const titles = splitTerms([profile.job_title, jobTitles].filter(Boolean).join(","));
      const places = splitTerms([profile.preferred_location, locations].filter(Boolean).join(","));
      if (!titles.length) throw new Error("Enter at least one job title, or add a target job title to your profile.");
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
      setResults(matchJobs(jobs, filters));
      setWarnings(notices);
      setSearchSummary(`${titles.join(", ")} · ${places.join(", ") || "All locations"}${sponsorshipRequired ? " · Sponsorship indicated only" : ""}`);
      setLastRun(new Date().toISOString());
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
    setSaving(true);
    setSaved(false);
    setError("");

    const payload = {
      user_id: user.id,

      additional_job_titles: jobTitles
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),

      additional_locations: locations
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),

      sponsorship_required: sponsorshipRequired,
      sources,
      is_active: isActive,
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

      setTimeout(() => {
        setSaved(false);
      }, 3000);
    } catch (e) {
      setError(e.message);
    }

    setSaving(false);
  }

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
  const totalPages = Math.max(1, Math.ceil((results?.length || 0) / pageSize));
  return (
    <div className="jw" style={{ maxWidth: "1150px", margin: "0 auto", padding: "20px 16px" }}>
      <style>{`
        .jw-row { display:flex; gap:10px; align-items:center; flex-wrap:wrap; }
        .jw-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; }
        .jw label { font-size:13px; }
        .jw summary { cursor:pointer; }
        .jw button:disabled { opacity:.5; cursor:default; }
        .jw input:focus-visible, .jw button:focus-visible, .jw a:focus-visible { outline:2px solid #729fff; outline-offset:3px; }
        @media(max-width:650px) { .jw-grid { grid-template-columns:1fr; } }
      `}</style>
      <div className="jw-row" style={{ justifyContent: "space-between", marginBottom: "14px" }}>
        <div><h1 style={{ fontSize: "1.6rem" }}>Job Watch</h1><p style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>Find jobs and open the listings here.</p></div>
        <button onClick={runNow} disabled={running} style={{ ...button, background: "#1A3FA8", color: "white", borderColor: "#1A3FA8" }}>{running ? "Searching…" : "Run now"}</button>
      </div>
      <div className="jw-grid" style={{ marginBottom: "12px" }}>
        <label>Additional job titles<input style={{ ...inputStyle, marginTop: "4px" }} value={jobTitles} onChange={e => setJobTitles(e.target.value)} placeholder="IT Support, Service Desk Analyst" /></label>
        <label>Additional locations<input style={{ ...inputStyle, marginTop: "4px" }} value={locations} onChange={e => setLocations(e.target.value)} placeholder="Leicester, Nottingham, Remote" /></label>
      </div>
      <div className="jw-row" style={{ marginBottom: "14px", justifyContent: "space-between" }}>
        <label className="jw-row"><input type="checkbox" checked={sponsorshipRequired} onChange={e => setSponsorshipRequired(e.target.checked)} />Sponsorship required</label>
        <button onClick={savePreferences} disabled={saving} style={button}>{saving ? "Saving…" : saved ? "✓ Saved" : "Save preferences"}</button>
      </div>
      {error && <p role="alert" style={{ marginBottom: "12px", color: "#e06060" }}>{error}</p>}
      <div className="jw-row" role="tablist" aria-label="Job Watch" style={{ borderBottom: "1px solid var(--color-border-tertiary)", paddingBottom: "10px", marginBottom: "14px" }}>
        {[["results", "Jobs"], ["sources", "Sites & settings"]].map(([id, label]) => <button key={id} id={`jw-tab-${id}`} role="tab" aria-selected={tab === id} aria-controls={`jw-panel-${id}`} onClick={() => setTab(id)} style={{ ...button, background: tab === id ? "#1A3FA8" : button.background, color: tab === id ? "white" : button.color }}>{label}{id === "results" && results ? ` (${results.length})` : ""}</button>)}
      </div>
      <section id="jw-panel-sources" role="tabpanel" aria-labelledby="jw-tab-sources" hidden={tab !== "sources"}>
        <div style={{ ...card, padding: "16px" }}>
          <h2 style={{ fontSize: "1.1rem", marginBottom: "12px" }}>Job sources</h2>
          <div className="jw-row">{SOURCES.map(([value, label]) => <label className="jw-row" key={value}><input type="checkbox" checked={sources.includes(value)} onChange={() => toggleSource(value)} />{label}</label>)}</div>
          <p style={{ marginTop: "12px", fontSize: "13px", color: "var(--color-text-secondary)" }}>NHS Jobs and jobs.ac.uk are searched live when available. Trac and NHS Scotland use stored listings.</p>
        </div>
        <div style={{ ...card, padding: "16px", marginTop: "12px" }}>
          <h2 style={{ fontSize: "1.1rem", marginBottom: "8px" }}>Your sites</h2>
          <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", marginBottom: "12px" }}>Add a careers page or jobs RSS feed. Supported listings join your results when you click Run now. Sites are saved for your account in this browser.</p>
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
        <details style={{ ...card, padding: "16px", marginTop: "12px" }}>
          <summary>Monitoring preferences</summary>
          <p style={{ fontSize: "13px", margin: "12px 0" }}>Saved for future automatic monitoring. Use Run now to search manually.</p>
          <div className="jw-row"><label className="jw-row"><input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} />Enable Job Watch</label><label>Frequency <select style={{ ...inputStyle, width: "auto" }} value={frequency} onChange={e => setFrequency(e.target.value)}><option value="daily">Every day</option><option value="6_hours">Every 6 hours</option></select></label></div>
        </details>
      </section>
      <section id="jw-panel-results" role="tabpanel" aria-labelledby="jw-tab-results" hidden={tab !== "results"}>
        <div aria-live="polite" aria-busy={running}>
          {running && <p>Checking sources… this may take up to 45 seconds.</p>}
          {searchError && <p role="alert" style={{ color: "#e06060" }}>{searchError}</p>}
          {lastRun && <p style={{ fontSize: "12px", marginBottom: "10px", color: "var(--color-text-secondary)" }}>Last search: {new Date(lastRun).toLocaleString()} · {searchSummary}</p>}
          {results === null && !running && !searchError && <p>Choose your job titles and click Run now. Matches appear here.</p>}
          {results?.length === 0 && <p>No matches found. Try a broader title, another location, or more sources. Sponsorship-only searches exclude unknown sponsorship.</p>}
        </div>
        {warnings.length > 0 && <details style={{ margin: "10px 0", fontSize: "13px" }}><summary>Source notices ({warnings.length})</summary>{warnings.map((warning, i) => <p key={i} style={{ marginTop: "8px" }}>{warning}</p>)}</details>}
        <div className="jw-grid" style={{ marginTop: "12px" }}>
          {results?.slice((page - 1) * pageSize, page * pageSize).map((job, i) => <article key={`${job.url}-${i}`} style={{ ...card, padding: "14px", overflowWrap: "anywhere" }}>
            <h3 style={{ fontSize: "1rem", marginBottom: "6px" }}>{job.title}</h3>
            <p style={{ fontSize: "13px" }}>{job.company || "Employer not supplied"} · {job.location || "Location not supplied"}</p>
            <p style={{ fontSize: "12px", marginTop: "6px", color: "var(--color-text-secondary)" }}>{job.salary || "Salary not supplied"} · {job.origin === "live" ? "Fetched live" : "Stored listing"}</p>
            <div className="jw-row" style={{ justifyContent: "space-between", marginTop: "10px" }}>
              <a href={job.url} target="_blank" rel="noopener noreferrer" style={{ color: "#729fff", fontSize: "13px" }}>View job / Apply ↗</a>
              <details style={{ fontSize: "12px" }}><summary>Details</summary><p>{job.custom_site ? job.source : SOURCES.find(([key]) => key === jobSource(job))?.[1]}</p><p>Sponsorship: {job.sponsorship === true ? "Indicated — confirm with employer" : job.sponsorship === false ? "Not indicated" : "Unknown"}</p><p>Closing: {job.closing_date || "Check listing"}</p></details>
            </div>
          </article>)}
        </div>
        {results?.length > 0 && <div className="jw-row" style={{ justifyContent: "center", marginTop: "12px" }}><button style={button} disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</button><span style={{ fontSize: "13px" }}>Page {page} of {totalPages}</span><button style={button} disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</button></div>}
        <p style={{ marginTop: "12px", fontSize: "12px", color: "var(--color-text-secondary)" }}>Search uses current fields plus your profile title and location. Coverage varies by source.</p>
      </section>
    </div>
  );
}
