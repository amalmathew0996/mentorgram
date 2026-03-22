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

const SPONSORSHIP_JOBS = [
  { title: "Software Engineer", company: "Google UK", location: "London", salary: "£65,000–£95,000", sector: "Technology", visa: "Skilled Worker", type: "Full-time" },
  { title: "Data Scientist", company: "HSBC", location: "London / Remote", salary: "£55,000–£80,000", sector: "Finance", visa: "Skilled Worker", type: "Full-time" },
  { title: "NHS Junior Doctor", company: "NHS England", location: "Nationwide", salary: "£32,000–£58,000", sector: "Healthcare", visa: "Health & Care", type: "Full-time" },
  { title: "Cybersecurity Analyst", company: "BAE Systems", location: "Manchester", salary: "£45,000–£70,000", sector: "Cybersecurity", visa: "Skilled Worker", type: "Full-time" },
  { title: "AI Research Engineer", company: "DeepMind", location: "London", salary: "£75,000–£120,000", sector: "AI & Tech", visa: "Skilled Worker", type: "Full-time" },
  { title: "Renewable Energy Engineer", company: "Ørsted", location: "Leeds", salary: "£50,000–£75,000", sector: "Green Energy", visa: "Skilled Worker", type: "Full-time" },
  { title: "Financial Analyst", company: "Barclays", location: "London", salary: "£45,000–£65,000", sector: "Finance", visa: "Skilled Worker", type: "Full-time" },
  { title: "Biomedical Scientist", company: "AstraZeneca", location: "Cambridge", salary: "£40,000–£60,000", sector: "Healthcare", visa: "Skilled Worker", type: "Full-time" },
];

const SECTORS = ["All", "Technology", "Finance", "Healthcare", "Cybersecurity", "AI & Tech", "Green Energy"];

