import { useState, useEffect, useRef } from "react";

// ── Known UK visa sponsors (curated from Home Office register) ─────────────
const SPONSORS = [
  // Technology
  { name: "Google LLC", location: "London", city: "London", sector: "Technology", route: "Skilled Worker", rating: "A", size: "Large", website: "https://careers.google.com" },
  { name: "Amazon UK Services Ltd", location: "London", city: "London", sector: "Technology", route: "Skilled Worker", rating: "A", size: "Large", website: "https://amazon.jobs/en-gb" },
  { name: "Microsoft Limited", location: "Reading", city: "Reading", sector: "Technology", route: "Skilled Worker", rating: "A", size: "Large", website: "https://careers.microsoft.com" },
  { name: "Meta Platforms Ireland Ltd", location: "London", city: "London", sector: "Technology", route: "Skilled Worker", rating: "A", size: "Large", website: "https://www.metacareers.com" },
  { name: "Apple (UK) Limited", location: "London", city: "London", sector: "Technology", route: "Skilled Worker", rating: "A", size: "Large", website: "https://www.apple.com/uk/jobs/uk" },
  { name: "IBM United Kingdom Limited", location: "Portsmouth", city: "Portsmouth", sector: "Technology", route: "Skilled Worker", rating: "A", size: "Large", website: "https://www.ibm.com/uk-en/employment" },
  { name: "Accenture (UK) Limited", location: "London", city: "London", sector: "Technology", route: "Skilled Worker", rating: "A", size: "Large", website: "https://www.accenture.com/gb-en/careers" },
  { name: "Capgemini UK Plc", location: "London", city: "London", sector: "Technology", route: "Skilled Worker", rating: "A", size: "Large", website: "https://www.capgemini.com/gb-en/careers" },
  { name: "Fujitsu Services Limited", location: "London", city: "London", sector: "Technology", route: "Skilled Worker", rating: "A", size: "Large", website: "https://careers.fujitsu.com/uk" },
  { name: "Wipro Limited UK", location: "London", city: "London", sector: "Technology", route: "Skilled Worker", rating: "A", size: "Large", website: "https://careers.wipro.com" },
  { name: "Infosys BPO Limited", location: "Coventry", city: "Coventry", sector: "Technology", route: "Skilled Worker", rating: "A", size: "Large", website: "https://www.infosys.com/careers" },
  { name: "Tata Consultancy Services UK Ltd", location: "London", city: "London", sector: "Technology", route: "Skilled Worker", rating: "A", size: "Large", website: "https://www.tcs.com/careers" },
  { name: "HCL Technologies UK Limited", location: "London", city: "London", sector: "Technology", route: "Skilled Worker", rating: "A", size: "Large", website: "https://www.hcltech.com/careers" },
  { name: "Cisco Systems Limited", location: "Bedfont", city: "London", sector: "Technology", route: "Skilled Worker", rating: "A", size: "Large", website: "https://jobs.cisco.com" },
  { name: "Oracle Corporation UK Limited", location: "Reading", city: "Reading", sector: "Technology", route: "Skilled Worker", rating: "A", size: "Large", website: "https://www.oracle.com/uk/corporate/careers" },
  { name: "SAP (UK) Limited", location: "Feltham", city: "London", sector: "Technology", route: "Skilled Worker", rating: "A", size: "Large", website: "https://jobs.sap.com" },
  { name: "Deloitte LLP", location: "London", city: "London", sector: "Finance", route: "Skilled Worker", rating: "A", size: "Large", website: "https://www2.deloitte.com/uk/en/pages/careers" },
  { name: "PricewaterhouseCoopers LLP", location: "London", city: "London", sector: "Finance", route: "Skilled Worker", rating: "A", size: "Large", website: "https://www.pwc.co.uk/careers" },
  { name: "KPMG LLP", location: "London", city: "London", sector: "Finance", route: "Skilled Worker", rating: "A", size: "Large", website: "https://home.kpmg/uk/en/home/careers" },
  { name: "Ernst & Young LLP", location: "London", city: "London", sector: "Finance", route: "Skilled Worker", rating: "A", size: "Large", website: "https://www.ey.com/en_uk/careers" },
  // Finance & Banking
  { name: "HSBC Bank plc", location: "London", city: "London", sector: "Finance", route: "Skilled Worker", rating: "A", size: "Large", website: "https://www.hsbc.com/careers" },
  { name: "Barclays Bank PLC", location: "London", city: "London", sector: "Finance", route: "Skilled Worker", rating: "A", size: "Large", website: "https://home.barclays/careers" },
  { name: "Lloyds Banking Group", location: "London", city: "London", sector: "Finance", route: "Skilled Worker", rating: "A", size: "Large", website: "https://www.lloydsbankinggroup.com/careers" },
  { name: "NatWest Group PLC", location: "Edinburgh", city: "Edinburgh", sector: "Finance", route: "Skilled Worker", rating: "A", size: "Large", website: "https://careers.natwestgroup.com" },
  { name: "Goldman Sachs International", location: "London", city: "London", sector: "Finance", route: "Skilled Worker", rating: "A", size: "Large", website: "https://www.goldmansachs.com/careers" },
  { name: "JPMorgan Chase Bank N.A.", location: "London", city: "London", sector: "Finance", route: "Skilled Worker", rating: "A", size: "Large", website: "https://careers.jpmorgan.com/us/en" },
  { name: "Morgan Stanley & Co International", location: "London", city: "London", sector: "Finance", route: "Skilled Worker", rating: "A", size: "Large", website: "https://www.morganstanley.com/people/careers" },
  { name: "Deutsche Bank AG", location: "London", city: "London", sector: "Finance", route: "Skilled Worker", rating: "A", size: "Large", website: "https://careers.db.com/uk-en" },
  { name: "Credit Suisse (UK) Limited", location: "London", city: "London", sector: "Finance", route: "Skilled Worker", rating: "A", size: "Large", website: "https://www.credit-suisse.com/careers" },
  { name: "Standard Chartered Bank", location: "London", city: "London", sector: "Finance", route: "Skilled Worker", rating: "A", size: "Large", website: "https://www.sc.com/en/careers" },
  // Healthcare
  { name: "NHS England", location: "London", city: "London", sector: "Healthcare", route: "Health & Care Worker", rating: "A", size: "Large", website: "https://www.jobs.nhs.uk" },
  { name: "NHS Scotland", location: "Edinburgh", city: "Edinburgh", sector: "Healthcare", route: "Health & Care Worker", rating: "A", size: "Large", website: "https://apply.jobs.scot.nhs.uk" },
  { name: "NHS Wales", location: "Cardiff", city: "Cardiff", sector: "Healthcare", route: "Health & Care Worker", rating: "A", size: "Large", website: "https://www.jobs.nhs.uk" },
  { name: "Bupa Insurance Limited", location: "London", city: "London", sector: "Healthcare", route: "Skilled Worker", rating: "A", size: "Large", website: "https://careers.bupa.com" },
  { name: "Nuffield Health", location: "London", city: "London", sector: "Healthcare", route: "Skilled Worker", rating: "A", size: "Large", website: "https://www.nuffieldhealth.com/careers" },
  { name: "Spire Healthcare Limited", location: "London", city: "London", sector: "Healthcare", route: "Skilled Worker", rating: "A", size: "Large", website: "https://www.spirehealthcare.com/careers" },
  { name: "HCA Healthcare UK", location: "London", city: "London", sector: "Healthcare", route: "Skilled Worker", rating: "A", size: "Large", website: "https://careers.hcahealthcareuk.com" },
  { name: "AstraZeneca UK Limited", location: "Cambridge", city: "Cambridge", sector: "Healthcare", route: "Skilled Worker", rating: "A", size: "Large", website: "https://careers.astrazeneca.com" },
  { name: "GlaxoSmithKline plc", location: "Brentford", city: "London", sector: "Healthcare", route: "Skilled Worker", rating: "A", size: "Large", website: "https://www.gsk.com/en-gb/careers" },
  { name: "Pfizer Limited", location: "Sandwich", city: "Kent", sector: "Healthcare", route: "Skilled Worker", rating: "A", size: "Large", website: "https://www.pfizer.co.uk/careers" },
  // Engineering
  { name: "Rolls-Royce plc", location: "Derby", city: "Derby", sector: "Engineering", route: "Skilled Worker", rating: "A", size: "Large", website: "https://careers.rolls-royce.com" },
  { name: "BAE Systems plc", location: "London", city: "London", sector: "Engineering", route: "Skilled Worker", rating: "A", size: "Large", website: "https://www.baesystems.com/en/careers" },
  { name: "Airbus Operations Limited", location: "Bristol", city: "Bristol", sector: "Engineering", route: "Skilled Worker", rating: "A", size: "Large", website: "https://www.airbus.com/en/careers" },
  { name: "GE Aerospace", location: "London", city: "London", sector: "Engineering", route: "Skilled Worker", rating: "A", size: "Large", website: "https://jobs.gecareers.com" },
  { name: "Siemens plc", location: "Farnborough", city: "Hampshire", sector: "Engineering", route: "Skilled Worker", rating: "A", size: "Large", website: "https://new.siemens.com/uk/en/company/jobs" },
  { name: "Arup Group Limited", location: "London", city: "London", sector: "Engineering", route: "Skilled Worker", rating: "A", size: "Large", website: "https://www.arup.com/careers" },
  { name: "Mott MacDonald Limited", location: "Croydon", city: "London", sector: "Engineering", route: "Skilled Worker", rating: "A", size: "Large", website: "https://www.mottmac.com/careers" },
  { name: "WSP UK Limited", location: "London", city: "London", sector: "Engineering", route: "Skilled Worker", rating: "A", size: "Large", website: "https://www.wsp.com/en-UK/careers" },
  { name: "Atkins Limited", location: "Epsom", city: "Surrey", sector: "Engineering", route: "Skilled Worker", rating: "A", size: "Large", website: "https://careers.atkinsrealis.com" },
  { name: "National Grid Electricity Transmission", location: "Warwick", city: "Warwick", sector: "Engineering", route: "Skilled Worker", rating: "A", size: "Large", website: "https://careers.nationalgrid.com" },
  // Retail & Hospitality
  { name: "Marks and Spencer plc", location: "London", city: "London", sector: "Retail", route: "Skilled Worker", rating: "A", size: "Large", website: "https://careers.marksandspencer.com" },
  { name: "Tesco PLC", location: "Welwyn Garden City", city: "Hertfordshire", sector: "Retail", route: "Skilled Worker", rating: "A", size: "Large", website: "https://www.tesco-careers.com" },
  { name: "Sainsbury's Supermarkets Ltd", location: "London", city: "London", sector: "Retail", route: "Skilled Worker", rating: "A", size: "Large", website: "https://jobs.sainsburys.co.uk" },
  { name: "Hilton UK Hospitality Limited", location: "Watford", city: "Hertfordshire", sector: "Hospitality", route: "Skilled Worker", rating: "A", size: "Large", website: "https://jobs.hilton.com" },
  { name: "InterContinental Hotels Group", location: "Windsor", city: "Berkshire", sector: "Hospitality", route: "Skilled Worker", rating: "A", size: "Large", website: "https://careers.ihg.com" },
  { name: "Marriott International", location: "London", city: "London", sector: "Hospitality", route: "Skilled Worker", rating: "A", size: "Large", website: "https://jobs.marriott.com" },
  { name: "Compass Group UK & Ireland Limited", location: "Chertsey", city: "Surrey", sector: "Hospitality", route: "Skilled Worker", rating: "A", size: "Large", website: "https://www.compass-group.co.uk/careers" },
  // Education
  { name: "University of Oxford", location: "Oxford", city: "Oxford", sector: "Education", route: "Skilled Worker", rating: "A", size: "Large", website: "https://hr.admin.ox.ac.uk/vacancies" },
  { name: "University of Cambridge", location: "Cambridge", city: "Cambridge", sector: "Education", route: "Skilled Worker", rating: "A", size: "Large", website: "https://www.jobs.cam.ac.uk" },
  { name: "Imperial College London", location: "London", city: "London", sector: "Education", route: "Skilled Worker", rating: "A", size: "Large", website: "https://www.imperial.ac.uk/work-at-imperial" },
  { name: "University College London", location: "London", city: "London", sector: "Education", route: "Skilled Worker", rating: "A", size: "Large", website: "https://www.ucl.ac.uk/work-at-ucl" },
  { name: "King's College London", location: "London", city: "London", sector: "Education", route: "Skilled Worker", rating: "A", size: "Large", website: "https://jobs.kcl.ac.uk" },
  { name: "University of Edinburgh", location: "Edinburgh", city: "Edinburgh", sector: "Education", route: "Skilled Worker", rating: "A", size: "Large", website: "https://www.ed.ac.uk/human-resources/jobs" },
  { name: "University of Manchester", location: "Manchester", city: "Manchester", sector: "Education", route: "Skilled Worker", rating: "A", size: "Large", website: "https://www.jobs.manchester.ac.uk" },
  { name: "University of Birmingham", location: "Birmingham", city: "Birmingham", sector: "Education", route: "Skilled Worker", rating: "A", size: "Large", website: "https://www.birmingham.ac.uk/jobs" },
  { name: "University of Bristol", location: "Bristol", city: "Bristol", sector: "Education", route: "Skilled Worker", rating: "A", size: "Large", website: "https://www.bristol.ac.uk/jobs" },
  { name: "University of Leeds", location: "Leeds", city: "Leeds", sector: "Education", route: "Skilled Worker", rating: "A", size: "Large", website: "https://jobs.leeds.ac.uk" },
  // Public Sector
  { name: "Home Office", location: "London", city: "London", sector: "Public Sector", route: "Skilled Worker", rating: "A", size: "Large", website: "https://www.civilservicejobs.service.gov.uk" },
  { name: "Department for Work and Pensions", location: "London", city: "London", sector: "Public Sector", route: "Skilled Worker", rating: "A", size: "Large", website: "https://www.civilservicejobs.service.gov.uk" },
  { name: "HM Revenue & Customs", location: "London", city: "London", sector: "Public Sector", route: "Skilled Worker", rating: "A", size: "Large", website: "https://www.civilservicejobs.service.gov.uk" },
  { name: "Metropolitan Police Service", location: "London", city: "London", sector: "Public Sector", route: "Skilled Worker", rating: "A", size: "Large", website: "https://careers.met.police.uk" },
  { name: "Ministry of Defence", location: "London", city: "London", sector: "Public Sector", route: "Skilled Worker", rating: "A", size: "Large", website: "https://www.civilservicejobs.service.gov.uk" },
  // AI & Data
  { name: "DeepMind Technologies Limited", location: "London", city: "London", sector: "AI & Data", route: "Skilled Worker", rating: "A", size: "Medium", website: "https://deepmind.google/about/careers" },
  { name: "Wayve Technologies Limited", location: "London", city: "London", sector: "AI & Data", route: "Skilled Worker", rating: "A", size: "Medium", website: "https://wayve.ai/careers" },
  { name: "Faculty AI", location: "London", city: "London", sector: "AI & Data", route: "Skilled Worker", rating: "A", size: "Medium", website: "https://faculty.ai/careers" },
  { name: "Palantir Technologies UK Ltd", location: "London", city: "London", sector: "AI & Data", route: "Skilled Worker", rating: "A", size: "Large", website: "https://www.palantir.com/careers" },
  { name: "Quantexa Limited", location: "London", city: "London", sector: "AI & Data", route: "Skilled Worker", rating: "A", size: "Medium", website: "https://www.quantexa.com/about/careers" },
  { name: "Graphcore Limited", location: "Bristol", city: "Bristol", sector: "AI & Data", route: "Skilled Worker", rating: "A", size: "Medium", website: "https://www.graphcore.ai/careers" },
];

