// src/CouncilsPage.jsx
import { useState, useMemo } from "react";
import councils, { COUNCIL_REGIONS } from "./councils.js";

const S = {
  section:   { maxWidth: "1200px", margin: "0 auto", padding: "2rem 1.5rem 4rem" },
  title:     { fontSize: "clamp(1.75rem, 3vw, 2.25rem)", fontWeight: 600, letterSpacing: "-0.02em", textAlign: "center", margin: "0 0 0.5rem" },
  sub:       { fontSize: "0.95rem", color: "var(--color-text-secondary)", textAlign: "center", marginBottom: "1.75rem" },
};

export default function CouncilsPage() {
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("All");

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
      <p style={S.sub}>Explore <strong>{councils.length}+</strong> UK councils and click through to their careers pages.</p>

      {/* Search + region filter */}
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

      {/* Result count */}
      <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginBottom: "12px" }}>
        Showing <strong style={{ color: "var(--color-text-primary)" }}>{filtered.length}</strong> of {councils.length} councils
      </p>

      {/* Councils list */}
      {filtered.length === 0 ? (
        <div style={{
          textAlign: "center",
          padding: "48px 16px",
          background: "var(--color-background-primary)",
          border: "0.5px solid var(--color-border-tertiary)",
          borderRadius: "12px",
          color: "var(--color-text-secondary)",
        }}>
          No councils match your search. Try a different name or region.
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "10px",
        }}>
          {filtered.map(c => (
            <a
              key={c.name}
              href={c.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                textDecoration: "none",
                background: "var(--color-background-primary)",
                border: "0.5px solid var(--color-border-tertiary)",
                borderRadius: "10px",
                padding: "12px 14px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "10px",
                transition: "border-color 0.15s, transform 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--color-border-secondary)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--color-border-tertiary)"; e.currentTarget.style.transform = "translateY(0)"; }}
            >
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: "13px", fontWeight: 500, color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {c.name}
                </p>
                <p style={{ margin: "2px 0 0", fontSize: "11px", color: "var(--color-text-secondary)" }}>
                  {c.type} · {c.region}
                </p>
              </div>
              <span style={{ fontSize: "11px", color: "#1A3FA8", fontWeight: 500, whiteSpace: "nowrap", flexShrink: 0 }}>Jobs ↗</span>
            </a>
          ))}
        </div>
      )}

      <p style={{ marginTop: "32px", fontSize: "11px", color: "var(--color-text-secondary)", textAlign: "center", lineHeight: 1.6 }}>
        Data covers councils across England, Wales, Scotland, and Northern Ireland.<br />
        Links open a Google search for each council's careers page in a new tab.
      </p>
    </div>
  );
}
