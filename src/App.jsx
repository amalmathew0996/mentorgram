import { useState, useRef, useEffect } from "react";
import AuthPage from "./Auth.jsx";
import SponsorsPage from "./Sponsors.jsx";
import Dashboard from "./Dashboard.jsx";
import { PrivacyPage, TermsPage, CookieBanner } from "./Legal.jsx";

const NAV_LINKS = ["Home", "AI Mentor", "Education Paths", "UK Universities", "Sponsorship Jobs", "Visa Sponsors", "Contact", "My Profile"];
const SECTORS = ["All", "Technology", "AI & Data", "Healthcare", "Finance", "Engineering", "Business", "Education", "Hospitality", "Public Sector"];
const VISA_TYPES = ["All Jobs", "Visa Sponsorship", "No Sponsorship Info"];
const JOBS_PER_PAGE = 15;

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

// These are 100% real verified jobs fetched from Indeed
// The live API fetches 500+ more on page load
const FALLBACK_JOBS = [
  { title: "ICT Senior Networking & Security Engineer", company: "Great Ormond Street Hospital", location: "London", salary: "\u00a356,276\u2013\u00a363,176/yr", sector: "Technology", sponsorship: true, posted: "24 Mar 2026", url: "https://to.indeed.com/aa2ckl2qbytx", source: "indeed" },
  { title: "Campus Software Engineer 2026", company: "American Express", location: "London", salary: "\u00a348,300\u2013\u00a380,000/yr", sector: "Technology", sponsorship: true, posted: "23 Mar 2026", url: "https://to.indeed.com/aa4mpzx6gtsj", source: "indeed" },
  { title: "Staff Software Engineer AI/ML", company: "OpenAsset", location: "London", salary: "Competitive", sector: "Technology", sponsorship: false, posted: "2 Mar 2026", url: "https://to.indeed.com/aakgzmdscfyl", source: "indeed" },
  { title: "Senior Software Engineer", company: "SKEDULO", location: "London", salary: "\u00a390,000\u2013\u00a3105,000/yr", sector: "Technology", sponsorship: false, posted: "4 Mar 2026", url: "https://to.indeed.com/aalcxlf2xgy2", source: "indeed" },
  { title: "CX/UX Designer", company: "Wolters Kluwer", location: "Kingston upon Thames", salary: "\u00a352,000\u2013\u00a374,750/yr", sector: "Technology", sponsorship: false, posted: "2 Mar 2026", url: "https://to.indeed.com/aapq46llchjf", source: "indeed" },
  { title: "Software and Controls Engineer", company: "Warburtons", location: "Enfield", salary: "Up to \u00a370,000/yr", sector: "Technology", sponsorship: false, posted: "12 Jan 2026", url: "https://to.indeed.com/aahwjyjkk774", source: "indeed" },
  { title: "Systems Specialist Business Intelligence", company: "Transport for London", location: "Stratford", salary: "\u00a363,000/yr", sector: "AI & Data", sponsorship: false, posted: "17 Mar 2026", url: "https://to.indeed.com/aahdcvnk444l", source: "indeed" },
  { title: "IT Engineer", company: "ASPECT Studios", location: "London", salary: "\u00a330,500\u2013\u00a354,500/yr", sector: "Technology", sponsorship: false, posted: "20 Mar 2026", url: "https://to.indeed.com/aaxnkwvwwxj2", source: "indeed" },
  { title: "Sales Development Representative SaaS", company: "Research Grid Ltd", location: "London", salary: "Up to \u00a345,000/yr", sector: "Business", sponsorship: false, posted: "19 Mar 2026", url: "https://to.indeed.com/aan8sxxk6lnk", source: "indeed" },
  { title: "Clinical Support Worker", company: "NHS", location: "Sutton-In-Ashfield", salary: "\u00a324,937\u2013\u00a326,598/yr", sector: "Healthcare", sponsorship: true, posted: "19 Mar 2026", url: "https://to.indeed.com/aanfm7p9nhhw", source: "indeed" },
  { title: "Registered Nurse", company: "Unity Care Solutions", location: "Basingstoke", salary: "Up to \u00a337.50/hr", sector: "Healthcare", sponsorship: true, posted: "18 Mar 2026", url: "https://to.indeed.com/aavpdrxz979r", source: "indeed" },
  { title: "Registered Nurse", company: "Unity Care Solutions", location: "Maidstone", salary: "Up to \u00a340/hr", sector: "Healthcare", sponsorship: true, posted: "20 Mar 2026", url: "https://to.indeed.com/aats4fkncn7c", source: "indeed" },
  { title: "Registered Nurse", company: "Unity Care Solutions", location: "Crawley", salary: "From \u00a328/hr", sector: "Healthcare", sponsorship: true, posted: "17 Mar 2026", url: "https://to.indeed.com/aaxsgwrwx69x", source: "indeed" },
  { title: "Registered Nurse", company: "Leonard Cheshire", location: "Penzance", salary: "\u00a322.20/hr", sector: "Healthcare", sponsorship: false, posted: "12 Mar 2026", url: "https://to.indeed.com/aajzp4l6ck8t", source: "indeed" },
  { title: "Registered Nurse RGN", company: "Roseberry Care Centres", location: "Morpeth", salary: "\u00a320.50/hr", sector: "Healthcare", sponsorship: false, posted: "19 Mar 2026", url: "https://to.indeed.com/aab8y4vkxy98", source: "indeed" },
  { title: "Registered Nurse", company: "St Wilfrid's Hospice", location: "Chichester", salary: "\u00a331,216\u2013\u00a337,861/yr", sector: "Healthcare", sponsorship: false, posted: "18 Mar 2026", url: "https://to.indeed.com/aa6r642hsmg2", source: "indeed" },
  { title: "Registered Nurse", company: "Advinia Healthcare", location: "Falkirk", salary: "\u00a321.95/hr", sector: "Healthcare", sponsorship: false, posted: "25 Feb 2026", url: "https://to.indeed.com/aaypb99krk9c", source: "indeed" },
  { title: "Registered Nurse", company: "Unity Care Solutions", location: "Heathfield", salary: "From \u00a328/hr", sector: "Healthcare", sponsorship: false, posted: "17 Mar 2026", url: "https://to.indeed.com/aalnvznnf2sn", source: "indeed" },
  { title: "Process Engineer", company: "Drive Medical", location: "Halifax", salary: "\u00a335,000\u2013\u00a345,000/yr", sector: "Engineering", sponsorship: false, posted: "20 Jan 2026", url: "https://to.indeed.com/aaslyktl9288", source: "indeed" },
  { title: "Manufacturing Engineer", company: "DMM Engineering", location: "Caernarfon", salary: "\u00a337,000\u2013\u00a339,000/yr", sector: "Engineering", sponsorship: false, posted: "13 Mar 2026", url: "https://to.indeed.com/aajsdp76xzwh", source: "indeed" },
  { title: "Manufacturing Engineer", company: "Rubicon People Partnership", location: "Lymington", salary: "\u00a345,000\u2013\u00a355,000/yr", sector: "Engineering", sponsorship: false, posted: "19 Mar 2026", url: "https://to.indeed.com/aajc8m96x2zv", source: "indeed" },
  { title: "Project Engineer", company: "SF Engineering Ltd", location: "Saint Ives", salary: "\u00a338,000\u2013\u00a350,000/yr", sector: "Engineering", sponsorship: false, posted: "24 Mar 2026", url: "https://to.indeed.com/aaychvplxtwn", source: "indeed" },
  { title: "Manufacturing Engineer", company: "Staffbase Recruitment", location: "Derby", salary: "\u00a338,000\u2013\u00a340,000/yr", sector: "Engineering", sponsorship: false, posted: "24 Feb 2026", url: "https://to.indeed.com/aa7txg8vmss4", source: "indeed" },
  { title: "Multi Skilled Engineer", company: "Reed Recruitment", location: "Antrim", salary: "\u00a320\u2013\u00a330/hr", sector: "Engineering", sponsorship: false, posted: "20 Mar 2026", url: "https://to.indeed.com/aabzmtlmh8rp", source: "indeed" },
  { title: "Data Science Lead", company: "QBE Insurance", location: "London", salary: "\u00a357,600\u2013\u00a374,600/yr", sector: "AI & Data", sponsorship: true, posted: "6 Jan 2026", url: "https://to.indeed.com/aah82lc9gw48", source: "indeed" },
  { title: "Junior Data Analyst", company: "EE", location: "London", salary: "\u00a339,250\u2013\u00a349,250/yr", sector: "AI & Data", sponsorship: false, posted: "18 Mar 2026", url: "https://to.indeed.com/aaxmh4zh7kts", source: "indeed" },
  { title: "Junior Data Analyst", company: "Climate Policy Initiative", location: "London", salary: "\u00a332,000\u2013\u00a340,000/yr", sector: "AI & Data", sponsorship: false, posted: "23 Mar 2026", url: "https://to.indeed.com/aa9mp4m24hry", source: "indeed" },
  { title: "Data Analyst", company: "LexisNexis Risk Solutions", location: "London", salary: "\u00a339,000\u2013\u00a347,000/yr", sector: "AI & Data", sponsorship: false, posted: "27 Feb 2026", url: "https://to.indeed.com/aa9trwg4nnyv", source: "indeed" },
  { title: "Associate Data Scientist", company: "Sainsbury's", location: "London", salary: "\u00a355,000\u2013\u00a378,000/yr", sector: "AI & Data", sponsorship: false, posted: "18 Mar 2026", url: "https://to.indeed.com/aahqn2jzw7wr", source: "indeed" },
  { title: "Machine Learning Intern", company: "Deliveroo", location: "London", salary: "Competitive", sector: "AI & Data", sponsorship: false, posted: "5 Mar 2026", url: "https://to.indeed.com/aa9c4kspdpsp", source: "indeed" },
  { title: "Clinical Homecare Nurse", company: "Pharmaxo", location: "London", salary: "\u00a335,000\u2013\u00a338,000/yr", sector: "Healthcare", sponsorship: true, posted: "24 Feb 2026", url: "https://to.indeed.com/aaddgg6snrfh", source: "indeed" },
  { title: "Complex Community Nurse", company: "Advantage Healthcare", location: "Croydon", salary: "\u00a343,950/yr", sector: "Healthcare", sponsorship: true, posted: "18 Mar 2026", url: "https://to.indeed.com/aaqwvz8xsc9y", source: "indeed" },
  { title: "Senior Staff Nurse", company: "St John & St Elizabeth Hospital", location: "London", salary: "\u00a335,750\u2013\u00a340,375/yr", sector: "Healthcare", sponsorship: true, posted: "12 Mar 2026", url: "https://to.indeed.com/aat626kkfq9g", source: "indeed" },
  { title: "NHS 111 Clinical Advisor Band 6", company: "Integrated Care Group", location: "Barking", salary: "\u00a321\u2013\u00a344/hr", sector: "Healthcare", sponsorship: true, posted: "20 Mar 2026", url: "https://to.indeed.com/aa6q2qhx6s47", source: "indeed" },
  { title: "Associate Dentist Visa Sponsorship", company: "MedMatch Group", location: "London", salary: "\u00a3140,000\u2013\u00a3160,000/yr", sector: "Healthcare", sponsorship: true, posted: "1 Nov 2025", url: "https://to.indeed.com/aa9lvwhlyw8c", source: "indeed" },
  { title: "Lead Veterinary Surgeon", company: "Medivet Group", location: "London", salary: "Up to \u00a380,000/yr", sector: "Healthcare", sponsorship: true, posted: "29 Sep 2025", url: "https://to.indeed.com/aayn69cms2xy", source: "indeed" },
  { title: "Software Engineer Backend", company: "Duffel", location: "London", salary: "Competitive", sector: "Technology", sponsorship: true, posted: "10 Mar 2026", url: "https://to.indeed.com/aanddsw9z6s7", source: "indeed" },
  { title: "kdb+ Developer Sponsorship Available", company: "Data Intellect", location: "London", salary: "Competitive", sector: "Technology", sponsorship: true, posted: "18 Mar 2026", url: "https://to.indeed.com/aaqklnbjq422", source: "indeed" }
];




