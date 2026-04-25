import CVGenerator from "./CVGenerator.jsx";
import { useState, useEffect, useRef, useMemo } from "react";

const SUPA_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPA_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

function getToken() { try { return JSON.parse(localStorage.getItem("mg_session") || "{}").access_token; } catch { return null; } }
function getRefreshToken() { try { return JSON.parse(localStorage.getItem("mg_session") || "{}").refresh_token; } catch { return null; } }
function getTokenExpiry() { try { return JSON.parse(localStorage.getItem("mg_session") || "{}").expires_at; } catch { return null; } }

// Refresh JWT if it's expired or about to expire (within 60 seconds)
async function ensureFreshToken() {
  const expiresAt = getTokenExpiry();
  if (!expiresAt) return getToken();
  // expires_at is in seconds (Unix timestamp)
  const nowSec = Math.floor(Date.now() / 1000);
  if (expiresAt - nowSec > 60) return getToken(); // still fresh

  const refreshToken = getRefreshToken();
  if (!refreshToken) return getToken();

  try {
    const res = await fetch(`${SUPA_URL}/auth/v1/token?grant_type=refresh_token`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: SUPA_KEY },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) return getToken(); // fall back to whatever we have
    const data = await res.json();
    if (data.access_token) {
      // Merge into existing session
      const existing = JSON.parse(localStorage.getItem("mg_session") || "{}");
      const updated = { ...existing, access_token: data.access_token, refresh_token: data.refresh_token || refreshToken, expires_at: data.expires_at, expires_in: data.expires_in };
      localStorage.setItem("mg_session", JSON.stringify(updated));
      return data.access_token;
    }
  } catch {}
  return getToken();
}

