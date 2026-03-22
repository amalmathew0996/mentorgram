import { useState, useRef, useEffect } from "react";

const NAV_LINKS = ["Home", "AI Mentor", "Education Paths", "UK Universities", "Sponsorship Jobs", "Contact"];
const SECTORS = ["All", "Technology", "AI & Data", "Healthcare", "Finance", "Engineering", "Business"];
const JOBS_PER_PAGE = 6;

const EDUCATION_SYSTEMS = [
  { country: "🇬🇧 United Kingdom", systems: ["GCSE", "A-Levels", "BTEC", "Scottish Highers"] },
  { country: "🇮🇳 India", systems: ["CBSE", "ICSE", "State Boards"] },
  { country: "🇺🇸 USA", systems: ["High School Diploma", "AP", "SAT/ACT"] },
  { country: "🇳🇬 Nigeria", systems: ["WAEC", "NECO", "JAMB"] },
  { country: "🇵🇰 Pakistan", systems: ["Intermediate/FSc", "Matric", "O/A Levels"] },
  { country: "🌍 International", systems: ["IB", "EU Systems", "Middle East Curricula"] },
];

const UK_UNIVERSITIES = [
  { name: "University of Oxford", rank: "#1 UK", focus: "Research & Humanities", entry: "AAA at A-Level", intl: "IELTS 7.0+", scholarships: "Rhodes, Clarendon" },
  { name: "University of Cambridge", rank: "#2 UK", focus: "STEM & Research", entry: "A*AA at A-Level", intl: "IELTS 7.5+", scholarships: "Gates Cambridge" },
  { name: "Imperial College London", rank: "#3 UK", focus: "Engineering & Medicine", entry: "A*AA at A-Level", intl: "IELTS 6.5+", scholarships: "Imperial Bursaries" },
  { name: "University of Edinburgh", rank: "#5 UK", focus: "Medicine & Law", entry: "AAA at A-Level", intl: "IELTS 6.5+", scholarships: "Edinburgh Global" },
  { name: "University of Manchester", rank: "#8 UK", focus: "Business & Technology", entry: "AAB at A-Level", intl: "IELTS 6.5+", scholarships: "President's Award" },
  { name: "King's College London", rank: "#6 UK", focus: "Medicine & Law", entry: "AAB at A-Level", intl: "IELTS 7.0+", scholarships: "King's Scholarships" },
];

const FEATURES = [
  { icon: "🤖", title: "AI Mentor", desc: "Get personalised guidance on education and career paths powered by advanced AI." },
  { icon: "🎓", title: "University Gateway", desc: "Explore UK universities, entry requirements, scholarships and UCAS guidance." },
  { icon: "💼", title: "Sponsorship Jobs", desc: "Find UK employers who offer visa sponsorship across high-demand sectors." },
  { icon: "🗺️", title: "Education Pathways", desc: "Navigate your local education system with expert AI support and planning." },
  { icon: "📊", title: "Career Insights", desc: "Access salary data, industry demand forecasts and skills gap analysis." },
  { icon: "🌍", title: "Global Reach", desc: "Supporting students from 50+ countries on their journey to UK education." },
];

