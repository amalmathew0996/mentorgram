import { useEffect, useState } from "react";

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
          Tell Mentorgram what you're looking for. We'll
          automatically monitor your selected job sources.
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
            ⏱ Monitoring
          </h3>

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
    </div>
  );
}
