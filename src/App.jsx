import { useState, useRef, useEffect } from "react";

const NAV_LINKS = ["Home", "AI Mentor", "Education Paths", "UK Universities", "Sponsorship Jobs", "Contact"];

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

// Real UK sponsorship jobs fetched from Indeed - March 2026
const ALL_JOBS = [
  { title: "Software Engineer (Backend)", company: "Duffel", location: "London", salary: "Competitive", sector: "Technology", posted: "Mar 10, 2026", url: "https://to.indeed.com/aa8lkh89tm2f" },
  { title: "kdb+ Developer (Sponsorship available)", company: "Data Intellect", location: "London", salary: "Competitive", sector: "Technology", posted: "Mar 18, 2026", url: "https://to.indeed.com/aacy7qmtdngf" },
  { title: "Data Scientist", company: "Ecotricity Group", location: "Stroud", salary: "£55,000–£65,000", sector: "AI & Data", posted: "Feb 17, 2026", url: "https://to.indeed.com/aanpm8v78c4q" },
  { title: "Applied Research Scientist (Speech)", company: "Emotech LTD", location: "London", salary: "From £45,000", sector: "AI & Data", posted: "Mar 20, 2026", url: "https://to.indeed.com/aadkm9q8xclx" },
  { title: "Senior Data Engineer", company: "AECOM", location: "Bristol", salary: "£58,500–£71,812", sector: "AI & Data", posted: "Mar 11, 2026", url: "https://to.indeed.com/aaz2vplvmxll" },
  { title: "Epidemiology Scientist", company: "MSD", location: "London", salary: "Competitive", sector: "Healthcare", posted: "Mar 10, 2026", url: "https://to.indeed.com/aatbqs2gbt6m" },
  { title: "Medical Secretary", company: "NHS", location: "North Hykeham", salary: "£27,485–£30,162", sector: "Healthcare", posted: "Mar 09, 2026", url: "https://to.indeed.com/aa62hddsjc7x" },
  { title: "School Nurse Assistant", company: "Rikkyo School", location: "Rudgwick", salary: "£27,000–£36,000", sector: "Healthcare", posted: "Mar 03, 2026", url: "https://to.indeed.com/aaqfn8qxl7vc" },
  { title: "Financial Analyst", company: "Confidential", location: "Bromley", salary: "£45,800–£100,000", sector: "Finance", posted: "Mar 12, 2026", url: "https://to.indeed.com/aagp8bkm6tfb" },
  { title: "Equipment Engineer", company: "Seagate Technology", location: "Derry", salary: "£27,827–£35,875", sector: "Engineering", posted: "Mar 09, 2026", url: "https://to.indeed.com/aa96f2kjv2np" },
  { title: "Civil Engineer Project Leader", company: "JN Bentley", location: "Reading", salary: "£36,000–£66,000", sector: "Engineering", posted: "Aug 12, 2025", url: "https://to.indeed.com/aa6tvqx8gsfd" },
  { title: "Project Leader", company: "Mott MacDonald", location: "Newport", salary: "£36,500–£55,000", sector: "Engineering", posted: "Jul 25, 2025", url: "https://to.indeed.com/aadr7s9xb4fw" },
  { title: "Lead Manufacturing Engineer", company: "GE Aerospace", location: "Gloucester", salary: "£23,795–£40,500", sector: "Engineering", posted: "Feb 25, 2026", url: "https://to.indeed.com/aagryjj7g7pb" },
];

const SECTORS = ["All", "Technology", "AI & Data", "Healthcare", "Finance", "Engineering"];