const FALLBACK_JOBS = [
  { title: "Software Engineer (Backend)", company: "Duffel", location: "London", salary: "Competitive", sector: "Technology", posted: "Mar 10, 2026", url: "https://to.indeed.com/aa8lkh89tm2f" },
  { title: "kdb+ Developer", company: "Data Intellect", location: "London", salary: "Competitive", sector: "Technology", posted: "Mar 18, 2026", url: "https://to.indeed.com/aacy7qmtdngf" },
  { title: "Junior Automation Developer", company: "Yu Group", location: "Nottingham", salary: "£30,000–£35,000", sector: "Technology", posted: "Mar 17, 2026", url: "https://to.indeed.com/aazw9p7dtkzw" },
  { title: "IT Consultant", company: "I-NET Software Solutions", location: "Hounslow", salary: "£40,000–£45,000", sector: "Technology", posted: "Feb 23, 2026", url: "https://to.indeed.com/aaftt8kkjy44" },
  { title: "Senior Software Developer", company: "Auto Integrate", location: "Portsmouth", salary: "£68,000–£87,000", sector: "Technology", posted: "Mar 17, 2026", url: "https://to.indeed.com/aarkm6dwyhhx" },
  { title: "C++ Software Engineer", company: "Insignis", location: "Lincoln", salary: "From £60,000", sector: "Technology", posted: "Feb 12, 2026", url: "https://to.indeed.com/aa9ygglssp8f" },
  { title: "Web Developer & Programmer", company: "Vape Wholesale Store", location: "Manchester", salary: "£45,000–£46,000", sector: "Technology", posted: "Jan 15, 2026", url: "https://to.indeed.com/aazmpnfjsqxl" },
  { title: "Mobile App Developer (Flutter)", company: "Blackstar Amplification", location: "Northampton", salary: "£26,000–£45,000", sector: "Technology", posted: "Sep 25, 2025", url: "https://to.indeed.com/aaqqtxgvhf94" },
  { title: "Test & Release Analyst", company: "ACI-UK", location: "Blackpool", salary: "From £40,000", sector: "Technology", posted: "Mar 04, 2026", url: "https://to.indeed.com/aam9j284xvzb" },
  { title: "Senior Test & Validation Engineer", company: "Pearson Whiffin", location: "Sandwich", salary: "£45,000–£50,000", sector: "Technology", posted: "Mar 09, 2026", url: "https://to.indeed.com/aa4vtj4y4b8j" },
  { title: "Data Engineer", company: "Cathedral Appointments", location: "Exeter", salary: "£50,000", sector: "AI & Data", posted: "Mar 06, 2026", url: "https://to.indeed.com/aam2lxzb4qg6" },
  { title: "Data Scientist", company: "Ecotricity Group", location: "Stroud", salary: "£55,000–£65,000", sector: "AI & Data", posted: "Feb 17, 2026", url: "https://to.indeed.com/aanpm8v78c4q" },
  { title: "Applied Research Scientist", company: "Emotech LTD", location: "London", salary: "From £45,000", sector: "AI & Data", posted: "Mar 20, 2026", url: "https://to.indeed.com/aadkm9q8xclx" },
  { title: "Senior Data Engineer", company: "AECOM", location: "Bristol", salary: "£58,500–£71,812", sector: "AI & Data", posted: "Mar 11, 2026", url: "https://to.indeed.com/aaz2vplvmxll" },
  { title: "Epidemiology Scientist", company: "MSD", location: "London", salary: "Competitive", sector: "Healthcare", posted: "Mar 10, 2026", url: "https://to.indeed.com/aatbqs2gbt6m" },
  { title: "Medical Secretary", company: "NHS", location: "North Hykeham", salary: "£27,485–£30,162", sector: "Healthcare", posted: "Mar 09, 2026", url: "https://to.indeed.com/aa62hddsjc7x" },
  { title: "School Nurse Assistant", company: "Rikkyo School", location: "Rudgwick", salary: "£27,000–£36,000", sector: "Healthcare", posted: "Mar 03, 2026", url: "https://to.indeed.com/aaqfn8qxl7vc" },
  { title: "Financial Analyst", company: "Confidential", location: "Bromley", salary: "£45,800–£100,000", sector: "Finance", posted: "Mar 12, 2026", url: "https://to.indeed.com/aagp8bkm6tfb" },
  { title: "Head of Marketing", company: "VeryConnect", location: "Glasgow", salary: "£85,000–£110,000", sector: "Business", posted: "Feb 25, 2026", url: "https://to.indeed.com/aad9y6rb22hy" },
  { title: "Communications Manager", company: "Calex UK Ltd", location: "Coventry", salary: "Up to £44,000", sector: "Business", posted: "Mar 19, 2026", url: "https://to.indeed.com/aa967gjhplpf" },
  { title: "Event Sponsorship Sales Manager", company: "IQPC", location: "London", salary: "£45,000–£55,000", sector: "Business", posted: "Mar 17, 2026", url: "https://to.indeed.com/aa8crzb2lbc9" },
  { title: "Business Development Manager", company: "London Orthodontic Group", location: "Richmond", salary: "£38,000–£55,000", sector: "Business", posted: "Feb 03, 2026", url: "https://to.indeed.com/aaxjflx28vww" },
  { title: "Client Relationship Manager", company: "The Lettings Hub", location: "Peterborough", salary: "£28,000–£35,000", sector: "Business", posted: "Jan 20, 2026", url: "https://to.indeed.com/aac2mqgsqg9d" },
  { title: "Equipment Engineer", company: "Seagate Technology", location: "Derry", salary: "£27,827–£35,875", sector: "Engineering", posted: "Mar 09, 2026", url: "https://to.indeed.com/aa96f2kjv2np" },
  { title: "Civil Engineer Project Leader", company: "JN Bentley", location: "Reading", salary: "£36,000–£66,000", sector: "Engineering", posted: "Aug 12, 2025", url: "https://to.indeed.com/aa6tvqx8gsfd" },
  { title: "Project Leader", company: "Mott MacDonald", location: "Newport", salary: "£36,500–£55,000", sector: "Engineering", posted: "Jul 25, 2025", url: "https://to.indeed.com/aadr7s9xb4fw" },
  { title: "Lead Manufacturing Engineer", company: "GE Aerospace", location: "Gloucester", salary: "£23,795–£40,500", sector: "Engineering", posted: "Feb 25, 2026", url: "https://to.indeed.com/aagryjj7g7pb" },
  { title: "Product R&D Co-ordinator", company: "Glasdon Group", location: "Blackpool", salary: "£45,450–£70,875", sector: "Engineering", posted: "Mar 12, 2026", url: "https://to.indeed.com/aafvw7lcz8pb" },
  { title: "International Sales Executive", company: "Glasdon Group", location: "Blackpool", salary: "Competitive", sector: "Business", posted: "Mar 12, 2026", url: "https://to.indeed.com/aabtpz8lk26q" },
  { title: "Sales Development Representative", company: "Nurtur Group", location: "Derby", salary: "From £26,000", sector: "Business", posted: "Mar 17, 2026", url: "https://to.indeed.com/aawpzfbslhm2" },
];

