// src/CouncilsPage.jsx
import { useState, useEffect, useMemo } from "react";
import councils, { COUNCIL_REGIONS } from "./councils.js";

const S = {
  section:   { maxWidth: "1200px", margin: "0 auto", padding: "2rem 1.5rem 4rem" },
  title:     { fontSize: "clamp(1.75rem, 3vw, 2.25rem)", fontWeight: 600, letterSpacing: "-0.02em", textAlign: "center", margin: "0 0 0.5rem" },
  sub:       { fontSize: "0.95rem", color: "var(--color-text-secondary)", textAlign: "center", marginBottom: "1.75rem" },
};

export default function CouncilsPage() {
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("All");
  const [selectedCouncil, setSelectedCouncil] = useState(null);

  if (selectedCouncil) {
    return <CouncilJobsView council={selectedCouncil} onBack={() => setSelectedCouncil(null)} />;
  }

  const filtered = useMemo(() => {
    let list = councils;
    if (region !== "All") list = list.filter(c => c.region === region);
    if (query.trim()) {
      const q = query.toLowerCase().trim();
      list = list.filter(c => c.name.toLowerCase().includes(q) || c.region.toLowerCase().includes(q) || c.type.toLowerCase().includes(q));
    }
    return list;
  }, [query, region]);

  const stats = useMemo(() => {
    const byRegion = councils.reduce((acc, c) => { acc[c.region] = (acc[c.region] || 0) + 1; return acc; }, {});
    return { total: councils.length, byRegion };
  }, []);

  return (
    <div style={S.section}>
      <h2 style={S.title}>UK Councils & Local Authorities</h2>
      <p style={S.sub}>Click a council to view its live job vacancies from public sector feeds.</p>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
        <input
          type="text"
          placeholder="Search councils by name (e.g. Manchester, Camden, Cardiff)…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={{
            width: "100%",
            padding: "12px 16px",
            fontSize: "14px",
            borderRadius: "10px",
            border: "0.5px solid var(--color-border-tertiary)",
            background: "var(--color-background-primary)",
            color: "var(--color-text-primary)",
            outline: "none",
            fontFamily: "inherit",
          }}
        />

        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {COUNCIL_REGIONS.map(r => (
            <button key={r} onClick={() => setRegion(r)}
              style={{
                padding: "6px 12px",
                borderRadius: "999px",
                fontSize: "12px",
                fontWeight: region === r ? 500 : 400,
                background: region === r ? "#1A3FA8" : "var(--color-background-secondary)",
                color: region === r ? "#fff" : "var(--color-text-secondary)",
                border: "none",
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "background 0.15s, color 0.15s",
                whiteSpace: "nowrap",
              }}>
              {r}{r !== "All" && stats.byRegion[r] ? ` (${stats.byRegion[r]})` : ""}
            </button>
          ))}
        </div>
      </div>

      <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginBottom: "12px" }}>
        Showing <strong style={{ color: "var(--color-text-primary)" }}>{filtered.length}</strong> of {councils.length} councils
      </p>

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 16px", background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "12px", color: "var(--color-text-secondary)" }}>
          No councils match your search. Try a different name or region.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "10px" }}>
          {filtered.map(c => (
            <button
              key={c.name}
              onClick={() => setSelectedCouncil(c)}
              style={{
                textAlign: "left",
                background: "var(--color-background-primary)",
                border: "0.5px solid var(--color-border-tertiary)",
                borderRadius: "10px",
                padding: "12px 14px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "10px",
                transition: "border-color 0.15s, transform 0.15s",
                cursor: "pointer",
                fontFamily: "inherit",
                color: "var(--color-text-primary)",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--color-border-secondary)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--color-border-tertiary)"; e.currentTarget.style.transform = "translateY(0)"; }}
            >
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: "13px", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</p>
                <p style={{ margin: "2px 0 0", fontSize: "11px", color: "var(--color-text-secondary)" }}>{c.type} · {c.region}</p>
              </div>
              <span style={{ fontSize: "11px", color: "#1A3FA8", fontWeight: 500, whiteSpace: "nowrap", flexShrink: 0 }}>View jobs →</span>
            </button>
          ))}
        </div>
      )}

      <p style={{ marginTop: "32px", fontSize: "11px", color: "var(--color-text-secondary)", textAlign: "center", lineHeight: 1.6 }}>
        Jobs sourced from jobsgopublic.com, myjobscotland.gov.uk, wmjobs.co.uk, and lg-jobs.co.uk.<br />
        Councils not covered by these feeds link directly to their careers page.
      </p>
    </div>
  );
}