async function supaFetch(path, opts = {}) {
  const token = await ensureFreshToken();
  const res = await fetch(`${SUPA_URL}/rest/v1${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", apikey: SUPA_KEY, Authorization: `Bearer ${token}`, Prefer: "return=representation", ...(opts.headers || {}) },
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    // Clearer error for expired session
    if (res.status === 401 || (e.message && /jwt|expired|invalid/i.test(e.message))) {
      throw new Error("Your session has expired. Please refresh the page or sign in again.");
    }
    throw new Error(e.message || "Request failed");
  }
  return res.status === 204 ? null : res.json();
}

async function supaAuthFetch(endpoint, method = "GET", body = null) {
  const token = await ensureFreshToken();
  const res = await fetch(`${SUPA_URL}/auth/v1/${endpoint}`, {
    method,
    headers: { "Content-Type": "application/json", apikey: SUPA_KEY, Authorization: `Bearer ${token}` },
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

// ── Design tokens (electric blue + dark UI) ──
// ── Theme factory: generate color tokens based on mode + accent ──
function makeTheme(mode, accentKey) {
  const accents = {
    blue:   { c: "#3B82F6", rgb: "59,130,246" },
    purple: { c: "#A78BFA", rgb: "167,139,250" },
    green:  { c: "#22C55E", rgb: "34,197,94" },
    coral:  { c: "#F97866", rgb: "249,120,102" },
  };
  const a = accents[accentKey] || accents.blue;

  if (mode === "light") {
    return {
      mode: "light",
      accentKey,
      bg:      "#F7F8FA",
      sidebar: "#FFFFFF",
      surf:    "#FFFFFF",
      surf2:   "#F3F4F8",
      line:    "#E0E3EA",
      line2:   "#C5CAD4",
      text:    "#0F1419",
      mute:    "#4A5266",
      dim:     "#7A8498",
      accent:  a.c,
      accentBg:`rgba(${a.rgb},0.10)`,
      accentHi:`rgba(${a.rgb},0.22)`,
      green:   "#15803D",
      purple:  "#6D28D9",
      amber:   "#B45309",
      red:     "#B91C1C",
    };
  }
  // dark (default)
  return {
    mode: "dark",
    accentKey,
    bg:      "#1A1A1F",
    sidebar: "#1F1F26",
    surf:    "#26262E",
    surf2:   "#2D2D36",
    line:    "rgba(255,255,255,0.08)",
    line2:   "rgba(255,255,255,0.16)",
    text:    "#F0F0F0",
    mute:    "#A0A0A0",
    dim:     "#7A7A85",
    accent:  a.c,
    accentBg:`rgba(${a.rgb},0.10)`,
    accentHi:`rgba(${a.rgb},0.22)`,
    green:   "#34D27B",
    purple:  "#B29BFF",
    amber:   "#FBB13C",
    red:     "#FF6B6B",
  };
}

// Default export for module-level use (CV helpers etc.)
const T = makeTheme("dark", "blue");

// ── CV text extraction helpers ──
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

function mapCVResultToProfile(result) {
  const profile = result.profile || {};
  const careers = result.careerPaths || [];
  const unis = result.universities || result.ukUniversities || [];
  const levelMap = { "undergraduate": "Student", "postgraduate": "Graduate (0–1 yr)", "professional": "Mid-level (3–5 yrs)" };
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
  return {
    suggestedSectors: fieldToSector(profile.currentField),
    suggestedSkills: (profile.keySkills || []).join(", "),
    suggestedJobTitle: careers[0]?.title || "",
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

// ── Small UI atoms ──
function Icon({ path, size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      {path}
    </svg>
  );
}

const ICONS = {
  home:        <path d="M3 12L12 3l9 9M5 10v10h14V10" />,
  user:        <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-7 8-7s8 3 8 7" /></>,
  doc:         <><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M8 10h8M8 14h5" /></>,
  target:      <><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></>,
  grad:        <path d="M22 10L12 5 2 10l10 5 10-5zM6 12v5c3 2 9 2 12 0v-5" />,
  clipboard:   <><path d="M9 2h6v4H9z" /><path d="M20 7V4a2 2 0 00-2-2h-2M4 7V4a2 2 0 012-2h2" /><rect x="4" y="7" width="16" height="15" rx="2" /></>,
  bookmark:    <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />,
  pen:         <><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4z" /></>,
  mic:         <><rect x="9" y="2" width="6" height="12" rx="3" /><path d="M5 10v2a7 7 0 0014 0v-2M12 19v3" /></>,
  cog:         <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></>,
  logout:      <><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><path d="M16 17l5-5-5-5M21 12H9" /></>,
  menu:        <><path d="M3 6h18M3 12h18M3 18h18" /></>,
  close:       <><path d="M18 6L6 18M6 6l12 12" /></>,
  check:       <path d="M20 6L9 17l-5-5" />,
  chevron:     <path d="M9 6l6 6-6 6" />,
  search:      <><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></>,
  calendar:    <><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>,
  spark:       <><path d="M12 2v6M12 16v6M4.9 4.9l4.2 4.2M14.9 14.9l4.2 4.2M2 12h6M16 12h6M4.9 19.1l4.2-4.2M14.9 9.1l4.2-4.2" /></>,
  bolt:        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />,
  telegram:    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-2.038 9.589c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.48 14.593l-2.95-.924c-.642-.204-.654-.642.135-.953l11.49-4.428c.537-.194 1.006.131.407.96z" />,
};

// ═════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════
export default function Dashboard({ user, onLogout, allJobs, onFilterByProfile, onNavigate }) {
  // ── Theme state ──
  const [themeMode, setThemeMode] = useState(() => { try { return localStorage.getItem("mg_theme_mode") || "dark"; } catch { return "dark"; } });
  const [themeAccent, setThemeAccent] = useState(() => { try { return localStorage.getItem("mg_theme_accent") || "blue"; } catch { return "blue"; } });

  // Local T shadows the module-level T — all existing T.xxx references resolve to this
  // eslint-disable-next-line no-shadow
  const T = useMemo(() => makeTheme(themeMode, themeAccent), [themeMode, themeAccent]);

  // Persist theme changes
  useEffect(() => {
    try { localStorage.setItem("mg_theme_mode", themeMode); localStorage.setItem("mg_theme_accent", themeAccent); } catch {}
  }, [themeMode, themeAccent]);

  // ── Reusable styles (recomputed when T changes) ──
  const card = useMemo(() => ({ background: T.surf, border: `1px solid ${T.line}`, borderRadius: "10px", padding: "16px 18px" }), [T]);
  const panelCard = useMemo(() => ({ ...card, padding: "18px 22px" }), [card]);
  const inp = useMemo(() => ({ padding: "11px 13px", borderRadius: "8px", border: `1px solid ${T.line}`, background: T.surf, color: T.text, fontSize: "13px", outline: "none", fontFamily: "inherit", width: "100%", boxSizing: "border-box", transition: "border-color 0.2s, background 0.2s" }), [T]);
  const inpFilled = useMemo(() => ({ ...inp, borderColor: T.line2, background: T.surf2 }), [inp, T]);
  const inpEmpty = useMemo(() => ({ ...inp, borderStyle: "dashed" }), [inp]);
  const chip = (active) => ({
    padding: "6px 12px", borderRadius: "16px", border: `1px solid ${active ? T.accent : T.line}`,
    background: active ? T.accent : "transparent", color: active ? "#fff" : T.mute,
    fontSize: "12px", fontWeight: active ? 500 : 400, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
  });
  const btnPrimary = useMemo(() => ({ padding: "10px 18px", background: T.accent, color: "#fff", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit", transition: "background 0.15s" }), [T]);
  const btnGhost = useMemo(() => ({ padding: "10px 18px", background: "transparent", color: T.text, border: `1px solid ${T.line2}`, borderRadius: "8px", fontSize: "13px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }), [T]);
  const lbl = useMemo(() => ({ display: "block", fontSize: "11px", color: T.mute, marginBottom: "5px", fontWeight: 400 }), [T]);

  const [view, setView] = useState(() => {
    try {
      const hint = localStorage.getItem("mg_dashboard_view");
      if (hint) {
        localStorage.removeItem("mg_dashboard_view");
        return hint;
      }
    } catch {}
    return "dashboard";
  });  // sidebar page: dashboard | profile | cv | matches | phd | tracker | saved | cvgen | interview | security
  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile hamburger
  const [jobsSubOpen, setJobsSubOpen] = useState(true);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Applications
  const [applications, setApplications] = useState([]);
  const [appsLoading, setAppsLoading] = useState(true);
  const [showAddApp, setShowAddApp] = useState(false);
  const [appSearch, setAppSearch] = useState("");
  const [appStatusFilter, setAppStatusFilter] = useState("All");
  const [urlInput, setUrlInput] = useState("");
  const [scraping, setScraping] = useState(false);
  const [scrapeResult, setScrapeResult] = useState(null);
  const [newApp, setNewApp] = useState({ title: "", company: "", url: "", type: "Job", status: "Want to apply", notes: "", deadline: "", location: "", reminder_days: 3 });

  // Saved jobs
  const [savedJobs, setSavedJobs] = useState(() => { try { return JSON.parse(localStorage.getItem("mg_saved_jobs") || "[]"); } catch { return []; } });

  // PhD Finder state — live feed from jobs.ac.uk
  const [phds, setPhds] = useState([]);
  const [phdsLoading, setPhdsLoading] = useState(false);
  const [phdsError, setPhdsError] = useState("");
  const [phdSearch, setPhdSearch] = useState("");
  const [phdCountry, setPhdCountry] = useState("all");
  const [phdFunding, setPhdFunding] = useState("all");
  const [phdCached, setPhdCached] = useState(false);

  // Telegram
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

  // CV Analysis state
  const [cvAnalysis, setCvAnalysis] = useState(() => { try { return JSON.parse(localStorage.getItem("mg_cv_analysis") || "null"); } catch { return null; } });
  const [cvLoading, setCvLoading] = useState(false);
  const [cvError, setCvError] = useState("");
  const [cvFileName, setCvFileName] = useState("");
  const [cvApplied, setCvApplied] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState("Masters");
  const fileRef = useRef(null);
  const profileCvRef = useRef(null);
  const [profileCvLoading, setProfileCvLoading] = useState(false);
  const [profileCvMsg, setProfileCvMsg] = useState("");

  const DEGREE_LEVELS = [
    { key: "Undergraduate", label: "Undergraduate", color: T.accent },
    { key: "Masters",       label: "Masters",       color: T.purple },
    { key: "PhD",           label: "PhD",           color: T.red },
  ];

  // Password change / delete
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [passLoading, setPassLoading] = useState(false);
  const [passMsg, setPassMsg] = useState({ type: "", text: "" });
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => { loadProfile(); loadApplications(); }, [user]);

  // Fetch jobs if not loaded by parent
  const [localJobs, setLocalJobs] = useState([]);
  useEffect(() => {
    if (allJobs && allJobs.length > 0) return;
    fetch("/api/jobs-db?pageSize=2000").then(r => r.json()).then(d => setLocalJobs(d.jobs || [])).catch(() => {});
  }, [allJobs]);

  const jobs = (allJobs && allJobs.length > 0) ? allJobs : localJobs;

  // Fetch live PhD feed the first time the user opens the PhD tab
  useEffect(() => {
    if (view !== "phd") return;
    if (phds.length > 0 || phdsLoading) return; // already have data
    setPhdsLoading(true); setPhdsError("");
    fetch("/api/phd-feed")
      .then(r => r.json())
      .then(d => {
        if (d.ok && Array.isArray(d.items)) {
          setPhds(d.items);
          setPhdCached(!!d.cached);
        } else {
          setPhdsError(d.error || "Could not load PhD listings.");
        }
      })
      .catch(err => setPhdsError("Network error: " + err.message))
      .finally(() => setPhdsLoading(false));
  }, [view]);

  // ── Application CRUD ──
  async function loadApplications() {
    setAppsLoading(true);
    try {
      const data = await supaFetch(`/applications?user_id=eq.${user.id}&select=*&order=created_at.desc`);
      setApplications(Array.isArray(data) ? data : []);
    } catch (e) {
      try { setApplications(JSON.parse(localStorage.getItem("mg_applications") || "[]")); }
      catch { setApplications([]); }
    }
    setAppsLoading(false);
  }

  async function saveApplication(app) {
    const body = {
      user_id: user.id, title: app.title, company: app.company, location: app.location || null,
      url: app.url || null, type: app.type || "Job", status: app.status || "Applied", notes: app.notes || null,
      deadline: app.deadline || null, reminder_days: app.reminder_days || null, reminder_sent: false,
    };
    try {
      const data = await supaFetch(`/applications`, { method: "POST", body: JSON.stringify(body) });
      const newEntry = Array.isArray(data) ? data[0] : data;
      setApplications(prev => [newEntry, ...prev]);
      return newEntry;
    } catch (e) {
      if (/session|jwt|expired/i.test(e.message)) {
        alert(e.message);
      } else {
        alert("Failed to save application: " + e.message);
      }
      return null;
    }
  }

  async function updateApplicationStatus(id, status) {
    try { await supaFetch(`/applications?id=eq.${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      setApplications(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    } catch (e) { alert("Update failed: " + e.message); }
  }

  async function deleteApplication(id) {
    if (!confirm("Remove this application from your tracker?")) return;
    try { await supaFetch(`/applications?id=eq.${id}`, { method: "DELETE" });
      setApplications(prev => prev.filter(a => a.id !== id));
    } catch (e) { alert("Delete failed: " + e.message); }
  }

  // ── URL AUTO-FILL ──
  async function scrapeUrl() {
    if (!urlInput || !urlInput.startsWith("http")) {
      setScrapeResult({ error: "Please paste a full URL (including https://)" });
      return;
    }
    setScraping(true); setScrapeResult(null);
    try {
      const res = await fetch("/api/scrape-job", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: urlInput }) });
      const data = await res.json();
      if (data.success && (data.title || data.company)) {
        setNewApp(prev => ({ ...prev, url: urlInput, title: data.title || prev.title, company: data.company || prev.company, location: data.location || prev.location, notes: data.description ? (prev.notes ? prev.notes : data.description) : prev.notes }));

        // Different message depending on how we got the data
        if (data.method === "ai") {
          const conf = data.confidence || "low";
          setScrapeResult({
            success: true,
            aiAssisted: true,
            message: `✨ AI-filled from ${data.source}. Confidence: ${conf}. Please double-check the fields below.`
          });
        } else {
          setScrapeResult({
            success: true,
            message: `✓ Auto-filled from ${data.source || "the page"}. Review and edit below.`
          });
        }
      } else {
        setNewApp(prev => ({ ...prev, url: urlInput }));
        const host = (() => { try { return new URL(urlInput).hostname.replace("www.", ""); } catch { return "this site"; } })();
        const isBlocked = /indeed|glassdoor/.test(host);
        setScrapeResult({
          fallback: true,
          message: isBlocked
            ? `${host} blocks auto-fill. Please enter details manually below (should take ~30 seconds).`
            : `Couldn't auto-fill from ${host}. Please enter details manually below.`
        });
      }
    } catch (err) {
      setNewApp(prev => ({ ...prev, url: urlInput }));
      setScrapeResult({ fallback: true, message: "Auto-fill failed. Fill in manually below." });
    }
    setScraping(false);
  }

  function resetAddForm() {
    setUrlInput(""); setScrapeResult(null);
    setNewApp({ title: "", company: "", url: "", type: "Job", status: "Want to apply", notes: "", deadline: "", location: "", reminder_days: 3 });
  }

  async function loadProfile() {
    setLoading(true);
    try {
      const data = await supaFetch(`/profiles?user_id=eq.${user.id}&select=*`);
      if (data?.length > 0) {
        const p = data[0]; setProfile(p);
        setFullName(p.full_name || ""); setJobTitle(p.job_title || ""); setSectors(p.sectors || []);
        setExperience(p.experience_level || ""); setSalary(p.min_salary || "Any");
        setLocation(p.preferred_location || ""); setVisaStatus(p.visa_status || "");
        setSkills(p.skills || ""); setBio(p.bio || "");
        setTelegramConnected(!!p.telegram_chat_id);
      } else { setFullName(user.user_metadata?.full_name || ""); }
    } catch (e) { console.log(e.message); }
    setLoading(false);
  }

  async function saveProfile() {
    setSaving(true);
    const data = { user_id: user.id, full_name: fullName, job_title: jobTitle, sectors, experience_level: experience, min_salary: salary, preferred_location: location, visa_status: visaStatus, skills, bio, updated_at: new Date().toISOString() };
    try {
      if (profile) await supaFetch(`/profiles?user_id=eq.${user.id}`, { method: "PATCH", body: JSON.stringify(data) });
      else await supaFetch("/profiles", { method: "POST", body: JSON.stringify(data) });
      setProfile(data); setSaved(true); setTimeout(() => setSaved(false), 3000);
    } catch (e) { alert("Save failed: " + e.message); }
    setSaving(false);
  }

  async function handleCVUpload(file) {
    if (!file) return;
    setCvError(""); setCvFileName(file.name); setCvLoading(true); setCvApplied(false);
    try {
      const cvText = await extractCVText(file);
      if (!cvText || cvText.trim().length < 50) { setCvError("Could not extract text. Try a PDF or paste text below."); setCvLoading(false); return; }
      const res = await fetch("/api/cv-analyser", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cvText, degreeLevel: selectedLevel }) });
      let data; try { data = await res.json(); } catch { throw new Error("Server error"); }
      if (!res.ok || data.error) throw new Error(data.error || "Analysis failed");
      if (!data.result) throw new Error("No result returned");
      const analysis = { result: data.result, date: new Date().toISOString(), fileName: file.name, degreeLevel: selectedLevel };
      localStorage.setItem("mg_cv_analysis", JSON.stringify(analysis));
      setCvAnalysis(analysis);
    } catch (err) { setCvError("Analysis failed: " + err.message); }
    setCvLoading(false);
  }

  // Quick-fill profile from CV — one-click upload on profile page
  async function quickFillFromCV(file) {
    if (!file) return;
    setProfileCvLoading(true); setProfileCvMsg("");
    try {
      const cvText = await extractCVText(file);
      if (!cvText || cvText.trim().length < 50) {
        setProfileCvMsg("⚠️ Could not extract text from the file. Try a PDF or DOCX.");
        setProfileCvLoading(false); return;
      }
      const res = await fetch("/api/cv-analyser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cvText, degreeLevel: "Masters" }),
      });
      const data = await res.json();
      if (!res.ok || data.error || !data.result) throw new Error(data.error || "Analysis failed");

      // Save the analysis for the CV Analysis page too
      const analysis = { result: data.result, date: new Date().toISOString(), fileName: file.name, degreeLevel: "Masters" };
      localStorage.setItem("mg_cv_analysis", JSON.stringify(analysis));
      setCvAnalysis(analysis);

      // Auto-apply to profile fields
      const mapped = mapCVResultToProfile(data.result);
      if (mapped.suggestedJobTitle) setJobTitle(prev => prev || mapped.suggestedJobTitle);
      if (mapped.suggestedExperience) setExperience(prev => prev || mapped.suggestedExperience);
      if (mapped.suggestedSectors.length > 0) setSectors(prev => [...new Set([...prev, ...mapped.suggestedSectors])]);
      if (mapped.suggestedSkills) setSkills(prev => prev.trim() ? prev + ", " + mapped.suggestedSkills : mapped.suggestedSkills);
      if (!visaStatus) setVisaStatus("I need visa sponsorship");

      setProfileCvMsg("✓ Profile filled from " + file.name + ". Review and save below.");
      setTimeout(() => setProfileCvMsg(""), 8000);
    } catch (err) {
      setProfileCvMsg("⚠️ " + (err.message || "Upload failed. Try again or use the CV Analysis tab."));
    }
    setProfileCvLoading(false);
  }

  function applyCVToProfile() {
    if (!cvAnalysis?.result) return;
    const mapped = mapCVResultToProfile(cvAnalysis.result);
    if (mapped.suggestedJobTitle && !jobTitle) setJobTitle(mapped.suggestedJobTitle);
    if (mapped.suggestedExperience && !experience) setExperience(mapped.suggestedExperience);
    if (mapped.suggestedSectors.length > 0) setSectors(prev => [...new Set([...prev, ...mapped.suggestedSectors])]);
    if (mapped.suggestedSkills) setSkills(prev => { const e = prev.trim(); return e ? e + ", " + mapped.suggestedSkills : mapped.suggestedSkills; });
    if (!visaStatus) setVisaStatus("I need visa sponsorship");
    setCvApplied(true); setTimeout(() => setView("profile"), 800);
  }

  async function changePassword() {
    if (!newPass || !confirmPass) { setPassMsg({ type: "err", text: "Please fill in all fields" }); return; }
    if (newPass.length < 8) { setPassMsg({ type: "err", text: "Password must be at least 8 characters" }); return; }
    if (newPass !== confirmPass) { setPassMsg({ type: "err", text: "Passwords do not match" }); return; }
    setPassLoading(true); setPassMsg({ type: "", text: "" });
    try { await supaAuthFetch("user", "PUT", { password: newPass });
      setPassMsg({ type: "ok", text: "Password updated successfully!" });
      setNewPass(""); setConfirmPass("");
    } catch (e) { setPassMsg({ type: "err", text: e.message }); }
    setPassLoading(false);
  }

  async function deleteAccount() {
    if (deleteConfirm.toLowerCase() !== "delete") return;
    setDeleteLoading(true);
    try {
      await supaFetch(`/profiles?user_id=eq.${user.id}`, { method: "DELETE" });
      const res = await fetch("/api/auth?action=delete-account", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ user_id: user.id, token: getToken() }) });
      if (!res.ok) throw new Error("Deletion failed");
      localStorage.removeItem("mg_session"); localStorage.removeItem("mg_user"); onLogout();
    } catch (e) { alert(e.message); setDeleteLoading(false); }
  }

  // ── Derived data ──
  // Only calculate matches if the profile has at least one filter set
  const hasProfileFilters = sectors.length > 0 || location || visaStatus;
  const matchedJobs = !hasProfileFilters ? [] : jobs.filter(j => {
    const tL = (j.title || "").toLowerCase();
    const sectorByTitle = (() => {
      if (/software|developer|devops|cloud|cyber|network|it.tech|helpdesk|full.stack|backend|frontend|react|python|java|aws|azure|linux|systems.eng|platform.eng/.test(tL)) return "Technology";
      if (/data.sci|machine.learn|ai |data.eng|data.anal/.test(tL)) return "AI & Data";
      if (/nurse|doctor|nhs|healthcare|medical|dental|care.work|clinical|therapist|pharmacist|midwife|paramedic/.test(tL)) return "Healthcare";
      if (/financ|accountant|audit|banking|investment|payroll/.test(tL)) return "Finance";
      if (/mechanical.eng|civil.eng|electrical.eng|embedded/.test(tL)) return "Engineering";
      if (/teacher|teaching|lecturer|tutor|school|academic/.test(tL)) return "Education";
      if (/chef|cook|hotel|restaurant|hospitality/.test(tL)) return "Hospitality";
      if (/social.work|council|government|police|charity/.test(tL)) return "Public Sector";
      if (/graphic.des|ui.des|ux.des|web.des|designer|creative|marketing|sales|hr |brand/.test(tL)) return "Business";
      return null;
    })();
    const es = j.sector || sectorByTitle || "Other";
    const sm = sectors.length === 0 || sectors.includes(es) || sectors.includes(sectorByTitle);
    const lm = !location || (j.location || "").toLowerCase().includes(location.toLowerCase());
    const vm = visaStatus !== "I need visa sponsorship" || j.sponsorship === true;
    return sm && lm && vm;
  });

  // Profile completion %
  const profileFields = [fullName, jobTitle, location, sectors.length > 0, experience, skills, visaStatus, bio];
  const filledCount = profileFields.filter(Boolean).length;
  const completionPct = Math.round((filledCount / profileFields.length) * 100);

  // Stats for dashboard landing
  const stats = {
    matches: matchedJobs.length,
    applications: applications.length,
    interviews: applications.filter(a => a.status === "Interview").length,
    offers: applications.filter(a => a.status === "Offer").length,
  };

  const initials = fullName ? fullName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : (user.email || "?")[0].toUpperCase();
  const firstName = fullName.split(" ")[0] || (user.email || "").split("@")[0] || "there";

  const cvResult = cvAnalysis?.result;
  const cvMapped = cvResult ? mapCVResultToProfile(cvResult) : null;

  if (loading) return (
    <div style={{ background: T.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", color: T.mute }}>
        <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>⏳</div>
        <p>Loading your dashboard...</p>
      </div>
    </div>
  );

  // Sidebar items
  const navItems = [
    { group: "Main", items: [
      { id: "dashboard", label: "Dashboard", icon: ICONS.home },
      { id: "profile",   label: "Profile",   icon: ICONS.user },
      { id: "cv",        label: "CV Analysis", icon: ICONS.doc, badge: cvAnalysis ? "✓" : null },
    ]},
    { group: "Job search", items: [
      { id: "opportunities", label: "Opportunities", icon: ICONS.target, hasSub: true, children: [
        { id: "matches", label: "Job Matches", count: matchedJobs.length || null },
        { id: "phd", label: "PhD Finder" },
      ]},
      { id: "tracker", label: "Applications", icon: ICONS.clipboard, count: applications.length || null },
      { id: "saved", label: "Saved", icon: ICONS.bookmark, count: savedJobs.length || null },
    ]},
    { group: "Tools", items: [
      { id: "cvgen", label: "CV Builder", icon: ICONS.pen },
      { id: "interview", label: "Interview Prep", icon: ICONS.mic },
    ]},
    { group: "Account", items: [
      { id: "security", label: "Settings", icon: ICONS.cog },
    ]},
  ];

  function NavButton({ item, depth = 0 }) {
    const isActive = view === item.id || (item.hasSub && item.children?.some(c => c.id === view));
    const isChild = depth > 0;
    return (
      <button
        onClick={() => {
          if (item.hasSub) { setJobsSubOpen(o => !o); return; }
          setView(item.id);
          setSidebarOpen(false);
        }}
        style={{
          display: "flex", alignItems: "center", gap: "10px",
          padding: isChild ? "6px 14px 6px 38px" : "8px 14px",
          margin: "1px 8px", borderRadius: "6px",
          fontSize: isChild ? "12px" : "13px",
          color: isActive ? T.accent : T.mute,
          background: isActive ? T.accentBg : "transparent",
          cursor: "pointer", fontFamily: "inherit", border: "none",
          width: "calc(100% - 16px)", textAlign: "left",
          transition: "all 0.15s", fontWeight: isActive ? 500 : 400,
        }}
        onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = T.surf; e.currentTarget.style.color = T.text; } }}
        onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = T.mute; } }}
      >
        {item.icon && <Icon path={item.icon} size={16} />}
        <span>{item.label}</span>
        {item.badge && <span style={{ marginLeft: "auto", fontSize: "10px", padding: "1px 6px", borderRadius: "8px", background: T.green, color: "#000", fontWeight: 700 }}>{item.badge}</span>}
        {item.count != null && <span style={{ marginLeft: "auto", fontSize: "10px", padding: "1px 7px", borderRadius: "8px", background: isActive ? T.accent : T.line2, color: "#fff", fontWeight: 600 }}>{item.count}</span>}
        {item.hasSub && <span style={{ marginLeft: "auto", color: T.dim, fontSize: "14px", transition: "transform 0.2s", display: "inline-block", transform: jobsSubOpen ? "rotate(90deg)" : "rotate(0deg)" }}>›</span>}
      </button>
    );
  }

  // ═══════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════
  return (
    <div style={{ background: T.bg, minHeight: "100vh", color: T.text, fontFamily: "inherit" }}>
      <style>{`
        @keyframes mgFadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes mgFillBar { to { width: var(--mg-pct, 0%); } }
        @keyframes mgWave { 0%, 60%, 100% { transform: rotate(0); } 10%, 30% { transform: rotate(12deg); } 20% { transform: rotate(-8deg); } }
        @keyframes mgSpin { to { transform: rotate(360deg); } }
        @keyframes mgPulse { 50% { opacity: 0.4; } }
        .mg-fade { opacity: 0; animation: mgFadeIn 0.5s ease-out forwards; }
        .mg-wave { display: inline-block; animation: mgWave 2.4s ease-in-out infinite; transform-origin: 70% 70%; }
        .mg-scrollbar::-webkit-scrollbar { width: 6px; }
        .mg-scrollbar::-webkit-scrollbar-thumb { background: ${T.line2}; border-radius: 3px; }
        .mg-scrollbar::-webkit-scrollbar-track { background: transparent; }
        @media (max-width: 860px) {
          .mg-sidebar { transform: translateX(-100%); transition: transform 0.25s; z-index: 100; }
          .mg-sidebar.open { transform: translateX(0); }
          .mg-main { margin-left: 0 !important; }
          .mg-hamburger { display: flex !important; }
          .mg-hide-mobile { display: none !important; }
          .mg-stats { grid-template-columns: 1fr 1fr !important; }
          .mg-split { grid-template-columns: 1fr !important; }
          .mg-profile-grid { grid-template-columns: 1fr !important; }
          .mg-phd-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Mobile overlay */}
      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 99 }} />}

      {/* SIDEBAR */}
      <aside className={`mg-sidebar mg-scrollbar${sidebarOpen ? " open" : ""}`}
        style={{ position: "fixed", top: 0, left: 0, width: "220px", height: "100vh", background: T.sidebar, padding: "30px 0 12px", display: "flex", flexDirection: "column", overflowY: "auto", zIndex: 50 }}>

        {/* Nav groups */}
        <div style={{ flex: 1 }}>
          {navItems.map((grp, gi) => (
            <div key={grp.group}>
              {gi > 0 && <div style={{ padding: "12px 14px 4px", fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", color: T.dim, fontWeight: 500 }}>{grp.group}</div>}
              {grp.items.map(item => (
                <div key={item.id}>
                  <NavButton item={item} />
                  {item.hasSub && jobsSubOpen && item.children?.map(c => (
                    <NavButton key={c.id} item={c} depth={1} />
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div style={{ padding: "8px", borderTop: `1px solid ${T.line}` }}>
          <button style={{ width: "calc(100% - 16px)", margin: "6px 8px 4px", padding: "9px 12px", background: `linear-gradient(135deg, ${T.accent}, ${T.purple})`, border: "none", borderRadius: "7px", color: "#fff", fontSize: "12px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
            onClick={() => onNavigate("Premium")}>
            <Icon path={ICONS.bolt} size={14} /> Upgrade to Premium
          </button>
          <button onClick={() => { localStorage.removeItem("mg_session"); localStorage.removeItem("mg_user"); onLogout(); }}
            style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 14px", margin: "1px 8px", borderRadius: "6px", fontSize: "13px", color: T.red, background: "transparent", cursor: "pointer", fontFamily: "inherit", border: "none", width: "calc(100% - 16px)", textAlign: "left" }}>
            <Icon path={ICONS.logout} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="mg-main mg-scrollbar" style={{ marginLeft: "220px", padding: "20px 40px 48px", minHeight: "calc(100vh - 60px)" }}>

        {/* Mobile hamburger */}
        <button onClick={() => setSidebarOpen(true)} className="mg-hamburger" style={{ display: "none", alignItems: "center", justifyContent: "center", width: "36px", height: "36px", background: T.surf, border: `1px solid ${T.line}`, borderRadius: "8px", color: T.text, cursor: "pointer", marginBottom: "16px" }}>
          <Icon path={ICONS.menu} />
        </button>

        {/* ═══════════════ DASHBOARD LANDING ═══════════════ */}
        {view === "dashboard" && (
          <div>
            {/* Welcome */}
            <div style={{ marginBottom: "24px" }}>
              <h1 style={{ fontSize: "26px", fontWeight: 500, margin: "0 0 4px", letterSpacing: "-0.01em" }}>
                Welcome back, {firstName} <span className="mg-wave">👋</span>
              </h1>
              <p style={{ fontSize: "13px", color: T.mute, margin: 0 }}>Here's what's happening with your job search today.</p>
            </div>

            {/* Completion banner */}
            {completionPct < 100 && (
              <div style={{ ...panelCard, display: "flex", alignItems: "center", gap: "18px", marginBottom: "22px", flexWrap: "wrap" }}>
                <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: T.accentBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: T.accent }}>
                  <Icon path={ICONS.user} size={20} />
                </div>
                <div style={{ flex: 1, minWidth: "220px" }}>
                  <h3 style={{ fontSize: "14px", margin: "0 0 3px", fontWeight: 500 }}>Complete your profile to get better matches</h3>
                  <p style={{ fontSize: "12px", color: T.mute, margin: "0 0 10px", lineHeight: 1.5 }}>
                    A complete profile gets <strong style={{ color: T.text }}>3× more job matches</strong>. Add your skills, experience, and preferences.
                  </p>
                  <div style={{ height: "4px", background: T.line, borderRadius: "2px", overflow: "hidden", maxWidth: "440px" }}>
                    <div style={{ height: "100%", background: T.accent, borderRadius: "2px", width: "0", animation: "mgFillBar 1.2s ease-out 0.3s forwards", "--mg-pct": completionPct + "%" }} />
                  </div>
                  <div style={{ fontSize: "11px", color: T.mute, marginTop: "4px" }}>{completionPct}% complete · {8 - filledCount} {8 - filledCount === 1 ? "step" : "steps"} left</div>
                </div>
                <button onClick={() => setView("profile")} style={{ ...btnPrimary, flexShrink: 0 }}>Complete profile →</button>
              </div>
            )}

            {/* Stats */}
            <div className="mg-stats" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "22px" }}>
              {[
                { lbl: "Job Matches",    val: hasProfileFilters ? stats.matches : "—",      sub: hasProfileFilters ? (stats.matches > 0 ? "Matched to your profile" : "No matches yet") : "Complete profile to see matches", onClick: () => setView(hasProfileFilters ? "matches" : "profile") },
                { lbl: "Applications",   val: stats.applications, sub: applications.filter(a => a.status === "Applied").length + " awaiting response", onClick: () => setView("tracker") },
                { lbl: "Interviews",     val: stats.interviews,   sub: stats.interviews > 0 ? "Active interview rounds" : "No interviews yet", onClick: () => setView("tracker") },
                { lbl: "Offers",         val: stats.offers,       sub: stats.offers > 0 ? "🎉 Well done!" : "Keep going", onClick: () => setView("tracker") },
              ].map((s, i) => (
                <button key={s.lbl} onClick={s.onClick} className="mg-fade" style={{ ...card, textAlign: "left", cursor: "pointer", fontFamily: "inherit", color: T.text, animationDelay: `${i * 0.06}s`, transition: "border-color 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = T.line2}
                  onMouseLeave={e => e.currentTarget.style.borderColor = T.line}>
                  <div style={{ fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", color: T.dim, fontWeight: 500, marginBottom: "8px" }}>{s.lbl}</div>
                  <div style={{ fontSize: "26px", fontWeight: 500, marginBottom: "4px", letterSpacing: "-0.02em" }}>{s.val}</div>
                  <div style={{ fontSize: "11px", color: T.mute }}>{s.sub}</div>
                </button>
              ))}
            </div>

            {/* Split: Recent activity + Quick actions */}
            <div className="mg-split" style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "14px", marginBottom: "22px" }}>

              {/* Recent activity */}
              <div style={panelCard}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <div>
                    <h3 style={{ fontSize: "13px", margin: 0, fontWeight: 500 }}>Recent activity</h3>
                    <p style={{ fontSize: "11px", color: T.dim, margin: "2px 0 0" }}>Your latest application updates</p>
                  </div>
                  <button onClick={() => setView("tracker")} style={{ fontSize: "11px", color: T.accent, background: T.accentBg, border: "none", padding: "4px 10px", borderRadius: "5px", cursor: "pointer", fontFamily: "inherit" }}>View all →</button>
                </div>
                {applications.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "2rem 0", color: T.mute }}>
                    <p style={{ fontSize: "13px", margin: "0 0 10px" }}>No activity yet</p>
                    <button onClick={() => setView("tracker")} style={{ ...btnGhost, fontSize: "12px", padding: "7px 14px" }}>+ Track your first application</button>
                  </div>
                ) : applications.slice(0, 4).map((a, i) => {
                  const statusColor = a.status === "Offer" ? T.green : a.status === "Interview" ? T.amber : a.status === "Rejected" ? T.red : a.status === "Want to apply" ? T.purple : T.accent;
                  const timeAgo = a.created_at ? timeSince(new Date(a.created_at)) : "";
                  return (
                    <div key={a.id || i} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 0", borderTop: i === 0 ? "none" : `1px solid ${T.line}`, paddingTop: i === 0 ? "4px" : "10px" }}>
                      <div style={{ width: "32px", height: "32px", borderRadius: "6px", background: statusColor, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "13px", fontWeight: 600, flexShrink: 0 }}>{(a.company || "?")[0].toUpperCase()}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: "13px", fontWeight: 500, margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.title}</p>
                        <p style={{ fontSize: "11px", color: T.mute, margin: 0 }}>{a.company}{a.location ? " · " + a.location : ""} · <span style={{ color: statusColor, fontWeight: 500 }}>{a.status}</span></p>
                      </div>
                      {timeAgo && <div style={{ fontSize: "11px", color: T.dim, flexShrink: 0 }}>{timeAgo}</div>}
                    </div>
                  );
                })}
              </div>

              {/* Quick actions */}
              <div style={panelCard}>
                <h3 style={{ fontSize: "13px", margin: "0 0 12px", fontWeight: 500 }}>Quick actions</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  {[
                    { icon: ICONS.doc,       t: "Update CV",   d: cvAnalysis ? "CV on file" : "Get matches", v: "cv" },
                    { icon: ICONS.search,    t: "Find jobs",   d: `${stats.matches} matches`, v: "matches" },
                    { icon: ICONS.clipboard, t: "Track app",   d: "Add new", v: "tracker" },
                    { icon: ICONS.calendar,  t: "Deadlines",   d: applications.filter(a => a.deadline).length + " upcoming", v: "tracker" },
                  ].map(q => (
                    <button key={q.t} onClick={() => setView(q.v)} style={{ padding: "12px", background: T.bg, border: `1px solid ${T.line}`, borderRadius: "8px", cursor: "pointer", textAlign: "left", fontFamily: "inherit", color: T.text, transition: "all 0.15s" }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.background = T.surf2; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = T.line; e.currentTarget.style.background = T.bg; }}>
                      <div style={{ width: "24px", height: "24px", borderRadius: "5px", background: T.accentBg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "8px", color: T.accent }}>
                        <Icon path={q.icon} size={14} />
                      </div>
                      <p style={{ fontSize: "12px", fontWeight: 500, margin: "0 0 2px" }}>{q.t}</p>
                      <p style={{ fontSize: "10px", color: T.mute, margin: 0, lineHeight: 1.4 }}>{q.d}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Top matches preview */}
            {matchedJobs.length > 0 && (
              <div style={panelCard}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <div>
                    <h3 style={{ fontSize: "13px", margin: 0, fontWeight: 500 }}>Top matches for you</h3>
                    <p style={{ fontSize: "11px", color: T.dim, margin: "2px 0 0" }}>Based on your sectors and location</p>
                  </div>
                  <button onClick={() => setView("matches")} style={{ fontSize: "11px", color: T.accent, background: T.accentBg, border: "none", padding: "4px 10px", borderRadius: "5px", cursor: "pointer", fontFamily: "inherit" }}>View all {matchedJobs.length} →</button>
                </div>
                {matchedJobs.slice(0, 4).map((j, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 0", borderTop: i === 0 ? "none" : `1px solid ${T.line}` }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "13px", fontWeight: 500, margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{j.title}</p>
                      <p style={{ fontSize: "11px", color: T.mute, margin: 0 }}>{j.company} · {j.location}{j.salary ? " · " + j.salary : ""}</p>
                    </div>
                    {j.sponsorship && <span style={{ padding: "2px 8px", borderRadius: "10px", fontSize: "10px", fontWeight: 600, background: "rgba(34,197,94,0.12)", color: T.green, flexShrink: 0 }}>✓ Visa</span>}
                    {j.url && <a href={j.url} target="_blank" rel="noopener noreferrer" style={{ padding: "6px 12px", borderRadius: "6px", background: T.accent, color: "#fff", fontSize: "11px", textDecoration: "none", fontWeight: 500, flexShrink: 0 }}>Apply ↗</a>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════ PROFILE ═══════════════ */}
        {view === "profile" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", gap: "16px", flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: "11px", letterSpacing: "0.18em", textTransform: "uppercase", color: T.dim, fontWeight: 500 }}>Profile</div>
                <h1 style={{ fontSize: "26px", fontWeight: 500, margin: "6px 0 4px", letterSpacing: "-0.01em" }}>Tell us about you</h1>
                <p style={{ fontSize: "13px", color: T.mute, margin: 0 }}>The more we know, the better we match.</p>
              </div>
              {/* Completion ring */}
              <div style={{ position: "relative", width: "72px", height: "72px", flexShrink: 0 }}>
                <svg width="72" height="72" style={{ transform: "rotate(-90deg)" }}>
                  <circle cx="36" cy="36" r="32" fill="none" stroke={T.line} strokeWidth="4" />
                  <circle cx="36" cy="36" r="32" fill="none" stroke={T.accent} strokeWidth="4" strokeLinecap="round"
                    strokeDasharray={`${(completionPct / 100) * 201} 201`}
                    style={{ transition: "stroke-dasharray 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)" }} />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ fontSize: "14px", fontWeight: 500, lineHeight: 1 }}>{completionPct}%</div>
                  <div style={{ fontSize: "7px", color: T.dim, letterSpacing: "0.1em", textTransform: "uppercase", marginTop: "2px" }}>complete</div>
                </div>
              </div>
            </div>

            {cvApplied && (
              <div style={{ padding: "10px 14px", background: "rgba(167,139,250,0.1)", border: `1px solid ${T.purple}33`, borderRadius: "8px", fontSize: "12px", color: T.purple, fontWeight: 500, marginBottom: "16px" }}>
                ✨ Profile auto-filled from your CV. Review and save below.
              </div>
            )}

            {/* ── Quick-fill from CV card ── */}
            <div
              onClick={() => !profileCvLoading && profileCvRef.current?.click()}
              onDragOver={e => { e.preventDefault(); if (!profileCvLoading) e.currentTarget.style.borderColor = T.purple; }}
              onDragLeave={e => { e.currentTarget.style.borderColor = T.purple + "55"; }}
              onDrop={e => { e.preventDefault(); e.currentTarget.style.borderColor = T.purple + "55"; if (!profileCvLoading) quickFillFromCV(e.dataTransfer.files[0]); }}
              style={{
                display: "flex", alignItems: "center", gap: "16px",
                padding: "18px 22px", marginBottom: "22px",
                background: "linear-gradient(135deg, rgba(167,139,250,0.08), rgba(59,130,246,0.04))",
                border: `1.5px dashed ${T.purple}55`, borderRadius: "10px",
                cursor: profileCvLoading ? "wait" : "pointer",
                transition: "border-color 0.2s, background 0.2s",
              }}
              onMouseEnter={e => { if (!profileCvLoading) e.currentTarget.style.background = "linear-gradient(135deg, rgba(167,139,250,0.12), rgba(59,130,246,0.06))"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "linear-gradient(135deg, rgba(167,139,250,0.08), rgba(59,130,246,0.04))"; }}
            >
              <input ref={profileCvRef} type="file" accept=".pdf,.txt,.doc,.docx" style={{ display: "none" }}
                onChange={e => quickFillFromCV(e.target.files[0])} />
              <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: "rgba(167,139,250,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: T.purple }}>
                {profileCvLoading ? (
                  <div style={{ width: "18px", height: "18px", border: `2px solid ${T.purple}33`, borderTopColor: T.purple, borderRadius: "50%", animation: "mgSpin 0.9s linear infinite" }} />
                ) : (
                  <Icon path={ICONS.spark} size={22} />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ fontSize: "14px", margin: "0 0 3px", fontWeight: 500, color: T.text }}>
                  {profileCvLoading ? "Analysing your CV..." : "Quick fill from your CV"}
                </h3>
                <p style={{ fontSize: "12px", color: T.mute, margin: 0, lineHeight: 1.5 }}>
                  {profileCvLoading
                    ? "This takes about 10 seconds. Hang tight."
                    : cvAnalysis
                      ? "Upload a new CV to re-fill your profile fields automatically."
                      : "Drop your CV here or click to upload. We'll auto-fill your job title, skills, sectors and more. PDF or DOCX."}
                </p>
              </div>
              {!profileCvLoading && (
                <button
                  onClick={e => { e.stopPropagation(); profileCvRef.current?.click(); }}
                  style={{ padding: "9px 16px", background: T.purple, color: "#fff", border: "none", borderRadius: "7px", fontSize: "12px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", flexShrink: 0 }}>
                  {cvAnalysis ? "Upload new CV" : "Upload CV"}
                </button>
              )}
            </div>

            {profileCvMsg && (
              <div style={{ padding: "10px 14px", background: profileCvMsg.startsWith("✓") ? "rgba(34,197,94,0.1)" : "rgba(226,75,74,0.1)", border: `1px solid ${profileCvMsg.startsWith("✓") ? T.green : T.red}33`, borderRadius: "8px", fontSize: "12px", color: profileCvMsg.startsWith("✓") ? T.green : T.red, fontWeight: 500, marginBottom: "16px" }}>
                {profileCvMsg}
              </div>
            )}

            <div className="mg-profile-grid" style={{ display: "grid", gridTemplateColumns: "1fr 240px", gap: "28px" }}>

              {/* Form sections */}
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

                {/* Section 1: Basics */}
                <ProfileSection T={T} num={1} done={!!(fullName && jobTitle)} title="The basics">
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div><label style={lbl}>Full name</label><input style={fullName ? inpFilled : inpEmpty} value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your full name" /></div>
                    <div><label style={lbl}>Target role</label><input style={jobTitle ? inpFilled : inpEmpty} value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="e.g. Software Engineer" /></div>
                  </div>
                  <div style={{ marginTop: "10px" }}>
                    <label style={lbl}>About me</label>
                    <textarea style={{ ...(bio ? inpFilled : inpEmpty), minHeight: "70px", resize: "vertical" }} value={bio} onChange={e => setBio(e.target.value)} placeholder="Brief background about yourself..." />
                  </div>
                </ProfileSection>

                {/* Section 2: Where and how */}
                <ProfileSection T={T} num={2} done={!!(location && salary && salary !== "Any")} title="Where and how">
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
                    <div><label style={lbl}>Preferred city</label><input style={location ? inpFilled : inpEmpty} value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. London" /></div>
                    <div><label style={lbl}>Min salary</label>
                      <select style={(salary && salary !== "Any") ? inpFilled : inpEmpty} value={salary} onChange={e => setSalary(e.target.value)}>
                        {SALARY_RANGES.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                </ProfileSection>

                {/* Section 3: Sectors */}
                <ProfileSection T={T} num={3} done={sectors.length > 0} title="Your sectors" meta={sectors.length > 0 ? `${sectors.length} selected` : "Pick any"}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {SECTORS.map(s => <button key={s} style={chip(sectors.includes(s))} onClick={() => setSectors(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s])}>{s}</button>)}
                  </div>
                </ProfileSection>

                {/* Section 4: Experience */}
                <ProfileSection T={T} num={4} done={!!experience} title="Experience level" meta="Pick one">
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {EXPERIENCE_LEVELS.map(lv => <button key={lv} style={chip(experience === lv)} onClick={() => setExperience(experience === lv ? "" : lv)}>{lv}</button>)}
                  </div>
                </ProfileSection>

                {/* Section 5: Skills */}
                <ProfileSection T={T} num={5} done={!!skills} title="Skills">
                  <input style={skills ? inpFilled : inpEmpty} value={skills} onChange={e => setSkills(e.target.value)} placeholder="e.g. Python, React, Project Management, NHS, IELTS 7.0" />
                </ProfileSection>

                {/* Section 6: Visa */}
                <ProfileSection T={T} num={6} done={!!visaStatus} title="Visa preference">
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {VISA_OPTIONS.map(v => <button key={v} style={chip(visaStatus === v)} onClick={() => setVisaStatus(v)}>{v}</button>)}
                  </div>
                </ProfileSection>

                {/* Telegram */}
                <div style={panelCard}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "12px" }}>
                    <div style={{ width: "32px", height: "32px", borderRadius: "7px", background: "rgba(34,158,217,0.12)", color: "#229ED9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon path={ICONS.telegram} size={18} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: "13px", margin: "0 0 3px", fontWeight: 500 }}>Weekly job alerts via Telegram</h3>
                      <p style={{ fontSize: "12px", color: T.mute, margin: 0, lineHeight: 1.5 }}>Get 5 personalised visa sponsorship jobs every Friday.</p>
                    </div>
                  </div>
                  {telegramConnected ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", background: "rgba(34,197,94,0.08)", border: `1px solid ${T.green}33`, borderRadius: "7px" }}>
                      <span style={{ fontSize: "16px" }}>✓</span>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontWeight: 500, fontSize: "12px", color: T.green }}>Telegram connected</p>
                        <p style={{ margin: 0, fontSize: "11px", color: T.mute }}>Alerts sent every Friday afternoon</p>
                      </div>
                      <button onClick={async () => { await supaFetch("/profiles?user_id=eq." + user.id, { method: "PATCH", body: JSON.stringify({ telegram_chat_id: null }) }); setTelegramConnected(false); }}
                        style={{ fontSize: "11px", color: T.red, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>Disconnect</button>
                    </div>
                  ) : (
                    <a href={"https://t.me/MentorgramAIBot?start=" + user.id} target="_blank" rel="noopener noreferrer"
                      style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "9px 16px", borderRadius: "7px", background: "#229ED9", color: "#fff", textDecoration: "none", fontSize: "12px", fontWeight: 500 }}>
                      <Icon path={ICONS.telegram} size={14} /> Connect Telegram
                    </a>
                  )}
                </div>

                {/* Save button */}
                <button style={{ ...btnPrimary, padding: "13px", fontSize: "14px", background: saved ? T.green : T.accent, opacity: saving ? 0.7 : 1 }} onClick={saveProfile} disabled={saving}>
                  {saving ? "Saving..." : saved ? "✓ Profile saved" : "Save profile"}
                </button>
              </div>

              {/* Live preview */}
              <div className="mg-hide-mobile" style={{ position: "sticky", top: "20px", alignSelf: "flex-start" }}>
                <div style={panelCard}>
                  <div style={{ fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: T.dim, marginBottom: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: T.green, animation: "mgPulse 2s ease-in-out infinite" }} /> Live preview
                  </div>
                  <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: T.accent, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "17px", fontWeight: 500, marginBottom: "12px" }}>{initials}</div>
                  <div style={{ fontSize: "14px", fontWeight: 500, marginBottom: "2px" }}>{fullName || "Your name"}</div>
                  <div style={{ fontSize: "12px", color: T.mute, marginBottom: "14px" }}>{jobTitle || "Your role"}{location ? ` · ${location}` : ""}</div>
                  {[
                    { l: "Sectors", v: sectors.length > 0 ? `${sectors.length} selected` : "Not set" },
                    { l: "Experience", v: experience || "Not set" },
                    { l: "Min salary", v: salary !== "Any" ? salary : "Any" },
                    { l: "Visa", v: visaStatus ? (visaStatus.includes("sponsor") ? "Needs sponsor" : visaStatus.includes("right") ? "Right to work" : "Either") : "Not set" },
                  ].map(s => (
                    <div key={s.l} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderTop: `1px solid ${T.line}`, fontSize: "12px" }}>
                      <span style={{ color: T.dim }}>{s.l}</span>
                      <span style={{ color: T.text, fontWeight: 500 }}>{s.v}</span>
                    </div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderTop: `1px solid ${T.line}`, fontSize: "12px" }}>
                    <span style={{ color: T.dim }}>Matches</span>
                    <span style={{ color: T.accent, fontWeight: 500 }}>{matchedJobs.length} jobs</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ═══════════════ CV ANALYSIS ═══════════════ */}
        {view === "cv" && (
          <div>
            <div style={{ marginBottom: "20px" }}>
              <h1 style={{ fontSize: "24px", fontWeight: 500, margin: "0 0 4px", letterSpacing: "-0.01em" }}>CV Analysis</h1>
              <p style={{ fontSize: "13px", color: T.mute, margin: 0 }}>Upload your CV and our AI will auto-fill your profile, suggest career paths, and match you with jobs.</p>
            </div>

            <div style={{ ...panelCard, marginBottom: "16px" }}>
              <label style={lbl}>What are you looking for?</label>
              <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
                {DEGREE_LEVELS.map(l => (
                  <button key={l.key} onClick={() => setSelectedLevel(l.key)}
                    style={{ padding: "7px 14px", borderRadius: "16px", fontSize: "12px", fontWeight: selectedLevel === l.key ? 500 : 400, cursor: "pointer", fontFamily: "inherit",
                      border: `1px solid ${selectedLevel === l.key ? l.color : T.line}`,
                      background: selectedLevel === l.key ? `${l.color}18` : "transparent",
                      color: selectedLevel === l.key ? l.color : T.mute }}>
                    {l.label}
                  </button>
                ))}
              </div>

              <div onClick={() => fileRef.current?.click()}
                onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = T.accent; }}
                onDragLeave={e => { e.currentTarget.style.borderColor = T.line; }}
                onDrop={e => { e.preventDefault(); e.currentTarget.style.borderColor = T.line; handleCVUpload(e.dataTransfer.files[0]); }}
                style={{ border: `2px dashed ${T.line2}`, borderRadius: "10px", padding: "28px", textAlign: "center", cursor: "pointer", background: T.bg, transition: "border-color 0.2s" }}>
                <input ref={fileRef} type="file" accept=".pdf,.txt,.doc,.docx" style={{ display: "none" }} onChange={e => handleCVUpload(e.target.files[0])} />
                <div style={{ width: "40px", height: "40px", borderRadius: "8px", background: T.accentBg, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px", color: T.accent }}>
                  <Icon path={ICONS.doc} size={22} />
                </div>
                {cvFileName ? (
                  <>
                    <p style={{ fontSize: "13px", fontWeight: 500, margin: "0 0 4px", color: T.green }}>✓ {cvFileName}</p>
                    <p style={{ fontSize: "12px", color: T.mute, margin: 0 }}>Click to upload a different file</p>
                  </>
                ) : (
                  <>
                    <p style={{ fontSize: "13px", fontWeight: 500, margin: "0 0 4px" }}>Drop your CV here or click to upload</p>
                    <p style={{ fontSize: "12px", color: T.mute, margin: 0 }}>PDF, DOCX, TXT · max 5MB</p>
                  </>
                )}
              </div>

              {cvLoading && (
                <div style={{ display: "flex", gap: "10px", alignItems: "center", padding: "10px 14px", background: T.accentBg, borderRadius: "8px", marginTop: "12px" }}>
                  <div style={{ width: "14px", height: "14px", border: `2px solid ${T.accentBg}`, borderTopColor: T.accent, borderRadius: "50%", animation: "mgSpin 1s linear infinite" }} />
                  <p style={{ margin: 0, fontSize: "12px", color: T.accent }}>Analysing your CV with AI...</p>
                </div>
              )}
              {cvError && <p style={{ color: T.red, fontSize: "12px", margin: "12px 0 0" }}>⚠️ {cvError}</p>}
            </div>

            {cvResult && !cvLoading && (
              <div style={{ display: "grid", gap: "12px" }}>
                <div style={{ ...panelCard, borderColor: T.purple + "55" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                    <div>
                      <p style={{ fontWeight: 500, margin: "0 0 3px", fontSize: "14px" }}>{cvApplied ? "✓ Profile updated" : "Apply results to your profile"}</p>
                      <p style={{ fontSize: "12px", color: T.mute, margin: 0 }}>{cvApplied ? "Your profile has been updated." : "Auto-fill job title, sectors, skills and experience."}</p>
                    </div>
                    {!cvApplied && <button onClick={applyCVToProfile} style={{ ...btnPrimary, background: T.purple }}>Apply to profile</button>}
                  </div>
                </div>

                <div style={panelCard}>
                  <p style={{ fontWeight: 500, margin: "0 0 10px", fontSize: "13px" }}>Profile summary</p>
                  <p style={{ fontSize: "13px", color: T.mute, lineHeight: 1.6, margin: "0 0 12px" }}>{cvResult.summary}</p>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {(cvResult.profile?.keySkills || []).map(s => (
                      <span key={s} style={{ padding: "3px 10px", borderRadius: "16px", fontSize: "11px", fontWeight: 500, background: "rgba(167,139,250,0.12)", color: T.purple }}>{s}</span>
                    ))}
                  </div>
                </div>

                {cvResult.careerPaths?.length > 0 && (
                  <div style={panelCard}>
                    <p style={{ fontWeight: 500, margin: "0 0 12px", fontSize: "13px" }}>Recommended career paths</p>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "10px" }}>
                      {cvResult.careerPaths.map((cp, i) => (
                        <div key={i} style={{ background: T.bg, borderRadius: "8px", padding: "12px", border: `1px solid ${T.line}` }}>
                          <p style={{ fontWeight: 500, margin: "0 0 5px", fontSize: "13px" }}>{cp.title}</p>
                          <p style={{ fontSize: "12px", color: T.mute, margin: "0 0 8px", lineHeight: 1.5 }}>{cp.description}</p>
                          <div style={{ fontSize: "11px", color: T.green, fontWeight: 500 }}>{cp.salaryRange}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {cvResult.gaps?.length > 0 && (
                  <div style={{ ...panelCard, background: "rgba(245,158,11,0.04)", borderColor: T.amber + "33" }}>
                    <p style={{ fontWeight: 500, margin: "0 0 8px", fontSize: "13px" }}>Skills to develop</p>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      {cvResult.gaps.map((g, i) => (
                        <span key={i} style={{ padding: "4px 10px", borderRadius: "16px", fontSize: "12px", background: "rgba(245,158,11,0.12)", color: T.amber, fontWeight: 500 }}>{g}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════ JOB MATCHES ═══════════════ */}
        {view === "matches" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <h1 style={{ fontSize: "24px", fontWeight: 500, margin: "0 0 4px", letterSpacing: "-0.01em" }}>Job matches</h1>
                <p style={{ fontSize: "13px", color: T.mute, margin: 0 }}>{hasProfileFilters ? `${matchedJobs.length} visa sponsorship jobs matched to your profile` : "Complete your profile to see personalised matches"}</p>
              </div>
              <button onClick={() => { onFilterByProfile({ sectors, location, visaStatus }); onNavigate("Sponsorship Jobs"); }} style={btnPrimary}>
                View all on jobs board ↗
              </button>
            </div>

            {matchedJobs.length === 0 ? (
              <div style={{ ...panelCard, textAlign: "center", padding: "3rem 2rem" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "10px", background: T.accentBg, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: T.accent }}>
                  <Icon path={ICONS.search} size={22} />
                </div>
                <p style={{ fontWeight: 500, margin: "0 0 6px", fontSize: "14px" }}>No matches yet</p>
                <p style={{ color: T.mute, fontSize: "13px", marginBottom: "16px" }}>Update your profile with sectors and location to see matching jobs</p>
                <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap" }}>
                  <button onClick={() => setView("cv")} style={{ ...btnPrimary, background: T.purple }}>Analyse my CV</button>
                  <button onClick={() => setView("profile")} style={btnGhost}>Update profile</button>
                </div>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "12px" }}>
                {matchedJobs.slice(0, 20).map((j, i) => (
                  <div key={i} style={{ ...card, transition: "border-color 0.15s, transform 0.15s", padding: "0", overflow: "hidden", display: "flex", flexDirection: "column" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = T.line2; e.currentTarget.style.transform = "translateY(-2px)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = T.line; e.currentTarget.style.transform = "translateY(0)"; }}>
                    <div style={{ padding: "14px 16px", flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px", marginBottom: "8px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: 0 }}>
                          <span style={{ width: "22px", height: "22px", borderRadius: "6px", background: T.accentBg, color: T.accent, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 600, flexShrink: 0 }}>{i + 1}</span>
                          <p style={{ fontWeight: 500, margin: 0, fontSize: "14px", lineHeight: 1.35, wordBreak: "break-word" }}>{j.title}</p>
                        </div>
                        {j.sponsorship && <span style={{ padding: "3px 8px", borderRadius: "12px", fontSize: "10px", fontWeight: 600, background: "rgba(34,197,94,0.12)", color: T.green, whiteSpace: "nowrap", flexShrink: 0 }}>✓ Visa</span>}
                      </div>
                      <p style={{ color: T.mute, fontSize: "12px", margin: "0 0 10px", paddingLeft: "30px" }}>{j.company}</p>
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center", fontSize: "11px", color: T.mute, paddingLeft: "30px" }}>
                        {j.sector && <span style={{ padding: "2px 9px", borderRadius: "12px", background: T.accentBg, color: T.accent, fontWeight: 500 }}>{j.sector}</span>}
                        <span>📍 {j.location}</span>
                        {j.salary && <span style={{ color: T.green, fontWeight: 500 }}>💰 {j.salary}</span>}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "6px", padding: "10px 16px", borderTop: `1px solid ${T.line}`, background: T.bg }}>
                      {j.url && <a href={j.url} target="_blank" rel="noopener noreferrer" style={{ flex: 1, padding: "7px 10px", borderRadius: "6px", background: T.accent, color: "#fff", fontSize: "12px", textDecoration: "none", fontWeight: 500, textAlign: "center" }}>Apply ↗</a>}
                      <button onClick={async () => { const r = await saveApplication({ title: j.title, company: j.company, url: j.url, type: "Job", status: "Want to apply", notes: "", deadline: "", location: j.location, reminder_days: null }); if (r) alert("Saved to Applications tracker ✓"); }}
                        style={{ flex: 1, padding: "7px 10px", borderRadius: "6px", background: "transparent", color: T.text, border: `1px solid ${T.line2}`, fontSize: "12px", cursor: "pointer", fontFamily: "inherit", fontWeight: 500 }}>📋 Save</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════ APPLICATION TRACKER ═══════════════ */}
        {view === "tracker" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <h1 style={{ fontSize: "24px", fontWeight: 500, margin: "0 0 4px", letterSpacing: "-0.01em" }}>Applications</h1>
                <p style={{ fontSize: "13px", color: T.mute, margin: 0 }}>{applications.length} applications tracked · Email reminders to {user.email}</p>
              </div>
              {!showAddApp && <button onClick={() => setShowAddApp(true)} style={btnPrimary}>+ Add Application</button>}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: "8px", marginBottom: "16px" }}>
              {[
                { status: "Want to apply", color: T.purple, bg: "rgba(167,139,250,0.08)" },
                { status: "Applied",       color: T.accent, bg: T.accentBg },
                { status: "Interview",     color: T.amber,  bg: "rgba(245,158,11,0.08)" },
                { status: "Offer",         color: T.green,  bg: "rgba(34,197,94,0.08)" },
                { status: "Rejected",      color: T.red,    bg: "rgba(226,75,74,0.08)" },
              ].map(s => {
                const isActive = appStatusFilter === s.status;
                return (
                  <button key={s.status} onClick={() => setAppStatusFilter(isActive ? "All" : s.status)}
                    style={{
                      background: isActive ? s.bg : "transparent",
                      borderRadius: "10px",
                      padding: "12px",
                      textAlign: "center",
                      border: `1.5px solid ${isActive ? s.color : T.line}`,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      transition: "all 0.18s ease",
                      transform: isActive ? "translateY(-1px)" : "translateY(0)",
                      boxShadow: isActive ? `0 4px 12px ${s.bg}` : "none",
                    }}>
                    <p style={{ fontSize: "22px", fontWeight: 500, margin: "0 0 2px", color: s.color }}>{applications.filter(a => a.status === s.status).length}</p>
                    <p style={{ fontSize: "11px", color: isActive ? s.color : T.mute, margin: 0, fontWeight: isActive ? 500 : 400 }}>{s.status}</p>
                  </button>
                );
              })}
            </div>

            {/* Search bar + filter info */}
            {applications.length > 0 && (
              <div style={{ display: "flex", gap: "10px", marginBottom: "14px", flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ flex: 1, minWidth: "200px", position: "relative", display: "flex", alignItems: "center" }}>
                  <span style={{ position: "absolute", left: "12px", color: T.dim, display: "flex", alignItems: "center" }}>
                    <Icon path={ICONS.search} size={14} />
                  </span>
                  <input
                    style={{ ...inp, paddingLeft: "36px", paddingRight: appSearch ? "34px" : "13px" }}
                    placeholder="Search applications by title, company or location..."
                    value={appSearch}
                    onChange={e => setAppSearch(e.target.value)}
                  />
                  {appSearch && (
                    <button onClick={() => setAppSearch("")}
                      style={{ position: "absolute", right: "10px", background: "none", border: "none", cursor: "pointer", color: T.mute, fontSize: "16px", lineHeight: 1, padding: "2px 4px" }}>×</button>
                  )}
                </div>
                {appStatusFilter !== "All" && (
                  <button onClick={() => setAppStatusFilter("All")}
                    style={{ padding: "8px 14px", borderRadius: "7px", fontSize: "12px", border: `1px solid ${T.line2}`, background: T.accentBg, color: T.accent, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", fontWeight: 500 }}>
                    Showing: {appStatusFilter} ✕
                  </button>
                )}
              </div>
            )}

            {showAddApp && (
              <div style={{ ...panelCard, marginBottom: "12px", border: `1.5px solid ${T.accent}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <p style={{ fontWeight: 500, margin: 0, fontSize: "13px" }}>Add application — paste URL to auto-fill</p>
                  <button onClick={() => { resetAddForm(); setShowAddApp(false); }} style={{ fontSize: "13px", color: T.mute, background: "none", border: "none", cursor: "pointer" }}>✕</button>
                </div>

                <div style={{ background: T.accentBg, border: `1px solid ${T.accent}33`, borderRadius: "7px", padding: "12px", marginBottom: "12px" }}>
                  <label style={{ ...lbl, fontWeight: 500, color: T.text }}>📎 Paste job URL (optional)</label>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <input style={inp} placeholder="https://example.com/jobs/..." value={urlInput}
                      onChange={e => setUrlInput(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && !scraping && scrapeUrl()} />
                    <button onClick={scrapeUrl} disabled={scraping || !urlInput}
                      style={{ ...btnPrimary, padding: "9px 16px", whiteSpace: "nowrap", opacity: scraping || !urlInput ? 0.5 : 1 }}>
                      {scraping ? "..." : "Auto-fill"}
                    </button>
                  </div>
                  <p style={{ margin: "6px 0 0", fontSize: "10px", color: T.mute, lineHeight: 1.5 }}>
                    Works best on LinkedIn, Greenhouse, Workable, FindAPhD, jobs.ac.uk, company career pages. Indeed/Glassdoor may need manual entry.
                  </p>
                  {scrapeResult?.success && (
                    <p style={{ margin: "8px 0 0", fontSize: "11px", color: scrapeResult.aiAssisted ? T.purple : T.green }}>
                      {scrapeResult.message}
                    </p>
                  )}
                  {scrapeResult?.fallback && <p style={{ margin: "8px 0 0", fontSize: "11px", color: T.amber }}>⚠️ {scrapeResult.message}</p>}
                  {scrapeResult?.error && <p style={{ margin: "8px 0 0", fontSize: "11px", color: T.red }}>⚠️ {scrapeResult.error}</p>}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
                  <div><label style={lbl}>Job title *</label><input style={inp} placeholder="e.g. Senior Engineer" value={newApp.title} onChange={e => setNewApp(p => ({ ...p, title: e.target.value }))} /></div>
                  <div><label style={lbl}>Company *</label><input style={inp} placeholder="e.g. Acme Corp" value={newApp.company} onChange={e => setNewApp(p => ({ ...p, company: e.target.value }))} /></div>
                  <div><label style={lbl}>Location</label><input style={inp} placeholder="e.g. London" value={newApp.location} onChange={e => setNewApp(p => ({ ...p, location: e.target.value }))} /></div>
                  <div><label style={lbl}>Type</label>
                    <select style={inp} value={newApp.type} onChange={e => setNewApp(p => ({ ...p, type: e.target.value }))}>
                      <option>Job</option><option>PhD</option><option>Masters</option><option>Internship</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: "10px" }}>
                  <label style={lbl}>🔗 Job link (auto-filled if you pasted a URL above)</label>
                  <input style={inp} placeholder="https://..." value={newApp.url}
                    onChange={e => setNewApp(p => ({ ...p, url: e.target.value }))} />
                </div>

                <div style={{ marginBottom: "10px" }}>
                  <label style={lbl}>Status</label>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {[
                      { s: "Want to apply", c: T.purple, bg: "rgba(167,139,250,0.12)" },
                      { s: "Applied",       c: T.accent, bg: T.accentBg },
                      { s: "Interview",     c: T.amber,  bg: "rgba(245,158,11,0.12)" },
                      { s: "Offer",         c: T.green,  bg: "rgba(34,197,94,0.12)" },
                      { s: "Rejected",      c: T.red,    bg: "rgba(226,75,74,0.12)" },
                    ].map(opt => {
                      const active = newApp.status === opt.s;
                      return (
                        <button key={opt.s} type="button"
                          onClick={() => setNewApp(p => ({ ...p, status: opt.s }))}
                          style={{
                            padding: "7px 14px", borderRadius: "16px", fontSize: "12px",
                            fontWeight: active ? 600 : 400, cursor: "pointer", fontFamily: "inherit",
                            border: `1px solid ${active ? opt.c : T.line}`,
                            background: active ? opt.bg : "transparent",
                            color: active ? opt.c : T.mute,
                            transition: "all 0.15s",
                          }}>
                          {opt.s}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div style={{ background: "rgba(245,158,11,0.05)", border: `1px solid ${T.amber}33`, borderRadius: "7px", padding: "12px", marginBottom: "10px" }}>
                  <label style={{ ...lbl, fontWeight: 500, color: T.amber }}>📅 Deadline & reminder</label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div><label style={{ ...lbl, fontSize: "10px" }}>Deadline</label><input style={inp} type="date" value={newApp.deadline} onChange={e => setNewApp(p => ({ ...p, deadline: e.target.value }))} /></div>
                    <div><label style={{ ...lbl, fontSize: "10px" }}>Email reminder</label>
                      <select style={{ ...inp, opacity: newApp.deadline ? 1 : 0.5 }} disabled={!newApp.deadline}
                        value={newApp.reminder_days || ""}
                        onChange={e => setNewApp(p => ({ ...p, reminder_days: e.target.value ? parseInt(e.target.value) : null }))}>
                        <option value="">No reminder</option>
                        <option value="1">1 day before</option>
                        <option value="3">3 days before</option>
                        <option value="7">1 week before</option>
                        <option value="14">2 weeks before</option>
                      </select>
                    </div>
                  </div>
                  {newApp.deadline && newApp.reminder_days && (
                    <p style={{ margin: "8px 0 0", fontSize: "11px", color: T.amber }}>
                      ✓ We'll email <strong>{user.email}</strong> on <strong>{new Date(new Date(newApp.deadline).getTime() - newApp.reminder_days * 86400000).toLocaleDateString("en-GB", { day: "numeric", month: "long" })}</strong>
                    </p>
                  )}
                </div>

                <textarea style={{ ...inp, minHeight: "60px", resize: "vertical", marginBottom: "10px" }} placeholder="Notes..." value={newApp.notes} onChange={e => setNewApp(p => ({ ...p, notes: e.target.value }))} />

                <div style={{ display: "flex", gap: "8px" }}>
                  <button style={{ ...btnPrimary, flex: 1, padding: "10px", opacity: (!newApp.title || !newApp.company) ? 0.5 : 1 }}
                    disabled={!newApp.title || !newApp.company}
                    onClick={async () => { if (!newApp.title || !newApp.company) return; const r = await saveApplication(newApp); if (r) { resetAddForm(); setShowAddApp(false); } }}>
                    Save application
                  </button>
                  <button style={btnGhost} onClick={() => { resetAddForm(); setShowAddApp(false); }}>Cancel</button>
                </div>
              </div>
            )}

            {appsLoading ? (
              <div style={{ ...panelCard, textAlign: "center", padding: "2rem", color: T.mute }}>Loading applications...</div>
            ) : applications.length === 0 ? (
              <div style={{ ...panelCard, textAlign: "center", padding: "3rem 2rem" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "10px", background: T.accentBg, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: T.accent }}>
                  <Icon path={ICONS.clipboard} size={22} />
                </div>
                <p style={{ fontWeight: 500, margin: "0 0 6px", fontSize: "14px" }}>No applications tracked yet</p>
                <p style={{ color: T.mute, fontSize: "13px", marginBottom: "16px" }}>Add your first application to start tracking deadlines</p>
                <button onClick={() => setShowAddApp(true)} style={btnPrimary}>+ Add first application</button>
              </div>
            ) : (() => {
              // Filter applications by search + status
              const q = appSearch.toLowerCase().trim();
              const filteredApps = applications.filter(a => {
                const matchesStatus = appStatusFilter === "All" || a.status === appStatusFilter;
                const matchesSearch = !q || (
                  (a.title || "").toLowerCase().includes(q) ||
                  (a.company || "").toLowerCase().includes(q) ||
                  (a.location || "").toLowerCase().includes(q) ||
                  (a.notes || "").toLowerCase().includes(q)
                );
                return matchesStatus && matchesSearch;
              });

              if (filteredApps.length === 0) {
                return (
                  <div style={{ ...panelCard, textAlign: "center", padding: "2.5rem 2rem" }}>
                    <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: T.accentBg, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", color: T.accent }}>
                      <Icon path={ICONS.search} size={20} />
                    </div>
                    <p style={{ fontWeight: 500, margin: "0 0 6px", fontSize: "14px" }}>No matching applications</p>
                    <p style={{ color: T.mute, fontSize: "13px", marginBottom: "14px" }}>
                      {appSearch && appStatusFilter !== "All" ? `No results for "${appSearch}" in ${appStatusFilter}` :
                       appSearch ? `No applications match "${appSearch}"` :
                       `No applications with status "${appStatusFilter}"`}
                    </p>
                    <button onClick={() => { setAppSearch(""); setAppStatusFilter("All"); }} style={btnGhost}>Clear filters</button>
                  </div>
                );
              }

              return (
              <>
              {(appSearch || appStatusFilter !== "All") && (
                <p style={{ fontSize: "12px", color: T.mute, marginBottom: "10px" }}>
                  Showing <strong style={{ color: T.text }}>{filteredApps.length}</strong> of <strong style={{ color: T.text }}>{applications.length}</strong> applications
                </p>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px", borderRadius: "10px", border: `1px solid ${T.line}`, overflow: "hidden", background: T.surf }}>
                {filteredApps.map((a, idx) => {
                  const statusColor = a.status === "Want to apply" ? T.purple : a.status === "Applied" ? T.accent : a.status === "Interview" ? T.amber : a.status === "Offer" ? T.green : T.red;
                  const statusBg = a.status === "Want to apply" ? "rgba(167,139,250,0.12)" : a.status === "Applied" ? T.accentBg : a.status === "Interview" ? "rgba(245,158,11,0.12)" : a.status === "Offer" ? "rgba(34,197,94,0.12)" : "rgba(226,75,74,0.12)";
                  const isLast = idx === filteredApps.length - 1;
                  return (
                    <div key={a.id} style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "10px 14px",
                      borderBottom: isLast ? "none" : `1px solid ${T.line}`,
                      transition: "background 0.15s",
                      cursor: "default",
                    }}
                      onMouseEnter={e => { e.currentTarget.style.background = T.surf2; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>

                      {/* Status indicator pill (left) */}
                      <div style={{ width: "4px", height: "32px", background: statusColor, borderRadius: "2px", flexShrink: 0 }} />

                      {/* Title + company (main info, takes available space) */}
                      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "2px" }}>
                        <p style={{ fontWeight: 500, margin: 0, fontSize: "13px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.title}</p>
                        <p style={{ fontSize: "11px", color: T.mute, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {a.company}{a.location ? " · " + a.location : ""}
                        </p>
                      </div>

                      {/* Deadline (if exists) */}
                      {a.deadline && (
                        <div style={{ fontSize: "11px", color: T.amber, display: "flex", alignItems: "center", gap: "4px", flexShrink: 0, whiteSpace: "nowrap" }}>
                          <Icon path={ICONS.calendar} size={11} />
                          <span>{new Date(a.deadline).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
                        </div>
                      )}

                      {/* Status dropdown */}
                      <select value={a.status} onChange={e => updateApplicationStatus(a.id, e.target.value)}
                        style={{
                          fontSize: "11px",
                          padding: "5px 8px",
                          borderRadius: "999px",
                          border: `1px solid ${statusColor}`,
                          fontFamily: "inherit",
                          cursor: "pointer",
                          fontWeight: 500,
                          background: statusBg,
                          color: statusColor,
                          minWidth: "110px",
                          flexShrink: 0,
                        }}>
                        <option>Want to apply</option><option>Applied</option><option>Interview</option><option>Offer</option><option>Rejected</option>
                      </select>

                      {/* View link */}
                      {a.url ? (
                        <a href={a.url} target="_blank" rel="noopener noreferrer" style={{
                          padding: "5px 12px",
                          borderRadius: "6px",
                          background: T.accent,
                          color: "#fff",
                          fontSize: "11px",
                          textDecoration: "none",
                          fontWeight: 500,
                          flexShrink: 0,
                          whiteSpace: "nowrap",
                        }}>View ↗</a>
                      ) : (
                        <span style={{ width: "60px", flexShrink: 0 }} />
                      )}

                      {/* Delete button */}
                      <button onClick={() => deleteApplication(a.id)} title="Remove"
                        style={{
                          width: "26px",
                          height: "26px",
                          padding: 0,
                          borderRadius: "6px",
                          color: T.dim,
                          background: "transparent",
                          border: "none",
                          fontSize: "14px",
                          cursor: "pointer",
                          fontFamily: "inherit",
                          flexShrink: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "color 0.15s, background 0.15s",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.color = T.red; e.currentTarget.style.background = "rgba(226,75,74,0.1)"; }}
                        onMouseLeave={e => { e.currentTarget.style.color = T.dim; e.currentTarget.style.background = "transparent"; }}>×</button>
                    </div>
                  );
                })}
              </div>
              </>
              );
            })()}
          </div>
        )}

        {/* ═══════════════ PhD FINDER ═══════════════ */}
        {view === "phd" && (() => {
          // Apply live filters
          const phdFiltered = phds.filter(p => {
            if (phdCountry !== "all") {
              if (phdCountry === "uk" && p.country !== "UK") return false;
              if (phdCountry === "de" && p.country !== "Germany") return false;
              if (phdCountry === "other" && (p.country === "UK" || p.country === "Germany")) return false;
            }
            if (phdFunding === "funded" && !p.funded) return false;
            if (phdFunding === "unfunded" && p.funded) return false;
            if (phdSearch.trim()) {
              const q = phdSearch.toLowerCase();
              const hay = `${p.title} ${p.uni} ${p.department || ""} ${p.field || ""}`.toLowerCase();
              if (!hay.includes(q)) return false;
            }
            return true;
          });

          return (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
                <div>
                  <h1 style={{ fontSize: "24px", fontWeight: 500, margin: "0 0 4px", letterSpacing: "-0.01em" }}>PhD Finder</h1>
                  <p style={{ fontSize: "13px", color: T.mute, margin: 0 }}>
                    {phdsLoading ? "Loading latest PhD opportunities..." :
                     phds.length > 0 ? `${phdFiltered.length} of ${phds.length} PhD positions · Live from jobs.ac.uk` :
                     "Live PhD opportunities from UK universities"}
                  </p>
                </div>
                <button onClick={() => { setPhds([]); setPhdsLoading(false); setTimeout(() => setView("phd"), 10); }}
                  disabled={phdsLoading}
                  style={{ ...btnGhost, fontSize: "12px", padding: "7px 14px", opacity: phdsLoading ? 0.5 : 1 }}>
                  {phdsLoading ? "Loading..." : "↻ Refresh"}
                </button>
              </div>

              {/* Filters */}
              <div style={{ ...card, marginBottom: "14px", padding: "12px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "8px" }}>
                  <input style={{ ...inp, fontSize: "12px" }} placeholder="🔍 Search by field, topic, university..."
                    value={phdSearch} onChange={e => setPhdSearch(e.target.value)} />
                  <select style={{ ...inp, fontSize: "12px" }} value={phdCountry} onChange={e => setPhdCountry(e.target.value)}>
                    <option value="all">All countries</option>
                    <option value="uk">🇬🇧 UK only</option>
                    <option value="de">🇩🇪 Germany only</option>
                    <option value="other">Other</option>
                  </select>
                  <select style={{ ...inp, fontSize: "12px" }} value={phdFunding} onChange={e => setPhdFunding(e.target.value)}>
                    <option value="all">All funding</option>
                    <option value="funded">Funded only</option>
                    <option value="unfunded">Self-funded</option>
                  </select>
                </div>
              </div>

              {/* Loading */}
              {phdsLoading && (
                <div style={{ ...panelCard, textAlign: "center", padding: "3rem 2rem" }}>
                  <div style={{ width: "28px", height: "28px", border: `3px solid ${T.line}`, borderTopColor: T.accent, borderRadius: "50%", animation: "mgSpin 0.9s linear infinite", margin: "0 auto 14px" }} />
                  <p style={{ fontSize: "13px", color: T.mute, margin: 0 }}>Fetching latest PhD listings...</p>
                </div>
              )}

              {/* Error */}
              {phdsError && !phdsLoading && (
                <div style={{ ...panelCard, textAlign: "center", padding: "2rem", borderColor: T.red + "55" }}>
                  <p style={{ fontSize: "13px", color: T.red, margin: "0 0 10px" }}>⚠️ {phdsError}</p>
                  <button onClick={() => { setPhds([]); setTimeout(() => setView("phd"), 10); }} style={btnGhost}>Try again</button>
                </div>
              )}

              {/* Results */}
              {!phdsLoading && !phdsError && phdFiltered.length === 0 && phds.length > 0 && (
                <div style={{ ...panelCard, textAlign: "center", padding: "2rem" }}>
                  <p style={{ fontSize: "13px", color: T.mute, margin: "0 0 10px" }}>No matches for your filters.</p>
                  <button onClick={() => { setPhdSearch(""); setPhdCountry("all"); setPhdFunding("all"); }} style={btnGhost}>Clear filters</button>
                </div>
              )}

              {!phdsLoading && phdFiltered.length > 0 && (
                <div className="mg-phd-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px" }}>
                  {phdFiltered.map((p, i) => (
                    <div key={p.url || i} style={{ ...card, padding: "0", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                      <div style={{ padding: "12px 14px", flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px", marginBottom: "6px" }}>
                          <p style={{ fontWeight: 500, margin: 0, fontSize: "13px", lineHeight: 1.4 }}>{p.title}</p>
                          <span style={{ padding: "2px 8px", borderRadius: "12px", fontSize: "9px", fontWeight: 600, whiteSpace: "nowrap", flexShrink: 0,
                            background: p.funded ? "rgba(34,197,94,0.12)" : "rgba(245,158,11,0.12)",
                            color: p.funded ? T.green : T.amber }}>
                            {p.funded ? "✓ Funded" : "Self-funded"}
                          </span>
                        </div>
                        <p style={{ fontSize: "11px", color: T.mute, margin: "0 0 8px", lineHeight: 1.4 }}>
                          {p.uni}{p.department ? " · " + p.department : ""}
                        </p>
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center", fontSize: "10px" }}>
                          <span style={{ fontSize: "11px" }}>{p.country === "UK" ? "🇬🇧" : p.country === "Germany" ? "🇩🇪" : p.country === "USA" ? "🇺🇸" : p.country === "Netherlands" ? "🇳🇱" : p.country === "China" ? "🇨🇳" : p.country === "France" ? "🇫🇷" : "🌍"}</span>
                          {p.field && <span style={{ padding: "2px 7px", borderRadius: "10px", background: T.accentBg, color: T.accent, fontWeight: 500 }}>{p.field}</span>}
                          {p.stipend && p.stipend !== "Contact for details" && <span style={{ color: T.green, fontWeight: 500 }}>{p.stipend}</span>}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "6px", padding: "8px 14px", borderTop: `1px solid ${T.line}`, background: T.bg }}>
                        <a href={p.url} target="_blank" rel="noopener noreferrer"
                          style={{ flex: 1, padding: "6px 8px", borderRadius: "6px", background: T.accent, color: "#fff", fontSize: "11px", fontWeight: 500, textAlign: "center", textDecoration: "none" }}>
                          View ↗
                        </a>
                        <button onClick={async () => {
                          const r = await saveApplication({
                            title: p.title,
                            company: p.uni,
                            url: p.url,
                            type: "PhD",
                            status: "Want to apply",
                            notes: p.funded ? "Funded · " + p.stipend : ("Self-funded · " + (p.stipend || "")),
                            deadline: "",
                            location: p.country,
                            reminder_days: 7,
                          });
                          if (r) alert("Saved to Applications ✓");
                        }}
                          style={{ flex: 1, padding: "6px 8px", borderRadius: "6px", background: "transparent", color: T.text, border: `1px solid ${T.line2}`, fontSize: "11px", cursor: "pointer", fontFamily: "inherit" }}>
                          + Track
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ textAlign: "center", marginTop: "20px" }}>
                <p style={{ fontSize: "12px", color: T.mute, marginBottom: "10px" }}>
                  {phdCached ? "Results cached from the last fetch. Click Refresh for the latest." : "Want more PhD positions? Try these sites directly:"}
                </p>
                <div style={{ display: "flex", gap: "6px", justifyContent: "center", flexWrap: "wrap" }}>
                  {[["FindAPhD.com", "https://www.findaphd.com"], ["Academics.de (Germany)", "https://www.academics.de"], ["DAAD Portal", "https://www.daad.de/en/study-and-research-in-germany/phd-studies-and-research/"], ["jobs.ac.uk", "https://www.jobs.ac.uk/phd"]].map(([name, url]) => (
                    <a key={name} href={url} target="_blank" rel="noopener noreferrer"
                      style={{ padding: "6px 12px", borderRadius: "6px", border: `1px solid ${T.line}`, fontSize: "11px", color: T.accent, textDecoration: "none" }}>
                      {name} ↗
                    </a>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}

        {/* ═══════════════ SAVED JOBS ═══════════════ */}
        {view === "saved" && (
          <div>
            <div style={{ marginBottom: "20px" }}>
              <h1 style={{ fontSize: "24px", fontWeight: 500, margin: "0 0 4px", letterSpacing: "-0.01em" }}>Saved jobs</h1>
              <p style={{ fontSize: "13px", color: T.mute, margin: 0 }}>Jobs you've bookmarked to apply later</p>
            </div>
            {savedJobs.length === 0 ? (
              <div style={{ ...panelCard, textAlign: "center", padding: "3rem 2rem" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "10px", background: T.accentBg, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: T.accent }}>
                  <Icon path={ICONS.bookmark} size={22} />
                </div>
                <p style={{ fontWeight: 500, margin: "0 0 6px", fontSize: "14px" }}>No saved jobs yet</p>
                <p style={{ color: T.mute, fontSize: "13px", marginBottom: "16px" }}>Browse jobs and click the bookmark icon to save them here</p>
                <button onClick={() => setView("matches")} style={btnPrimary}>Browse jobs</button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {savedJobs.map((j, i) => (
                  <div key={i} style={{ ...card, display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" }}>
                    <div>
                      <p style={{ fontWeight: 500, margin: "0 0 2px", fontSize: "13px" }}>{j.title}</p>
                      <p style={{ fontSize: "12px", color: T.mute, margin: 0 }}>{j.company} · {j.location}</p>
                    </div>
                    <div style={{ display: "flex", gap: "6px" }}>
                      {j.url && <a href={j.url} target="_blank" rel="noopener noreferrer" style={{ padding: "6px 12px", borderRadius: "6px", background: T.accent, color: "#fff", fontSize: "11px", textDecoration: "none", fontWeight: 500 }}>Apply ↗</a>}
                      <button onClick={() => { const updated = savedJobs.filter((_, idx) => idx !== i); setSavedJobs(updated); localStorage.setItem("mg_saved_jobs", JSON.stringify(updated)); }}
                        style={{ padding: "6px 10px", borderRadius: "6px", background: "transparent", color: T.red, border: `1px solid ${T.line2}`, fontSize: "11px", cursor: "pointer", fontFamily: "inherit" }}>Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════ CV BUILDER ═══════════════ */}
        {view === "cvgen" && (
          <div>
            <div style={{ marginBottom: "20px" }}>
              <h1 style={{ fontSize: "24px", fontWeight: 500, margin: "0 0 4px", letterSpacing: "-0.01em" }}>CV Builder</h1>
              <p style={{ fontSize: "13px", color: T.mute, margin: 0 }}>Generate tailored CVs and cover letters for any job</p>
            </div>
            {!cvResult ? (
              <div style={{ ...panelCard, textAlign: "center", padding: "3rem 2rem" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "10px", background: "rgba(167,139,250,0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: T.purple }}>
                  <Icon path={ICONS.pen} size={22} />
                </div>
                <p style={{ fontWeight: 500, margin: "0 0 6px", fontSize: "14px" }}>Analyse your CV first</p>
                <p style={{ color: T.mute, fontSize: "13px", marginBottom: "16px", lineHeight: 1.6 }}>Upload your CV so we can help you tailor new versions for specific jobs in seconds.</p>
                <button onClick={() => setView("cv")} style={{ ...btnPrimary, background: T.purple }}>Go to CV Analysis →</button>
              </div>
            ) : (
              <CVBuilderInline cvText="" />
            )}
          </div>
        )}

        {/* ═══════════════ INTERVIEW PREP ═══════════════ */}
        {view === "interview" && (
          <div>
            <div style={{ marginBottom: "20px" }}>
              <h1 style={{ fontSize: "24px", fontWeight: 500, margin: "0 0 4px", letterSpacing: "-0.01em" }}>Interview Prep</h1>
              <p style={{ fontSize: "13px", color: T.mute, margin: 0 }}>Practice common interview questions for visa-sponsored roles</p>
            </div>
            <div style={{ ...panelCard, textAlign: "center", padding: "3rem 2rem" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "10px", background: "rgba(167,139,250,0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: T.purple }}>
                <Icon path={ICONS.mic} size={22} />
              </div>
              <p style={{ fontWeight: 500, margin: "0 0 6px", fontSize: "14px" }}>Coming soon</p>
              <p style={{ color: T.mute, fontSize: "13px", marginBottom: "16px", lineHeight: 1.6, maxWidth: "480px", margin: "0 auto 16px" }}>
                Mock interviews, STAR framework practice, and visa-specific question banks. We're building this now — want to be notified when it launches?
              </p>
              <button onClick={() => alert("We'll email you when it's ready!")} style={btnPrimary}>Notify me when ready</button>
            </div>
          </div>
        )}

        {/* ═══════════════ SETTINGS ═══════════════ */}
        {view === "security" && (
          <div>
            <div style={{ marginBottom: "20px" }}>
              <h1 style={{ fontSize: "24px", fontWeight: 500, margin: "0 0 4px", letterSpacing: "-0.01em" }}>Settings</h1>
              <p style={{ fontSize: "13px", color: T.mute, margin: 0 }}>Manage your account, password, and data preferences</p>
            </div>

            <div style={{ display: "grid", gap: "12px" }}>

              {/* ── APPEARANCE ── */}
              <div style={panelCard}>
                <h3 style={{ fontSize: "13px", margin: "0 0 4px", fontWeight: 500 }}>🎨 Appearance</h3>
                <p style={{ fontSize: "12px", color: T.mute, margin: "0 0 14px" }}>Customise your dashboard theme. Changes apply instantly.</p>

                {/* Mode toggle */}
                <div style={{ marginBottom: "16px" }}>
                  <div style={{ fontSize: "11px", color: T.mute, marginBottom: "8px", fontWeight: 500, letterSpacing: "0.04em" }}>Mode</div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    {[
                      { k: "dark",  label: "Dark",  icon: "🌙" },
                      { k: "light", label: "Light", icon: "☀️" },
                    ].map(m => (
                      <button key={m.k} onClick={() => setThemeMode(m.k)}
                        style={{
                          flex: 1, padding: "11px 14px", borderRadius: "8px",
                          border: `1.5px solid ${themeMode === m.k ? T.accent : T.line}`,
                          background: themeMode === m.k ? T.accentBg : "transparent",
                          color: themeMode === m.k ? T.accent : T.text,
                          fontSize: "13px", fontWeight: themeMode === m.k ? 500 : 400,
                          cursor: "pointer", fontFamily: "inherit",
                          display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                          transition: "all 0.15s",
                        }}>
                        <span style={{ fontSize: "15px" }}>{m.icon}</span> {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Accent color */}
                <div>
                  <div style={{ fontSize: "11px", color: T.mute, marginBottom: "8px", fontWeight: 500, letterSpacing: "0.04em" }}>Accent colour</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
                    {[
                      { k: "blue",   label: "Blue",   color: "#3B82F6" },
                      { k: "purple", label: "Purple", color: "#A78BFA" },
                      { k: "green",  label: "Green",  color: "#22C55E" },
                      { k: "coral",  label: "Coral",  color: "#F97866" },
                    ].map(a => (
                      <button key={a.k} onClick={() => setThemeAccent(a.k)}
                        style={{
                          padding: "10px 8px", borderRadius: "8px",
                          border: `1.5px solid ${themeAccent === a.k ? a.color : T.line}`,
                          background: themeAccent === a.k ? `${a.color}15` : "transparent",
                          color: T.text,
                          fontSize: "12px", fontWeight: themeAccent === a.k ? 500 : 400,
                          cursor: "pointer", fontFamily: "inherit",
                          display: "flex", flexDirection: "column", alignItems: "center", gap: "6px",
                          transition: "all 0.15s",
                        }}>
                        <span style={{ width: "22px", height: "22px", borderRadius: "50%", background: a.color, display: "block", boxShadow: themeAccent === a.k ? `0 0 0 3px ${T.bg}, 0 0 0 4px ${a.color}` : "none", transition: "box-shadow 0.15s" }} />
                        <span>{a.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preview */}
                <div style={{ marginTop: "16px", padding: "12px 14px", background: T.bg, borderRadius: "8px", border: `1px solid ${T.line}`, display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "11px", color: T.dim, textTransform: "uppercase", letterSpacing: "0.08em" }}>Preview:</span>
                  <button style={{ padding: "6px 14px", background: T.accent, color: "#fff", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: 500, fontFamily: "inherit" }}>Primary button</button>
                  <span style={{ padding: "3px 10px", borderRadius: "14px", fontSize: "11px", fontWeight: 500, background: T.accentBg, color: T.accent }}>Tag style</span>
                  <span style={{ fontSize: "11px", color: T.mute }}>Currently: {themeMode} + {themeAccent}</span>
                </div>
              </div>

              <div style={panelCard}>
                <h3 style={{ fontSize: "13px", margin: "0 0 12px", fontWeight: 500 }}>Account information</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {[["Email", user.email], ["Verified", "✓ Verified"], ["Created", new Date(user.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })]].map(([l, v]) => (
                    <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "9px 12px", background: T.bg, borderRadius: "7px", border: `1px solid ${T.line}` }}>
                      <span style={{ fontSize: "12px", color: T.mute }}>{l}</span>
                      <span style={{ fontSize: "12px", fontWeight: 500, color: l === "Verified" ? T.green : T.text }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={panelCard}>
                <h3 style={{ fontSize: "13px", margin: "0 0 12px", fontWeight: 500 }}>Change password</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {passMsg.text && <div style={{ padding: "9px 12px", borderRadius: "7px", fontSize: "12px", background: passMsg.type === "ok" ? "rgba(34,197,94,0.1)" : "rgba(226,75,74,0.1)", color: passMsg.type === "ok" ? T.green : T.red }}>{passMsg.text}</div>}
                  <div><label style={lbl}>New password</label><input style={inp} type="password" placeholder="At least 8 characters" value={newPass} onChange={e => setNewPass(e.target.value)} /></div>
                  <div><label style={lbl}>Confirm new password</label><input style={inp} type="password" placeholder="Repeat new password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} /></div>
                  <button style={{ ...btnPrimary, opacity: passLoading ? 0.7 : 1 }} onClick={changePassword} disabled={passLoading}>{passLoading ? "Updating..." : "Update password"}</button>
                </div>
              </div>

              <div style={panelCard}>
                <h3 style={{ fontSize: "13px", margin: "0 0 6px", fontWeight: 500 }}>Your data & privacy</h3>
                <p style={{ fontSize: "12px", color: T.mute, margin: "0 0 12px", lineHeight: 1.6 }}>Under UK GDPR you have rights over your personal data. Contact <strong style={{ color: T.text }}>info@mentorgramai.com</strong>.</p>
                <a href="mailto:info@mentorgramai.com?subject=Data Request" style={{ ...btnGhost, textDecoration: "none", display: "inline-block", fontSize: "12px", padding: "7px 14px" }}>Request my data</a>
              </div>

              <div style={{ ...panelCard, borderColor: T.red + "55" }}>
                <h3 style={{ fontSize: "13px", margin: "0 0 8px", fontWeight: 500, color: T.red }}>⚠️ Delete account</h3>
                {!deleteOpen ? (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                    <p style={{ fontSize: "12px", color: T.mute, margin: 0 }}>Permanently delete your account and all data. Cannot be undone.</p>
                    <button onClick={() => setDeleteOpen(true)} style={{ ...btnGhost, color: T.red, borderColor: T.red + "55", fontSize: "12px", padding: "7px 14px" }}>Delete account</button>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <p style={{ fontSize: "12px", color: T.mute, margin: 0 }}>Type <strong style={{ color: T.text }}>delete</strong> to confirm.</p>
                    <input style={{ ...inp, borderColor: T.red }} placeholder='Type "delete"' value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)} />
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button onClick={() => { setDeleteOpen(false); setDeleteConfirm(""); }} style={{ ...btnGhost, flex: 1 }}>Cancel</button>
                      <button onClick={deleteAccount} disabled={deleteLoading || deleteConfirm.toLowerCase() !== "delete"}
                        style={{ ...btnPrimary, flex: 1, background: T.red, opacity: deleteConfirm.toLowerCase() === "delete" ? 1 : 0.4 }}>
                        {deleteLoading ? "Deleting..." : "Permanently delete"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// HELPER COMPONENTS
// ═════════════════════════════════════════════════════════════════
function ProfileSection({ num, done, title, meta, children, T }) {
  return (
    <div className="mg-fade" style={{ animationDelay: `${num * 0.05}s` }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
        <div style={{ width: "22px", height: "22px", borderRadius: "50%", border: `1px solid ${done ? T.green : T.line2}`, background: done ? T.green : "transparent", color: done ? "#000" : T.mute, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 500 }}>
          {done ? "✓" : num}
        </div>
        <div style={{ fontSize: "13px", fontWeight: 500 }}>{title}</div>
        {meta && <div style={{ fontSize: "11px", color: T.dim, marginLeft: "auto" }}>{meta}</div>}
      </div>
      {children}
    </div>
  );
}

function timeSince(date) {
  const s = Math.floor((new Date() - date) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24); if (d < 7) return `${d}d ago`;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