// ─── Styles (outside component so they never cause remounts) ───────────────
const S = {
  wrap: { fontFamily: "var(--font-sans)", color: "var(--color-text-primary)", minHeight: "100vh", background: "var(--color-background-tertiary)" },
  btnPrimary: { padding: "12px 28px", borderRadius: "var(--border-radius-md)", background: "#534AB7", color: "#fff", border: "none", fontSize: "15px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit" },
  btnOutline: { padding: "12px 28px", borderRadius: "var(--border-radius-md)", background: "transparent", color: "var(--color-text-primary)", border: "0.5px solid var(--color-border-secondary)", fontSize: "15px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit" },
  section: { maxWidth: "1100px", margin: "0 auto", padding: "3rem 1.5rem" },
  sectionTitle: { fontSize: "1.6rem", fontWeight: 500, margin: "0 0 0.5rem" },
  sectionSub: { color: "var(--color-text-secondary)", margin: "0 0 2rem", fontSize: "15px" },
  grid3: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem" },
  grid2: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1rem" },
  card: { background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: "1.25rem" },
  tag: (c) => ({ display: "inline-block", padding: "3px 10px", borderRadius: "var(--border-radius-md)", fontSize: "12px", fontWeight: 500, background: c === "purple" ? "#EEEDFE" : c === "teal" ? "#E1F5EE" : "#E6F1FB", color: c === "purple" ? "#3C3489" : c === "teal" ? "#085041" : "#0C447C" }),
  input: { padding: "10px 14px", borderRadius: "var(--border-radius-md)", border: "0.5px solid var(--color-border-secondary)", background: "var(--color-background-secondary)", color: "var(--color-text-primary)", fontSize: "14px", outline: "none", fontFamily: "inherit", width: "100%", boxSizing: "border-box" },
  footer: { borderTop: "0.5px solid var(--color-border-tertiary)", background: "var(--color-background-primary)", padding: "2rem 1.5rem", textAlign: "center" },
  statsRow: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1rem", margin: "2rem 0" },
  statCard: { background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", padding: "1rem", textAlign: "center" },
  filterBtn: (a) => ({ padding: "6px 16px", borderRadius: "20px", border: a ? "none" : "0.5px solid var(--color-border-secondary)", background: a ? "#534AB7" : "var(--color-background-primary)", color: a ? "#fff" : "var(--color-text-secondary)", fontSize: "13px", cursor: "pointer", fontFamily: "inherit" }),
  pageBtn: (a) => ({ minWidth: "36px", height: "36px", padding: "0 10px", borderRadius: "var(--border-radius-md)", border: a ? "none" : "0.5px solid var(--color-border-secondary)", background: a ? "#534AB7" : "var(--color-background-primary)", color: a ? "#fff" : "var(--color-text-secondary)", fontSize: "14px", cursor: a ? "default" : "pointer", fontFamily: "inherit", fontWeight: a ? 500 : 400 }),
  pageArrow: (d) => ({ width: "36px", height: "36px", borderRadius: "var(--border-radius-md)", border: "0.5px solid var(--color-border-secondary)", background: "transparent", color: d ? "var(--color-border-secondary)" : "var(--color-text-primary)", fontSize: "18px", cursor: d ? "default" : "pointer", fontFamily: "inherit" }),
};

// ─── Jobs Page (outside main component to prevent remounting) ──────────────
function JobsPage({ allJobs, jobsLoading, updatedAt, onFetchJobs, onNavigate }) {
  const [sector, setSector] = useState("All");
  const [filterQuery, setFilterQuery] = useState("");
  const [liveSearch, setLiveSearch] = useState("");
  const [locationSearch, setLocationSearch] = useState("");
  const [page, setPage] = useState(1);
  const topRef = useRef(null);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [sector, filterQuery]);

  // Scroll to top on page change
  useEffect(() => { topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }, [page]);

  const filtered = allJobs.filter(j => {
    const matchSector = sector === "All" || j.sector === sector;
    const q = filterQuery.toLowerCase().trim();
    const matchSearch = !q ||
      j.title.toLowerCase().includes(q) ||
      j.company.toLowerCase().includes(q) ||
      j.location.toLowerCase().includes(q) ||
      j.sector.toLowerCase().includes(q);
    return matchSector && matchSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / JOBS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * JOBS_PER_PAGE, safePage * JOBS_PER_PAGE);

  function getPageNums() {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (safePage <= 3) return [1, 2, 3, 4, 5];
    if (safePage >= totalPages - 2) return [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [safePage - 2, safePage - 1, safePage, safePage + 1, safePage + 2];
  }

  return (
    <div style={S.section}>
      <div ref={topRef}>
        <h2 style={S.sectionTitle}>Sponsorship jobs</h2>
        <p style={{ ...S.sectionSub, marginBottom: "1.5rem" }}>Search UK jobs offering visa sponsorship.</p>
      </div>

      {/* Single unified search box */}
      <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: "1.25rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <input
            style={{ ...S.input, flex: 2, minWidth: "160px" }}
            placeholder="🔍 Job title or keywords..."
            value={filterQuery}
            onChange={e => { setFilterQuery(e.target.value); setLiveSearch(e.target.value); }}
            onKeyDown={e => e.key === "Enter" && onFetchJobs(filterQuery, locationSearch)}
          />
          <input
            style={{ ...S.input, flex: 1, minWidth: "120px" }}
            placeholder="📍 Location (UK)"
            value={locationSearch}
            onChange={e => setLocationSearch(e.target.value)}
            onKeyDown={e => e.key === "Enter" && onFetchJobs(filterQuery, locationSearch)}
          />
          <button
            style={{ ...S.btnPrimary, padding: "10px 20px", fontSize: "14px", whiteSpace: "nowrap" }}
            onClick={() => onFetchJobs(filterQuery, locationSearch)}
            disabled={jobsLoading}
          >
            {jobsLoading ? "Searching..." : "Search Indeed"}
          </button>
        </div>
        <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", margin: "10px 0 0" }}>
          Type to filter results instantly · Click <strong>Search Indeed</strong> for fresh results
        </p>

        {/* Quick search chips */}
        <div style={{ display: "flex", gap: "8px", marginTop: "10px", flexWrap: "wrap" }}>
          {["Software Engineer", "Data Scientist", "NHS Nurse", "Financial Analyst", "Civil Engineer", "Marketing Manager"].map(q => (
            <button key={q} style={{ ...S.filterBtn(false), fontSize: "12px" }} onClick={() => { setFilterQuery(q); setLiveSearch(q); onFetchJobs(q, locationSearch); }}>{q}</button>
          ))}
        </div>
        {updatedAt && <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", margin: "8px 0 0" }}>Updated: {new Date(updatedAt).toLocaleTimeString()}</p>}
      </div>

      {/* Sector pills */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "1rem" }}>
        {SECTORS.map(sec => (
          <button key={sec} style={S.filterBtn(sector === sec)} onClick={() => setSector(sec)}>{sec}</button>
        ))}
      </div>

      {/* Results count */}
      <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", marginBottom: "1.25rem" }}>
        Showing {paginated.length} of {filtered.length} jobs
        {filterQuery && ` matching "${filterQuery}"`}
        {sector !== "All" && ` in ${sector}`}
        {jobsLoading && " — loading..."}
      </p>

      {/* Loading state */}
      {jobsLoading && (
        <div style={{ textAlign: "center", padding: "3rem", color: "var(--color-text-secondary)" }}>
          <p>Searching for UK sponsorship jobs...</p>
        </div>
      )}

      {/* Job cards */}
      {!jobsLoading && paginated.length > 0 && (
        <div style={S.grid2}>
          {paginated.map((j, i) => (
            <div key={i} style={{ ...S.card, display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1, marginRight: "10px" }}>
                  <p style={{ fontWeight: 500, margin: "0 0 4px", fontSize: "15px" }}>{j.title}</p>
                  <p style={{ color: "var(--color-text-secondary)", fontSize: "13px", margin: 0 }}>{j.company}</p>
                </div>
                <span style={S.tag("teal")}>Visa Sponsor</span>
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                {j.sector && <span style={S.tag("purple")}>{j.sector}</span>}
                <span style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>📍 {j.location}</span>
                {j.posted && <span style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>🗓 {j.posted}</span>}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <p style={{ fontWeight: 500, color: "#3C3489", margin: 0, fontSize: "14px" }}>{j.salary}</p>
                {j.url && <a href={j.url} target="_blank" rel="noopener noreferrer" style={{ padding: "7px 16px", borderRadius: "var(--border-radius-md)", background: "#534AB7", color: "#fff", fontSize: "13px", textDecoration: "none", fontWeight: 500 }}>Apply ↗</a>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No results */}
      {!jobsLoading && paginated.length === 0 && (
        <div style={{ ...S.card, textAlign: "center", padding: "2.5rem" }}>
          <p style={{ color: "var(--color-text-secondary)", marginBottom: "1rem" }}>No jobs found. Try a different search or clear filters.</p>
          <button style={S.btnOutline} onClick={() => { setFilterQuery(""); setSector("All"); }}>Clear filters</button>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && !jobsLoading && (
        <>
          <div style={{ display: "flex", gap: "6px", justifyContent: "center", alignItems: "center", marginTop: "2rem", flexWrap: "wrap" }}>
            {safePage > 3 && totalPages > 5 && <><button style={S.pageBtn(false)} onClick={() => setPage(1)}>1</button><span style={{ color: "var(--color-text-secondary)" }}>…</span></>}
            {getPageNums().map(p => <button key={p} style={S.pageBtn(p === safePage)} onClick={() => setPage(p)}>{p}</button>)}
            {safePage < totalPages - 2 && totalPages > 5 && <><span style={{ color: "var(--color-text-secondary)" }}>…</span><button style={S.pageBtn(false)} onClick={() => setPage(totalPages)}>{totalPages}</button></>}
          </div>
          <div style={{ display: "flex", gap: "8px", justifyContent: "center", marginTop: "10px" }}>
            <button style={{ ...S.btnOutline, padding: "8px 20px", fontSize: "13px", opacity: safePage === 1 ? 0.4 : 1 }} onClick={() => safePage > 1 && setPage(p => p - 1)} disabled={safePage === 1}>← Previous</button>
            <button style={{ ...S.btnPrimary, padding: "8px 20px", fontSize: "13px", opacity: safePage === totalPages ? 0.4 : 1 }} onClick={() => safePage < totalPages && setPage(p => p + 1)} disabled={safePage === totalPages}>Next →</button>
          </div>
          <p style={{ textAlign: "center", fontSize: "13px", color: "var(--color-text-secondary)", marginTop: "0.75rem" }}>Page {safePage} of {totalPages} · {filtered.length} total</p>
        </>
      )}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────
export default function Mentorgram() {
  const [activePage, setActivePage] = useState("Home");
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! I'm your Mentorgram AI Mentor 👋 I can help with education pathways, UK university applications, career guidance, and finding visa-sponsored jobs. What would you like to explore?" }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [allJobs, setAllJobs] = useState(FALLBACK_JOBS);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistDone, setWaitlistDone] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    if (activePage === "Sponsorship Jobs") fetchJobs("", "");
  }, [activePage]);

  async function fetchJobs(q, loc) {
    setJobsLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (loc) params.set("location", loc);
      const res = await fetch(`/api/jobs?${params}`);
      const data = await res.json();
      if (data.jobs?.length > 0) { setAllJobs(data.jobs); setUpdatedAt(data.updatedAt); }
    } catch { /* keep fallback */ }
    setJobsLoading(false);
  }

  async function sendMessage() {
    if (!chatInput.trim() || chatLoading) return;
    const msg = chatInput.trim();
    setChatInput("");
    setMessages(prev => [...prev, { role: "user", content: msg }]);
    setChatLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, system: "You are the Mentorgram AI Mentor — friendly expert career and education advisor for UK pathways. Be concise, warm, actionable.", messages: [...messages, { role: "user", content: msg }].map(m => ({ role: m.role, content: m.content })) })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.content?.[0]?.text || "Could you rephrase that?" }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, trouble connecting. Try again." }]);
    }
    setChatLoading(false);
  }

  function navTo(page) { setActivePage(page); setMobileMenu(false); }

  const heroAccent = { background: "linear-gradient(135deg, #534AB7, #1D9E75)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" };

  function renderPage() {
    switch (activePage) {
      case "Home": return (
        <div>
          <div style={{ padding: "5rem 1.5rem 4rem", textAlign: "center", maxWidth: "720px", margin: "0 auto" }}>
            <div style={{ ...S.tag("purple"), marginBottom: "1rem", fontSize: "13px" }}>🚀 AI-Powered Education & Career Platform</div>
            <h1 style={{ fontSize: "clamp(2rem,5vw,3rem)", fontWeight: 500, lineHeight: 1.2, margin: "0 0 1rem" }}>Your AI Mentor for<br /><span style={heroAccent}>Education & UK Careers</span></h1>
            <p style={{ fontSize: "1.1rem", color: "var(--color-text-secondary)", lineHeight: 1.7, margin: "0 0 2rem" }}>Mentorgram guides students worldwide from education to employment — with personalised AI mentoring, UK university pathways, and visa-sponsored job opportunities.</p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
              <button style={S.btnPrimary} onClick={() => navTo("AI Mentor")}>Chat with AI Mentor</button>
              <button style={S.btnOutline} onClick={() => navTo("Sponsorship Jobs")}>Browse Jobs</button>
            </div>
            <div style={S.statsRow}>
              {[["50+","Countries Supported"],["100K+","Students Guided"],["500+","UK Employers"],[FALLBACK_JOBS.length+"+","Job Listings"]].map(([n,l]) => (
                <div key={l} style={S.statCard}><p style={{ fontSize: "24px", fontWeight: 500, margin: "0 0 4px" }}>{n}</p><p style={{ fontSize: "13px", color: "var(--color-text-secondary)", margin: 0 }}>{l}</p></div>
              ))}
            </div>
          </div>
          <div style={{ background: "var(--color-background-primary)", borderTop: "0.5px solid var(--color-border-tertiary)", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
            <div style={S.section}>
              <h2 style={S.sectionTitle}>Everything you need to succeed</h2>
              <p style={S.sectionSub}>From subject selection to landing your first UK job.</p>
              <div style={S.grid3}>
                {FEATURES.map(f => (
                  <div key={f.title} style={S.card}>
                    <div style={{ fontSize: "24px", marginBottom: "10px" }}>{f.icon}</div>
                    <p style={{ fontWeight: 500, margin: "0 0 6px", fontSize: "15px" }}>{f.title}</p>
                    <p style={{ color: "var(--color-text-secondary)", fontSize: "14px", margin: 0, lineHeight: 1.6 }}>{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={S.section}>
            <div style={{ maxWidth: "540px", margin: "0 auto", textAlign: "center" }}>
              <h2 style={S.sectionTitle}>Join the waitlist</h2>
              <p style={S.sectionSub}>Be among the first to access Mentorgram's full platform.</p>
              {waitlistDone ? (
                <div style={{ ...S.card, background: "#E1F5EE", border: "0.5px solid #5DCAA5" }}><p style={{ color: "#085041", fontWeight: 500, margin: 0 }}>🎉 You're on the list! We'll be in touch soon.</p></div>
              ) : (
                <div style={{ display: "flex", gap: "8px" }}>
                  <input style={{ ...S.input, flex: 1 }} type="email" placeholder="Enter your email address" value={waitlistEmail} onChange={e => setWaitlistEmail(e.target.value)} />
                  <button style={S.btnPrimary} onClick={() => waitlistEmail && setWaitlistDone(true)}>Join</button>
                </div>
              )}
            </div>
          </div>
        </div>
      );

      case "AI Mentor": return (
        <div style={{ maxWidth: "760px", margin: "0 auto", padding: "1.5rem" }}>
          <h2 style={{ ...S.sectionTitle, marginBottom: "0.25rem" }}>AI Mentor</h2>
          <p style={{ ...S.sectionSub, marginBottom: "1.5rem" }}>Ask me anything about education, universities, careers, or UK jobs.</p>
          <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", display: "flex", flexDirection: "column", height: "520px" }}>
            <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              {messages.map((m, i) => (
                <div key={i} style={m.role === "user" ? { alignSelf: "flex-end", background: "#534AB7", color: "#fff", padding: "10px 14px", borderRadius: "16px 16px 4px 16px", maxWidth: "75%", fontSize: "14px", lineHeight: 1.6 } : { alignSelf: "flex-start", background: "var(--color-background-secondary)", color: "var(--color-text-primary)", padding: "10px 14px", borderRadius: "16px 16px 16px 4px", maxWidth: "75%", fontSize: "14px", lineHeight: 1.6 }}>{m.content}</div>
              ))}
              {chatLoading && <div style={{ alignSelf: "flex-start", background: "var(--color-background-secondary)", padding: "10px 14px", borderRadius: "16px 16px 16px 4px", fontSize: "14px", color: "var(--color-text-secondary)" }}>Thinking...</div>}
              <div ref={messagesEndRef} />
            </div>
            <div style={{ display: "flex", gap: "8px", padding: "1rem", borderTop: "0.5px solid var(--color-border-tertiary)" }}>
              <input style={{ ...S.input, flex: 1 }} placeholder="Ask about universities, careers, visas..." value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()} />
              <button style={{ padding: "10px 20px", borderRadius: "var(--border-radius-md)", background: "#534AB7", color: "#fff", border: "none", fontSize: "14px", cursor: "pointer", fontWeight: 500, fontFamily: "inherit" }} onClick={sendMessage} disabled={chatLoading}>Send</button>
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px", marginTop: "1rem", flexWrap: "wrap" }}>
            {["How do I apply to UK universities?", "What jobs offer visa sponsorship?", "Which A-levels should I choose?", "How does the Skilled Worker visa work?"].map(q => (
              <button key={q} style={{ ...S.filterBtn(false), fontSize: "12px" }} onClick={() => setChatInput(q)}>{q}</button>
            ))}
          </div>
        </div>
      );

      case "Education Paths": return (
        <div style={S.section}>
          <h2 style={S.sectionTitle}>Education pathways</h2>
          <p style={S.sectionSub}>Supporting students from all major education systems worldwide.</p>
          <div style={S.grid2}>
            {EDUCATION_SYSTEMS.map(e => (
              <div key={e.country} style={S.card}>
                <p style={{ fontWeight: 500, margin: "0 0 10px", fontSize: "15px" }}>{e.country}</p>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>{e.systems.map(sys => <span key={sys} style={S.tag("purple")}>{sys}</span>)}</div>
                <button style={{ ...S.btnOutline, marginTop: "12px", padding: "8px 16px", fontSize: "13px" }} onClick={() => { setChatInput(`Tell me about ${e.systems[0]} and UK university pathways`); navTo("AI Mentor"); }}>Get guidance ↗</button>
              </div>
            ))}
          </div>
        </div>
      );

      case "UK Universities": return (
        <div style={S.section}>
          <h2 style={S.sectionTitle}>UK universities</h2>
          <p style={S.sectionSub}>Explore top UK universities, entry requirements and scholarships.</p>
          <div style={S.grid2}>
            {UK_UNIVERSITIES.map(u => (
              <div key={u.name} style={S.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                  <p style={{ fontWeight: 500, margin: 0, fontSize: "15px" }}>{u.name}</p>
                  <span style={S.tag("purple")}>{u.rank}</span>
                </div>
                <p style={{ color: "var(--color-text-secondary)", fontSize: "13px", margin: "0 0 10px" }}>{u.focus}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {[["UK entry",u.entry],["International",u.intl],["Scholarships",u.scholarships]].map(([l,v]) => (
                    <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                      <span style={{ color: "var(--color-text-secondary)" }}>{l}</span>
                      <span style={l==="Scholarships"?{color:"#3C3489"}:{}}>{v}</span>
                    </div>
                  ))}
                </div>
                <button style={{ ...S.btnOutline, marginTop: "12px", padding: "8px 16px", fontSize: "13px", width: "100%" }} onClick={() => { setChatInput(`Tell me more about ${u.name} — courses, tips and scholarships`); navTo("AI Mentor"); }}>Ask AI Mentor ↗</button>
              </div>
            ))}
          </div>
        </div>
      );

      case "Sponsorship Jobs": return (
        <JobsPage
          allJobs={allJobs}
          jobsLoading={jobsLoading}
          updatedAt={updatedAt}
          onFetchJobs={fetchJobs}
          onNavigate={navTo}
        />
      );

      case "Contact": return (
        <div style={S.section}>
          <div style={{ maxWidth: "540px", margin: "0 auto" }}>
            <h2 style={S.sectionTitle}>Get in touch</h2>
            <p style={S.sectionSub}>Have questions about Mentorgram? We'd love to hear from you.</p>
            <div style={S.card}>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div style={{ display: "flex", gap: "10px" }}>
                  <input style={S.input} placeholder="Your name" />
                  <input style={S.input} placeholder="Your email" />
                </div>
                <input style={S.input} placeholder="Subject" />
                <textarea style={{ ...S.input, height: "120px", resize: "vertical" }} placeholder="Your message..." />
                <button style={S.btnPrimary}>Send message</button>
              </div>
            </div>
            <div style={{ ...S.card, marginTop: "1rem" }}>
              <p style={{ fontWeight: 500, margin: "0 0 10px" }}>Contact details</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "14px", color: "var(--color-text-secondary)" }}>
                <span>📧 info@mentorgramai.com</span>
                <span>🌐 mentorgramai.com</span>
                <span>📍 United Kingdom</span>
              </div>
            </div>
          </div>
        </div>
      );

      default: return null;
    }
  }

  return (
    <div style={S.wrap}>
      <style>{`
        @media (max-width: 768px) { .desktop-nav { display: none !important; } .hamburger-btn { display: flex !important; } }
        @media (min-width: 769px) { .mobile-menu { display: none !important; } .hamburger-btn { display: none !important; } .desktop-nav { display: flex !important; } }
      `}</style>

      <nav style={{ background: "var(--color-background-primary)", borderBottom: "0.5px solid var(--color-border-tertiary)", padding: "0 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", height: "60px", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }} onClick={() => navTo("Home")}>
          <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "linear-gradient(135deg, #534AB7, #1D9E75)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 500, fontSize: "18px" }}>M</div>
          <span style={{ fontSize: "18px", fontWeight: 500, color: "var(--color-text-primary)" }}>Mentorgram</span>
        </div>
        <div className="desktop-nav" style={{ display: "flex", gap: "4px", alignItems: "center" }}>
          {NAV_LINKS.map(l => <button key={l} style={{ padding: "6px 12px", borderRadius: "var(--border-radius-md)", cursor: "pointer", fontSize: "14px", background: activePage === l ? "var(--color-background-secondary)" : "transparent", color: activePage === l ? "var(--color-text-primary)" : "var(--color-text-secondary)", border: "none", fontFamily: "inherit" }} onClick={() => navTo(l)}>{l}</button>)}
        </div>
        <button className="hamburger-btn" style={{ display: "none", flexDirection: "column", gap: "5px", cursor: "pointer", padding: "8px", border: "none", background: "transparent" }} onClick={() => setMobileMenu(m => !m)}>
          <span style={{ width: "22px", height: "2px", background: "var(--color-text-primary)", borderRadius: "2px", display: "block", transition: "transform 0.2s", transform: mobileMenu ? "rotate(45deg) translate(5px,5px)" : "none" }} />
          <span style={{ width: "22px", height: "2px", background: "var(--color-text-primary)", borderRadius: "2px", display: "block", opacity: mobileMenu ? 0 : 1, transition: "opacity 0.2s" }} />
          <span style={{ width: "22px", height: "2px", background: "var(--color-text-primary)", borderRadius: "2px", display: "block", transition: "transform 0.2s", transform: mobileMenu ? "rotate(-45deg) translate(5px,-5px)" : "none" }} />
        </button>
      </nav>

      <div className="mobile-menu" style={{ display: mobileMenu ? "flex" : "none", flexDirection: "column", position: "fixed", top: "60px", left: 0, right: 0, background: "var(--color-background-primary)", borderBottom: "0.5px solid var(--color-border-tertiary)", padding: "0.75rem 1rem", gap: "4px", zIndex: 99 }}>
        {NAV_LINKS.map(l => <button key={l} style={{ padding: "12px 14px", borderRadius: "var(--border-radius-md)", cursor: "pointer", fontSize: "15px", background: activePage === l ? "var(--color-background-secondary)" : "transparent", color: activePage === l ? "var(--color-text-primary)" : "var(--color-text-secondary)", border: "none", fontFamily: "inherit", textAlign: "left", width: "100%", fontWeight: activePage === l ? 500 : 400 }} onClick={() => navTo(l)}>{l}</button>)}
      </div>

      <main onClick={() => mobileMenu && setMobileMenu(false)}>{renderPage()}</main>

      <footer style={S.footer}>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "14px", margin: 0 }}>© 2025 Mentorgram AI · info@mentorgramai.com · mentorgramai.com</p>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "13px", margin: "6px 0 0" }}>Empowering students worldwide to study, work, and thrive in the UK 🇬🇧</p>
      </footer>
    </div>
  );
}