const FEATURES = [
  { icon: "🤖", title: "AI Mentor", desc: "Get personalised guidance on education and career paths powered by advanced AI." },
  { icon: "🎓", title: "University Gateway", desc: "Explore UK universities, entry requirements, scholarships and UCAS guidance." },
  { icon: "💼", title: "Sponsorship Jobs", desc: "Find UK employers who offer visa sponsorship across high-demand sectors." },
  { icon: "🗺️", title: "Education Pathways", desc: "Navigate your local education system with expert AI support and planning." },
  { icon: "📊", title: "Career Insights", desc: "Access salary data, industry demand forecasts and skills gap analysis." },
  { icon: "🌍", title: "Global Reach", desc: "Supporting students from 50+ countries on their journey to UK education." },
];

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
  const [mobileMenu, setMobileMenu] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: `You are the Mentorgram AI Mentor — a friendly, expert career and education advisor. You help students worldwide navigate education pathways, UK university applications, visa processes, and career planning. You specialise in UK education (GCSEs, A-Levels, UCAS), international student pathways, UK visa sponsorship jobs, and career guidance in sectors like AI, healthcare, engineering, finance, cybersecurity, and green energy. Be concise, warm, and actionable. Always encourage students and provide specific next steps.`,
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

  const filteredJobs = sector === "All" ? SPONSORSHIP_JOBS : SPONSORSHIP_JOBS.filter(j => j.sector === sector);

  const styles = {
    wrap: { fontFamily: "var(--font-sans)", color: "var(--color-text-primary)", minHeight: "100vh", background: "var(--color-background-tertiary)" },
    nav: { background: "var(--color-background-primary)", borderBottom: "0.5px solid var(--color-border-tertiary)", padding: "0 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", height: "60px", position: "sticky", top: 0, zIndex: 100 },
    logo: { display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" },
    logoMark: { width: "36px", height: "36px", borderRadius: "10px", background: "linear-gradient(135deg, #534AB7, #1D9E75)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 500, fontSize: "18px" },
    logoText: { fontSize: "18px", fontWeight: 500, color: "var(--color-text-primary)" },
    navLinks: { display: "flex", gap: "4px", alignItems: "center" },
    navLink: (active) => ({ padding: "6px 12px", borderRadius: "var(--border-radius-md)", cursor: "pointer", fontSize: "14px", background: active ? "var(--color-background-secondary)" : "transparent", color: active ? "var(--color-text-primary)" : "var(--color-text-secondary)", border: "none", fontFamily: "inherit" }),
    hero: { padding: "5rem 1.5rem 4rem", textAlign: "center", maxWidth: "720px", margin: "0 auto" },
    heroTitle: { fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 500, lineHeight: 1.2, margin: "0 0 1rem", color: "var(--color-text-primary)" },
    heroAccent: { background: "linear-gradient(135deg, #534AB7, #1D9E75)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
    heroSub: { fontSize: "1.1rem", color: "var(--color-text-secondary)", lineHeight: 1.7, margin: "0 0 2rem" },
    btnPrimary: { padding: "12px 28px", borderRadius: "var(--border-radius-md)", background: "#534AB7", color: "#fff", border: "none", fontSize: "15px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit" },
    btnOutline: { padding: "12px 28px", borderRadius: "var(--border-radius-md)", background: "transparent", color: "var(--color-text-primary)", border: "0.5px solid var(--color-border-secondary)", fontSize: "15px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit" },
    section: { maxWidth: "1100px", margin: "0 auto", padding: "3rem 1.5rem" },
    sectionTitle: { fontSize: "1.6rem", fontWeight: 500, margin: "0 0 0.5rem", color: "var(--color-text-primary)" },
    sectionSub: { color: "var(--color-text-secondary)", margin: "0 0 2rem", fontSize: "15px" },
    grid3: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" },
    grid2: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1rem" },
    card: { background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: "1.25rem" },
    tag: (color) => ({ display: "inline-block", padding: "3px 10px", borderRadius: "var(--border-radius-md)", fontSize: "12px", background: color === "purple" ? "#EEEDFE" : color === "teal" ? "#E1F5EE" : "#E6F1FB", color: color === "purple" ? "#3C3489" : color === "teal" ? "#085041" : "#0C447C", fontWeight: 500 }),
    chatWrap: { maxWidth: "760px", margin: "0 auto", padding: "1.5rem" },
    chatBox: { background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", display: "flex", flexDirection: "column", height: "500px" },
    chatMessages: { flex: 1, overflowY: "auto", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" },
    msgUser: { alignSelf: "flex-end", background: "#534AB7", color: "#fff", padding: "10px 14px", borderRadius: "16px 16px 4px 16px", maxWidth: "75%", fontSize: "14px", lineHeight: 1.6 },
    msgBot: { alignSelf: "flex-start", background: "var(--color-background-secondary)", color: "var(--color-text-primary)", padding: "10px 14px", borderRadius: "16px 16px 16px 4px", maxWidth: "75%", fontSize: "14px", lineHeight: 1.6 },
    chatInput: { display: "flex", gap: "8px", padding: "1rem", borderTop: "0.5px solid var(--color-border-tertiary)" },
    input: { flex: 1, padding: "10px 14px", borderRadius: "var(--border-radius-md)", border: "0.5px solid var(--color-border-secondary)", background: "var(--color-background-secondary)", color: "var(--color-text-primary)", fontSize: "14px", fontFamily: "inherit", outline: "none" },
    sendBtn: { padding: "10px 20px", borderRadius: "var(--border-radius-md)", background: "#534AB7", color: "#fff", border: "none", fontSize: "14px", cursor: "pointer", fontFamily: "inherit", fontWeight: 500 },
    filterRow: { display: "flex", gap: "8px", flexWrap: "wrap", margin: "0 0 1.5rem" },
    filterBtn: (active) => ({ padding: "6px 16px", borderRadius: "20px", border: active ? "none" : "0.5px solid var(--color-border-secondary)", background: active ? "#534AB7" : "var(--color-background-primary)", color: active ? "#fff" : "var(--color-text-secondary)", fontSize: "13px", cursor: "pointer", fontFamily: "inherit" }),
    jobCard: { background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "10px" },
    footer: { borderTop: "0.5px solid var(--color-border-tertiary)", background: "var(--color-background-primary)", padding: "2rem 1.5rem", textAlign: "center" },
    statsRow: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem", margin: "2rem 0" },
    statCard: { background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", padding: "1rem", textAlign: "center" },
    statNum: { fontSize: "24px", fontWeight: 500, color: "var(--color-text-primary)", margin: "0 0 4px" },
    statLabel: { fontSize: "13px", color: "var(--color-text-secondary)", margin: 0 },
  };

  function HomePage() {
    return (
      <div>
        <div style={styles.hero}>
          <div style={{ display: "inline-block", ...styles.tag("purple"), marginBottom: "1rem", fontSize: "13px" }}>🚀 AI-Powered Education & Career Platform</div>
          <h1 style={styles.heroTitle}>
            Your AI Mentor for<br />
            <span style={styles.heroAccent}>Education & UK Careers</span>
          </h1>
          <p style={styles.heroSub}>
            Mentorgram guides students worldwide from education to employment — with personalised AI mentoring, UK university pathways, and visa-sponsored job opportunities.
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <button style={styles.btnPrimary} onClick={() => setActivePage("AI Mentor")}>Chat with AI Mentor</button>
            <button style={styles.btnOutline} onClick={() => setActivePage("Sponsorship Jobs")}>Browse Sponsored Jobs</button>
          </div>
          <div style={styles.statsRow}>
            {[["50+", "Countries Supported"], ["100K+", "Students Guided"], ["500+", "UK Employers"], ["95%", "Satisfaction Rate"]].map(([n, l]) => (
              <div key={l} style={styles.statCard}>
                <p style={styles.statNum}>{n}</p>
                <p style={styles.statLabel}>{l}</p>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: "var(--color-background-primary)", borderTop: "0.5px solid var(--color-border-tertiary)", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Everything you need to succeed</h2>
            <p style={styles.sectionSub}>From subject selection to landing your first UK job — Mentorgram is with you every step.</p>
            <div style={styles.grid3}>
              {FEATURES.map(f => (
                <div key={f.title} style={styles.card}>
                  <div style={{ fontSize: "24px", marginBottom: "10px" }}>{f.icon}</div>
                  <p style={{ fontWeight: 500, margin: "0 0 6px", fontSize: "15px" }}>{f.title}</p>
                  <p style={{ color: "var(--color-text-secondary)", fontSize: "14px", margin: 0, lineHeight: 1.6 }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={styles.section}>
          <div style={{ maxWidth: "540px", margin: "0 auto", textAlign: "center" }}>
            <h2 style={styles.sectionTitle}>Join the waitlist</h2>
            <p style={styles.sectionSub}>Be among the first to access Mentorgram's full platform when we launch.</p>
            {waitlistDone ? (
              <div style={{ ...styles.card, background: "#E1F5EE", border: "0.5px solid #5DCAA5", textAlign: "center" }}>
                <p style={{ color: "#085041", fontWeight: 500, margin: 0 }}>🎉 You're on the list! We'll be in touch soon.</p>
              </div>
            ) : (
              <div style={{ display: "flex", gap: "8px" }}>
                <input style={{ ...styles.input, flex: 1 }} type="email" placeholder="Enter your email address" value={waitlistEmail} onChange={e => setWaitlistEmail(e.target.value)} />
                <button style={styles.btnPrimary} onClick={() => waitlistEmail && setWaitlistDone(true)}>Join</button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  function AIMentorPage() {
    return (
      <div style={styles.chatWrap}>
        <h2 style={{ ...styles.sectionTitle, marginBottom: "0.25rem" }}>AI Mentor</h2>
        <p style={{ ...styles.sectionSub, marginBottom: "1.5rem" }}>Ask me anything about education, universities, careers, or UK visa-sponsored jobs.</p>
        <div style={styles.chatBox}>
          <div style={styles.chatMessages}>
            {messages.map((m, i) => (
              <div key={i} style={m.role === "user" ? styles.msgUser : styles.msgBot}>{m.content}</div>
            ))}
            {loading && <div style={styles.msgBot}>Thinking...</div>}
            <div ref={messagesEndRef} />
          </div>
          <div style={styles.chatInput}>
            <input
              style={styles.input}
              placeholder="Ask about universities, careers, visas..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMessage()}
            />
            <button style={styles.sendBtn} onClick={sendMessage} disabled={loading}>Send</button>
          </div>
        </div>
        <div style={{ ...styles.filterRow, marginTop: "1rem" }}>
          {["How do I apply to UK universities?", "What jobs offer visa sponsorship?", "Which A-levels should I choose?", "How does the Skilled Worker visa work?"].map(q => (
            <button key={q} style={{ ...styles.filterBtn(false), fontSize: "12px" }} onClick={() => { setInput(q); }}>{q}</button>
          ))}
        </div>
      </div>
    );
  }

  function EducationPage() {
    return (
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Education pathways</h2>
        <p style={styles.sectionSub}>Mentorgram supports students from all major education systems worldwide.</p>
        <div style={styles.grid2}>
          {EDUCATION_SYSTEMS.map(e => (
            <div key={e.country} style={styles.card}>
              <p style={{ fontWeight: 500, margin: "0 0 10px", fontSize: "15px" }}>{e.country}</p>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {e.systems.map(s => <span key={s} style={styles.tag("purple")}>{s}</span>)}
              </div>
              <button style={{ ...styles.btnOutline, marginTop: "12px", padding: "8px 16px", fontSize: "13px" }} onClick={() => { setInput(`Tell me about the ${e.systems[0]} education system and how to get into UK universities from ${e.country}`); setActivePage("AI Mentor"); }}>Get guidance ↗</button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function UniversitiesPage() {
    return (
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>UK universities</h2>
        <p style={styles.sectionSub}>Explore top UK universities, entry requirements and scholarships.</p>
        <div style={styles.grid2}>
          {UK_UNIVERSITIES.map(u => (
            <div key={u.name} style={styles.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                <p style={{ fontWeight: 500, margin: 0, fontSize: "15px" }}>{u.name}</p>
                <span style={styles.tag("purple")}>{u.rank}</span>
              </div>
              <p style={{ color: "var(--color-text-secondary)", fontSize: "13px", margin: "0 0 10px" }}>{u.focus}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                  <span style={{ color: "var(--color-text-secondary)" }}>UK entry</span>
                  <span>{u.entry}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                  <span style={{ color: "var(--color-text-secondary)" }}>International</span>
                  <span>{u.intl}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                  <span style={{ color: "var(--color-text-secondary)" }}>Scholarships</span>
                  <span style={{ color: "#3C3489" }}>{u.scholarships}</span>
                </div>
              </div>
              <button style={{ ...styles.btnOutline, marginTop: "12px", padding: "8px 16px", fontSize: "13px", width: "100%" }} onClick={() => { setInput(`Tell me more about ${u.name} — courses, application tips and scholarships`); setActivePage("AI Mentor"); }}>Ask AI Mentor ↗</button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function JobsPage() {
    return (
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Sponsorship jobs</h2>
        <p style={styles.sectionSub}>UK employers offering visa sponsorship across high-demand sectors.</p>
        <div style={styles.filterRow}>
          {SECTORS.map(s => <button key={s} style={styles.filterBtn(sector === s)} onClick={() => setSector(s)}>{s}</button>)}
        </div>
        <div style={styles.grid2}>
          {filteredJobs.map((j, i) => (
            <div key={i} style={styles.jobCard}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <p style={{ fontWeight: 500, margin: "0 0 4px", fontSize: "15px" }}>{j.title}</p>
                  <p style={{ color: "var(--color-text-secondary)", fontSize: "13px", margin: 0 }}>{j.company}</p>
                </div>
                <span style={styles.tag("teal")}>{j.visa}</span>
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <span style={styles.tag("purple")}>{j.sector}</span>
                <span style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>📍 {j.location}</span>
                <span style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>⏱ {j.type}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <p style={{ fontWeight: 500, color: "#3C3489", margin: 0, fontSize: "15px" }}>{j.salary}</p>
                <button style={{ ...styles.btnOutline, padding: "6px 14px", fontSize: "13px" }} onClick={() => { setInput(`How do I apply for a ${j.title} role at ${j.company} with visa sponsorship? What skills do I need?`); setActivePage("AI Mentor"); }}>Get help ↗</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function ContactPage() {
    return (
      <div style={styles.section}>
        <div style={{ maxWidth: "540px", margin: "0 auto" }}>
          <h2 style={styles.sectionTitle}>Get in touch</h2>
          <p style={styles.sectionSub}>Have questions about Mentorgram? We'd love to hear from you.</p>
          <div style={styles.card}>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "flex", gap: "10px" }}>
                <input style={{ ...styles.input, flex: 1 }} placeholder="Your name" />
                <input style={{ ...styles.input, flex: 1 }} placeholder="Your email" />
              </div>
              <input style={styles.input} placeholder="Subject" />
              <textarea style={{ ...styles.input, height: "120px", resize: "vertical" }} placeholder="Your message..." />
              <button style={styles.btnPrimary}>Send message</button>
            </div>
          </div>
          <div style={{ ...styles.card, marginTop: "1rem" }}>
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

  const pages = { "Home": <HomePage />, "AI Mentor": <AIMentorPage />, "Education Paths": <EducationPage />, "UK Universities": <UniversitiesPage />, "Sponsorship Jobs": <JobsPage />, "Contact": <ContactPage /> };

  return (
    <div style={styles.wrap}>
      <nav style={styles.nav}>
        <div style={styles.logo} onClick={() => setActivePage("Home")}>
          <div style={styles.logoMark}>M</div>
          <span style={styles.logoText}>Mentorgram</span>
        </div>
        <div style={styles.navLinks}>
          {NAV_LINKS.map(l => (
            <button key={l} style={styles.navLink(activePage === l)} onClick={() => setActivePage(l)}>{l}</button>
          ))}
        </div>
      </nav>
      <main>{pages[activePage]}</main>
      <footer style={styles.footer}>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "14px", margin: 0 }}>
          © 2025 Mentorgram AI · info@mentorgramai.com · mentorgramai.com
        </p>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "13px", margin: "6px 0 0" }}>
          Empowering students worldwide to study, work, and thrive in the UK 🇬🇧
        </p>
      </footer>
    </div>
  );
}
