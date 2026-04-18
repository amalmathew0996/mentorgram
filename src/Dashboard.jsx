import CVGenerator from "./CVGenerator.jsx";
import { useState, useEffect, useRef } from "react";

const SUPA_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPA_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

function getToken() { try { return JSON.parse(localStorage.getItem("mg_session") || "{}").access_token; } catch { return null; } }

async function supaFetch(path, opts = {}) {
  const res = await fetch(`${SUPA_URL}/rest/v1${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", apikey: SUPA_KEY, Authorization: `Bearer ${getToken()}`, Prefer: "return=representation", ...(opts.headers || {}) },
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || "Request failed"); }
  return res.status === 204 ? null : res.json();
}

async function supaAuthFetch(endpoint, method = "GET", body = null) {
  const res = await fetch(`${SUPA_URL}/auth/v1/${endpoint}`, {
    method,
    headers: { "Content-Type": "application/json", apikey: SUPA_KEY, Authorization: `Bearer ${getToken()}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || data.message || "Failed");
  return data;
}

const SECTORS = ["Technology", "AI & Data", "Healthcare", "Finance", "Engineering", "Business", "Education", "Hospitality", "Public Sector"];
const EXPERIENCE_LEVELS = ["Student", "Graduate (0–1 yr)", "Junior (1–3 yrs)", "Mid-level (3–5 yrs)", "Senior (5–10 yrs)", "Lead / Manager (10+ yrs)"];
const SALARY_RANGES = ["Any", "£20,000+", "£30,000+", "£40,000+", "£50,000+", "£60,000+", "£80,000+"];
const VISA_OPTIONS = ["I need visa sponsorship", "I have the right to work in the UK", "Either is fine"];

const pill = (active) => ({
  padding: "6px 14px", borderRadius: "20px", fontSize: "13px", fontWeight: active ? 500 : 400,
  cursor: "pointer", fontFamily: "inherit", border: active ? "none" : "0.5px solid var(--color-border-secondary)",
  background: active ? "#1A3FA8" : "var(--color-background-primary)", color: active ? "#fff" : "var(--color-text-secondary)", transition: "all 0.15s",
});
const card = { background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: "1.5rem" };
const inp = { padding: "10px 14px", borderRadius: "var(--border-radius-md)", border: "0.5px solid var(--color-border-secondary)", background: "var(--color-background-secondary)", color: "var(--color-text-primary)", fontSize: "14px", outline: "none", fontFamily: "inherit", width: "100%", boxSizing: "border-box" };
const btn = (primary, danger) => ({
  padding: "10px 22px", borderRadius: "var(--border-radius-md)", fontSize: "14px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
  background: danger ? "#E24B4A" : primary ? "#1A3FA8" : "transparent",
  color: danger || primary ? "#fff" : "var(--color-text-primary)",
  border: danger ? "none" : primary ? "none" : "0.5px solid var(--color-border-secondary)",
});

// ── CV text extraction helpers ──────────────────────────────────────────────
async function loadScript(src) {
  if (document.querySelector(`script[src="${src}"]`)) return;
  return new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = src; s.onload = res; s.onerror = rej;
    document.head.appendChild(s);
  });
}

async function extractTextFromPDF(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const pdfjsLib = window.pdfjsLib;
        if (!pdfjsLib) { reject(new Error("PDF.js not loaded")); return; }
        pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        const pdf = await pdfjsLib.getDocument({ data: e.target.result }).promise;
        let text = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map(item => item.str).join(" ") + "\n";
        }
        resolve(text);
      } catch (err) { reject(err); }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

async function extractCVText(file) {
  const name = file.name.toLowerCase();
  if (file.type === "application/pdf" || name.endsWith(".pdf")) {
    await loadScript("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js");
    return extractTextFromPDF(file);
  }
  if (name.endsWith(".docx") || file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    await loadScript("https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js");
    const arrayBuffer = await file.arrayBuffer();
    const result = await window.mammoth.extractRawText({ arrayBuffer });
    return result.value || "";
  }
  if (name.endsWith(".doc") || file.type === "application/msword") {
    throw new Error("Old .doc format not supported. Please save as .docx or PDF.");
  }
  return file.text();
}

// Map AI result fields to profile fields
function mapCVResultToProfile(result) {
  const profile = result.profile || {};
  const careers = result.careerPaths || [];
  const unis = result.universities || result.ukUniversities || [];

  // Map AI level to experience level
  const levelMap = {
    "undergraduate": "Student",
    "postgraduate": "Graduate (0–1 yr)",
    "professional": "Mid-level (3–5 yrs)",
  };

  // Map AI field to sector
  const fieldToSector = (field = "") => {
    const f = field.toLowerCase();
    if (/software|developer|tech|it |web|cyber|cloud|devops|network/.test(f)) return ["Technology"];
    if (/data|ai |machine|analytics/.test(f)) return ["AI & Data", "Technology"];
    if (/health|nurse|medical|care|nhs|clinical/.test(f)) return ["Healthcare"];
    if (/finance|account|banking|audit/.test(f)) return ["Finance"];
    if (/engineer|mechanical|civil|electrical/.test(f)) return ["Engineering"];
    if (/education|teach|academic|school/.test(f)) return ["Education"];
    if (/design|creative|marketing|brand|ui|ux/.test(f)) return ["Business"];
    if (/business|management|sales|hr|operations/.test(f)) return ["Business"];
    if (/social|public|council|government/.test(f)) return ["Public Sector"];
    return [];
  };

  const suggestedSectors = fieldToSector(profile.currentField);

  // Extract skills from keySkills
  const suggestedSkills = (profile.keySkills || []).join(", ");

  // Get job title from first career path
  const suggestedJobTitle = careers[0]?.title || "";

  return {
    suggestedSectors,
    suggestedSkills,
    suggestedJobTitle,
    suggestedExperience: levelMap[profile.level] || "",
    summary: result.summary || "",
    gaps: result.gaps || [],
    careerPaths: careers,
    universities: unis,
  };
}

function CVBuilderInline({ cvText }) {
  return <CVGenerator cvText={cvText} onNavigateToCV={null} />;
}