export default function Mentorgram() {
  const [activePage, setActivePage] = useState("Home");
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! I'm your Mentorgram AI Mentor 👋 I can help you with education pathways, UK university applications, career guidance, and finding visa-sponsored jobs. What would you like to explore today?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sector, setSector] = useState("All");
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistDone, setWaitlistDone] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const filteredJobs = sector === "All" ? ALL_JOBS : ALL_JOBS.filter(j => j.sector === sector);

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true"
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: "You are the Mentorgram AI Mentor — a friendly, expert career and education advisor. You help students worldwide navigate education pathways, UK university applications, visa processes, and career planning. Specialise in UK education (GCSEs, A-Levels, UCAS), international student pathways, UK visa sponsorship jobs, and career guidance in AI, healthcare, engineering, finance, cybersecurity, and green energy. Be concise, warm, and actionable.",
          messages: [...messages, { role: "user", content: userMsg }].map(m => ({ role: m.role, content: m.content }))
        })
      });
      const data = await res.json();
      const reply = data.content?.[0]?.text || "I'm here to help! Could you rephrase your question?";
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I'm having trouble connecting. Please try again in a moment." }]);
    }
    setLoading(false);
  }

  const s = {
    wrap: { fontFamily: "var(--font-sans)", color: "var(--color-text-primary)", minHeight: "100vh", background: "var(--color-background-tertiary)" },
    nav: { background: "var(--color-background-primary)", borderBottom: "0.5px solid var(--color-border-tertiary)", padding: "0 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", height: "60px", position: "sticky", top: 0, zIndex: 100 },
    logo: { display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" },
    logoMark: { width: "36px", height: "36px", borderRadius: "10px", background: "linear-gradient(135deg, #534AB7, #1D9E75)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 500, fontSize: "18px" },
    logoText: { fontSize: "18px", fontWeight: 500, color: "var(--color-text-primary)" },
    navLinks: { display: "flex", gap: "4px", alignItems: "center", flexWrap: "wrap" },
    navLink: (active) => ({ padding: "6px 12px", borderRadius: "var(--border-radius-md)", cursor: "pointer", fontSize: "14px", background: active ? "var(--color-background-secondary)" : "transparent", color: active ? "var(--color-text-primary)" : "var(--color-text-secondary)", border: "none", fontFamily: "inherit" }),
    hero: { padding: "5rem 1.5rem 4rem", textAlign: "center", maxWidth: "720px", margin: "0 auto" },
    heroTitle: { fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 500, lineHeight: 1.2, margin: "0 0 1rem", color: "var(--color-text-primary)" },
    heroAccent: { background: "linear-gradient(135deg, #534AB7, #1D9E75)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
    heroSub: { fontSize: "1.1rem", color: "var(--color-text-secondary)", lineHeight: 1.7, margin: "0 0 2rem" },
    btnPrimary: { padding: "12px 28px", borderRadius: "var(--border-radius-md)", background: "#534AB7", color: "#fff", border: "none", fontSize: "15px", fontWeight: 500, cursor: "pointer" },
    btnOutline: { padding: "12px 28px", borderRadius: "var(--border-radius-md)", background: "transparent", color: "var(--color-text-primary)", border: "0.5px solid var(--color-border-secondary)", fontSize: "15px", fontWeight: 500, cursor: "pointer" },
    section: { maxWidth: "1100px", margin: "0 auto", padding: "3rem 1.5rem" },
    sectionTitle: { fontSize: "1.6rem", fontWeight: 500, margin: "0 0 0.5rem", color: "var(--color-text-primary)" },
    sectionSub: { color: "var(--color-text-secondary)", margin: "0 0 2rem", fontSize: "15px" },
    grid3: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" },
    grid2: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1rem" },
    card: { background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: "1.25rem" },
    tag: (color) => ({ display: "inline-block", padding: "3px 10px", borderRadius: "var(--border-radius-md)", fontSize: "12px", background: color === "purple" ? "#EEEDFE" : color === "teal" ? "#E1F5EE" : "#E6F1FB", color: color === "purple" ? "#3C3489" : color === "teal" ? "#085041" : "#0C447C", fontWeight: 500 }),
    chatWrap: { maxWidth: "760px", margin: "0 auto", padding: "1.5rem" },
    chatBox: { background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", display: "flex", flexDirection: "column", height: "520px" },
    chatMessages: { flex: 1, overflowY: "auto", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" },
    msgUser: { alignSelf: "flex-end", background: "#534AB7", color: "#fff", padding: "10px 14px", borderRadius: "16px 16px 4px 16px", maxWidth: "75%", fontSize: "14px", lineHeight: 1.6 },
    msgBot: { alignSelf: "flex-start", background: "var(--color-background-secondary)", color: "var(--color-text-primary)", padding: "10px 14px", borderRadius: "16px 16px 16px 4px", maxWidth: "75%", fontSize: "14px", lineHeight: 1.6 },
    chatInputRow: { display: "flex", gap: "8px", padding: "1rem", borderTop: "0.5px solid var(--color-border-tertiary)" },
    input: { flex: 1, padding: "10px 14px", borderRadius: "var(--border-radius-md)", border: "0.5px solid var(--color-border-secondary)", background: "var(--color-background-secondary)", color: "var(--color-text-primary)", fontSize: "14px", outline: "none" },
    sendBtn: { padding: "10px 20px", borderRadius: "var(--border-radius-md)", background: "#534AB7", color: "#fff", border: "none", fontSize: "14px", cursor: "pointer", fontWeight: 500 },
    filterRow: { display: "flex", gap: "8px", flexWrap: "wrap", margin: "0 0 1.5rem" },
    filterBtn: (active) => ({ padding: "6px 16px", borderRadius: "20px", border: active ? "none" : "0.5px solid var(--color-border-secondary)", background: active ? "#534AB7" : "var(--color-background-primary)", color: active ? "#fff" : "var(--color-text-secondary)", fontSize: "13px", cursor: "pointer" }),
    footer: { borderTop: "0.5px solid var(--color-border-tertiary)", background: "var(--color-background-primary)", padding: "2rem 1.5rem", textAlign: "center" },
    statsRow: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem", margin: "2rem 0" },
    statCard: { background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", padding: "1rem", textAlign: "center" },
    liveTag: { display: "inline-flex", alignItems: "center", gap: "5px", padding: "3px 10px", borderRadius: "20px", fontSize: "12px", background: "#E1F5EE", color: "#085041", fontWeight: 500, marginLeft: "10px" },
    liveDot: { width: "6px", height: "6px", borderRadius: "50%", background: "#1D9E75", display: "inline-block" },
  };

  function HomePage() {
    return (
      <div>
        <div style={s.hero}>
          <div style={{ ...s.tag("purple"), marginBottom: "1rem", fontSize: "13px" }}>🚀 AI-Powered Education & Career Platform</div>
          <h1 style={s.heroTitle}>Your AI Mentor for<br /><span style={s.heroAccent}>Education & UK Careers</span></h1>
          <p style={s.heroSub}>Mentorgram guides students worldwide from education to employment — with personalised AI mentoring, UK university pathways, and live visa-sponsored job opportunities.</p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <button style={s.btnPrimary} onClick={() => setActivePage("AI Mentor")}>Chat with AI Mentor</button>
            <button style={s.btnOutline} onClick={() => setActivePage("Sponsorship Jobs")}>Browse Live Jobs</button>
          </div>
          <div style={s.statsRow}>
            {[["50+", "Countries Supported"], ["100K+", "Students Guided"], ["500+", "UK Employers"], ["Live", "Job Listings"]].map(([n, l]) => (
              <div key={l} style={s.statCard}>
                <p style={{ fontSize: "24px", fontWeight: 500, margin: "0 0 4px" }}>{n}</p>
                <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", margin: 0 }}>{l}</p>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: "var(--color-background-primary)", borderTop: "0.5px solid var(--color-border-tertiary)", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
          <div style={s.section}>
            <h2 style={s.sectionTitle}>Everything you need to succeed</h2>
            <p style={s.sectionSub}>From subject selection to landing your first UK job — Mentorgram is with you every step.</p>
            <div style={s.grid3}>
              {FEATURES.map(f => (
                <div key={f.title} style={s.card}>
                  <div style={{ fontSize: "24px", marginBottom: "10px" }}>{f.icon}</div>
                  <p style={{ fontWeight: 500, margin: "0 0 6px", fontSize: "15px" }}>{f.title}</p>
                  <p style={{ color: "var(--color-text-secondary)", fontSize: "14px", margin: 0, lineHeight: 1.6 }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={s.section}>
          <div style={{ maxWidth: "540px", margin: "0 auto", textAlign: "center" }}>
            <h2 style={s.sectionTitle}>Join the waitlist</h2>
            <p style={s.sectionSub}>Be among the first to access Mentorgram's full platform when we launch.</p>
            {waitlistDone ? (
              <div style={{ ...s.card, background: "#E1F5EE", border: "0.5px solid #5DCAA5" }}>
                <p style={{ color: "#085041", fontWeight: 500, margin: 0 }}>🎉 You're on the list! We'll be in touch soon.</p>
              </div>
            ) : (
              <div style={{ display: "flex", gap: "8px" }}>
                <input style={{ ...s.input, flex: 1 }} type="email" placeholder="Enter your email address" value={waitlistEmail} onChange={e => setWaitlistEmail(e.target.value)} />
                <button style={s.btnPrimary} onClick={() => waitlistEmail && setWaitlistDone(true)}>Join</button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  function AIMentorPage() {
    return (
      <div style={s.chatWrap}>
        <h2 style={{ ...s.sectionTitle, marginBottom: "0.25rem" }}>AI Mentor</h2>
        <p style={{ ...s.sectionSub, marginBottom: "1.5rem" }}>Ask me anything about education, universities, careers, or UK visa-sponsored jobs.</p>
        <div style={s.chatBox}>
          <div style={s.chatMessages}>
            {messages.map((m, i) => (
              <div key={i} style={m.role === "user" ? s.msgUser : s.msgBot}>{m.content}</div>
            ))}
            {loading && <div style={{ ...s.msgBot, color: "var(--color-text-secondary)" }}>Thinking...</div>}
            <div ref={messagesEndRef} />
          </div>
          <div style={s.chatInputRow}>
            <input style={s.input} placeholder="Ask about universities, careers, visas..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()} />
            <button style={s.sendBtn} onClick={sendMessage} disabled={loading}>Send</button>
          </div>
        </div>
        <div style={{ ...s.filterRow, marginTop: "1rem" }}>
          {["How do I apply to UK universities?", "What jobs offer visa sponsorship?", "Which A-levels should I choose?", "How does the Skilled Worker visa work?"].map(q => (
            <button key={q} style={{ ...s.filterBtn(false), fontSize: "12px" }} onClick={() => setInput(q)}>{q}</button>
          ))}
        </div>
      </div>
    );
  }

  function EducationPage() {
    return (
      <div style={s.section}>
        <h2 style={s.sectionTitle}>Education pathways</h2>
        <p style={s.sectionSub}>Mentorgram supports students from all major education systems worldwide.</p>
        <div style={s.grid2}>
          {EDUCATION_SYSTEMS.map(e => (
            <div key={e.country} style={s.card}>
              <p style={{ fontWeight: 500, margin: "0 0 10px", fontSize: "15px" }}>{e.country}</p>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {e.systems.map(sys => <span key={sys} style={s.tag("purple")}>{sys}</span>)}
              </div>
              <button style={{ ...s.btnOutline, marginTop: "12px", padding: "8px 16px", fontSize: "13px" }} onClick={() => { setInput(`Tell me about the ${e.systems[0]} education system and pathways to UK universities`); setActivePage("AI Mentor"); }}>Get guidance ↗</button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function UniversitiesPage() {
    return (
      <div style={s.section}>
        <h2 style={s.sectionTitle}>UK universities</h2>
        <p style={s.sectionSub}>Explore top UK universities, entry requirements and scholarships.</p>
        <div style={s.grid2}>
          {UK_UNIVERSITIES.map(u => (
            <div key={u.name} style={s.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                <p style={{ fontWeight: 500, margin: 0, fontSize: "15px" }}>{u.name}</p>
                <span style={s.tag("purple")}>{u.rank}</span>
              </div>
              <p style={{ color: "var(--color-text-secondary)", fontSize: "13px", margin: "0 0 10px" }}>{u.focus}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {[["UK entry", u.entry], ["International", u.intl], ["Scholarships", u.scholarships]].map(([label, val]) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                    <span style={{ color: "var(--color-text-secondary)" }}>{label}</span>
                    <span style={label === "Scholarships" ? { color: "#3C3489" } : {}}>{val}</span>
                  </div>
                ))}
              </div>
              <button style={{ ...s.btnOutline, marginTop: "12px", padding: "8px 16px", fontSize: "13px", width: "100%" }} onClick={() => { setInput(`Tell me more about ${u.name} — courses, application tips and scholarships`); setActivePage("AI Mentor"); }}>Ask AI Mentor ↗</button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function JobsPage() {
    return (
      <div style={s.section}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: "0.25rem" }}>
          <h2 style={{ ...s.sectionTitle, margin: 0 }}>Sponsorship jobs</h2>
          <span style={s.liveTag}><span style={s.liveDot} />&nbsp;Live from Indeed</span>
        </div>
        <p style={s.sectionSub}>Real UK jobs with visa sponsorship — sourced from Indeed.</p>
        <div style={s.filterRow}>
          {SECTORS.map(sec => (
            <button key={sec} style={s.filterBtn(sector === sec)} onClick={() => setSector(sec)}>{sec}</button>
          ))}
        </div>
        <div style={s.grid2}>
          {filteredJobs.map((j, i) => (
            <div key={i} style={{ ...s.card, display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1, marginRight: "10px" }}>
                  <p style={{ fontWeight: 500, margin: "0 0 4px", fontSize: "15px" }}>{j.title}</p>
                  <p style={{ color: "var(--color-text-secondary)", fontSize: "13px", margin: 0 }}>{j.company}</p>
                </div>
                <span style={s.tag("teal")}>Visa Sponsor</span>
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <span style={s.tag("purple")}>{j.sector}</span>
                <span style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>📍 {j.location}</span>
                <span style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>🗓 {j.posted}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <p style={{ fontWeight: 500, color: "#3C3489", margin: 0, fontSize: "14px" }}>{j.salary}</p>
                <a href={j.url} target="_blank" rel="noopener noreferrer" style={{ padding: "7px 16px", borderRadius: "var(--border-radius-md)", background: "#534AB7", color: "#fff", fontSize: "13px", textDecoration: "none", fontWeight: 500 }}>Apply ↗</a>
              </div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: "2rem" }}>
          <a href="https://uk.indeed.com/jobs?q=visa+sponsorship&l=United+Kingdom" target="_blank" rel="noopener noreferrer" style={{ ...s.btnOutline, textDecoration: "none", display: "inline-block" }}>View all jobs on Indeed ↗</a>
        </div>
      </div>
    );
  }

  function ContactPage() {
    return (
      <div style={s.section}>
        <div style={{ maxWidth: "540px", margin: "0 auto" }}>
          <h2 style={s.sectionTitle}>Get in touch</h2>
          <p style={s.sectionSub}>Have questions about Mentorgram? We'd love to hear from you.</p>
          <div style={s.card}>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "flex", gap: "10px" }}>
                <input style={s.input} placeholder="Your name" />
                <input style={s.input} placeholder="Your email" />
              </div>
              <input style={s.input} placeholder="Subject" />
              <textarea style={{ ...s.input, height: "120px", resize: "vertical" }} placeholder="Your message..." />
              <button style={s.btnPrimary}>Send message</button>
            </div>
          </div>
          <div style={{ ...s.card, marginTop: "1rem" }}>
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
  }

  const pages = {
    "Home": <HomePage />,
    "AI Mentor": <AIMentorPage />,
    "Education Paths": <EducationPage />,
    "UK Universities": <UniversitiesPage />,
    "Sponsorship Jobs": <JobsPage />,
    "Contact": <ContactPage />
  };

  return (
    <div style={s.wrap}>
      <nav style={s.nav}>
        <div style={s.logo} onClick={() => setActivePage("Home")}>
          <div style={s.logoMark}>M</div>
          <span style={s.logoText}>Mentorgram</span>
        </div>
        <div style={s.navLinks}>
          {NAV_LINKS.map(l => (
            <button key={l} style={s.navLink(activePage === l)} onClick={() => setActivePage(l)}>{l}</button>
          ))}
        </div>
      </nav>
      <main>{pages[activePage]}</main>
      <footer style={s.footer}>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "14px", margin: 0 }}>© 2025 Mentorgram AI · info@mentorgramai.com · mentorgramai.com</p>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "13px", margin: "6px 0 0" }}>Empowering students worldwide to study, work, and thrive in the UK 🇬🇧</p>
      </footer>
    </div>
  );
}