const SECTORS = ["All", "Technology", "Finance", "Healthcare", "Engineering", "Education", "Hospitality", "Retail", "Public Sector", "AI & Data"];
const ROUTES = ["All Routes", "Skilled Worker", "Health & Care Worker"];
const PER_PAGE = 12;

const S = {
  card: { background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: "1.25rem" },
  tag: (c) => ({ display: "inline-block", padding: "3px 10px", borderRadius: "var(--border-radius-md)", fontSize: "12px", fontWeight: 500, background: c === "purple" ? "#EEEDFE" : c === "teal" ? "#E1F5EE" : c === "blue" ? "#E3F2FD" : "#F5F5F5", color: c === "purple" ? "#3C3489" : c === "teal" ? "#085041" : c === "blue" ? "#0D47A1" : "#444" }),
  inp: { padding: "10px 14px", borderRadius: "var(--border-radius-md)", border: "0.5px solid var(--color-border-secondary)", background: "var(--color-background-secondary)", color: "var(--color-text-primary)", fontSize: "14px", outline: "none", fontFamily: "inherit", width: "100%", boxSizing: "border-box" },
  pill: (a) => ({ padding: "6px 16px", borderRadius: "20px", border: a ? "none" : "0.5px solid var(--color-border-secondary)", background: a ? "#534AB7" : "var(--color-background-primary)", color: a ? "#fff" : "var(--color-text-secondary)", fontSize: "13px", cursor: "pointer", fontFamily: "inherit", fontWeight: a ? 500 : 400, transition: "all 0.15s" }),
  btn: (primary) => ({ padding: "10px 22px", borderRadius: "var(--border-radius-md)", background: primary ? "#534AB7" : "transparent", color: primary ? "#fff" : "var(--color-text-primary)", border: primary ? "none" : "0.5px solid var(--color-border-secondary)", fontSize: "14px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }),
};

export default function SponsorsPage() {
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [sector, setSector] = useState("All");
  const [route, setRoute] = useState("All Routes");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const topRef = useRef(null);

  useEffect(() => { setPage(1); }, [search, location, sector, route]);

  const filtered = SPONSORS.filter(s => {
    const q = search.toLowerCase();
    const matchSearch = !q || s.name.toLowerCase().includes(q) || s.sector.toLowerCase().includes(q);
    const loc = location.toLowerCase();
    const matchLoc = !loc || s.location.toLowerCase().includes(loc) || s.city.toLowerCase().includes(loc);
    const matchSector = sector === "All" || s.sector === sector;
    const matchRoute = route === "All Routes" || s.route === route;
    return matchSearch && matchLoc && matchSector && matchRoute;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  // ── Detail view ──
  if (selected) {
    const s = selected;
    return (
      <div style={{ maxWidth: "760px", margin: "0 auto", padding: "2rem 1.5rem" }}>
        <button onClick={() => setSelected(null)} style={{ display: "flex", alignItems: "center", gap: "6px", background: "transparent", border: "none", color: "var(--color-text-secondary)", fontSize: "14px", cursor: "pointer", fontFamily: "inherit", marginBottom: "1.5rem", padding: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          Back to sponsors
        </button>

        <div style={{ ...S.card, padding: "2rem", marginBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
            <div style={{ width: "56px", height: "56px", borderRadius: "12px", background: "linear-gradient(135deg,#534AB7,#1D9E75)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "22px", flexShrink: 0 }}>
              {s.name[0]}
            </div>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: "1.4rem", fontWeight: 500, margin: "0 0 6px" }}>{s.name}</h1>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <span style={S.tag("purple")}>{s.sector}</span>
                <span style={S.tag("teal")}>✓ Licensed Sponsor</span>
                <span style={S.tag("blue")}>{s.route}</span>
                {s.rating === "A" && <span style={{ ...S.tag("teal"), background: "#E8F5E9", color: "#2E7D32" }}>A-Rated</span>}
              </div>
            </div>
          </div>

          <div style={{ borderTop: "0.5px solid var(--color-border-tertiary)", marginTop: "1.5rem", paddingTop: "1.5rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem" }}>
            {[["📍", "Location", s.location], ["🏢", "Sector", s.sector], ["🛂", "Visa Route", s.route], ["⭐", "Licence Rating", `${s.rating}-Rated`]].map(([icon, label, value]) => (
              <div key={label}>
                <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", margin: "0 0 3px" }}>{icon} {label}</p>
                <p style={{ fontSize: "14px", fontWeight: 500, margin: 0 }}>{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ ...S.card, marginBottom: "1rem" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 500, margin: "0 0 0.75rem" }}>🛂 Visa Sponsorship Information</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {[
              `${s.name} holds an active ${s.rating}-rated sponsor licence from the UK Home Office`,
              `Licensed to sponsor workers on the ${s.route} visa route`,
              "Can issue Certificates of Sponsorship (CoS) to eligible candidates",
              "A-rated sponsors have passed Home Office compliance checks",
              "Minimum salary thresholds apply — usually £41,700+ for Skilled Worker from July 2025",
            ].map((item, i) => (
              <p key={i} style={{ fontSize: "14px", color: "var(--color-text-secondary)", margin: 0, display: "flex", gap: "8px", lineHeight: 1.6 }}>
                <span style={{ color: "#1D9E75", flexShrink: 0 }}>✓</span><span>{item}</span>
              </p>
            ))}
          </div>
        </div>

        <div style={{ ...S.card, background: "#EEEDFE", border: "0.5px solid #AFA9EC", marginBottom: "1rem" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 500, margin: "0 0 0.75rem", color: "#3C3489" }}>📋 How to apply for a role here</h2>
          {[
            "Visit their careers page and find a suitable role",
            "Apply directly — mention you require visa sponsorship in your application",
            "If offered the role, the employer will assign you a Certificate of Sponsorship (CoS)",
            "Use the CoS reference number to apply for your Skilled Worker visa",
            "Home Office processing: typically 3–8 weeks",
          ].map((step, i) => (
            <p key={i} style={{ fontSize: "14px", color: "#3C3489", margin: "0 0 6px", display: "flex", gap: "10px" }}>
              <span style={{ background: "#534AB7", color: "#fff", borderRadius: "50%", width: "20px", height: "20px", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
              <span>{step}</span>
            </p>
          ))}
        </div>

        <div style={{ ...S.card, marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 500, margin: "0 0 0.5rem" }}>🔗 Verify on GOV.UK Register</h2>
          <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", margin: "0 0 1rem", lineHeight: 1.6 }}>
            Always verify the employer's current licence status on the official Home Office register before applying.
          </p>
          <a href="https://www.gov.uk/government/publications/register-of-licensed-sponsors-workers" target="_blank" rel="noopener noreferrer"
            style={{ ...S.btn(false), textDecoration: "none", display: "inline-block", fontSize: "13px", padding: "8px 16px" }}>
            🏛️ Check on GOV.UK Register ↗
          </a>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {s.website && (
            <a href={s.website} target="_blank" rel="noopener noreferrer"
              style={{ ...S.btn(true), textDecoration: "none" }}>
              View Jobs at {s.name.split(" ")[0]} ↗
            </a>
          )}
          <button style={S.btn(false)} onClick={() => setSelected(null)}>← Back to list</button>
        </div>
      </div>
    );
  }

  // ── List view ──
  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "2rem 1.5rem" }}>
      <div ref={topRef}>
        {/* Header */}
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "0.5rem" }}>
            <h2 style={{ fontSize: "1.8rem", fontWeight: 500, margin: 0 }}>Licensed Visa Sponsors</h2>
            <span style={{ ...S.tag("teal"), fontSize: "13px" }}>🏛️ Home Office Register</span>
          </div>
          <p style={{ color: "var(--color-text-secondary)", margin: 0, fontSize: "15px" }}>
            Employers licensed by the UK Home Office to sponsor Skilled Worker and Health & Care visas. Updated from the official GOV.UK register.
          </p>
        </div>

        {/* Stats bar */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.75rem", marginBottom: "1.5rem" }}>
          {[["🏢", "Total Sponsors", SPONSORS.length + "+"], ["✅", "A-Rated Sponsors", SPONSORS.filter(s => s.rating === "A").length], ["🛂", "Visa Routes", "2"], ["🌍", "Locations", "20+"]].map(([icon, label, value]) => (
            <div key={label} style={{ ...S.card, textAlign: "center", padding: "1rem" }}>
              <div style={{ fontSize: "20px", marginBottom: "4px" }}>{icon}</div>
              <p style={{ fontSize: "20px", fontWeight: 600, margin: "0 0 2px", color: "#534AB7" }}>{value}</p>
              <p style={{ fontSize: "11px", color: "var(--color-text-secondary)", margin: 0 }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Search & filters */}
        <div style={{ ...S.card, marginBottom: "1.25rem" }}>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "1rem" }}>
            <input style={{ ...S.inp, flex: 2, minWidth: "180px" }} placeholder="🔍 Search company name or sector..."
              value={search} onChange={e => setSearch(e.target.value)} />
            <input style={{ ...S.inp, flex: 1, minWidth: "140px" }} placeholder="📍 Filter by location..."
              value={location} onChange={e => setLocation(e.target.value)} />
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "0.75rem" }}>
            {SECTORS.map(s => <button key={s} style={{ ...S.pill(sector === s), fontSize: "12px", padding: "5px 12px" }} onClick={() => setSector(s)}>{s}</button>)}
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: "13px", color: "var(--color-text-secondary)", fontWeight: 500 }}>Visa route:</span>
            {ROUTES.map(r => (
              <button key={r} style={{ ...S.pill(route === r), fontSize: "12px", background: route === r ? (r === "Health & Care Worker" ? "#1D9E75" : "#534AB7") : "var(--color-background-primary)" }}
                onClick={() => setRoute(r)}>{r}</button>
            ))}
          </div>
        </div>

        {/* GOV.UK banner */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 14px", background: "#E8F5E9", border: "0.5px solid #81C784", borderRadius: "var(--border-radius-md)", marginBottom: "1.25rem", flexWrap: "wrap" }}>
          <span style={{ fontSize: "20px" }}>🏛️</span>
          <p style={{ fontSize: "13px", margin: 0, flex: 1, color: "#1B5E20" }}>
            <strong>Official Source:</strong> This list is sourced from the UK Home Office Register of Licensed Sponsors. Always verify current status at GOV.UK before applying.
          </p>
          <a href="https://www.gov.uk/government/publications/register-of-licensed-sponsors-workers" target="_blank" rel="noopener noreferrer"
            style={{ padding: "6px 14px", borderRadius: "var(--border-radius-md)", background: "#2E7D32", color: "#fff", fontSize: "12px", fontWeight: 500, textDecoration: "none", whiteSpace: "nowrap" }}>
            Download full register ↗
          </a>
        </div>

        {/* Results count */}
        <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", marginBottom: "1.25rem" }}>
          Showing <strong>{paginated.length}</strong> of <strong>{filtered.length}</strong> licensed sponsors
          {search && ` matching "${search}"`}
          {location && ` in "${location}"`}
          {sector !== "All" && ` · ${sector}`}
          {route !== "All Routes" && ` · ${route}`}
        </p>
      </div>

      {/* Sponsor cards */}
      {paginated.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
          {paginated.map((s, i) => (
            <div key={i} style={{ ...S.card, cursor: "pointer", transition: "transform 0.15s, box-shadow 0.15s" }}
              onClick={() => { setSelected(s); window.scrollTo(0, 0); }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(83,74,183,0.12)"; e.currentTarget.style.borderColor = "rgba(83,74,183,0.3)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = "var(--color-border-tertiary)"; }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "linear-gradient(135deg,#534AB7,#1D9E75)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "18px", flexShrink: 0 }}>
                  {s.name[0]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 500, margin: "0 0 3px", fontSize: "14px", color: "#534AB7", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</p>
                  <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", margin: 0 }}>📍 {s.location}</p>
                </div>
                <span style={{ ...S.tag("teal"), fontSize: "11px", background: "#E8F5E9", color: "#2E7D32", flexShrink: 0 }}>A-Rated</span>
              </div>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "12px" }}>
                <span style={S.tag("purple")}>{s.sector}</span>
                <span style={S.tag("blue")}>{s.route}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>✓ Licensed to issue CoS</span>
                <span style={{ fontSize: "12px", color: "#534AB7", fontWeight: 500 }}>View details →</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ ...S.card, textAlign: "center", padding: "3rem" }}>
          <p style={{ fontSize: "2rem", margin: "0 0 1rem" }}>🔍</p>
          <p style={{ fontWeight: 500 }}>No sponsors found</p>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "14px", marginBottom: "1.25rem" }}>Try a different search or clear filters</p>
          <button style={{ ...S.btn(true), display: "inline-block" }} onClick={() => { setSearch(""); setLocation(""); setSector("All"); setRoute("All Routes"); }}>Clear all filters</button>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <>
          <div style={{ display: "flex", gap: "6px", justifyContent: "center", marginTop: "2rem", flexWrap: "wrap" }}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => { setPage(p); topRef.current?.scrollIntoView({ behavior: "smooth" }); }}
                style={{ minWidth: "36px", height: "36px", borderRadius: "var(--border-radius-md)", border: p === safePage ? "none" : "0.5px solid var(--color-border-secondary)", background: p === safePage ? "#534AB7" : "var(--color-background-primary)", color: p === safePage ? "#fff" : "var(--color-text-secondary)", fontSize: "14px", cursor: "pointer", fontFamily: "inherit", fontWeight: p === safePage ? 500 : 400 }}>{p}</button>
            ))}
          </div>
          <p style={{ textAlign: "center", fontSize: "13px", color: "var(--color-text-secondary)", marginTop: "0.75rem" }}>
            Page {safePage} of {totalPages} · {filtered.length} sponsors
          </p>
        </>
      )}
    </div>
  );
}