export default function Dashboard({ user, onLogout, allJobs, onFilterByProfile, onNavigate }) {
  const [tab, setTab] = useState("overview");
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [telegramConnected, setTelegramConnected] = useState(false);

  // Profile fields
  const [fullName, setFullName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [sectors, setSectors] = useState([]);
  const [experience, setExperience] = useState("");
  const [salary, setSalary] = useState("Any");
  const [location, setLocation] = useState("");
  const [visaStatus, setVisaStatus] = useState("");
  const [skills, setSkills] = useState("");
  const [bio, setBio] = useState("");

  // ✅ CV Analysis state
  const [cvAnalysis, setCvAnalysis] = useState(() => {
    try { return JSON.parse(localStorage.getItem("mg_cv_analysis") || "null"); } catch { return null; }
  });
  const [cvLoading, setCvLoading] = useState(false);
  const [cvError, setCvError] = useState("");
  const [cvFileName, setCvFileName] = useState("");
  const [cvApplied, setCvApplied] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState("Masters");
  const fileRef = useRef(null);

  const DEGREE_LEVELS = [
    { key: "Undergraduate", label: "🎓 Undergraduate", color: "#1A3FA8" },
    { key: "Masters",       label: "📚 Masters",       color: "#7C3AED" },
    { key: "PhD",           label: "🔬 PhD",            color: "#DC2626" },
  ];

  // Password change
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [passLoading, setPassLoading] = useState(false);
  const [passMsg, setPassMsg] = useState({ type: "", text: "" });

  // Delete account
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => { loadProfile(); }, [user]);

  // ✅ Fetch jobs if not already loaded
  const [localJobs, setLocalJobs] = useState([]);
  useEffect(() => {
    if (allJobs && allJobs.length > 0) return; // already loaded by parent
    fetch("/api/jobs-db?pageSize=2000")
      .then(r => r.json())
      .then(d => setLocalJobs(d.jobs || []))
      .catch(() => {});
  }, [allJobs]);

  const jobs = (allJobs && allJobs.length > 0) ? allJobs : localJobs;

  async function loadProfile() {
    setLoading(true);
    try {
      const data = await supaFetch(`/profiles?user_id=eq.${user.id}&select=*`);
      if (data?.length > 0) {
        const p = data[0];
        setProfile(p);
        setFullName(p.full_name || "");
        setJobTitle(p.job_title || "");
        setSectors(p.sectors || []);
        setExperience(p.experience_level || "");
        setSalary(p.min_salary || "Any");
        setLocation(p.preferred_location || "");
        setVisaStatus(p.visa_status || "");
        setSkills(p.skills || "");
        setBio(p.bio || "");
        setTelegramConnected(!!p.telegram_chat_id);
      } else {
        setFullName(user.user_metadata?.full_name || "");
      }
    } catch (e) { console.log(e.message); }
    setLoading(false);
  }

  async function saveProfile() {
    setSaving(true);
    const data = { user_id: user.id, full_name: fullName, job_title: jobTitle, sectors, experience_level: experience, min_salary: salary, preferred_location: location, visa_status: visaStatus, skills, bio, updated_at: new Date().toISOString() };
    try {
      if (profile) await supaFetch(`/profiles?user_id=eq.${user.id}`, { method: "PATCH", body: JSON.stringify(data) });
      else await supaFetch("/profiles", { method: "POST", body: JSON.stringify(data) });
      setProfile(data); setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) { alert("Save failed: " + e.message); }
    setSaving(false);
  }

  // ✅ Handle CV file upload and analysis
  async function handleCVUpload(file) {
    if (!file) return;
    setCvError(""); setCvFileName(file.name); setCvLoading(true); setCvApplied(false);
    try {
      const cvText = await extractCVText(file);
      if (!cvText || cvText.trim().length < 50) {
        setCvError("Could not extract text. Try a PDF or paste text below.");
        setCvLoading(false); return;
      }
      const res = await fetch("/api/cv-analyser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cvText, degreeLevel: selectedLevel }),
      });
      let data;
      try { data = await res.json(); } catch { throw new Error("Server error"); }
      if (!res.ok || data.error) throw new Error(data.error || "Analysis failed");
      if (!data.result) throw new Error("No result returned");

      const analysis = { result: data.result, date: new Date().toISOString(), fileName: file.name, degreeLevel: selectedLevel };
      localStorage.setItem("mg_cv_analysis", JSON.stringify(analysis));
      setCvAnalysis(analysis);
    } catch (err) {
      setCvError("Analysis failed: " + err.message);
    }
    setCvLoading(false);
  }

  // ✅ Apply CV analysis results to profile fields
  function applyCVToProfile() {
    if (!cvAnalysis?.result) return;
    const mapped = mapCVResultToProfile(cvAnalysis.result);

    if (mapped.suggestedJobTitle && !jobTitle) setJobTitle(mapped.suggestedJobTitle);
    if (mapped.suggestedExperience && !experience) setExperience(mapped.suggestedExperience);
    if (mapped.suggestedSectors.length > 0) setSectors(prev => [...new Set([...prev, ...mapped.suggestedSectors])]);
    if (mapped.suggestedSkills) setSkills(prev => {
      const existing = prev.trim();
      const newSkills = mapped.suggestedSkills;
      return existing ? existing + ", " + newSkills : newSkills;
    });

    // Auto-set visa if needed
    if (!visaStatus) setVisaStatus("I need visa sponsorship");

    setCvApplied(true);
    setTimeout(() => setTab("profile"), 800);
  }

  async function changePassword() {
    if (!newPass || !confirmPass) { setPassMsg({ type: "err", text: "Please fill in all fields" }); return; }
    if (newPass.length < 8) { setPassMsg({ type: "err", text: "Password must be at least 8 characters" }); return; }
    if (newPass !== confirmPass) { setPassMsg({ type: "err", text: "Passwords do not match" }); return; }
    setPassLoading(true); setPassMsg({ type: "", text: "" });
    try {
      await supaAuthFetch("user", "PUT", { password: newPass });
      setPassMsg({ type: "ok", text: "Password updated successfully!" });
      setCurrentPass(""); setNewPass(""); setConfirmPass("");
    } catch (e) { setPassMsg({ type: "err", text: e.message }); }
    setPassLoading(false);
  }

  async function deleteAccount() {
    if (deleteConfirm.toLowerCase() !== "delete") return;
    setDeleteLoading(true);
    try {
      await supaFetch(`/profiles?user_id=eq.${user.id}`, { method: "DELETE" });
      const res = await fetch("/api/delete-account", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ user_id: user.id, token: getToken() }) });
      if (!res.ok) throw new Error("Deletion failed");
      localStorage.removeItem("mg_session"); localStorage.removeItem("mg_user");
      onLogout();
    } catch (e) { alert(e.message); setDeleteLoading(false); }
  }

  const matchedJobs = jobs.filter(j => {
    // ✅ Smart sector match — also check title keywords for mis-categorised jobs
    const titleLower = (j.title || "").toLowerCase();
    const sectorByTitle = (() => {
      if (/software|developer|devops|cloud|cyber|network|it.tech|helpdesk|full.stack|backend|frontend|react|python|java|aws|azure|linux|systems.eng|platform.eng/.test(titleLower)) return "Technology";
      if (/data.sci|machine.learn|ai |data.eng|data.anal/.test(titleLower)) return "AI & Data";
      if (/nurse|doctor|nhs|healthcare|medical|dental|care.work|clinical|therapist|pharmacist|midwife|paramedic/.test(titleLower)) return "Healthcare";
      if (/financ|accountant|audit|banking|investment|payroll/.test(titleLower)) return "Finance";
      if (/mechanical.eng|civil.eng|electrical.eng|embedded/.test(titleLower)) return "Engineering";
      if (/teacher|teaching|lecturer|tutor|school|academic/.test(titleLower)) return "Education";
      if (/chef|cook|hotel|restaurant|hospitality/.test(titleLower)) return "Hospitality";
      if (/social.work|council|government|police|charity/.test(titleLower)) return "Public Sector";
      if (/graphic.des|ui.des|ux.des|web.des|designer|creative|marketing|sales|hr |brand/.test(titleLower)) return "Business";
      return null;
    })();
    const effectiveSector = j.sector || sectorByTitle || "Other";
    const sm = sectors.length === 0 || sectors.includes(effectiveSector) || sectors.includes(sectorByTitle);
    const lm = !location || (j.location || "").toLowerCase().includes(location.toLowerCase());
    const vm = visaStatus !== "I need visa sponsorship" || j.sponsorship === true;
    return sm && lm && vm;
  });

  const initials = fullName ? fullName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : (user.email || "?")[0].toUpperCase();

  const tabs = [
    { id: "overview", label: "Overview",    icon: "🏠" },
    { id: "cv",       label: "CV Analysis", icon: "📄", badge: cvAnalysis ? "✓" : null },
    { id: "profile",  label: "My Profile",  icon: "👤" },
    { id: "matches",  label: "Job Matches", icon: "🎯", count: matchedJobs.length },
    { id: "cvgen",    label: "CV Builder",   icon: "✍️" },
    { id: "security", label: "Security",    icon: "🔒" },
  ];

  const cvResult = cvAnalysis?.result;
  // Build cv text from analysis result for the generator
  const cvTextForGen = ""; // User uploads CV fresh in generator
  const cvMapped = cvResult ? mapCVResultToProfile(cvResult) : null;

  if (loading) return (
    <div style={{ textAlign: "center", padding: "4rem" }}>
      <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>⏳</div>
      <p style={{ color: "var(--color-text-secondary)" }}>Loading your dashboard...</p>
    </div>
  );

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "2rem 1.5rem" }}>

      {/* Header */}
      <div style={{ ...card, marginBottom: "1.5rem", background: "linear-gradient(135deg, rgba(26,63,168,0.06), rgba(29,158,117,0.04))", borderColor: "rgba(26,63,168,0.15)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
          <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "linear-gradient(135deg,#1A3FA8,#FF4500)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "20px", flexShrink: 0 }}>{initials}</div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 500, margin: "0 0 3px" }}>{fullName || "Your Account"}</h2>
            <p style={{ color: "var(--color-text-secondary)", fontSize: "13px", margin: 0 }}>{user.email}</p>
            {jobTitle && <p style={{ color: "var(--color-text-primary)", fontSize: "13px", margin: "3px 0 0", fontWeight: 500 }}>{jobTitle}</p>}
            {cvAnalysis && <p style={{ color: "#7C3AED", fontSize: "12px", margin: "3px 0 0" }}>📄 CV analysed · {new Date(cvAnalysis.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</p>}
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {matchedJobs.length > 0 && (
              <button style={{ ...btn(true), fontSize: "13px", padding: "8px 16px" }}
                onClick={() => { onFilterByProfile({ sectors, location, visaStatus }); onNavigate("Sponsorship Jobs"); }}>
                🎯 {matchedJobs.length} job matches
              </button>
            )}
            <button style={{ ...btn(false), fontSize: "13px", padding: "8px 16px", color: "#E24B4A", borderColor: "rgba(226,75,74,0.4)" }}
              onClick={() => { localStorage.removeItem("mg_session"); localStorage.removeItem("mg_user"); onLogout(); }}>
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "1.5rem", overflowX: "auto", paddingBottom: "2px" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: "9px 16px", borderRadius: "var(--border-radius-md)", border: "none", background: tab === t.id ? "#1A3FA8" : "var(--color-background-primary)", color: tab === t.id ? "#fff" : "var(--color-text-secondary)", fontSize: "13px", fontWeight: tab === t.id ? 500 : 400, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "5px", transition: "all 0.15s", boxShadow: tab === t.id ? "0 2px 8px rgba(26,63,168,0.3)" : "none" }}>
            <span>{t.icon}</span>
            <span>{t.label}</span>
            {t.badge && <span style={{ background: "#16A34A", color: "#fff", padding: "1px 6px", borderRadius: "10px", fontSize: "10px", fontWeight: 700 }}>{t.badge}</span>}
            {t.count != null && <span style={{ background: tab === t.id ? "rgba(255,255,255,0.25)" : "#1A3FA8", color: "#fff", padding: "1px 7px", borderRadius: "10px", fontSize: "11px", fontWeight: 600 }}>{t.count}</span>}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === "overview" && (
        <div style={{ display: "grid", gap: "1rem" }}>
          {/* CV Analysis prompt if no CV yet */}
          {!cvAnalysis && (
            <div style={{ ...card, background: "linear-gradient(135deg, rgba(124,58,237,0.06), rgba(26,63,168,0.04))", borderColor: "rgba(124,58,237,0.2)" }}>
              <div style={{ display: "flex", gap: "14px", alignItems: "flex-start", flexWrap: "wrap" }}>
                <span style={{ fontSize: "32px" }}>📄</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, margin: "0 0 4px", fontSize: "15px" }}>Upload your CV to auto-fill your profile</p>
                  <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", margin: "0 0 12px", lineHeight: 1.6 }}>Our AI will analyse your CV and automatically update your profile, recommend career paths, and match you with relevant jobs and universities.</p>
                  <button onClick={() => setTab("cv")} style={{ ...btn(true), padding: "9px 20px", fontSize: "13px", background: "#7C3AED" }}>Analyse my CV →</button>
                </div>
              </div>
            </div>
          )}

          {/* CV summary if analysed */}
          {cvAnalysis && cvMapped && (
            <div style={{ ...card, borderColor: "rgba(124,58,237,0.2)", background: "linear-gradient(135deg, rgba(124,58,237,0.04), transparent)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px", gap: "10px", flexWrap: "wrap" }}>
                <p style={{ fontWeight: 600, margin: 0, fontSize: "15px" }}>📄 Your CV Analysis</p>
                <div style={{ display: "flex", gap: "6px" }}>
                  <button onClick={() => setTab("cv")} style={{ ...btn(false), fontSize: "12px", padding: "5px 12px" }}>Update CV</button>
                  <button onClick={() => { applyCVToProfile(); setTab("profile"); }} style={{ ...btn(true), fontSize: "12px", padding: "5px 12px", background: "#7C3AED" }}>Apply to profile</button>
                </div>
              </div>
              <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: 1.7, margin: "0 0 12px" }}>{cvResult.summary}</p>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {(cvResult.profile?.keySkills || []).slice(0, 6).map(s => (
                  <span key={s} style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "12px", background: "rgba(124,58,237,0.12)", color: "#7C3AED", fontWeight: 500 }}>{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem" }}>
            {[
              { icon: "🎯", label: "Job Matches",        value: matchedJobs.length,       color: "var(--color-text-primary)" },
              { icon: "🏢", label: "Sectors Selected",   value: sectors.length || "None", color: "#FF4500" },
              { icon: "📍", label: "Preferred Location", value: location || "Not set",    color: "#F59E0B" },
              { icon: "📄", label: "CV Status",          value: cvAnalysis ? "Analysed" : "Not uploaded", color: cvAnalysis ? "#7C3AED" : "var(--color-text-secondary)" },
            ].map(s => (
              <div key={s.label} style={{ ...card, textAlign: "center" }}>
                <div style={{ fontSize: "24px", marginBottom: "6px" }}>{s.icon}</div>
                <p style={{ fontSize: "18px", fontWeight: 600, margin: "0 0 3px", color: s.color }}>{s.value}</p>
                <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", margin: 0 }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <div style={card}>
            <h3 style={{ fontSize: "1rem", fontWeight: 500, margin: "0 0 1rem" }}>Quick actions</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px" }}>
              {[
                { icon: "📄", title: "Analyse my CV",       desc: "Auto-fill profile and get job matches",    action: () => setTab("cv"),          color: "#7C3AED" },
                { icon: "👤", title: "Complete your profile", desc: "Add experience and skills for better matches", action: () => setTab("profile") },
                { icon: "🎯", title: "View job matches",    desc: `${matchedJobs.length} jobs match your profile`, action: () => setTab("matches") },
                { icon: "🔍", title: "Browse all jobs",     desc: "Search UK sponsorship jobs",               action: () => onNavigate("Sponsorship Jobs") },
              ].map(a => (
                <button key={a.title} onClick={a.action} style={{ ...card, border: "0.5px solid var(--color-border-tertiary)", textAlign: "left", cursor: "pointer", background: "var(--color-background-secondary)", transition: "all 0.15s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(26,63,168,0.4)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--color-border-tertiary)"; e.currentTarget.style.transform = "none"; }}>
                  <div style={{ fontSize: "20px", marginBottom: "6px" }}>{a.icon}</div>
                  <p style={{ fontWeight: 500, fontSize: "14px", margin: "0 0 3px", color: a.color || "var(--color-text-primary)" }}>{a.title}</p>
                  <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", margin: 0 }}>{a.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Top matches preview */}
          {matchedJobs.length > 0 && (
            <div style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <h3 style={{ fontSize: "1rem", fontWeight: 500, margin: 0 }}>🎯 Your top job matches</h3>
                <button onClick={() => setTab("matches")} style={{ ...btn(false), padding: "6px 14px", fontSize: "12px" }}>View all</button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {matchedJobs.slice(0, 4).map((j, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", gap: "10px", flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: "140px" }}>
                      <p style={{ fontWeight: 500, fontSize: "14px", margin: "0 0 2px" }}>{j.title}</p>
                      <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", margin: 0 }}>{j.company} · {j.location}</p>
                    </div>
                    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                      {j.sponsorship && <span style={{ padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: 500, background: "rgba(22,163,74,0.12)", color: "#16A34A" }}>✓ Visa</span>}
                      <span style={{ fontSize: "13px", fontWeight: 500 }}>{j.salary}</span>
                      {j.url && <a href={j.url} target="_blank" rel="noopener noreferrer" style={{ padding: "5px 12px", borderRadius: "var(--border-radius-md)", background: "#1A3FA8", color: "#fff", fontSize: "12px", textDecoration: "none", fontWeight: 500 }}>Apply ↗</a>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── CV ANALYSIS TAB ── */}
      {tab === "cv" && (
        <div style={{ display: "grid", gap: "1rem" }}>
          <div style={{ ...card, borderColor: "rgba(124,58,237,0.2)" }}>
            <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", marginBottom: "1.25rem" }}>
              <span style={{ fontSize: "32px" }}>🤖</span>
              <div>
                <h3 style={{ margin: "0 0 4px", fontSize: "1rem", fontWeight: 600 }}>CV Analysis — Auto-fill your profile</h3>
                <p style={{ margin: 0, fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>Upload your CV and our AI will analyse it, then automatically update your profile, suggest career paths and match you with relevant jobs and universities.</p>
              </div>
            </div>

            {/* Degree level selector */}
            <p style={{ fontSize: "13px", fontWeight: 600, margin: "0 0 8px" }}>What are you looking for?</p>
            <div style={{ display: "flex", gap: "8px", marginBottom: "1.25rem", flexWrap: "wrap" }}>
              {DEGREE_LEVELS.map(l => (
                <button key={l.key} onClick={() => setSelectedLevel(l.key)}
                  style={{ padding: "7px 16px", borderRadius: "20px", fontSize: "13px", fontWeight: selectedLevel === l.key ? 600 : 400, cursor: "pointer", fontFamily: "inherit",
                    border: selectedLevel === l.key ? "2px solid " + l.color : "0.5px solid var(--color-border-tertiary)",
                    background: selectedLevel === l.key ? "rgba(124,58,237,0.08)" : "var(--color-background-primary)",
                    color: selectedLevel === l.key ? l.color : "var(--color-text-secondary)" }}>
                  {l.label}
                </button>
              ))}
            </div>

            {/* Upload zone */}
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = "#7C3AED"; }}
              onDragLeave={e => { e.currentTarget.style.borderColor = "var(--color-border-secondary)"; }}
              onDrop={e => { e.preventDefault(); e.currentTarget.style.borderColor = "var(--color-border-secondary)"; handleCVUpload(e.dataTransfer.files[0]); }}
              style={{ border: "2px dashed var(--color-border-secondary)", borderRadius: "var(--border-radius-lg)", padding: "2rem", textAlign: "center", cursor: "pointer", marginBottom: "1rem", background: "var(--color-background-secondary)", transition: "border-color 0.2s" }}>
              <input ref={fileRef} type="file" accept=".pdf,.txt,.doc,.docx" style={{ display: "none" }} onChange={e => handleCVUpload(e.target.files[0])} />
              <div style={{ fontSize: "36px", marginBottom: "10px" }}>📄</div>
              {cvFileName ? (
                <div>
                  <p style={{ fontWeight: 500, margin: "0 0 4px", color: "#16A34A" }}>✓ {cvFileName}</p>
                  <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", margin: 0 }}>Click to upload a different file</p>
                </div>
              ) : (
                <div>
                  <p style={{ fontWeight: 500, margin: "0 0 6px" }}>Drop your CV here or click to upload</p>
                  <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", margin: 0 }}>PDF, DOCX, TXT — max 5MB</p>
                </div>
              )}
            </div>

            {cvLoading && (
              <div style={{ display: "flex", gap: "10px", alignItems: "center", padding: "12px 16px", background: "rgba(124,58,237,0.06)", borderRadius: "var(--border-radius-md)", marginBottom: "1rem" }}>
                <div style={{ width: "16px", height: "16px", border: "2px solid rgba(124,58,237,0.2)", borderTopColor: "#7C3AED", borderRadius: "50%", animation: "spin 1s linear infinite", flexShrink: 0 }} />
                <style>{".spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}"}</style>
                <p style={{ margin: 0, fontSize: "13px", color: "#7C3AED" }}>Analysing your CV with AI...</p>
              </div>
            )}
            {cvError && <p style={{ color: "#E24B4A", fontSize: "13px", margin: "0 0 1rem", lineHeight: 1.5 }}>⚠️ {cvError}</p>}
          </div>

          {/* CV Results */}
          {cvResult && !cvLoading && (
            <div style={{ display: "grid", gap: "1rem" }}>
              {/* Apply to profile CTA */}
              <div style={{ ...card, background: "linear-gradient(135deg, rgba(124,58,237,0.08), rgba(26,63,168,0.04))", borderColor: "rgba(124,58,237,0.25)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                  <div>
                    <p style={{ fontWeight: 600, margin: "0 0 4px", fontSize: "15px" }}>
                      {cvApplied ? "✅ Profile updated!" : "Apply results to your profile"}
                    </p>
                    <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", margin: 0 }}>
                      {cvApplied ? "Your profile has been updated with your CV data." : "Auto-fill your job title, sectors, skills and experience level from this analysis."}
                    </p>
                  </div>
                  {!cvApplied && (
                    <button onClick={applyCVToProfile} style={{ ...btn(true), background: "#7C3AED", padding: "10px 20px", whiteSpace: "nowrap" }}>
                      ✨ Apply to profile
                    </button>
                  )}
                </div>
              </div>

              {/* Profile summary */}
              <div style={card}>
                <p style={{ fontWeight: 600, margin: "0 0 10px", fontSize: "15px" }}>👤 Your Profile Summary</p>
                <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", lineHeight: 1.7, margin: "0 0 12px" }}>{cvResult.summary}</p>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "12px" }}>
                  {(cvResult.profile?.keySkills || []).map(s => (
                    <span key={s} style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: 500, background: "rgba(124,58,237,0.12)", color: "#7C3AED" }}>{s}</span>
                  ))}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "8px" }}>
                  {[["📚", "Level", cvResult.profile?.level], ["💼", "Field", cvResult.profile?.currentField], ["⭐", "Experience", cvResult.profile?.experience]].map(([icon, label, val]) => val ? (
                    <div key={label} style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", padding: "8px 12px" }}>
                      <p style={{ fontSize: "11px", color: "var(--color-text-secondary)", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.04em" }}>{icon} {label}</p>
                      <p style={{ fontSize: "13px", fontWeight: 500, margin: 0, textTransform: "capitalize" }}>{val}</p>
                    </div>
                  ) : null)}
                </div>
              </div>

              {/* Career paths */}
              <div style={card}>
                <p style={{ fontWeight: 600, margin: "0 0 12px", fontSize: "15px" }}>🚀 Recommended Career Paths</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "10px" }}>
                  {(cvResult.careerPaths || []).map((cp, i) => (
                    <div key={i} style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", padding: "1rem" }}>
                      <p style={{ fontWeight: 600, margin: "0 0 6px", fontSize: "14px" }}>{cp.title}</p>
                      <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", margin: "0 0 8px", lineHeight: 1.5 }}>{cp.description}</p>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                        <span style={{ color: "var(--color-text-secondary)" }}>Salary</span>
                        <span style={{ fontWeight: 500, color: "#16A34A" }}>{cp.salaryRange}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Universities */}
              {(cvResult.universities || cvResult.ukUniversities || []).length > 0 && (
                <div style={card}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <p style={{ fontWeight: 600, margin: 0, fontSize: "15px" }}>🎓 Recommended Programmes</p>
                    <button onClick={() => onNavigate("Universities")} style={{ ...btn(false), fontSize: "12px", padding: "5px 12px" }}>Browse more →</button>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {(cvResult.universities || cvResult.ukUniversities || []).slice(0, 5).map((u, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "10px 12px", background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", gap: "10px", flexWrap: "wrap" }}>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontWeight: 500, fontSize: "14px", margin: "0 0 2px" }}>{u.course}</p>
                          <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", margin: 0 }}>{u.name} · {u.country === "Germany" ? "🇩🇪" : "🇬🇧"} {u.degreeType}</p>
                        </div>
                        <span style={{ padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: 500, background: u.country === "Germany" ? "rgba(22,163,74,0.12)" : "rgba(26,63,168,0.12)", color: u.country === "Germany" ? "#16A34A" : "#1A3FA8", whiteSpace: "nowrap" }}>
                          {u.country === "Germany" ? "🇩🇪 Germany" : "🇬🇧 UK"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Skill gaps */}
              {cvResult.gaps?.length > 0 && (
                <div style={{ ...card, background: "rgba(245,158,11,0.04)", borderColor: "rgba(245,158,11,0.2)" }}>
                  <p style={{ fontWeight: 600, margin: "0 0 10px", fontSize: "14px" }}>⚡ Skills to Develop</p>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {cvResult.gaps.map((g, i) => (
                      <span key={i} style={{ padding: "4px 12px", borderRadius: "20px", fontSize: "13px", background: "rgba(245,158,11,0.12)", color: "#D97706", fontWeight: 500 }}>{g}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Matched jobs from CV */}
              {matchedJobs.length > 0 && (
                <div style={card}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <p style={{ fontWeight: 600, margin: 0, fontSize: "15px" }}>💼 Jobs Matching Your CV</p>
                    <button onClick={() => { onFilterByProfile({ sectors, location, visaStatus }); onNavigate("Sponsorship Jobs"); }} style={{ ...btn(true), fontSize: "12px", padding: "5px 12px" }}>View all {matchedJobs.length} →</button>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {matchedJobs.slice(0, 4).map((j, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", gap: "10px", flexWrap: "wrap" }}>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontWeight: 500, fontSize: "14px", margin: "0 0 2px" }}>{j.title}</p>
                          <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", margin: 0 }}>{j.company} · {j.location}</p>
                        </div>
                        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                          {j.sponsorship && <span style={{ padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: 500, background: "rgba(22,163,74,0.12)", color: "#16A34A" }}>✓ Visa</span>}
                          {j.url && <a href={j.url} target="_blank" rel="noopener noreferrer" style={{ padding: "5px 12px", borderRadius: "var(--border-radius-md)", background: "#1A3FA8", color: "#fff", fontSize: "12px", textDecoration: "none", fontWeight: 500 }}>Apply ↗</a>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── PROFILE ── */}
      {tab === "profile" && (
        <div style={{ display: "grid", gap: "1rem" }}>
          {cvApplied && (
            <div style={{ padding: "12px 16px", background: "rgba(124,58,237,0.08)", border: "0.5px solid rgba(124,58,237,0.2)", borderRadius: "var(--border-radius-md)", fontSize: "13px", color: "#7C3AED", fontWeight: 500 }}>
              ✨ Profile fields have been auto-filled from your CV. Review and save below.
            </div>
          )}
          <div style={card}>
            <h3 style={{ fontSize: "1rem", fontWeight: 500, margin: "0 0 1rem" }}>👤 Basic Information</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
              <div><label style={{ fontSize: "12px", color: "var(--color-text-secondary)", display: "block", marginBottom: "5px" }}>Full Name</label><input style={inp} value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your full name" /></div>
              <div><label style={{ fontSize: "12px", color: "var(--color-text-secondary)", display: "block", marginBottom: "5px" }}>Current / Target Job Title</label><input style={inp} value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="e.g. Software Engineer" /></div>
              <div><label style={{ fontSize: "12px", color: "var(--color-text-secondary)", display: "block", marginBottom: "5px" }}>Preferred Location</label><input style={inp} value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. London" /></div>
            </div>
            <div style={{ marginTop: "12px" }}><label style={{ fontSize: "12px", color: "var(--color-text-secondary)", display: "block", marginBottom: "5px" }}>About Me</label><textarea style={{ ...inp, height: "80px", resize: "vertical" }} value={bio} onChange={e => setBio(e.target.value)} placeholder="Brief background about yourself..." /></div>
          </div>

          <div style={card}>
            <h3 style={{ fontSize: "1rem", fontWeight: 500, margin: "0 0 1rem" }}>💼 Experience Level</h3>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {EXPERIENCE_LEVELS.map(lvl => <button key={lvl} style={pill(experience === lvl)} onClick={() => setExperience(experience === lvl ? "" : lvl)}>{lvl}</button>)}
            </div>
          </div>

          <div style={card}>
            <h3 style={{ fontSize: "1rem", fontWeight: 500, margin: "0 0 0.4rem" }}>🏢 Preferred Sectors</h3>
            <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", margin: "0 0 1rem" }}>We'll filter jobs based on these sectors</p>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {SECTORS.map(s => <button key={s} style={pill(sectors.includes(s))} onClick={() => setSectors(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s])}>{s}</button>)}
            </div>
          </div>

          <div style={card}>
            <h3 style={{ fontSize: "1rem", fontWeight: 500, margin: "0 0 0.4rem" }}>⚡ Skills</h3>
            <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", margin: "0 0 1rem" }}>Add skills to match against job listings</p>
            <input style={inp} value={skills} onChange={e => setSkills(e.target.value)} placeholder="e.g. Python, React, Project Management, NHS, IELTS 7.0" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem" }}>
            <div style={card}>
              <h3 style={{ fontSize: "1rem", fontWeight: 500, margin: "0 0 1rem" }}>💰 Minimum Salary</h3>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {SALARY_RANGES.map(s => <button key={s} style={pill(salary === s)} onClick={() => setSalary(s)}>{s}</button>)}
              </div>
            </div>
            <div style={card}>
              <h3 style={{ fontSize: "1rem", fontWeight: 500, margin: "0 0 1rem" }}>🛂 Visa Status</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {VISA_OPTIONS.map(v => <button key={v} style={{ ...pill(visaStatus === v), textAlign: "left", borderRadius: "var(--border-radius-md)", padding: "8px 14px" }} onClick={() => setVisaStatus(v)}>{v}</button>)}
              </div>
            </div>
          </div>

          {/* Telegram Notifications */}
          <div style={card}>
            <h3 style={{ fontSize: "1rem", fontWeight: 500, margin: "0 0 0.5rem" }}>📲 Weekly Job Alerts via Telegram</h3>
            <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", margin: "0 0 1rem", lineHeight: 1.6 }}>
              Get 5 personalised visa sponsorship jobs delivered to your Telegram every Friday — matched to your sectors and location.
            </p>
            {telegramConnected ? (
              <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", background: "rgba(22,163,74,0.08)", border: "0.5px solid rgba(22,163,74,0.25)", borderRadius: "var(--border-radius-md)" }}>
                <span style={{ fontSize: "20px" }}>✅</span>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: "13px", color: "#16A34A" }}>Telegram connected</p>
                  <p style={{ margin: 0, fontSize: "12px", color: "var(--color-text-secondary)" }}>You'll receive job alerts every Friday afternoon</p>
                </div>
                <button
                  onClick={async () => {
                    await supaFetch("/profiles?user_id=eq." + user.id, { method: "PATCH", body: JSON.stringify({ telegram_chat_id: null }) });
                    setTelegramConnected(false);
                  }}
                  style={{ fontSize: "12px", color: "#E24B4A", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                  Disconnect
                </button>
              </div>
            ) : (
              <a
                href={"https://t.me/MentorgramAIBot?start=" + user.id}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 20px", borderRadius: "var(--border-radius-md)", background: "#229ED9", color: "#fff", textDecoration: "none", fontSize: "14px", fontWeight: 600, fontFamily: "inherit" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-2.038 9.589c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.48 14.593l-2.95-.924c-.642-.204-.654-.642.135-.953l11.49-4.428c.537-.194 1.006.131.407.96z"/></svg>
                Connect Telegram
              </a>
            )}
          </div>

          <button style={{ ...btn(true), padding: "13px", fontSize: "15px", opacity: saving ? 0.7 : 1, background: saved ? "#16A34A" : "#1A3FA8" }} onClick={saveProfile} disabled={saving}>
            {saving ? "Saving..." : saved ? "✓ Profile saved!" : "Save profile"}
          </button>
        </div>
      )}

      {/* ── MATCHES ── */}
      {tab === "matches" && (
        <div>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <h3 style={{ margin: "0 0 4px", fontSize: "1rem", fontWeight: 600 }}>🎯 Your Top Job Matches</h3>
              <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", margin: 0 }}>
                <strong>{matchedJobs.length}</strong> visa sponsorship jobs matched to your profile
                {sectors.length > 0 && " · " + sectors.slice(0, 2).join(", ")}
                {location && " · " + location}
              </p>
            </div>
            <button style={{ ...btn(true), padding: "8px 16px", fontSize: "13px" }}
              onClick={() => { onFilterByProfile({ sectors, location, visaStatus }); onNavigate("Sponsorship Jobs"); }}>
              View all on jobs board ↗
            </button>
          </div>

          {matchedJobs.length === 0 ? (
            <div style={{ ...card, textAlign: "center", padding: "3rem" }}>
              <p style={{ fontSize: "2rem", margin: "0 0 1rem" }}>🔍</p>
              <p style={{ fontWeight: 500 }}>No matches yet</p>
              <p style={{ color: "var(--color-text-secondary)", fontSize: "14px", marginBottom: "1.25rem" }}>Update your profile with sectors and location to see matching jobs</p>
              <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap" }}>
                <button style={{ ...btn(true), background: "#7C3AED", padding: "9px 20px" }} onClick={() => setTab("cv")}>Analyse my CV</button>
                <button style={{ ...btn(false), padding: "9px 20px" }} onClick={() => setTab("profile")}>Update profile</button>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {matchedJobs.slice(0, 10).map((j, i) => (
                <div key={i} style={{ ...card, display: "flex", flexDirection: "column", gap: "0", padding: "0", overflow: "hidden", transition: "transform 0.2s, box-shadow 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 24px rgba(26,63,168,0.12)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}>
                  {/* Top bar */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "1rem 1.25rem 0.75rem", gap: "10px" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
                        <span style={{ background: "#1A3FA8", color: "#fff", width: "24px", height: "24px", borderRadius: "6px", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
                        <p style={{ fontWeight: 700, margin: 0, fontSize: "15px", lineHeight: 1.3 }}>{j.title}</p>
                      </div>
                      <p style={{ color: "var(--color-text-secondary)", fontSize: "13px", margin: 0, fontWeight: 500 }}>{j.company}</p>
                    </div>
                    {j.sponsorship && (
                      <span style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, background: "rgba(22,163,74,0.12)", color: "#16A34A", whiteSpace: "nowrap", flexShrink: 0, border: "0.5px solid rgba(22,163,74,0.3)" }}>✓ Visa Sponsor</span>
                    )}
                  </div>

                  {/* Details row */}
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", padding: "0 1.25rem 0.75rem", alignItems: "center" }}>
                    <span style={{ padding: "2px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 500, background: "rgba(26,63,168,0.08)", color: "#1A3FA8" }}>{j.sector}</span>
                    <span style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>📍 {j.location}</span>
                    {j.salary && <span style={{ fontSize: "12px", color: "#16A34A", fontWeight: 600 }}>💰 {j.salary}</span>}
                    {j.posted && <span style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>🕐 {j.posted}</span>}
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: "flex", gap: "8px", padding: "10px 1.25rem", borderTop: "0.5px solid var(--color-border-tertiary)", background: "var(--color-background-secondary)" }}>
                    {j.url && (
                      <a href={j.url} target="_blank" rel="noopener noreferrer"
                        style={{ flex: 1, padding: "8px 14px", borderRadius: "var(--border-radius-md)", background: "#1A3FA8", color: "#fff", fontSize: "13px", textDecoration: "none", fontWeight: 600, textAlign: "center" }}>
                        Apply Now ↗
                      </a>
                    )}
                    <button
                      onClick={() => { onNavigate("CV Generator"); }}
                      style={{ flex: 1, padding: "8px 14px", borderRadius: "var(--border-radius-md)", background: "transparent", color: "var(--color-text-primary)", border: "0.5px solid var(--color-border-secondary)", fontSize: "13px", cursor: "pointer", fontFamily: "inherit", fontWeight: 500 }}>
                      🎯 Tailor CV
                    </button>
                  </div>
                </div>
              ))}

              {matchedJobs.length > 10 && (
                <button style={{ ...btn(false), width: "100%", padding: "12px", textAlign: "center" }}
                  onClick={() => { onFilterByProfile({ sectors, location, visaStatus }); onNavigate("Sponsorship Jobs"); }}>
                  View all {matchedJobs.length} matching jobs on jobs board →
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── CV BUILDER ── */}
      {tab === "cvgen" && (
        <div>
          {!cvResult ? (
            <div style={{ ...card, textAlign: "center", padding: "3rem" }}>
              <p style={{ fontSize: "2.5rem", margin: "0 0 1rem" }}>✍️</p>
              <p style={{ fontWeight: 600, margin: "0 0 8px", fontSize: "16px" }}>Generate a tailored CV for any job</p>
              <p style={{ color: "var(--color-text-secondary)", fontSize: "14px", margin: "0 0 1.5rem", lineHeight: 1.6 }}>First analyse your CV in the CV Analysis tab, then come back here to generate ATS-optimised CVs and cover letters for any job in seconds.</p>
              <button onClick={() => setTab("cv")} style={{ ...btn(true), background: "#7C3AED", padding: "10px 24px" }}>Go to CV Analysis →</button>
            </div>
          ) : (
            <CVBuilderInline cvText={cvTextForGen} />
          )}
        </div>
      )}

      {/* ── SECURITY ── */}
      {tab === "security" && (
        <div style={{ display: "grid", gap: "1rem" }}>
          <div style={card}>
            <h3 style={{ fontSize: "1rem", fontWeight: 500, margin: "0 0 1rem" }}>📧 Account Information</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {[["Email address", user.email], ["Email verified", "✓ Verified"], ["Account created", new Date(user.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })]].map(([l, v]) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)" }}>
                  <span style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>{l}</span>
                  <span style={{ fontSize: "13px", fontWeight: 500, color: l === "Email verified" ? "#16A34A" : "inherit" }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={card}>
            <h3 style={{ fontSize: "1rem", fontWeight: 500, margin: "0 0 1rem" }}>🔑 Change Password</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {passMsg.text && <div style={{ padding: "10px 14px", borderRadius: "var(--border-radius-md)", fontSize: "13px", background: passMsg.type === "ok" ? "rgba(22,163,74,0.1)" : "#FEE8E8", color: passMsg.type === "ok" ? "#16A34A" : "#9B1C1C" }}>{passMsg.text}</div>}
              <div><label style={{ fontSize: "12px", color: "var(--color-text-secondary)", display: "block", marginBottom: "5px" }}>New password</label><input style={inp} type="password" placeholder="At least 8 characters" value={newPass} onChange={e => setNewPass(e.target.value)} /></div>
              <div><label style={{ fontSize: "12px", color: "var(--color-text-secondary)", display: "block", marginBottom: "5px" }}>Confirm new password</label><input style={inp} type="password" placeholder="Repeat new password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} /></div>
              <button style={{ ...btn(true), opacity: passLoading ? 0.7 : 1 }} onClick={changePassword} disabled={passLoading}>{passLoading ? "Updating..." : "Update password"}</button>
            </div>
          </div>

          <div style={card}>
            <h3 style={{ fontSize: "1rem", fontWeight: 500, margin: "0 0 0.5rem" }}>🔒 Your Data & Privacy</h3>
            <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", margin: "0 0 1rem", lineHeight: 1.6 }}>Under UK GDPR you have rights over your personal data. Contact us at <strong>info@mentorgramai.com</strong>.</p>
            <a href="mailto:info@mentorgramai.com?subject=Data Request" style={{ ...btn(false), textDecoration: "none", display: "inline-block", fontSize: "13px", padding: "8px 16px" }}>Request my data</a>
          </div>

          <div style={{ border: "0.5px solid rgba(226,75,74,0.3)", borderRadius: "var(--border-radius-lg)", padding: "1.5rem" }}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 500, margin: "0 0 0.5rem", color: "#E24B4A" }}>⚠️ Delete Account</h3>
            {!deleteOpen ? (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", margin: 0 }}>Permanently delete your account and all data. Cannot be undone.</p>
                <button onClick={() => setDeleteOpen(true)} style={{ ...btn(false), fontSize: "13px", padding: "8px 16px", color: "#E24B4A", borderColor: "rgba(226,75,74,0.5)" }}>Delete account</button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", margin: 0 }}>Type <strong>delete</strong> to confirm.</p>
                <input style={{ ...inp, borderColor: "#E24B4A" }} placeholder='Type "delete" to confirm' value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)} />
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={() => { setDeleteOpen(false); setDeleteConfirm(""); }} style={{ ...btn(false), flex: 1 }}>Cancel</button>
                  <button onClick={deleteAccount} disabled={deleteLoading || deleteConfirm.toLowerCase() !== "delete"} style={{ ...btn(false, true), flex: 1, opacity: deleteConfirm.toLowerCase() === "delete" ? 1 : 0.4 }}>
                    {deleteLoading ? "Deleting..." : "Permanently delete"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
