import { useState, useEffect } from "react";

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

export default function Dashboard({ user, onLogout, allJobs, onFilterByProfile, onNavigate }) {
  const [tab, setTab] = useState("overview");
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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
    if (deleteConfirm.toLowerCase() !== "delete") { return; }
    setDeleteLoading(true);
    try {
      await supaFetch(`/profiles?user_id=eq.${user.id}`, { method: "DELETE" });
      const res = await fetch("/api/delete-account", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ user_id: user.id, token: getToken() }) });
      if (!res.ok) throw new Error("Deletion failed");
      localStorage.removeItem("mg_session"); localStorage.removeItem("mg_user");
      onLogout();
    } catch (e) { alert(e.message); setDeleteLoading(false); }
  }

  // Matched jobs
  const matchedJobs = allJobs.filter(j => {
    const sm = sectors.length === 0 || sectors.includes(j.sector);
    const lm = !location || j.location?.toLowerCase().includes(location.toLowerCase());
    const vm = visaStatus !== "I need visa sponsorship" || j.sponsorship === true;
    return sm && lm && vm;
  });

  const initials = fullName ? fullName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : (user.email || "?")[0].toUpperCase();
  const tabs = [
    { id: "overview", label: "Overview", icon: "🏠" },
    { id: "profile", label: "My Profile", icon: "👤" },
    { id: "matches", label: `Job Matches`, icon: "🎯", count: matchedJobs.length },
    { id: "security", label: "Security", icon: "🔒" },
  ];

  if (loading) return (
    <div style={{ textAlign: "center", padding: "4rem" }}>
      <div style={{ fontSize: "2rem", marginBottom: "1rem", animation: "pulse 1.5s ease infinite" }}>⏳</div>
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
            {jobTitle && <p style={{ color: "#1A3FA8", fontSize: "13px", margin: "3px 0 0", fontWeight: 500 }}>{jobTitle}</p>}
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
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
            {t.count != null && <span style={{ background: tab === t.id ? "rgba(255,255,255,0.25)" : "#1A3FA8", color: tab === t.id ? "#fff" : "#fff", padding: "1px 7px", borderRadius: "10px", fontSize: "11px", fontWeight: 600 }}>{t.count}</span>}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === "overview" && (
        <div style={{ display: "grid", gap: "1rem" }}>
          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem" }}>
            {[
              { icon: "🎯", label: "Job Matches", value: matchedJobs.length, color: "#1A3FA8" },
              { icon: "🏢", label: "Sectors Selected", value: sectors.length || "None", color: "#FF4500" },
              { icon: "📍", label: "Preferred Location", value: location || "Not set", color: "#F59E0B" },
              { icon: "🛂", label: "Visa Status", value: visaStatus ? "Set" : "Not set", color: "#8B5CF6" },
            ].map(s => (
              <div key={s.label} style={{ ...card, textAlign: "center" }}>
                <div style={{ fontSize: "24px", marginBottom: "6px" }}>{s.icon}</div>
                <p style={{ fontSize: "22px", fontWeight: 600, margin: "0 0 3px", color: s.color }}>{s.value}</p>
                <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", margin: 0 }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <div style={card}>
            <h3 style={{ fontSize: "1rem", fontWeight: 500, margin: "0 0 1rem" }}>Quick actions</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px" }}>
              {[
                { icon: "👤", title: "Complete your profile", desc: "Add experience and skills to get better matches", action: () => setTab("profile") },
                { icon: "🎯", title: "View job matches", desc: `${matchedJobs.length} jobs match your profile`, action: () => setTab("matches") },
                { icon: "💬", title: "Ask AI Mentor", desc: "Get personalised career guidance", action: () => onNavigate("AI Mentor") },
                { icon: "🔍", title: "Browse all jobs", desc: "Search UK sponsorship jobs", action: () => onNavigate("Sponsorship Jobs") },
              ].map(a => (
                <button key={a.title} onClick={a.action} style={{ ...card, border: "0.5px solid var(--color-border-tertiary)", textAlign: "left", cursor: "pointer", background: "var(--color-background-secondary)", transition: "all 0.15s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(26,63,168,0.4)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--color-border-tertiary)"; e.currentTarget.style.transform = "none"; }}>
                  <div style={{ fontSize: "20px", marginBottom: "6px" }}>{a.icon}</div>
                  <p style={{ fontWeight: 500, fontSize: "14px", margin: "0 0 3px" }}>{a.title}</p>
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
                      <p style={{ fontWeight: 500, fontSize: "14px", margin: "0 0 2px", color: "#1A3FA8" }}>{j.title}</p>
                      <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", margin: 0 }}>{j.company} · {j.location}</p>
                    </div>
                    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                      {j.sponsorship && <span style={{ padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: 500, background: "#FFF0E8", color: "#AA2800" }}>✓ Visa</span>}
                      <span style={{ fontSize: "13px", fontWeight: 500, color: "#0D2478" }}>{j.salary}</span>
                      {j.url && <a href={j.url} target="_blank" rel="noopener noreferrer" style={{ padding: "5px 12px", borderRadius: "var(--border-radius-md)", background: "#1A3FA8", color: "#fff", fontSize: "12px", textDecoration: "none", fontWeight: 500 }}>Apply ↗</a>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── PROFILE ── */}
      {tab === "profile" && (
        <div style={{ display: "grid", gap: "1rem" }}>
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

          <button style={{ ...btn(true), padding: "13px", fontSize: "15px", opacity: saving ? 0.7 : 1, background: saved ? "#FF4500" : "#1A3FA8" }} onClick={saveProfile} disabled={saving}>
            {saving ? "Saving..." : saved ? "✓ Profile saved!" : "Save profile"}
          </button>
        </div>
      )}

      {/* ── MATCHES ── */}
      {tab === "matches" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "10px" }}>
            <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", margin: 0 }}>
              <strong>{matchedJobs.length} jobs</strong> match your profile
              {sectors.length > 0 && ` in ${sectors.slice(0, 2).join(", ")}${sectors.length > 2 ? "..." : ""}`}
              {location && ` near ${location}`}
            </p>
            <button style={{ ...btn(true), padding: "8px 16px", fontSize: "13px" }}
              onClick={() => { onFilterByProfile({ sectors, location, visaStatus }); onNavigate("Sponsorship Jobs"); }}>
              View on jobs board ↗
            </button>
          </div>
          {matchedJobs.length === 0 ? (
            <div style={{ ...card, textAlign: "center", padding: "3rem" }}>
              <p style={{ fontSize: "2rem", margin: "0 0 1rem" }}>🔍</p>
              <p style={{ fontWeight: 500 }}>No matches yet</p>
              <p style={{ color: "var(--color-text-secondary)", fontSize: "14px", marginBottom: "1.25rem" }}>Update your profile with sectors and location</p>
              <button style={{ ...btn(false), display: "inline-block", padding: "9px 20px" }} onClick={() => setTab("profile")}>Update profile</button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1rem" }}>
              {matchedJobs.slice(0, 20).map((j, i) => (
                <div key={i} style={{ ...card, display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div><p style={{ fontWeight: 500, margin: "0 0 3px", fontSize: "15px", color: "#1A3FA8" }}>{j.title}</p><p style={{ color: "var(--color-text-secondary)", fontSize: "13px", margin: 0 }}>{j.company}</p></div>
                    {j.sponsorship && <span style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 500, background: "#FFF0E8", color: "#AA2800", whiteSpace: "nowrap" }}>✓ Visa</span>}
                  </div>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    <span style={{ padding: "2px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: 500, background: "#E8EDFC", color: "#0D2478" }}>{j.sector}</span>
                    <span style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>📍 {j.location}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <p style={{ fontWeight: 500, color: "#0D2478", margin: 0, fontSize: "14px" }}>{j.salary}</p>
                    {j.url && <a href={j.url} target="_blank" rel="noopener noreferrer" style={{ padding: "6px 14px", borderRadius: "var(--border-radius-md)", background: "#1A3FA8", color: "#fff", fontSize: "13px", textDecoration: "none", fontWeight: 500 }}>Apply ↗</a>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── SECURITY ── */}
      {tab === "security" && (
        <div style={{ display: "grid", gap: "1rem" }}>
          {/* Account info */}
          <div style={card}>
            <h3 style={{ fontSize: "1rem", fontWeight: 500, margin: "0 0 1rem" }}>📧 Account Information</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)" }}>
                <span style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>Email address</span>
                <span style={{ fontSize: "13px", fontWeight: 500 }}>{user.email}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)" }}>
                <span style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>Email verified</span>
                <span style={{ fontSize: "13px", fontWeight: 500, color: "#FF4500" }}>✓ Verified</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)" }}>
                <span style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>Account created</span>
                <span style={{ fontSize: "13px", fontWeight: 500 }}>{new Date(user.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</span>
              </div>
            </div>
          </div>

          {/* Change password */}
          <div style={card}>
            <h3 style={{ fontSize: "1rem", fontWeight: 500, margin: "0 0 1rem" }}>🔑 Change Password</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {passMsg.text && <div style={{ padding: "10px 14px", borderRadius: "var(--border-radius-md)", fontSize: "13px", background: passMsg.type === "ok" ? "#FFF0E8" : "#FEE8E8", color: passMsg.type === "ok" ? "#AA2800" : "#9B1C1C", border: `0.5px solid ${passMsg.type === "ok" ? "#FF8C5A" : "#F5A0A0"}` }}>{passMsg.text}</div>}
              <div><label style={{ fontSize: "12px", color: "var(--color-text-secondary)", display: "block", marginBottom: "5px" }}>New password</label><input style={inp} type="password" placeholder="At least 8 characters" value={newPass} onChange={e => setNewPass(e.target.value)} /></div>
              <div><label style={{ fontSize: "12px", color: "var(--color-text-secondary)", display: "block", marginBottom: "5px" }}>Confirm new password</label><input style={inp} type="password" placeholder="Repeat new password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} /></div>
              <button style={{ ...btn(true), opacity: passLoading ? 0.7 : 1 }} onClick={changePassword} disabled={passLoading}>
                {passLoading ? "Updating..." : "Update password"}
              </button>
            </div>
          </div>

          {/* Data & Privacy */}
          <div style={card}>
            <h3 style={{ fontSize: "1rem", fontWeight: 500, margin: "0 0 0.5rem" }}>🔒 Your Data & Privacy</h3>
            <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", margin: "0 0 1rem", lineHeight: 1.6 }}>
              Under UK GDPR you have rights over your personal data. To request a copy of your data or ask any privacy questions, contact us at <strong>info@mentorgramai.com</strong>.
            </p>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <a href="mailto:info@mentorgramai.com?subject=Data Request" style={{ ...btn(false), textDecoration: "none", display: "inline-block", fontSize: "13px", padding: "8px 16px" }}>Request my data</a>
            </div>
          </div>

          {/* Danger zone */}
          <div style={{ border: "0.5px solid rgba(226,75,74,0.3)", borderRadius: "var(--border-radius-lg)", padding: "1.5rem" }}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 500, margin: "0 0 0.5rem", color: "#E24B4A" }}>⚠️ Delete Account</h3>
            {!deleteOpen ? (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", margin: 0 }}>Permanently delete your account and all data. This cannot be undone and fulfils your right to erasure under UK GDPR.</p>
                <button onClick={() => setDeleteOpen(true)} style={{ ...btn(false), fontSize: "13px", padding: "8px 16px", color: "#E24B4A", borderColor: "rgba(226,75,74,0.5)", whiteSpace: "nowrap" }}>Delete account</button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", margin: 0 }}>Type <strong>delete</strong> to confirm permanent deletion of your account and all associated data.</p>
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