// ─── Global styles (outside component) ────────────────────────────────────
const S = {
  wrap: { fontFamily: "var(--font-sans)", color: "var(--color-text-primary)", minHeight: "100vh", background: "var(--color-background-tertiary)" },
  btnPrimary: { padding: "12px 28px", borderRadius: "var(--border-radius-md)", background: "#1A3FA8", color: "#fff", border: "none", fontSize: "15px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit" },
  btnOutline: { padding: "12px 28px", borderRadius: "var(--border-radius-md)", background: "transparent", color: "var(--color-text-primary)", border: "0.5px solid var(--color-border-secondary)", fontSize: "15px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit" },
  section: { maxWidth: "1100px", margin: "0 auto", padding: "3rem 1.5rem" },
  sectionTitle: { fontSize: "1.6rem", fontWeight: 500, margin: "0 0 0.5rem" },
  sectionSub: { color: "var(--color-text-secondary)", margin: "0 0 2rem", fontSize: "15px" },
  grid3: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem" },
  grid2: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1rem" },
  card: { background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: "1.25rem" },
  tag: (c) => ({ display: "inline-block", padding: "3px 10px", borderRadius: "var(--border-radius-md)", fontSize: "12px", fontWeight: 500, background: c === "purple" ? "rgba(26,63,168,0.15)" : c === "teal" ? "rgba(255,69,0,0.15)" : "rgba(26,63,168,0.1)", color: c === "purple" ? "#1A3FA8" : c === "teal" ? "#FF4500" : "#1A3FA8" }),
  input: { padding: "10px 14px", borderRadius: "var(--border-radius-md)", border: "0.5px solid var(--color-border-secondary)", background: "var(--color-background-secondary)", color: "var(--color-text-primary)", fontSize: "14px", outline: "none", fontFamily: "inherit", width: "100%", boxSizing: "border-box" },
  footer: { borderTop: "0.5px solid var(--color-border-tertiary)", background: "var(--color-background-primary)", padding: "2rem 1.5rem", textAlign: "center" },
  statsRow: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1rem", margin: "2rem 0" },
  statCard: { background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", padding: "1rem", textAlign: "center" },
  filterBtn: (a) => ({ padding: "6px 16px", borderRadius: "20px", border: a ? "none" : "0.5px solid var(--color-border-secondary)", background: a ? "#1A3FA8" : "var(--color-background-primary)", color: a ? "#fff" : "var(--color-text-secondary)", fontSize: "13px", cursor: "pointer", fontFamily: "inherit" }),
  pageBtn: (a) => ({ minWidth: "36px", height: "36px", padding: "0 10px", borderRadius: "var(--border-radius-md)", border: a ? "none" : "0.5px solid var(--color-border-secondary)", background: a ? "#1A3FA8" : "var(--color-background-primary)", color: a ? "#fff" : "var(--color-text-secondary)", fontSize: "14px", cursor: a ? "default" : "pointer", fontFamily: "inherit", fontWeight: a ? 500 : 400 }),
};

// ─── Share Button ──────────────────────────────────────────────────────────
function ShareButton({ job }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handle(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const jobData = btoa(encodeURIComponent(JSON.stringify({ title: job.title, company: job.company, location: job.location, salary: job.salary, sector: job.sector, posted: job.posted, url: job.url })));
  const siteUrl = `https://mentorgramai.com/#job=${encodeURIComponent(jobData)}`;
  const text = `🇬🇧 UK Job with Visa Sponsorship!\n\n💼 ${job.title}\n🏢 ${job.company}\n📍 ${job.location}\n💰 ${job.salary}\n\n👉 View details: ${siteUrl}\n\n🎓 Find more at mentorgramai.com`;

  const options = [
    { label: "WhatsApp", color: "#25D366", href: `https://wa.me/?text=${encodeURIComponent(text)}`, icon: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" },
    { label: "Telegram", color: "#229ED9", href: `https://t.me/share/url?url=${encodeURIComponent(siteUrl)}&text=${encodeURIComponent(text)}`, icon: "M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" },
    { label: "Email", color: "#EA4335", href: `mailto:?subject=${encodeURIComponent(`Job: ${job.title} at ${job.company}`)}&body=${encodeURIComponent(text)}`, icon: "M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" },
    { label: "Copy link", color: "#1A3FA8", action: () => { navigator.clipboard.writeText(siteUrl); setOpen(false); } },
  ];

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen(o => !o)} title="Share"
        style={{ width: "34px", height: "34px", borderRadius: "var(--border-radius-md)", border: "0.5px solid var(--color-border-secondary)", background: "var(--color-background-primary)", color: "var(--color-text-secondary)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
        </svg>
      </button>
      {open && (
        <>
          {/* Backdrop to catch outside clicks on mobile */}
          <div style={{ position: "fixed", inset: 0, zIndex: 49 }} onClick={() => setOpen(false)} />
          <div style={{ position: "fixed", bottom: "auto", right: "1rem", left: "auto", top: "auto", marginTop: "8px", background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: "6px", zIndex: 200, minWidth: "165px", boxShadow: "0 8px 30px rgba(0,0,0,0.2)" }}
            ref={node => { if (node && ref.current) { const btn = ref.current.getBoundingClientRect(); node.style.top = (btn.bottom + 8) + "px"; node.style.left = Math.min(btn.left, window.innerWidth - 175) + "px"; } }}>
            <p style={{ fontSize: "11px", color: "var(--color-text-secondary)", padding: "4px 10px 6px", margin: 0, borderBottom: "0.5px solid var(--color-border-tertiary)" }}>Share this job</p>
            {options.map(opt => opt.href ? (
              <a key={opt.label} href={opt.href} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}
                style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 10px", borderRadius: "var(--border-radius-md)", color: "var(--color-text-primary)", textDecoration: "none", fontSize: "14px" }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--color-background-secondary)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill={opt.color}><path d={opt.icon}/></svg>{opt.label}
              </a>
            ) : (
              <button key={opt.label} onClick={opt.action}
                style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 10px", borderRadius: "var(--border-radius-md)", color: "var(--color-text-primary)", fontSize: "14px", cursor: "pointer", width: "100%", border: "none", background: "transparent", fontFamily: "inherit", textAlign: "left" }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--color-background-secondary)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill={opt.color}><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Job Detail Page ───────────────────────────────────────────────────────
function JobDetailPage({ job, onBack, onAskMentor }) {
  const jobData = btoa(encodeURIComponent(JSON.stringify({ title: job.title, company: job.company, location: job.location, salary: job.salary, sector: job.sector, posted: job.posted, url: job.url })));
  const siteUrl = `https://mentorgramai.com/#job=${encodeURIComponent(jobData)}`;
  return (
    <div style={{ maxWidth: "760px", margin: "0 auto", padding: "2rem 1.5rem" }}>
      <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: "6px", background: "transparent", border: "none", color: "var(--color-text-secondary)", fontSize: "14px", cursor: "pointer", fontFamily: "inherit", marginBottom: "1.5rem", padding: 0 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        Back to jobs
      </button>
      <div style={{ ...S.card, padding: "1.75rem", marginBottom: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 500, margin: "0 0 6px" }}>{job.title}</h1>
            <p style={{ fontSize: "16px", color: "var(--color-text-secondary)", margin: "0 0 1rem" }}>{job.company}</p>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {job.sector && <span style={S.tag("purple")}>{job.sector}</span>}
              {job.sponsorship === true
                ? <span style={{ ...S.tag("teal") }}>✓ Visa Sponsorship</span>
                : <span style={{ display:"inline-block", padding:"3px 10px", borderRadius:"var(--border-radius-md)", fontSize:"12px", fontWeight:500, background:"var(--color-background-secondary)", color:"var(--color-text-secondary)" }}>No sponsorship info</span>
              }
            </div>
          </div>
          <ShareButton job={job} />
        </div>
        <div style={{ borderTop: "0.5px solid var(--color-border-tertiary)", marginTop: "1.25rem", paddingTop: "1.25rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem" }}>
          {[["📍","Location",job.location],["💰","Salary",job.salary],["🗂️","Sector",job.sector||"General"],["🗓️","Posted",job.posted||"Recently"]].map(([icon,label,value]) => (
            <div key={label}>
              <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", margin: "0 0 3px" }}>{icon} {label}</p>
              <p style={{ fontSize: "14px", fontWeight: 500, margin: 0 }}>{value}</p>
            </div>
          ))}
        </div>
      </div>
      <div style={{ ...S.card, marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 500, margin: "0 0 0.75rem" }}>About this role</h2>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "14px", lineHeight: 1.7, margin: "0 0 0.75rem" }}>
          This is a UK-based role at <strong>{job.company}</strong> in <strong>{job.location}</strong> offering visa sponsorship for eligible candidates.
        </p>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "14px", lineHeight: 1.7, margin: 0 }}>
          The role is in the <strong>{job.sector || "General"}</strong> sector and eligible for a <strong>Skilled Worker visa</strong>. Click Apply for full details and requirements.
        </p>
      </div>
      <div style={{ background: "rgba(26,63,168,0.1)", border: "0.5px solid rgba(26,63,168,0.2)", borderRadius: "var(--border-radius-lg)", padding: "1.25rem", marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 500, margin: "0 0 0.75rem", color: "var(--color-text-primary)" }}>🛂 Visa sponsorship info</h2>
        {["This employer is registered as a UK visa sponsor","You may be eligible for a Skilled Worker or Health & Care visa","Minimum salary thresholds apply (usually £26,200+)","Your employer will assign a Certificate of Sponsorship (CoS)"].map((item, i) => (
          <p key={i} style={{ fontSize: "14px", color: "var(--color-text-primary)", margin: "0 0 4px", display: "flex", gap: "8px" }}><span>✓</span><span>{item}</span></p>
        ))}
      </div>
      <div style={{ ...S.card, marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 500, margin: "0 0 0.5rem" }}>💬 Need help applying?</h2>
        <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", margin: "0 0 1rem", lineHeight: 1.6 }}>Ask our AI Mentor about this role, the skills needed, and how visa sponsorship works.</p>
        <button style={{ ...S.btnOutline, padding: "9px 20px", fontSize: "14px" }}
          onClick={() => onAskMentor(`I want to apply for ${job.title} at ${job.company} in ${job.location}. What skills do I need and how does visa sponsorship work?`)}>
          Ask AI Mentor ↗
        </button>
      </div>
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        {job.url && <a href={job.url} target="_blank" rel="noopener noreferrer" style={{ ...S.btnPrimary, textDecoration: "none" }}>Apply for this job ↗</a>}
        <button style={S.btnOutline} onClick={onBack}>← Back to jobs</button>
      </div>
    </div>
  );
}

// ─── Jobs Page ─────────────────────────────────────────────────────────────
function JobsPage({ allJobs, jobsLoading, updatedAt, onFetchJobs, onSelectJob, profileFilter, onClearProfileFilter }) {
  const [sector, setSector] = useState("All");
  const [visaType, setVisaType] = useState("All Jobs");
  const [titleQuery, setTitleQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [page, setPage] = useState(1);
  const [clickedJob, setClickedJob] = useState(null);
  const topRef = useRef(null);

  // Auto-apply profile filter when passed in
  useEffect(() => {
    if (profileFilter) {
      if (profileFilter.sectors?.length > 0) setSector(profileFilter.sectors[0]);
      if (profileFilter.location) setLocationQuery(profileFilter.location);
      if (profileFilter.visaStatus === "I need visa sponsorship") setVisaType("Visa Sponsorship");
    }
  }, [profileFilter]);
  const searchTimer = useRef(null);

  useEffect(() => { setPage(1); }, [sector, visaType, titleQuery, locationQuery]);
  useEffect(() => { topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }, [page]);

  function handleTitleChange(val) {
    setTitleQuery(val);
    clearTimeout(searchTimer.current);
    if (val.length >= 3) {
      searchTimer.current = setTimeout(() => onFetchJobs(val, locationQuery), 600);
    }
  }

  function handleLocationChange(val) {
    setLocationQuery(val);
    clearTimeout(searchTimer.current);
    if (val.length === 0) {
      searchTimer.current = setTimeout(() => onFetchJobs(titleQuery, ""), 300);
    } else if (val.length >= 2) {
      searchTimer.current = setTimeout(() => onFetchJobs(titleQuery, val), 600);
    }
  }

  const filtered = allJobs.filter(j => {
    const matchSector = sector === "All" || j.sector === sector;
    const matchVisa = visaType === "All Jobs"
      || (visaType === "Visa Sponsorship" && j.sponsorship === true)
      || (visaType === "No Sponsorship Info" && j.sponsorship !== true);
    const q = titleQuery.toLowerCase().trim();
    const matchTitle = !q || j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q);
    const loc = locationQuery.toLowerCase().trim();
    const matchLoc = !loc || j.location.toLowerCase().includes(loc);
    return matchSector && matchVisa && matchTitle && matchLoc;
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
        <p style={{ ...S.sectionSub, marginBottom: "1.5rem" }}>Search UK jobs with visa sponsorship — updated live.</p>
      </div>

      {/* Search box */}
      <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: "1.25rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <div style={{ flex: 2, minWidth: "160px", position: "relative", display: "flex", alignItems: "center" }}>
            <input style={{ ...S.input, paddingRight: titleQuery ? "32px" : "12px" }} placeholder="🔍 Job title or keywords..."
              value={titleQuery} onChange={e => handleTitleChange(e.target.value)}
              onKeyDown={e => e.key === "Enter" && onFetchJobs(titleQuery, locationQuery)} />
            {titleQuery && (
              <button onClick={() => handleTitleChange("")}
                style={{ position: "absolute", right: "8px", background: "none", border: "none", cursor: "pointer", color: "var(--color-text-secondary)", fontSize: "18px", lineHeight: 1, padding: "0 2px", display: "flex", alignItems: "center" }}>×</button>
            )}
          </div>
          <input style={{ ...S.input, flex: 1, minWidth: "120px" }} placeholder="📍 Location..."
            value={locationQuery} onChange={e => handleLocationChange(e.target.value)}
            onKeyDown={e => e.key === "Enter" && onFetchJobs(titleQuery, locationQuery)} />
          <button style={{ ...S.btnPrimary, padding: "10px 20px", fontSize: "14px", whiteSpace: "nowrap", opacity: jobsLoading ? 0.7 : 1 }}
            onClick={() => { clearTimeout(searchTimer.current); onFetchJobs(titleQuery, locationQuery); }} disabled={jobsLoading}>
            {jobsLoading ? "Searching..." : "Search"}
          </button>
        </div>
        <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", margin: "10px 0 10px" }}>
          💡 Type to filter instantly · Click Search for live results from Indeed
        </p>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {["Software Engineer", "Data Scientist", "NHS Nurse", "Financial Analyst", "Civil Engineer", "Marketing Manager", "Research Fellow", "Lecturer"].map(q => (
            <button key={q} style={{ ...S.filterBtn(titleQuery === q), fontSize: "12px", padding: "4px 12px" }}
              onClick={() => { setTitleQuery(q); onFetchJobs(q, locationQuery); }}>{q}</button>
          ))}
        </div>
        {updatedAt && <p style={{ fontSize: "11px", color: "var(--color-text-secondary)", margin: "8px 0 0" }}>Updated: {new Date(updatedAt).toLocaleTimeString()}</p>}
      </div>

      {/* Profile filter banner */}
      {profileFilter && (
        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", background: "linear-gradient(135deg, rgba(26,63,168,0.08), rgba(29,158,117,0.05))", border: "0.5px solid rgba(26,63,168,0.2)", borderRadius: "var(--border-radius-md)", marginBottom: "1rem", flexWrap: "wrap" }}>
          <span style={{ fontSize: "14px" }}>🎯</span>
          <p style={{ fontSize: "13px", margin: 0, flex: 1 }}>
            <strong>Filtered by your profile</strong>
            {profileFilter.sectors?.length > 0 && ` · ${profileFilter.sectors.join(", ")}`}
            {profileFilter.location && ` · ${profileFilter.location}`}
            {profileFilter.visaStatus === "I need visa sponsorship" && " · Visa Sponsorship only"}
          </p>
          <button onClick={() => { onClearProfileFilter(); setSector("All"); setLocationQuery(""); setVisaType("All Jobs"); }}
            style={{ padding: "5px 12px", borderRadius: "var(--border-radius-md)", border: "0.5px solid var(--color-border-secondary)", background: "transparent", fontSize: "12px", cursor: "pointer", fontFamily: "inherit", color: "var(--color-text-secondary)" }}>
            Clear ✕
          </button>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "0.75rem" }}>
        {SECTORS.map(s => <button key={s} style={{ ...S.filterBtn(sector === s), fontSize: "12px", padding: "5px 12px" }} onClick={() => setSector(s)}>{s}</button>)}
      </div>
      <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        <span style={{ fontSize: "13px", color: "var(--color-text-secondary)", fontWeight: 500 }}>Filter:</span>
        {VISA_TYPES.map(v => (
          <button key={v} style={{ ...S.filterBtn(visaType === v), background: visaType === v
            ? (v === "Visa Sponsorship" ? "#16A34A" : v === "No Sponsorship Info" ? "#888" : "#1A3FA8")
            : "var(--color-background-primary)" }}
            onClick={() => setVisaType(v)}>{v}</button>
        ))}
      </div>

      {/* Results count */}
      <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", marginBottom: "1.25rem" }}>
        {jobsLoading
          ? "🔍 Fetching live jobs from Indeed, Reed & Adzuna..."
          : <>
              Showing <strong>{paginated.length}</strong> of <strong>{filtered.length}</strong> jobs
              {" · "}
              <span style={{ color: "var(--color-text-secondary)", fontSize: "12px" }}>
                {[...new Set(allJobs.map(j => j.source).filter(Boolean))].map((src, i) => (
                  <span key={src} style={{ marginLeft: i > 0 ? "6px" : 0 }}>
                    <span style={{ display:"inline-block", padding:"1px 7px", borderRadius:"10px", fontSize:"11px", fontWeight:500,
                      background: src==="Reed" ? "#FFF3E0" : src==="Adzuna" ? "#E3F2FD" : "#F3F2FF",
                      color: src==="Reed" ? "#E65100" : src==="Adzuna" ? "#0D47A1" : "#1A3FA8"
                    }}>{src}</span>
                  </span>
                ))}
              </span>
              {allJobs.length <= 40 && <span style={{ color: "#1A3FA8", cursor: "pointer", marginLeft: "8px", fontSize: "12px" }} onClick={() => fetchJobs(titleQuery, locationQuery)}>↻ Load live jobs</span>}
            </>
        }
        {!jobsLoading && titleQuery && ` · matching "${titleQuery}"`}
        {!jobsLoading && locationQuery && ` · in "${locationQuery}"`}
        {!jobsLoading && sector !== "All" && ` · ${sector}`}
      </p>

      {/* Loading skeletons */}
      {jobsLoading && (
        <div style={S.grid2}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{ ...S.card, display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ height: "16px", background: "var(--color-background-secondary)", borderRadius: "4px", width: "70%" }} />
              <div style={{ height: "12px", background: "var(--color-background-secondary)", borderRadius: "4px", width: "40%" }} />
              <div style={{ height: "12px", background: "var(--color-background-secondary)", borderRadius: "4px", width: "55%" }} />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
                <div style={{ height: "14px", background: "var(--color-background-secondary)", borderRadius: "4px", width: "30%" }} />
                <div style={{ height: "32px", width: "70px", background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)" }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Job cards */}
      {!jobsLoading && paginated.length > 0 && (
        <div style={S.grid2}>
          {paginated.map((j, i) => (
            <div key={i}
              className={clickedJob === i ? "job-card-click" : ""}
              style={{ ...S.card, display: "flex", flexDirection: "column", justifyContent: "space-between", cursor: "pointer", transition: "box-shadow 0.2s, border-color 0.2s", minHeight: "190px" }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 20px rgba(26,63,168,0.12)"; e.currentTarget.style.borderColor = "rgba(26,63,168,0.3)"; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = "var(--color-border-tertiary)"; }}
              onClick={() => { setClickedJob(i); setTimeout(() => { onSelectJob(j); setClickedJob(null); }, 320); }}>

              {/* Title + sponsorship badge */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px", marginBottom: "6px" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, margin: "0 0 3px", fontSize: "14px", color: "var(--color-text-primary)", lineHeight: 1.4, wordBreak: "break-word" }}>{j.title}</p>
                  <p style={{ color: "var(--color-text-secondary)", fontSize: "12px", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{j.company}</p>
                </div>
                <span style={{ flexShrink: 0, padding: "3px 8px", borderRadius: "var(--border-radius-md)", fontSize: "11px", fontWeight: 500, whiteSpace: "nowrap",
                  background: j.sponsorship === true ? "rgba(22,163,74,0.15)" : "var(--color-background-secondary)",
                  color: j.sponsorship === true ? "#16A34A" : "var(--color-text-secondary)" }}>
                  {j.sponsorship === true ? "✓ Sponsorship" : "No info"}
                </span>
              </div>

              {/* Tags + location */}
              <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", alignItems: "center", marginBottom: "8px" }}>
                {j.sector && <span style={{ padding: "2px 7px", borderRadius: "var(--border-radius-md)", fontSize: "11px", fontWeight: 500, background: "rgba(26,63,168,0.12)", color: "#1A3FA8" }}>{j.sector}</span>}

                <span style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>📍 {j.location}</span>
                {j.posted && <span style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>📅 {j.posted}</span>}
              </div>

              {/* Salary + buttons — pinned to bottom */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", marginTop: "auto" }}>
                <p style={{ fontWeight: 600, color: "var(--color-text-primary)", margin: 0, fontSize: "13px", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{j.salary || "Competitive"}</p>
                <div style={{ display: "flex", gap: "6px", flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                  <ShareButton job={j} />
                  <button
                    onClick={e => { e.stopPropagation(); setClickedJob(i); setTimeout(() => { onSelectJob(j); setClickedJob(null); }, 320); }}
                    style={{ padding: "6px 14px", borderRadius: "var(--border-radius-md)", background: "#1A3FA8", color: "#fff", fontSize: "12px", fontWeight: 500, border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                    View ↗
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No results */}
      {!jobsLoading && paginated.length === 0 && (
        <div style={{ ...S.card, textAlign: "center", padding: "3rem" }}>
          <p style={{ fontSize: "2rem", margin: "0 0 1rem" }}>🔍</p>
          <p style={{ fontWeight: 500, marginBottom: "0.5rem" }}>No jobs found</p>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "14px", marginBottom: "1.25rem" }}>Try searching for a specific role above</p>
          <button style={S.btnPrimary} onClick={() => { setTitleQuery(""); setLocationQuery(""); setSector("All"); setVisaType("All Jobs"); onFetchJobs("", ""); }}>Show all jobs</button>
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

// ─── Contact Page ─────────────────────────────────────────────────────────
function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("idle");

  async function handleSubmit() {
    if (!name || !email || !subject || !message) {
      alert("Please fill in all fields.");
      return;
    }
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message })
      });
      const data = await res.json();
      if (data.success) {
        setStatus("success");
        setName(""); setEmail(""); setSubject(""); setMessage("");
      } else {
        throw new Error("Failed");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <div style={S.section}>
      <div style={{ maxWidth: "540px", margin: "0 auto" }}>
        <h2 style={S.sectionTitle}>Get in touch</h2>
        <p style={S.sectionSub}>Have questions about Mentorgram? We'd love to hear from you.</p>

        {status === "success" ? (
          <div style={{ textAlign: "center", padding: "2rem 1rem", position: "relative", overflow: "hidden" }}>
            <style>{`
              @keyframes popIn { 0% { transform: scale(0) rotate(-10deg); opacity: 0; } 60% { transform: scale(1.2) rotate(5deg); } 100% { transform: scale(1) rotate(0deg); opacity: 1; } }
              @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
              @keyframes confettiFall { 0% { transform: translateY(-20px) rotate(0deg); opacity: 1; } 100% { transform: translateY(220px) rotate(720deg); opacity: 0; } }
              @keyframes pulse2 { 0%,100% { transform: scale(1); } 50% { transform: scale(1.08); } }
              .success-icon { animation: popIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; display: inline-block; }
              .success-title { animation: fadeSlideUp 0.5s ease 0.3s both; }
              .success-sub { animation: fadeSlideUp 0.5s ease 0.45s both; }
              .success-btn { animation: fadeSlideUp 0.5s ease 0.6s both; }
              .confetti-piece { position: absolute; width: 8px; height: 8px; border-radius: 2px; animation: confettiFall linear forwards; }
            `}</style>

            {/* Confetti pieces */}
            {[
              { left: "10%", delay: "0s",   color: "#1A3FA8", size: "8px",  duration: "1.2s" },
              { left: "20%", delay: "0.1s", color: "#FF4500", size: "6px",  duration: "1.5s" },
              { left: "30%", delay: "0.2s", color: "#F7C75B", size: "10px", duration: "1.1s" },
              { left: "45%", delay: "0s",   color: "#E24B4A", size: "7px",  duration: "1.4s" },
              { left: "55%", delay: "0.15s",color: "#1A3FA8", size: "9px",  duration: "1.3s" },
              { left: "65%", delay: "0.05s",color: "#FF4500", size: "6px",  duration: "1.6s" },
              { left: "75%", delay: "0.2s", color: "#F7C75B", size: "8px",  duration: "1.2s" },
              { left: "85%", delay: "0.1s", color: "#E24B4A", size: "7px",  duration: "1.5s" },
              { left: "50%", delay: "0.3s", color: "#1A3FA8", size: "5px",  duration: "1.1s" },
              { left: "35%", delay: "0.25s",color: "#FF4500", size: "9px",  duration: "1.4s" },
            ].map((c, i) => (
              <div key={i} className="confetti-piece" style={{ left: c.left, top: "-10px", background: c.color, width: c.size, height: c.size, animationDuration: c.duration, animationDelay: c.delay }} />
            ))}

            {/* Animated envelope icon */}
            <div className="success-icon" style={{ fontSize: "64px", marginBottom: "1rem", display: "block" }}>
              📨
            </div>

            <h3 className="success-title" style={{ fontSize: "1.4rem", fontWeight: 500, margin: "0 0 0.5rem", color: "var(--color-text-primary)" }}>
              Message sent! 🎉
            </h3>
            <p className="success-sub" style={{ color: "var(--color-text-secondary)", fontSize: "14px", margin: "0 0 1.5rem", lineHeight: 1.6 }}>
              Thanks <strong>{name}</strong>! We'll get back to you at <strong>{email}</strong> shortly.
            </p>
            <button className="success-btn" style={{ ...S.btnOutline, padding: "9px 24px", fontSize: "14px" }} onClick={() => setStatus("idle")}>
              Send another message
            </button>
          </div>
        ) : (
          <div style={S.card}>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <input style={{ ...S.input, flex: 1, minWidth: "140px" }} placeholder="Your name" value={name} onChange={e => setName(e.target.value)} />
                <input style={{ ...S.input, flex: 1, minWidth: "140px" }} type="email" placeholder="Your email" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <input style={S.input} placeholder="Subject" value={subject} onChange={e => setSubject(e.target.value)} />
              <textarea style={{ ...S.input, height: "120px", resize: "vertical" }} placeholder="Your message..." value={message} onChange={e => setMessage(e.target.value)} />
              <button style={{ ...S.btnPrimary, opacity: status === "sending" ? 0.7 : 1 }} onClick={handleSubmit} disabled={status === "sending"}>
                {status === "sending" ? "Sending..." : "Send message"}
              </button>
              {status === "error" && (
                <p style={{ color: "#E24B4A", fontSize: "13px", margin: 0 }}>
                  Something went wrong. Email us directly at{" "}
                  <a href="mailto:info@mentorgramai.com" style={{ color: "#E24B4A" }}>info@mentorgramai.com</a>
                </p>
              )}
            </div>
          </div>
        )}

        <div style={{ ...S.card, marginTop: "1rem" }}>
          <p style={{ fontWeight: 500, margin: "0 0 10px" }}>Contact details</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "14px", color: "var(--color-text-secondary)" }}>
            <a href="mailto:info@mentorgramai.com" style={{ color: "var(--color-text-secondary)", textDecoration: "none" }}>📧 info@mentorgramai.com</a>
            <span>🌐 mentorgramai.com</span>
            <span>📍 United Kingdom</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────
// ── Instagram Lead Capture / Guide Page ─────────────────────────────────────
function GuidePage({ navTo }) {
  const [emailVal, setEmailVal] = useState("");
  const [done, setDone] = useState(false);
  const [err, setErr] = useState(false);

  function handleSubmit() {
    if (!emailVal.trim() || !emailVal.includes("@")) { setErr(true); return; }
    setErr(false);
    // Try to save email
    fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Guide Download", email: emailVal, subject: "Guide Request", message: "Requested sponsorship guide via Instagram landing page." }),
    }).catch(() => {});
    setDone(true);
  }

  const chapters = [
    { n: "1", title: "How UK Sponsorship Works", desc: "Skilled Worker visa explained — points, salary thresholds, CoS process" },
    { n: "2", title: "Where to Find Sponsored Jobs", desc: "7 best sources including GOV.UK register and Mentorgram's free jobs board" },
    { n: "3", title: "CV & Cover Letter Formula", desc: "UK CV format, how to mention sponsorship professionally, template phrases" },
    { n: "4", title: "Interview & Visa Timeline", desc: "What to expect, questions to ask, and how long the full process takes" },
    { n: "5", title: "5 Costly Mistakes to Avoid", desc: "The most common errors that waste months of applications" },
    { n: "✓", title: "Your 7-Step Action Plan", desc: "A concrete plan to start your sponsored job search today" },
  ];

  return (
    <div style={{ fontFamily: "var(--font-sans)", color: "var(--color-text-primary)", minHeight: "100vh" }}>
      {/* Hero */}
      <div style={{ background: "linear-gradient(160deg, #0d2478 0%, #1a3fa8 50%, #0f1535 100%)", padding: "60px 20px 80px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ display: "inline-block", background: "rgba(255,69,0,0.2)", color: "#ff6b35", border: "1px solid rgba(255,69,0,0.3)", padding: "6px 16px", borderRadius: "20px", fontSize: "12px", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "20px" }}>
          🎁 Free Download
        </div>
        <h1 style={{ fontSize: "clamp(26px, 5vw, 44px)", fontWeight: 800, lineHeight: 1.15, margin: "0 0 16px", color: "#fff", letterSpacing: "-0.02em" }}>
          How to Land a<br /><span style={{ color: "#FF4500" }}>UK Visa-Sponsored Role</span>
        </h1>
        <p style={{ fontSize: "16px", color: "#94a3c8", maxWidth: "520px", margin: "0 auto 36px", lineHeight: 1.7 }}>
          The step-by-step guide to finding, applying and getting sponsored to work in the UK — completely free.
        </p>

        {/* Lead capture card */}
        <div style={{ background: "#fff", color: "#1a1a2e", borderRadius: "20px", padding: "32px 28px", maxWidth: "440px", margin: "0 auto", boxShadow: "0 32px 80px rgba(0,0,0,0.4)" }}>
          {!done ? (
            <>
              <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#1A3FA8", margin: "0 0 6px" }}>Get Your Free Guide</h2>
              <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 20px", lineHeight: 1.6 }}>Enter your email and download instantly — no spam, ever.</p>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>Email address</label>
              <input
                type="email"
                value={emailVal}
                onChange={e => { setEmailVal(e.target.value); setErr(false); }}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
                placeholder="you@email.com"
                style={{ width: "100%", padding: "12px 14px", border: err ? "1.5px solid #ef4444" : "1.5px solid #e2e8f0", borderRadius: "10px", fontSize: "14px", outline: "none", marginBottom: "12px", boxSizing: "border-box", fontFamily: "inherit", color: "#1a1a2e" }}
              />
              {err && <p style={{ color: "#ef4444", fontSize: "12px", margin: "-8px 0 10px" }}>Please enter a valid email address</p>}
              <button
                onClick={handleSubmit}
                style={{ width: "100%", padding: "13px", background: "#1A3FA8", color: "#fff", border: "none", borderRadius: "10px", fontSize: "15px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                Send Me the Free Guide →
              </button>
              <p style={{ fontSize: "11px", color: "#94a3b8", textAlign: "center", marginTop: "10px" }}>🔒 No spam. Unsubscribe anytime.</p>
            </>
          ) : (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "48px", marginBottom: "12px" }}>🎉</div>
              <h3 style={{ fontSize: "20px", fontWeight: 700, color: "#16A34A", marginBottom: "8px" }}>Your guide is ready!</h3>
              <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "20px", lineHeight: 1.6 }}>Click below to download your free copy.</p>
              <a href="/sponsorship-guide.pdf" download
                style={{ display: "inline-block", padding: "12px 28px", background: "linear-gradient(135deg, #1A3FA8, #FF4500)", color: "#fff", borderRadius: "10px", fontSize: "14px", fontWeight: 700, textDecoration: "none" }}>
                ⬇ Download Free Guide
              </a>
              <p style={{ marginTop: "16px", fontSize: "12px", color: "#94a3b8" }}>
                Also search 500+ live sponsored jobs on{" "}
                <button onClick={() => navTo("Sponsorship Jobs")} style={{ background: "none", border: "none", color: "#1A3FA8", cursor: "pointer", fontFamily: "inherit", fontSize: "12px", fontWeight: 600, padding: 0, textDecoration: "underline" }}>
                  Mentorgram Jobs
                </button>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* What's inside */}
      <div style={{ padding: "60px 20px", maxWidth: "700px", margin: "0 auto" }}>
        <h2 style={{ fontSize: "24px", fontWeight: 700, textAlign: "center", margin: "0 0 8px" }}>What's Inside the Guide</h2>
        <p style={{ textAlign: "center", color: "var(--color-text-secondary)", marginBottom: "36px" }}>8 pages of actionable, no-fluff advice</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "14px" }}>
          {chapters.map(c => (
            <div key={c.n} style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: "18px", display: "flex", gap: "14px", alignItems: "flex-start" }}>
              <div style={{ width: "34px", height: "34px", borderRadius: "8px", background: "linear-gradient(135deg, #1A3FA8, #0d2478)", color: "#fff", fontWeight: 800, fontSize: "15px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{c.n}</div>
              <div>
                <p style={{ fontWeight: 600, fontSize: "14px", margin: "0 0 3px", color: "var(--color-text-primary)" }}>{c.title}</p>
                <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", lineHeight: 1.5 }}>{c.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA bar */}
      <div style={{ background: "#1A3FA8", padding: "40px 20px", textAlign: "center" }}>
        <p style={{ fontSize: "13px", color: "#b0c4f8", marginBottom: "4px" }}>While you're here</p>
        <h3 style={{ fontSize: "20px", fontWeight: 700, color: "#fff", marginBottom: "16px" }}>Search 500+ Live Visa-Sponsored Jobs</h3>
        <button onClick={() => navTo("Sponsorship Jobs")}
          style={{ padding: "12px 28px", background: "#FF4500", color: "#fff", border: "none", borderRadius: "10px", fontSize: "15px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
          Browse Jobs →
        </button>
      </div>
    </div>
  );
}

export default function Mentorgram() {
  // Hash-based routing — maps page names to URL hashes
  const PAGE_SLUGS = {
    "Home": "",
    "AI Mentor": "ai-mentor",
    "Education Paths": "education",
    "UK Universities": "universities",
    "Sponsorship Jobs": "jobs",
    "Visa Sponsors": "visa-sponsors",
    "Contact": "contact",
    "My Profile": "profile",
    "Privacy Policy": "privacy",
    "Terms & Conditions": "terms",
    "Guide": "guide",
  };
  const SLUG_TO_PAGE = Object.fromEntries(Object.entries(PAGE_SLUGS).map(([k,v]) => [v, k]));

  function getInitialPage() {
    const path = window.location.pathname.replace("/", "").split("?")[0];
    return SLUG_TO_PAGE[path] || "Home";
  }

  const [activePage, setActivePage] = useState(getInitialPage);
  const [messages, setMessages] = useState([{ role: "assistant", content: "Hi! I'm your Mentorgram AI Mentor 👋 I can help with education pathways, UK university applications, career guidance, and visa-sponsored jobs. What would you like to explore?" }]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [allJobs, setAllJobs] = useState(FALLBACK_JOBS);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistDone, setWaitlistDone] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("mg_user") || "null"); } catch { return null; }
  });
  const [cookieConsent, setCookieConsent] = useState(() => localStorage.getItem("mg_cookies") || null);
  const [profileFilter, setProfileFilter] = useState(null);
  const [pageTransition, setPageTransition] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // Handle shared job URLs
  useEffect(() => {
    function checkHash() {
      try {
        // Handle deep-linked job
        const hash = window.location.hash;
        if (hash.startsWith("#job=")) {
          const encoded = decodeURIComponent(hash.replace("#job=", ""));
          const job = JSON.parse(decodeURIComponent(atob(encoded)));
          setSelectedJob(job);
          setActivePage("Sponsorship Jobs");
          return;
        }
        // Handle clean path navigation (back/forward buttons)
        const path = window.location.pathname.replace("/", "").split("?")[0];
        const page = SLUG_TO_PAGE[path];
        if (page) setActivePage(page);
      } catch { /* ignore */ }
    }
    checkHash();
    window.addEventListener("popstate", checkHash);
    return () => window.removeEventListener("popstate", checkHash);
  }, []);

  useEffect(() => {
    if (activePage === "Sponsorship Jobs" && !selectedJob && allJobs.length <= 75) {
      fetchJobs("", "");
    }
  }, [activePage]);

  async function fetchJobs(q, loc) {
    setJobsLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (loc) params.set("location", loc);
      params.set("pageSize", "500");

      // Try database first (fast, 500+ jobs), fall back to live RSS
      let dbJobs = [];
      let rssJobs = [];

      const [dbRes, rssRes, indeedRes] = await Promise.allSettled([
        fetch(`/api/jobs-db?${params}`).then(r => r.json()).catch(() => ({ jobs: [] })),
        fetch(`/api/jobsacuk?${params}`).then(r => r.json()).catch(() => ({ jobs: [] })),
        fetch(`/api/jobs?${params}`).then(r => r.json()).catch(() => ({ jobs: [] })),
      ]);

      dbJobs     = dbRes.status     === "fulfilled" ? (dbRes.value?.jobs     || []) : [];
      rssJobs    = rssRes.status    === "fulfilled" ? (rssRes.value?.jobs    || []) : [];
      const indeedJobs = indeedRes.status === "fulfilled" ? (indeedRes.value?.jobs || []) : [];

      // Merge: FALLBACK (always has sponsorship data) + Indeed + DB + RSS
      const allSources = [...FALLBACK_JOBS, ...indeedJobs, ...dbJobs, ...rssJobs];

      // Deduplicate by URL
      const seen = new Set();
      const combined = allSources.filter(j => {
        if (!j.url || seen.has(j.url)) return false;
        seen.add(j.url);
        return true;
      });

      // Apply local filter if query given
      const filtered = (q || loc) ? combined.filter(j => {
        const matchQ = !q || j.title.toLowerCase().includes(q.toLowerCase()) ||
          j.company.toLowerCase().includes(q.toLowerCase()) ||
          j.sector.toLowerCase().includes(q.toLowerCase());
        const matchL = !loc || j.location.toLowerCase().includes(loc.toLowerCase());
        return matchQ && matchL;
      }) : combined;

      if (filtered.length > 0) {
        setAllJobs(filtered);
        setUpdatedAt(new Date().toISOString());
      }
    } catch { /* keep existing jobs */ }
    setJobsLoading(false);
  }

  async function sendMessage() {
    if (!chatInput.trim() || chatLoading) return;
    const msg = chatInput.trim();
    setChatInput("");
    const updatedMessages = [...messages, { role: "user", content: msg }];
    setMessages(updatedMessages);
    setChatLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.reply || "Could you rephrase that?" }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, trouble connecting. Please try again." }]);
    }
    setChatLoading(false);
  }

  function navTo(page) {
    setPageTransition(true);
    setTimeout(() => {
      setActivePage(page);
      setMobileMenu(false);
      setSelectedJob(null);
      setPageTransition(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
      // Update URL hash so refresh works + back button works
      const slug = PAGE_SLUGS[page] || "";
      window.history.pushState(null, "", slug ? `/${slug}` : "/");
    }, 220);
  }

  const heroAccent = { background: "linear-gradient(135deg, #1A3FA8, #FF4500)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" };

  function renderPage() {
    switch (activePage) {
      case "Home": return (
        <div>
          <style>{`
            @keyframes fadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
            @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
            @keyframes float { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-8px); } }
            @keyframes countUp { from { opacity:0; transform:scale(0.8); } to { opacity:1; transform:scale(1); } }
            @keyframes slideIn { from { opacity:0; transform:translateX(-20px); } to { opacity:1; transform:translateX(0); } }
            @keyframes shimmer { 0% { background-position:-200% center; } 100% { background-position:200% center; } }
            @keyframes orb1 { 0%,100% { transform:translate(0,0); } 33% { transform:translate(60px,-40px); } 66% { transform:translate(-30px,50px); } }
            @keyframes orb2 { 0%,100% { transform:translate(0,0); } 33% { transform:translate(-50px,60px); } 66% { transform:translate(40px,-30px); } }
            @keyframes orb3 { 0%,100% { transform:translate(0,0); } 50% { transform:translate(30px,40px); } }
            @keyframes particle { 0% { transform:translateY(0) rotate(0deg); opacity:0; } 10% { opacity:1; } 90% { opacity:1; } 100% { transform:translateY(-600px) rotate(720deg); opacity:0; } }
            .hero-badge { animation:fadeIn 0.6s ease forwards; }
            .hero-title { animation:fadeUp 0.7s ease 0.1s both; }
            .hero-sub { animation:fadeUp 0.7s ease 0.2s both; }
            .hero-btns { animation:fadeUp 0.7s ease 0.3s both; }
            .stat-card { animation:countUp 0.6s ease both; }
            .stat-card:nth-child(1){animation-delay:0.4s} .stat-card:nth-child(2){animation-delay:0.5s} .stat-card:nth-child(3){animation-delay:0.6s} .stat-card:nth-child(4){animation-delay:0.7s}
            .feature-card { animation:fadeUp 0.6s ease both; transition:transform 0.2s,box-shadow 0.2s; }
            .feature-card:hover { transform:translateY(-4px); box-shadow:0 8px 24px rgba(26,63,168,0.12); }
            .feature-card:nth-child(1){animation-delay:0.1s} .feature-card:nth-child(2){animation-delay:0.2s} .feature-card:nth-child(3){animation-delay:0.3s} .feature-card:nth-child(4){animation-delay:0.4s} .feature-card:nth-child(5){animation-delay:0.5s} .feature-card:nth-child(6){animation-delay:0.6s}
            .float-icon { animation:float 3s ease-in-out infinite; display:inline-block; }
            .hero-btn-primary { transition:transform 0.15s,background 0.15s; } .hero-btn-primary:hover { transform:scale(1.03); background:#4840a0 !important; }
            .hero-btn-outline { transition:transform 0.15s,background 0.15s; } .hero-btn-outline:hover { transform:scale(1.03); background:var(--color-background-secondary) !important; }
            .step-item { animation:slideIn 0.6s ease both; }
            .step-item:nth-child(1){animation-delay:0.1s} .step-item:nth-child(2){animation-delay:0.25s} .step-item:nth-child(3){animation-delay:0.4s} .step-item:nth-child(4){animation-delay:0.55s}
            .shimmer-text { background:linear-gradient(90deg,#1A3FA8,#FF4500,#1A3FA8); background-size:200% auto; -webkit-background-clip:text; -webkit-text-fill-color:transparent; animation:shimmer 3s linear infinite; }
            .orb1 { animation:orb1 12s ease-in-out infinite; } .orb2 { animation:orb2 15s ease-in-out infinite; } .orb3 { animation:orb3 10s ease-in-out infinite; }
            .particle { animation:particle linear infinite; position:absolute; bottom:-10px; border-radius:50%; }
            .particle:nth-child(1){left:10%;animation-duration:8s;width:6px;height:6px}
            .particle:nth-child(2){left:20%;animation-duration:10s;animation-delay:1s;width:4px;height:4px}
            .particle:nth-child(3){left:35%;animation-duration:7s;animation-delay:2s;width:5px;height:5px}
            .particle:nth-child(4){left:50%;animation-duration:11s;animation-delay:0.5s;width:3px;height:3px}
            .particle:nth-child(5){left:65%;animation-duration:9s;animation-delay:1.5s;width:6px;height:6px}
            .particle:nth-child(6){left:75%;animation-duration:12s;animation-delay:3s;width:4px;height:4px}
            .particle:nth-child(7){left:85%;animation-duration:8s;animation-delay:2.5s;width:5px;height:5px}
            .particle:nth-child(8){left:90%;animation-duration:10s;animation-delay:4s;width:3px;height:3px}
          `}</style>

          <div style={{ position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
              <div className="orb1" style={{ position: "absolute", top: "5%", left: "10%", width: "400px", height: "400px", borderRadius: "50%", background: "radial-gradient(circle, rgba(26,63,168,0.18) 0%, transparent 70%)", filter: "blur(40px)" }} />
              <div className="orb2" style={{ position: "absolute", top: "10%", right: "5%", width: "350px", height: "350px", borderRadius: "50%", background: "radial-gradient(circle, rgba(29,158,117,0.15) 0%, transparent 70%)", filter: "blur(40px)" }} />
              <div className="orb3" style={{ position: "absolute", bottom: "5%", left: "40%", width: "300px", height: "300px", borderRadius: "50%", background: "radial-gradient(circle, rgba(26,63,168,0.1) 0%, transparent 70%)", filter: "blur(50px)" }} />
              <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(26,63,168,1) 1px,transparent 1px),linear-gradient(90deg,rgba(26,63,168,1) 1px,transparent 1px)", backgroundSize: "60px 60px", opacity: 0.04 }} />
              <div style={{ position: "absolute", inset: 0 }}>
                {[...Array(8)].map((_, i) => <div key={i} className="particle" style={{ background: i % 2 === 0 ? "rgba(26,63,168,0.5)" : "rgba(29,158,117,0.5)" }} />)}
              </div>
            </div>

            <div style={{ padding: "5rem 1.5rem 4rem", textAlign: "center", maxWidth: "760px", margin: "0 auto", position: "relative", zIndex: 1 }}>
              <div className="hero-badge" style={{ ...S.tag("purple"), marginBottom: "1.25rem", fontSize: "13px" }}>🚀 AI-Powered Education & Career Platform</div>
              <h1 className="hero-title" style={{ fontSize: "clamp(2.2rem,5vw,3.4rem)", fontWeight: 500, lineHeight: 1.15, margin: "0 0 1.25rem" }}>
                Your AI Mentor for<br /><span className="shimmer-text">Education & UK Careers</span>
              </h1>
              <p className="hero-sub" style={{ fontSize: "1.1rem", color: "var(--color-text-secondary)", lineHeight: 1.8, margin: "0 0 2.25rem", maxWidth: "560px", marginLeft: "auto", marginRight: "auto" }}>
                Mentorgram guides students from education to employment across the UK, Australia, Germany, Finland and Austria — with AI mentoring, university pathways, and visa-sponsored job opportunities.
              </p>
              <div className="hero-btns" style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
                <button className="hero-btn-primary" style={S.btnPrimary} onClick={() => navTo("AI Mentor")}>Chat with AI Mentor</button>
                <button className="hero-btn-outline" style={S.btnOutline} onClick={() => navTo("Sponsorship Jobs")}>Browse Jobs</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: "1rem", margin: "3rem 0 0" }}>
                {[["5","Countries Covered","🌍"],["Free","To Use","✨"],["500+","Visa Sponsors","🏢"],[FALLBACK_JOBS.length+"+","Live Jobs","💼"]].map(([n,l,icon]) => (
                  <div key={l} className="stat-card" style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-lg)", padding: "1.25rem 1rem", textAlign: "center", border: "0.5px solid var(--color-border-tertiary)" }}>
                    <div style={{ fontSize: "22px", marginBottom: "6px" }}>{icon}</div>
                    <p style={{ fontSize: "26px", fontWeight: 500, margin: "0 0 4px" }}>{n}</p>
                    <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", margin: 0 }}>{l}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ background: "var(--color-background-primary)", borderTop: "0.5px solid var(--color-border-tertiary)", borderBottom: "0.5px solid var(--color-border-tertiary)", padding: "3rem 1.5rem" }}>
            <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
              <h2 style={{ ...S.sectionTitle, textAlign: "center", marginBottom: "0.5rem" }}>How Mentorgram works</h2>
              <p style={{ ...S.sectionSub, textAlign: "center", marginBottom: "2.5rem" }}>Four simple steps from student to UK career</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: "1rem" }}>
                {[{ step:"01",icon:"🗺️",title:"Choose your pathway",desc:"Tell us your education background and career goals." },{ step:"02",icon:"🤖",title:"Get AI guidance",desc:"Your personal AI mentor creates a tailored plan." },{ step:"03",icon:"🎓",title:"Apply to UK universities",desc:"Navigate UCAS with expert step-by-step support." },{ step:"04",icon:"💼",title:"Land a sponsored job",desc:"Find UK employers who will sponsor your visa." }].map(s => (
                  <div key={s.step} className="step-item" style={{ display: "flex", gap: "14px", alignItems: "flex-start", padding: "1.25rem", background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-lg)", border: "0.5px solid var(--color-border-tertiary)" }}>
                    <div style={{ minWidth: "40px", height: "40px", borderRadius: "10px", background: "linear-gradient(135deg,#1A3FA8,#FF4500)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "13px", fontWeight: 500 }}>{s.step}</div>
                    <div>
                      <p style={{ fontWeight: 500, margin: "0 0 4px", fontSize: "15px" }}>{s.title}</p>
                      <p style={{ color: "var(--color-text-secondary)", fontSize: "13px", margin: 0, lineHeight: 1.6 }}>{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ padding: "3rem 1.5rem" }}>
            <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
              <h2 style={{ ...S.sectionTitle, textAlign: "center", marginBottom: "0.5rem" }}>Everything you need to succeed</h2>
              <p style={{ ...S.sectionSub, textAlign: "center", marginBottom: "2.5rem" }}>From subject selection to landing your first UK job.</p>
              <div style={S.grid3}>
                {FEATURES.map(f => (
                  <div key={f.title} className="feature-card" style={S.card}>
                    <div className="float-icon" style={{ fontSize: "28px", marginBottom: "12px" }}>{f.icon}</div>
                    <p style={{ fontWeight: 500, margin: "0 0 6px", fontSize: "15px" }}>{f.title}</p>
                    <p style={{ color: "var(--color-text-secondary)", fontSize: "14px", margin: 0, lineHeight: 1.6 }}>{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ padding: "4rem 1.5rem", borderTop: "0.5px solid var(--color-border-tertiary)" }}>
            <div style={{ maxWidth: "540px", margin: "0 auto", textAlign: "center" }}>
              <h2 style={S.sectionTitle}>Join the waitlist</h2>
              <p style={S.sectionSub}>Be among the first to access Mentorgram's full platform.</p>
              {waitlistDone ? (
                <div style={{ ...S.card, background: "rgba(255,69,0,0.1)", border: "0.5px solid rgba(255,69,0,0.3)" }}><p style={{ color: "#FF4500", fontWeight: 500, margin: 0 }}>🎉 You're on the list! We'll be in touch soon.</p></div>
              ) : (
                <div style={{ display: "flex", gap: "8px" }}>
                  <input style={{ ...S.input, flex: 1 }} type="email" placeholder="Enter your email address" value={waitlistEmail} onChange={e => setWaitlistEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && waitlistEmail && setWaitlistDone(true)} />
                  <button style={S.btnPrimary} onClick={() => waitlistEmail && setWaitlistDone(true)}>Join</button>
                </div>
              )}
            </div>
          </div>
        </div>
      );

      case "AI Mentor": return (
        <div style={{ maxWidth: "560px", margin: "0 auto", padding: "4rem 1.5rem", textAlign: "center" }}>
          <div style={{ fontSize: "56px", marginBottom: "1.5rem" }}>🤖</div>
          <h2 style={{ fontSize: "1.8rem", fontWeight: 500, margin: "0 0 0.75rem", color: "var(--color-text-primary)" }}>AI Mentor</h2>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "16px", lineHeight: 1.7, margin: "0 0 2rem" }}>
            We're building something powerful — a personalised AI mentor that guides you through education pathways, career decisions, and UK visa-sponsored job opportunities.
          </p>
          <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: "1.5rem", marginBottom: "1.5rem" }}>
            <p style={{ fontSize: "13px", fontWeight: 600, color: "#16A34A", margin: "0 0 0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>✦ Coming Soon</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", textAlign: "left" }}>
              {["Personalised career roadmaps for your background", "UK, Australia, Germany, Finland & Austria pathways", "Visa guidance and sponsorship job matching", "University application support (UCAS & international)", "Live industry demand forecasts and salary insights"].map((f, i) => (
                <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                  <span style={{ color: "#1A3FA8", fontWeight: 600, flexShrink: 0 }}>→</span>
                  <span style={{ fontSize: "14px", color: "var(--color-text-primary)" }}>{f}</span>
                </div>
              ))}
            </div>
          </div>
          <p style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>
            Want early access?{" "}
            <button onClick={() => navTo("Contact")} style={{ background: "none", border: "none", color: "#1A3FA8", cursor: "pointer", fontFamily: "inherit", fontSize: "13px", fontWeight: 500, padding: 0, textDecoration: "underline" }}>
              Get in touch
            </button>
          </p>
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
                      <span style={l==="Scholarships"?{color:"#1A3FA8"}:{}}>{v}</span>
                    </div>
                  ))}
                </div>
                <button style={{ ...S.btnOutline, marginTop: "12px", padding: "8px 16px", fontSize: "13px", width: "100%" }} onClick={() => { setChatInput(`Tell me more about ${u.name} — courses, tips and scholarships`); navTo("AI Mentor"); }}>Ask AI Mentor ↗</button>
              </div>
            ))}
          </div>
        </div>
      );

      case "Sponsorship Jobs": return selectedJob ? (
        <JobDetailPage job={selectedJob} onBack={() => { setSelectedJob(null); window.location.hash = ""; }} onAskMentor={(msg) => { setChatInput(msg); setSelectedJob(null); navTo("AI Mentor"); }} />
      ) : (
        <JobsPage allJobs={allJobs} jobsLoading={jobsLoading} updatedAt={updatedAt} onFetchJobs={fetchJobs}
          onSelectJob={(job) => { setSelectedJob(job); window.scrollTo(0, 0); }}
          profileFilter={profileFilter} onClearProfileFilter={() => setProfileFilter(null)} />
      );

      case "Contact": return <ContactPage />;
      case "Visa Sponsors": return <SponsorsPage />;
      case "Privacy Policy": return <PrivacyPage />;
      case "Terms & Conditions": return <TermsPage />;

      case "Guide": return <GuidePage navTo={navTo} />;

      case "My Profile": return user ? (
        <Dashboard
          user={user}
          allJobs={allJobs}
          onLogout={() => { setUser(null); navTo("Home"); }}
          onFilterByProfile={(filter) => setProfileFilter(filter)}
          onNavigate={navTo}
        />
      ) : (
        <AuthPage onLogin={(u) => { setUser(u); }} onNavToHome={() => navTo("Home")} />
      );

      default: return null;
    }
  }

  return (
    <div style={S.wrap}>
      <style>{`
        @media (max-width: 768px) { .desktop-nav { display:none !important; } .hamburger-btn { display:flex !important; } }
        @media (min-width: 769px) { .mobile-menu { display:none !important; } .hamburger-btn { display:none !important; } .desktop-nav { display:flex !important; } }
      `}</style>
      <nav style={{ background: "var(--color-background-primary)", borderBottom: "0.5px solid var(--color-border-tertiary)", padding: "0 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", height: "60px", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "9px", cursor: "pointer" }} onClick={() => navTo("Home")}>
          <img src="/logo.png" alt="Mentorgram" style={{ width: "40px", height: "40px", objectFit: "cover", borderRadius: "22%", display: "block" }} />
          <span style={{ fontSize: "17px", fontWeight: 600, color: "var(--color-text-primary)", letterSpacing: "-0.01em" }}>Mentorgram</span>
        </div>
        <div className="desktop-nav" style={{ display: "flex", gap: "4px", alignItems: "center" }}>
          {NAV_LINKS.filter(l => l !== "My Profile").map(l => {
            const isDisabled = l === "AI Mentor";
            return (
              <button key={l} className="nav-btn"
                style={{ padding: "6px 12px", borderRadius: "var(--border-radius-md)", cursor: isDisabled ? "default" : "pointer", fontSize: "14px", background: activePage === l ? "var(--color-background-secondary)" : "transparent", color: isDisabled ? "var(--color-border-secondary)" : activePage === l ? "var(--color-text-primary)" : "var(--color-text-secondary)", border: "none", fontFamily: "inherit", opacity: isDisabled ? 0.45 : 1 }}
                onClick={() => !isDisabled && navTo(l)}
                title={isDisabled ? "Coming soon" : ""}
              >
                {l}{isDisabled && <span style={{ fontSize: "9px", background: "rgba(128,128,128,0.15)", color: "var(--color-text-secondary)", padding: "1px 5px", borderRadius: "4px", marginLeft: "4px", verticalAlign: "middle" }}>Soon</span>}
              </button>
            );
          })}
          {user ? (
            <button onClick={() => navTo("My Profile")} title="My Dashboard" style={{ width: "34px", height: "34px", borderRadius: "50%", background: activePage === "My Profile" ? "#1A3FA8" : "linear-gradient(135deg,#1A3FA8,#FF4500)", border: "none", cursor: "pointer", color: "#fff", fontWeight: 600, fontSize: "13px", fontFamily: "inherit" }}>
              {(user.user_metadata?.full_name || user.email || "?")[0].toUpperCase()}
            </button>
          ) : (
            <button onClick={() => navTo("My Profile")} style={{ padding: "6px 16px", borderRadius: "var(--border-radius-md)", background: "#1A3FA8", color: "#fff", border: "none", fontSize: "13px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>Sign in</button>
          )}
        </div>
        <button className="hamburger-btn" style={{ display: "none", flexDirection: "column", gap: "5px", cursor: "pointer", padding: "8px", border: "none", background: "transparent" }} onClick={() => setMobileMenu(m => !m)}>
          <span style={{ width: "22px", height: "2px", background: "var(--color-text-primary)", borderRadius: "2px", display: "block", transition: "transform 0.2s", transform: mobileMenu ? "rotate(45deg) translate(5px,5px)" : "none" }} />
          <span style={{ width: "22px", height: "2px", background: "var(--color-text-primary)", borderRadius: "2px", display: "block", opacity: mobileMenu ? 0 : 1, transition: "opacity 0.2s" }} />
          <span style={{ width: "22px", height: "2px", background: "var(--color-text-primary)", borderRadius: "2px", display: "block", transition: "transform 0.2s", transform: mobileMenu ? "rotate(-45deg) translate(5px,-5px)" : "none" }} />
        </button>
      </nav>
      <div className="mobile-menu" style={{ display: mobileMenu ? "flex" : "none", flexDirection: "column", position: "fixed", top: "60px", left: 0, right: 0, background: "var(--color-background-primary)", borderBottom: "0.5px solid var(--color-border-tertiary)", padding: "0.75rem 1rem", gap: "4px", zIndex: 99 }}>
        {NAV_LINKS.filter(l => l !== "My Profile").map(l => {
          const isDisabled = l === "AI Mentor";
          return (
            <button key={l}
              style={{ padding: "12px 14px", borderRadius: "var(--border-radius-md)", cursor: isDisabled ? "default" : "pointer", fontSize: "15px", background: activePage === l ? "var(--color-background-secondary)" : "transparent", color: isDisabled ? "var(--color-border-secondary)" : activePage === l ? "var(--color-text-primary)" : "var(--color-text-secondary)", border: "none", fontFamily: "inherit", textAlign: "left", width: "100%", fontWeight: activePage === l ? 500 : 400, opacity: isDisabled ? 0.5 : 1 }}
              onClick={() => !isDisabled && navTo(l)}
            >
              {l}{isDisabled && <span style={{ fontSize: "10px", marginLeft: "6px", color: "var(--color-text-secondary)" }}>— Coming soon</span>}
            </button>
          );
        })}
        {/* Sign In / Dashboard in mobile menu */}
        <div style={{ borderTop: "0.5px solid var(--color-border-tertiary)", marginTop: "4px", paddingTop: "8px" }}>
          {user ? (
            <button onClick={() => { navTo("My Profile"); setMobileMenu(false); }}
              style={{ padding: "12px 14px", borderRadius: "var(--border-radius-md)", cursor: "pointer", fontSize: "15px", background: activePage === "My Profile" ? "var(--color-background-secondary)" : "transparent", color: "var(--color-text-primary)", border: "none", fontFamily: "inherit", textAlign: "left", width: "100%", fontWeight: 500, display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "linear-gradient(135deg,#1A3FA8,#FF4500)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 600, fontSize: "12px", flexShrink: 0 }}>
                {(user.user_metadata?.full_name || user.email || "?")[0].toUpperCase()}
              </div>
              My Dashboard
            </button>
          ) : (
            <button onClick={() => { navTo("My Profile"); setMobileMenu(false); }}
              style={{ padding: "12px 14px", borderRadius: "var(--border-radius-md)", cursor: "pointer", fontSize: "15px", background: "#1A3FA8", color: "#fff", border: "none", fontFamily: "inherit", textAlign: "left", width: "100%", fontWeight: 500 }}>
              Sign In / Register
            </button>
          )}
        </div>
      </div>
      <main onClick={() => mobileMenu && setMobileMenu(false)} style={{ paddingBottom: cookieConsent ? 0 : "80px" }}>
        <style>{`
          @keyframes pageIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes pageOut { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(-8px); } }
          @keyframes jobCardPop { 0% { transform: scale(1); } 40% { transform: scale(0.97); } 70% { transform: scale(1.02); } 100% { transform: scale(1); } }
          .page-enter { animation: pageIn 0.3s ease forwards; }
          .page-exit { animation: pageOut 0.2s ease forwards; }
          .job-card-click { animation: jobCardPop 0.35s ease forwards; }
          .nav-btn { transition: all 0.15s ease; }
          .nav-btn:hover { transform: translateY(-1px); }
        `}</style>
        <div className={pageTransition ? "page-exit" : "page-enter"} key={activePage}>
          {renderPage()}
        </div>
      </main>
      <footer style={S.footer}>
        {/* Social links */}
        <div style={{ display: "flex", gap: "16px", justifyContent: "center", marginBottom: "14px" }}>
          <a href="https://www.linkedin.com/company/mentorgramai" target="_blank" rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--color-text-secondary)", textDecoration: "none", fontSize: "13px", fontWeight: 500, transition: "color 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.color = "#0A66C2"}
            onMouseLeave={e => e.currentTarget.style.color = "var(--color-text-secondary)"}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            LinkedIn
          </a>
          <a href="https://www.instagram.com/mentorgramai" target="_blank" rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--color-text-secondary)", textDecoration: "none", fontSize: "13px", fontWeight: 500, transition: "color 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.color = "#E1306C"}
            onMouseLeave={e => e.currentTarget.style.color = "var(--color-text-secondary)"}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
            Instagram
          </a>
        </div>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "14px", margin: 0 }}>© 2026 Mentorgram AI · <span style={{ textDecoration: "none" }}>info@mentorgramai.com</span> · mentorgramai.com</p>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "12px", margin: "6px 0 0" }}>Guiding students to study, work and thrive in 🇬🇧 UK · 🇦🇺 Australia · 🇩🇪 Germany · 🇫🇮 Finland · 🇦🇹 Austria</p>
        <div style={{ display: "flex", gap: "16px", justifyContent: "center", marginTop: "1rem", flexWrap: "wrap" }}>
          {["Privacy Policy", "Terms & Conditions", "Contact"].map(l => (
            <button key={l} onClick={() => navTo(l)} style={{ background: "none", border: "none", color: "var(--color-text-secondary)", fontSize: "12px", cursor: "pointer", fontFamily: "inherit", textDecoration: "underline" }}>{l}</button>
          ))}
        </div>
      </footer>

      {/* Cookie Banner */}
      {!cookieConsent && (
        <CookieBanner
          onAccept={() => { localStorage.setItem("mg_cookies", "all"); setCookieConsent("all"); }}
          onReject={() => { localStorage.setItem("mg_cookies", "essential"); setCookieConsent("essential"); }}
        />
      )}
    </div>
  );
}
