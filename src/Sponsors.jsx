import { useState, useEffect, useRef, useCallback } from "react";

const SECTORS = ["All", "Technology", "Finance", "Healthcare", "Engineering", "Education", "Hospitality", "Retail", "Public Sector", "Other"];
const ROUTES = ["All Routes", "Skilled Worker", "Health & Care Worker"];
const PER_PAGE = 20;

const S = {
  card: { background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: "1.25rem" },
  tag: (c) => ({ display: "inline-block", padding: "3px 10px", borderRadius: "var(--border-radius-md)", fontSize: "12px", fontWeight: 500, background: c === "purple" ? "rgba(26,63,168,0.12)" : c === "teal" ? "rgba(255,69,0,0.1)" : c === "blue" ? "#E3F2FD" : c === "green" ? "#E8F5E9" : "#F5F5F5", color: c === "purple" ? "#1A3FA8" : c === "teal" ? "#FF4500" : c === "blue" ? "#0D47A1" : c === "green" ? "#2E7D32" : "#444" }),
  inp: { padding: "10px 14px", borderRadius: "var(--border-radius-md)", border: "0.5px solid var(--color-border-secondary)", background: "var(--color-background-secondary)", color: "var(--color-text-primary)", fontSize: "14px", outline: "none", fontFamily: "inherit", width: "100%", boxSizing: "border-box" },
  pill: (a, color) => ({ padding: "6px 16px", borderRadius: "20px", border: a ? "none" : "0.5px solid var(--color-border-secondary)", background: a ? (color || "#1A3FA8") : "var(--color-background-primary)", color: a ? "#fff" : "var(--color-text-secondary)", fontSize: "13px", cursor: "pointer", fontFamily: "inherit", fontWeight: a ? 500 : 400, transition: "all 0.15s" }),
  btn: (primary) => ({ padding: "10px 22px", borderRadius: "var(--border-radius-md)", background: primary ? "#1A3FA8" : "transparent", color: primary ? "#fff" : "var(--color-text-primary)", border: primary ? "none" : "0.5px solid var(--color-border-secondary)", fontSize: "14px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }),
  pageBtn: (a) => ({ minWidth: "36px", height: "36px", padding: "0 10px", borderRadius: "var(--border-radius-md)", border: a ? "none" : "0.5px solid var(--color-border-secondary)", background: a ? "#1A3FA8" : "var(--color-background-primary)", color: a ? "#fff" : "var(--color-text-secondary)", fontSize: "14px", cursor: a ? "default" : "pointer", fontFamily: "inherit", fontWeight: a ? 500 : 400 }),
};

const SECTOR_COLORS = {
  Technology: "#1A3FA8", Finance: "#0D47A1", Healthcare: "#FF4500",
  Engineering: "#E65100", Education: "#6A1B9A", Hospitality: "#F57C00",
  Retail: "#00695C", "Public Sector": "#37474F", Other: "#546E7A",
};

function SponsorCard({ sponsor, onClick }) {
  const color = SECTOR_COLORS[sponsor.sector] || "#1A3FA8";
  return (
    <div style={{ ...S.card, cursor: "pointer", transition: "transform 0.15s, box-shadow 0.15s, border-color 0.15s" }}
      onClick={onClick}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 6px 20px ${color}22`; e.currentTarget.style.borderColor = `${color}44`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = "var(--color-border-tertiary)"; }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
        <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: `linear-gradient(135deg, ${color}, ${color}99)`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "17px", flexShrink: 0 }}>
          {sponsor.name[0].toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 500, margin: "0 0 2px", fontSize: "13.5px", color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sponsor.name}</p>
          <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", margin: 0 }}>📍 {sponsor.location || "UK"}</p>
        </div>
        {sponsor.rating === "A" && <span style={{ ...S.tag("green"), fontSize: "11px", flexShrink: 0 }}>A</span>}
      </div>
      <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", marginBottom: "10px" }}>
        <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: "var(--border-radius-md)", fontSize: "11px", fontWeight: 500, background: `${color}18`, color }}>{sponsor.sector}</span>
        <span style={{ ...S.tag("teal"), fontSize: "11px" }}>{sponsor.route === "Health & Care Worker" ? "Health & Care" : "Skilled Worker"}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>✓ Licensed to issue CoS</span>
        <span style={{ fontSize: "11px", color, fontWeight: 500 }}>View →</span>
      </div>
    </div>
  );
}

function SponsorDetail({ sponsor, onBack }) {
  const color = SECTOR_COLORS[sponsor.sector] || "#1A3FA8";
  return (
    <div style={{ maxWidth: "760px", margin: "0 auto", padding: "2rem 1.5rem" }}>
      <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: "6px", background: "transparent", border: "none", color: "var(--color-text-secondary)", fontSize: "14px", cursor: "pointer", fontFamily: "inherit", marginBottom: "1.5rem", padding: 0 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        Back to sponsors
      </button>

      <div style={{ ...S.card, padding: "2rem", marginBottom: "1rem" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
          <div style={{ width: "56px", height: "56px", borderRadius: "14px", background: `linear-gradient(135deg,${color},${color}99)`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "24px", flexShrink: 0 }}>
            {sponsor.name[0].toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: "1.4rem", fontWeight: 500, margin: "0 0 8px" }}>{sponsor.name}</h1>
            <div style={{ display: "flex", gap: "7px", flexWrap: "wrap" }}>
              <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: "var(--border-radius-md)", fontSize: "12px", fontWeight: 500, background: `${color}18`, color }}>{sponsor.sector}</span>
              <span style={S.tag("teal")}>✓ Licensed Sponsor</span>
              <span style={S.tag("blue")}>{sponsor.route}</span>
              {sponsor.rating === "A" && <span style={S.tag("green")}>A-Rated ✓</span>}
            </div>
          </div>
        </div>
        <div style={{ borderTop: "0.5px solid var(--color-border-tertiary)", marginTop: "1.5rem", paddingTop: "1.5rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem" }}>
          {[["📍", "Location", sponsor.location || "UK"], ["🏢", "Sector", sponsor.sector], ["🛂", "Visa Route", sponsor.route], ["⭐", "Rating", `${sponsor.rating}-Rated`]].map(([icon, label, val]) => (
            <div key={label}><p style={{ fontSize: "12px", color: "var(--color-text-secondary)", margin: "0 0 3px" }}>{icon} {label}</p><p style={{ fontSize: "14px", fontWeight: 500, margin: 0 }}>{val}</p></div>
          ))}
        </div>
      </div>

      <div style={{ ...S.card, marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 500, margin: "0 0 0.75rem" }}>🛂 Visa Sponsorship Details</h2>
        {[
          `${sponsor.name} holds an active ${sponsor.rating}-rated sponsor licence from the UK Home Office`,
          `Licensed on the ${sponsor.route} visa route — can issue Certificates of Sponsorship (CoS)`,
          "A-rated sponsors meet all Home Office compliance requirements",
          "Minimum salary for new Skilled Worker applications: £41,700+ (from July 2025)",
          "Worker must meet skill level RQF3+ and English language B2 requirements",
        ].map((item, i) => (
          <p key={i} style={{ fontSize: "14px", color: "var(--color-text-secondary)", margin: "0 0 8px", display: "flex", gap: "8px", lineHeight: 1.6 }}>
            <span style={{ color: "#FF4500", flexShrink: 0 }}>✓</span><span>{item}</span>
          </p>
        ))}
      </div>

      <div style={{ background: "rgba(26,63,168,0.12)", border: "0.5px solid #AFA9EC", borderRadius: "var(--border-radius-lg)", padding: "1.25rem", marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 500, margin: "0 0 0.75rem", color: "var(--color-text-primary)" }}>📋 How to get sponsored here</h2>
        {["Find and apply for a suitable role at this organisation", "State in your application that you require visa sponsorship", "If offered the job, they assign you a Certificate of Sponsorship (CoS)", "Apply for your Skilled Worker visa using the CoS reference number", "Home Office decision: typically 3–8 weeks from application"].map((step, i) => (
          <p key={i} style={{ fontSize: "14px", color: "var(--color-text-primary)", margin: "0 0 8px", display: "flex", gap: "10px", lineHeight: 1.6 }}>
            <span style={{ background: "#1A3FA8", color: "#fff", borderRadius: "50%", width: "20px", height: "20px", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
            <span>{step}</span>
          </p>
        ))}
      </div>

      <div style={{ ...S.card, marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 500, margin: "0 0 0.5rem" }}>🏛️ Verify on Official Register</h2>
        <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", margin: "0 0 1rem", lineHeight: 1.6 }}>Always verify the current licence status on the official Home Office register before applying.</p>
        <a href="https://www.gov.uk/government/publications/register-of-licensed-sponsors-workers" target="_blank" rel="noopener noreferrer"
          style={{ ...S.btn(false), textDecoration: "none", display: "inline-block", fontSize: "13px", padding: "8px 16px" }}>
          Check on GOV.UK Register ↗
        </a>
      </div>

      <button style={S.btn(false)} onClick={onBack}>← Back to all sponsors</button>
    </div>
  );
}

export default function SponsorsPage() {
  const [sponsors, setSponsors] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);

  // Filters
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [sector, setSector] = useState("All");
  const [route, setRoute] = useState("All Routes");
  const [page, setPage] = useState(1);

  const topRef = useRef(null);
  const searchTimer = useRef(null);

  const fetchSponsors = useCallback(async (params = {}) => {
    setLoading(true); setError("");
    try {
      const p = new URLSearchParams({
        q: params.search ?? search,
        location: params.location ?? location,
        sector: params.sector ?? sector,
        route: params.route ?? route,
        page: params.page ?? page,
        perPage: PER_PAGE,
      });
      const res = await fetch(`/api/sponsors?${p}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load sponsors");
      setSponsors(data.sponsors || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 0);
    } catch (e) { setError(e.message); }
    setLoading(false);
  }, [search, location, sector, route, page]);

  // Initial load
  useEffect(() => { fetchSponsors({ page: 1 }); }, []);

  // Debounced search
  function handleSearch(val) {
    setSearch(val); setPage(1);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => fetchSponsors({ search: val, page: 1 }), 400);
  }

  function handleLocation(val) {
    setLocation(val); setPage(1);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => fetchSponsors({ location: val, page: 1 }), 400);
  }

  function handleSector(val) {
    setSector(val); setPage(1);
    fetchSponsors({ sector: val, page: 1 });
  }

  function handleRoute(val) {
    setRoute(val); setPage(1);
    fetchSponsors({ route: val, page: 1 });
  }

  function handlePage(p) {
    setPage(p);
    fetchSponsors({ page: p });
    topRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  function handleClear() {
    setSearch(""); setLocation(""); setSector("All"); setRoute("All Routes"); setPage(1);
    fetchSponsors({ search: "", location: "", sector: "All", route: "All Routes", page: 1 });
  }

  if (selected) return <SponsorDetail sponsor={selected} onBack={() => { setSelected(null); window.scrollTo(0, 0); }} />;

  // Pagination page numbers
  function getPageNums() {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page <= 4) return [1, 2, 3, 4, 5, "...", totalPages];
    if (page >= totalPages - 3) return [1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, "...", page - 1, page, page + 1, "...", totalPages];
  }

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "2rem 1.5rem" }}>
      <div ref={topRef}>
        {/* Header */}
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "0.5rem", flexWrap: "wrap" }}>
            <h2 style={{ fontSize: "1.8rem", fontWeight: 500, margin: 0 }}>Licensed Visa Sponsors</h2>
            <span style={{ ...S.tag("green") }}>🏛️ Home Office Register</span>
            {total > 0 && <span style={{ ...S.tag("purple") }}>{total.toLocaleString()} sponsors</span>}
          </div>
          <p style={{ color: "var(--color-text-secondary)", margin: 0, fontSize: "15px" }}>
            Every employer licensed by the UK Home Office to sponsor Skilled Worker and Health & Care visas — sourced live from the official GOV.UK register.
          </p>
        </div>

        {/* Search & filters */}
        <div style={{ ...S.card, marginBottom: "1.25rem" }}>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "1rem" }}>
            <input style={{ ...S.inp, flex: 2, minWidth: "180px" }} placeholder="🔍 Search by company name..."
              value={search} onChange={e => handleSearch(e.target.value)} />
            <input style={{ ...S.inp, flex: 1, minWidth: "140px" }} placeholder="📍 Filter by city / location..."
              value={location} onChange={e => handleLocation(e.target.value)} />
            {(search || location || sector !== "All" || route !== "All Routes") && (
              <button style={{ ...S.btn(false), padding: "10px 16px", fontSize: "13px", color: "#E24B4A", borderColor: "rgba(226,75,74,0.3)", whiteSpace: "nowrap" }} onClick={handleClear}>
                Clear ✕
              </button>
            )}
          </div>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "0.75rem" }}>
            {SECTORS.map(s => <button key={s} style={{ ...S.pill(sector === s, SECTOR_COLORS[s]), fontSize: "12px", padding: "5px 12px" }} onClick={() => handleSector(s)}>{s}</button>)}
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: "13px", color: "var(--color-text-secondary)", fontWeight: 500 }}>Visa route:</span>
            {ROUTES.map(r => <button key={r} style={{ ...S.pill(route === r, r === "Health & Care Worker" ? "#FF4500" : "#1A3FA8"), fontSize: "12px" }} onClick={() => handleRoute(r)}>{r}</button>)}
          </div>
        </div>

        {/* GOV.UK banner */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 14px", background: "#E8F5E9", border: "0.5px solid #81C784", borderRadius: "var(--border-radius-md)", marginBottom: "1.25rem", flexWrap: "wrap" }}>
          <span style={{ fontSize: "18px" }}>🏛️</span>
          <p style={{ fontSize: "13px", margin: 0, flex: 1, color: "#1B5E20", lineHeight: 1.5 }}>
            <strong>Official Source:</strong> Live data from the UK Home Office Register of Licensed Sponsors. Updated monthly. Always verify at GOV.UK before applying.
          </p>
          <a href="https://www.gov.uk/government/publications/register-of-licensed-sponsors-workers" target="_blank" rel="noopener noreferrer"
            style={{ padding: "6px 14px", borderRadius: "var(--border-radius-md)", background: "#2E7D32", color: "#fff", fontSize: "12px", fontWeight: 500, textDecoration: "none", whiteSpace: "nowrap" }}>
            Download full CSV ↗
          </a>
        </div>

        {/* Results count */}
        <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", marginBottom: "1.25rem" }}>
          {loading ? "🔍 Loading sponsors from GOV.UK register..." : error ? "" :
            <>Showing <strong>{((page - 1) * PER_PAGE) + 1}–{Math.min(page * PER_PAGE, total)}</strong> of <strong>{total.toLocaleString()}</strong> licensed sponsors
              {search && ` matching "${search}"`}
              {location && ` in "${location}"`}
              {sector !== "All" && ` · ${sector}`}
              {route !== "All Routes" && ` · ${route}`}
            </>
          }
        </p>
      </div>

      {/* Error */}
      {error && (
        <div style={{ ...S.card, background: "#FEE8E8", border: "0.5px solid #F5A0A0", marginBottom: "1rem", textAlign: "center", padding: "2rem" }}>
          <p style={{ fontSize: "1.5rem", margin: "0 0 0.5rem" }}>⚠️</p>
          <p style={{ fontWeight: 500, color: "#9B1C1C", marginBottom: "0.5rem" }}>Could not load live register</p>
          <p style={{ color: "#9B1C1C", fontSize: "13px", marginBottom: "1rem" }}>{error}</p>
          <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap" }}>
            <button style={S.btn(true)} onClick={() => fetchSponsors({ page: 1 })}>Try again</button>
            <a href="https://www.gov.uk/government/publications/register-of-licensed-sponsors-workers" target="_blank" rel="noopener noreferrer"
              style={{ ...S.btn(false), textDecoration: "none" }}>View on GOV.UK ↗</a>
          </div>
        </div>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
          {[...Array(12)].map((_, i) => (
            <div key={i} style={{ ...S.card }}>
              <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "var(--color-background-secondary)", flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ height: "14px", background: "var(--color-background-secondary)", borderRadius: "4px", marginBottom: "6px", width: "70%" }} />
                  <div style={{ height: "11px", background: "var(--color-background-secondary)", borderRadius: "4px", width: "45%" }} />
                </div>
              </div>
              <div style={{ height: "22px", background: "var(--color-background-secondary)", borderRadius: "20px", width: "50%", marginBottom: "10px" }} />
              <div style={{ height: "11px", background: "var(--color-background-secondary)", borderRadius: "4px", width: "60%" }} />
            </div>
          ))}
        </div>
      )}

      {/* Sponsor cards */}
      {!loading && !error && sponsors.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
          {sponsors.map((s, i) => <SponsorCard key={i} sponsor={s} onClick={() => { setSelected(s); window.scrollTo(0, 0); }} />)}
        </div>
      )}

      {/* No results */}
      {!loading && !error && sponsors.length === 0 && (
        <div style={{ ...S.card, textAlign: "center", padding: "3rem" }}>
          <p style={{ fontSize: "2rem", margin: "0 0 1rem" }}>🔍</p>
          <p style={{ fontWeight: 500 }}>No sponsors found</p>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "14px", marginBottom: "1.25rem" }}>Try a different search or clear your filters</p>
          <button style={{ ...S.btn(true), display: "inline-block" }} onClick={handleClear}>Clear all filters</button>
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <>
          <div style={{ display: "flex", gap: "6px", justifyContent: "center", alignItems: "center", marginTop: "2rem", flexWrap: "wrap" }}>
            <button style={{ ...S.pageBtn(false), opacity: page === 1 ? 0.4 : 1 }} onClick={() => page > 1 && handlePage(page - 1)} disabled={page === 1}>← Prev</button>
            {getPageNums().map((p, i) => (
              p === "..." ? <span key={`d${i}`} style={{ color: "var(--color-text-secondary)", padding: "0 4px" }}>…</span>
              : <button key={p} style={S.pageBtn(p === page)} onClick={() => p !== page && handlePage(p)}>{p}</button>
            ))}
            <button style={{ ...S.pageBtn(false), opacity: page === totalPages ? 0.4 : 1 }} onClick={() => page < totalPages && handlePage(page + 1)} disabled={page === totalPages}>Next →</button>
          </div>
          <p style={{ textAlign: "center", fontSize: "13px", color: "var(--color-text-secondary)", marginTop: "0.75rem" }}>
            Page {page} of {totalPages.toLocaleString()} · {total.toLocaleString()} total licensed sponsors
          </p>
        </>
      )}
    </div>
  );
}