function CouncilJobsView({ council, onBack }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/live-jobs?source=councils&council=${encodeURIComponent(council.name)}`)
      .then(r => r.json())
      .then(data => {
        setJobs(data.jobs || []);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [council.name]);

  return (
    <div style={S.section}>
      <button onClick={onBack}
        style={{
          background: "transparent",
          border: "none",
          color: "#1A3FA8",
          fontSize: "13px",
          cursor: "pointer",
          fontFamily: "inherit",
          padding: "6px 0",
          marginBottom: "16px",
        }}>
        ← Back to all councils
      </button>

      <div style={{
        background: "var(--color-background-primary)",
        border: "0.5px solid var(--color-border-tertiary)",
        borderRadius: "12px",
        padding: "20px 24px",
        marginBottom: "24px",
      }}>
        <h2 style={{ margin: 0, fontSize: "22px", fontWeight: 600, letterSpacing: "-0.01em" }}>{council.name}</h2>
        <p style={{ margin: "4px 0 12px", fontSize: "13px", color: "var(--color-text-secondary)" }}>
          {council.type} · {council.region}
        </p>
        <a href={council.url} target="_blank" rel="noopener noreferrer"
          style={{
            display: "inline-block",
            padding: "8px 14px",
            background: "#1A3FA8",
            color: "#fff",
            borderRadius: "8px",
            fontSize: "12px",
            fontWeight: 500,
            textDecoration: "none",
          }}>
          Visit council careers page ↗
        </a>
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: "48px 16px", color: "var(--color-text-secondary)", fontSize: "13px" }}>
          Loading jobs from public sector feeds…
        </div>
      )}

      {error && (
        <div style={{ padding: "16px", background: "rgba(255,107,107,0.08)", border: "1px solid rgba(255,107,107,0.3)", borderRadius: "10px", color: "#c53030", fontSize: "13px", marginBottom: "16px" }}>
          Couldn't load jobs: {error}
        </div>
      )}

      {!loading && !error && jobs.length === 0 && (
        <div style={{ textAlign: "center", padding: "48px 16px", background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "12px" }}>
          <p style={{ margin: "0 0 8px", fontSize: "14px", color: "var(--color-text-primary)", fontWeight: 500 }}>
            No matching jobs found in RSS feeds for {council.name}
          </p>
          <p style={{ margin: "0 0 16px", fontSize: "12px", color: "var(--color-text-secondary)" }}>
            This council may post jobs on their own site only. Visit their careers page directly:
          </p>
          <a href={council.url} target="_blank" rel="noopener noreferrer"
            style={{ display: "inline-block", padding: "10px 18px", background: "#1A3FA8", color: "#fff", borderRadius: "8px", fontSize: "13px", fontWeight: 500, textDecoration: "none" }}>
            Open council careers page ↗
          </a>
        </div>
      )}

      {!loading && jobs.length > 0 && (
        <>
          <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginBottom: "12px" }}>
            <strong style={{ color: "var(--color-text-primary)" }}>{jobs.length}</strong> live vacancies · Updated automatically
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {jobs.map((j, i) => (
              <a key={i} href={j.url} target="_blank" rel="noopener noreferrer"
                style={{
                  textDecoration: "none",
                  background: "var(--color-background-primary)",
                  border: "0.5px solid var(--color-border-tertiary)",
                  borderRadius: "10px",
                  padding: "14px 16px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "12px",
                  transition: "border-color 0.15s, transform 0.15s",
                  color: "var(--color-text-primary)",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--color-border-secondary)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--color-border-tertiary)"; e.currentTarget.style.transform = "translateY(0)"; }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={{ margin: 0, fontSize: "13px", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {j.title}
                  </p>
                  <p style={{ margin: "2px 0 0", fontSize: "11px", color: "var(--color-text-secondary)" }}>
                    {j.company}{j.location ? " · " + j.location : ""}{j.salary && j.salary !== "See listing" ? " · " + j.salary : ""}
                  </p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2px", flexShrink: 0 }}>
                  {j.posted && <span style={{ fontSize: "10px", color: "var(--color-text-secondary)" }}>{j.posted}</span>}
                  <span style={{ fontSize: "11px", color: "#1A3FA8", fontWeight: 500 }}>Apply ↗</span>
                </div>
              </a>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
