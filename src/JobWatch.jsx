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
  const [visibleCount, setVisibleCount] = useState(20);
  const [searchSummary, setSearchSummary] = useState("");
  const runController = useRef(null);

  useEffect(() => () => runController.current?.abort(), [user?.id]);

  async function runNow() {
    if (runController.current) return;
    if (!sources.length) { setSearchError("Select at least one job source."); return; }
    const controller = new AbortController();
    runController.current = controller;
    const timeout = setTimeout(() => controller.abort(), 45000);
    setRunning(true);
    setSearchError("");
    setWarnings([]);
    setResults(null);
    setLastRun("");
    setVisibleCount(20);
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
      const filters = { titles, locations: places, sources: [...sources], sponsorshipRequired };
      const readJobs = async path => {
        const response = await fetch(path, { signal: controller.signal, cache: "no-store" });
        if (!response.ok) throw new Error("Search service unavailable");
        const data = await response.json();
        if (data.error || !Array.isArray(data.jobs)) throw new Error(data.error || "Invalid search response");
        return data;
      };
      const queries = await Promise.allSettled([
        readJobs(`/api/live-jobs?source=job-watch&sources=${encodeURIComponent(filters.sources.join(","))}&titles=${encodeURIComponent(titles.join(","))}`),
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
        } else notices.push(index === 0 ? "Live feeds are unavailable. Showing stored listings only." : "Stored listings are unavailable. Showing live feed results only.");
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

  return (
    <div
      style={{
        maxWidth: "900px",
        margin: "0 auto",
        padding: "2rem 1.5rem",
      }}
    >
      <div style={{ marginBottom: "2rem" }}>
        <h1
          style={{
            margin: "0 0 8px",
            fontSize: "1.8rem",
            fontWeight: 500,
          }}
        >
          🔎 Job Watch
        </h1>

        <p
          style={{
            margin: 0,
            color: "var(--color-text-secondary)",
            fontSize: "14px",
          }}
        >
          Search for jobs using your profile and the preferences below.
          Click Run now to see matching listings on this page.
        </p>
      </div>

      {error && (
        <div
          style={{
            background: "#FEE8E8",
            color: "#9B1C1C",
            padding: "12px 14px",
            borderRadius: "var(--border-radius-md)",
            marginBottom: "1rem",
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gap: "1rem",
        }}
      >
        <div style={card}>
          <h3
            style={{
              margin: "0 0 6px",
              fontSize: "1rem",
              fontWeight: 500,
            }}
          >
            💼 Additional job titles
          </h3>

          <p
            style={{
              fontSize: "13px",
              color: "var(--color-text-secondary)",
            }}
          >
            Mentorgram will also use the target job title
            from your profile.
          </p>

          <input
            style={inputStyle}
            value={jobTitles}
            onChange={(e) => setJobTitles(e.target.value)}
            placeholder="Service Desk Analyst, IT Support Engineer, Systems Administrator"
          />
        </div>

        <div style={card}>
          <h3
            style={{
              margin: "0 0 6px",
              fontSize: "1rem",
              fontWeight: 500,
            }}
          >
            📍 Additional locations
          </h3>

          <p
            style={{
              fontSize: "13px",
              color: "var(--color-text-secondary)",
            }}
          >
            Separate multiple locations with commas.
          </p>

          <input
            style={inputStyle}
            value={locations}
            onChange={(e) => setLocations(e.target.value)}
            placeholder="Leicester, Nottingham, Birmingham, Remote"
          />
        </div>

        <div style={card}>
          <h3
            style={{
              margin: "0 0 1rem",
              fontSize: "1rem",
              fontWeight: 500,
            }}
          >
            🌐 Job sources
          </h3>

          <div
            style={{
              display: "grid",
              gap: "10px",
            }}
          >
            {SOURCES.map(([value, label]) => (
              <label
                key={value}
                style={{
                  display: "flex",
                  gap: "10px",
                  alignItems: "center",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                <input
                  type="checkbox"
                  checked={sources.includes(value)}
                  onChange={() => toggleSource(value)}
                />

                {label}
              </label>
            ))}
          </div>
        </div>

        <div style={card}>
          <h3
            style={{
              margin: "0 0 1rem",
              fontSize: "1rem",
              fontWeight: 500,
            }}
          >
            🛂 Sponsorship
          </h3>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            <input
              type="checkbox"
              checked={sponsorshipRequired}
              onChange={(e) =>
                setSponsorshipRequired(e.target.checked)
              }
            />

            I require Skilled Worker sponsorship
          </label>
        </div>

        <div style={card}>
          <h3
            style={{
              margin: "0 0 1rem",
              fontSize: "1rem",
              fontWeight: 500,
            }}
          >
            ⏱ Monitoring preferences
          </h3>

          <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", marginBottom: "1rem" }}>
            These preferences are saved for future automatic monitoring. For now, use Run now to search manually.
          </p>
          <div
            style={{
              display: "grid",
              gap: "14px",
            }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                fontSize: "14px",
              }}
            >
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) =>
                  setIsActive(e.target.checked)
                }
              />

              Enable Job Watch
            </label>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  marginBottom: "6px",
                  color: "var(--color-text-secondary)",
                }}
              >
                Check for jobs
              </label>

              <select
                style={inputStyle}
                value={frequency}
                onChange={(e) =>
                  setFrequency(e.target.value)
                }
              >
                <option value="daily">Every day</option>
                <option value="6_hours">
                  Every 6 hours
                </option>
              </select>
            </div>
          </div>
        </div>

        <button
          onClick={savePreferences}
          disabled={saving}
          style={{
            padding: "13px",
            border: "none",
            borderRadius: "var(--border-radius-md)",
            background: saved ? "#FF4500" : "#1A3FA8",
            color: "#fff",
            fontSize: "15px",
            fontWeight: 500,
            cursor: "pointer",
            fontFamily: "inherit",
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving
            ? "Saving..."
            : saved
            ? "✓ Job Watch saved!"
            : "Save Job Watch"}
        </button>
      </div>

      <section aria-labelledby="job-watch-results" style={{ ...card, marginTop: "1.5rem" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", justifyContent: "space-between", alignItems: "center" }}>
          <h2 id="job-watch-results" style={{ fontSize: "1.3rem" }}>Matching jobs</h2>
          <button onClick={runNow} disabled={running} style={{ padding: "12px 24px", border: 0, borderRadius: "8px", background: "#1A3FA8", color: "white", fontSize: "15px", cursor: running ? "wait" : "pointer", opacity: running ? 0.7 : 1 }}>
            {running ? "Searching…" : "Run now"}
          </button>
        </div>
        <p style={{ marginTop: "12px", fontSize: "13px", color: "var(--color-text-secondary)" }}>
          Uses the current fields, including unsaved changes, plus your profile title and location.
          Live searches cover NHS Jobs and jobs.ac.uk when available. Trac and NHS Scotland use stored listings.
          This searches available feeds and stored jobs, not every vacancy on each website.
        </p>
        <div aria-live="polite" aria-busy={running}>
          {running && <p style={{ marginTop: "16px" }}>Checking job sources. This may take up to 45 seconds…</p>}
          {searchError && <p role="alert" style={{ marginTop: "16px", color: "#e06060" }}>{searchError}</p>}
          {warnings.map((warning, i) => <p key={i} style={{ marginTop: "12px", fontSize: "13px" }}>{warning}</p>)}
          {lastRun && <p style={{ marginTop: "16px", fontSize: "13px" }}>Last search: {new Date(lastRun).toLocaleString()} · {results?.length || 0} matching jobs<br />{searchSummary}</p>}
          {results === null && !running && !searchError && <p style={{ marginTop: "16px" }}>Your job results will appear here after you click Run now.</p>}
          {results?.length === 0 && <p style={{ marginTop: "16px" }}>No matches were found in the available listings. Try a broader job title, another location, or more sources. Sponsorship-only searches exclude listings where sponsorship is unknown.</p>}
        </div>
        <div style={{ display: "grid", gap: "12px", marginTop: "16px" }}>
          {results?.slice(0, visibleCount).map((job, i) => (
            <article key={`${job.url}-${i}`} style={{ ...card, padding: "16px", overflowWrap: "anywhere" }}>
              <h3 style={{ fontSize: "1.05rem", marginBottom: "8px" }}>{job.title}</h3>
              <p>{job.company || "Employer not supplied"} · {job.location || "Location not supplied"}</p>
              <p style={{ marginTop: "8px", fontSize: "13px", color: "var(--color-text-secondary)" }}>{job.salary || "Salary not supplied"}</p>
              <p style={{ marginTop: "8px", fontSize: "13px" }}>
                {SOURCES.find(([key]) => key === jobSource(job))?.[1]} · {job.origin === "live" ? "Fetched live" : "Stored listing"}
              </p>
              <p style={{ marginTop: "8px", fontSize: "13px" }}>Sponsorship: {job.sponsorship === true ? "Indicated — confirm with employer" : job.sponsorship === false ? "Not indicated" : "Unknown — check listing"}</p>
              <p style={{ marginTop: "8px", fontSize: "13px" }}>Closing date: {job.closing_date || "Check original listing"}</p>
              <a href={job.url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", marginTop: "14px", color: "#729fff" }}>View job / Apply ↗</a>
            </article>
          ))}
        </div>
        {results && results.length > visibleCount && <button onClick={() => setVisibleCount(count => count + 20)} style={{ ...inputStyle, marginTop: "16px", cursor: "pointer" }}>Show more jobs ({results.length - visibleCount} remaining)</button>}
      </section>
    </div>
  );
}
