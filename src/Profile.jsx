import { useState, useEffect } from "react";
import { ConsentCheckbox } from "./Legal.jsx";

// ─── Supabase helpers ──────────────────────────────────────────────────────
const SUPA_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPA_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

async function supaFetch(path, opts = {}) {
  const res = await fetch(`${SUPA_URL}/rest/v1${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      apikey: SUPA_KEY,
      Authorization: `Bearer ${getToken() || SUPA_KEY}`,
      Prefer: "return=representation",
      ...(opts.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error_description || "Request failed");
  }
  return res.status === 204 ? null : res.json();
}

async function supaAuth(endpoint, body) {
  const res = await fetch(`${SUPA_URL}/auth/v1/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: SUPA_KEY },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || data.msg || "Auth failed");
  return data;
}

function getToken() { try { return JSON.parse(localStorage.getItem("mg_session") || "{}").access_token; } catch { return null; } }
function getUser() { try { return JSON.parse(localStorage.getItem("mg_user") || "null"); } catch { return null; } }
function saveSession(session, user) {
  localStorage.setItem("mg_session", JSON.stringify(session));
  localStorage.setItem("mg_user", JSON.stringify(user));
}
function clearSession() {
  localStorage.removeItem("mg_session");
  localStorage.removeItem("mg_user");
}

// ─── Style helpers ─────────────────────────────────────────────────────────
const btn = (primary) => ({
  padding: "11px 24px", borderRadius: "var(--border-radius-md)",
  background: primary ? "#534AB7" : "transparent",
  color: primary ? "#fff" : "var(--color-text-primary)",
  border: primary ? "none" : "0.5px solid var(--color-border-secondary)",
  fontSize: "14px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
  width: "100%", transition: "opacity 0.15s",
});
const inp = {
  padding: "10px 14px", borderRadius: "var(--border-radius-md)",
  border: "0.5px solid var(--color-border-secondary)",
  background: "var(--color-background-secondary)",
  color: "var(--color-text-primary)", fontSize: "14px",
  outline: "none", fontFamily: "inherit", width: "100%", boxSizing: "border-box",
};
const card = {
  background: "var(--color-background-primary)",
  border: "0.5px solid var(--color-border-tertiary)",
  borderRadius: "var(--border-radius-lg)", padding: "1.5rem",
};
const tag = (active) => ({
  padding: "6px 14px", borderRadius: "20px", fontSize: "13px",
  fontWeight: active ? 500 : 400, cursor: "pointer", fontFamily: "inherit",
  border: active ? "none" : "0.5px solid var(--color-border-secondary)",
  background: active ? "#534AB7" : "var(--color-background-primary)",
  color: active ? "#fff" : "var(--color-text-secondary)",
  transition: "all 0.15s",
});

const SECTORS = ["Technology", "AI & Data", "Healthcare", "Finance", "Engineering", "Business", "Education", "Hospitality", "Public Sector"];
const EXPERIENCE_LEVELS = ["Student", "Graduate (0–1 yr)", "Junior (1–3 yrs)", "Mid-level (3–5 yrs)", "Senior (5–10 yrs)", "Lead / Manager (10+ yrs)"];
const SALARY_RANGES = ["Any", "£20,000+", "£30,000+", "£40,000+", "£50,000+", "£60,000+", "£80,000+"];
const VISA_OPTIONS = ["I need visa sponsorship", "I have the right to work in the UK", "Either is fine"];

// ─── Auth Page ─────────────────────────────────────────────────────────────
export function AuthPage({ onLogin }) {
  const [mode, setMode] = useState("login"); // login | signup | forgot
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit() {
    if (!email || (!password && mode !== "forgot")) { setError("Please fill in all fields"); return; }
    if (mode === "signup" && !consent) { setError("Please accept the Terms & Conditions and Privacy Policy to continue"); return; }
    setLoading(true); setError(""); setSuccess("");
    try {
      if (mode === "signup") {
        const data = await supaAuth("signup", { email, password, data: { full_name: name } });
        if (data.user && !data.session) {
          setSuccess("Check your email to verify your account, then log in!");
          setMode("login");
        } else if (data.session) {
          saveSession(data.session, data.user);
          onLogin(data.user);
        }
      } else if (mode === "login") {
        const data = await supaAuth("token?grant_type=password", { email, password });
        saveSession(data, data.user);
        onLogin(data.user);
      } else if (mode === "forgot") {
        await supaAuth("recover", { email });
        setSuccess("Password reset email sent! Check your inbox.");
      }
    } catch (e) { setError(e.message); }
    setLoading(false);
  }

  return (
    <div style={{ maxWidth: "420px", margin: "4rem auto", padding: "0 1.5rem" }}>
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <div style={{ width: "52px", height: "52px", borderRadius: "14px", background: "linear-gradient(135deg,#534AB7,#1D9E75)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 600, fontSize: "22px", margin: "0 auto 1rem" }}>M</div>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 500, margin: "0 0 0.4rem" }}>
          {mode === "login" ? "Welcome back" : mode === "signup" ? "Create your account" : "Reset password"}
        </h1>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "14px", margin: 0 }}>
          {mode === "login" ? "Sign in to access your personalised job matches" : mode === "signup" ? "Get personalised UK job recommendations" : "We'll send you a reset link"}
        </p>
      </div>

      <div style={card}>
        {success && <div style={{ background: "#E1F5EE", border: "0.5px solid #5DCAA5", borderRadius: "var(--border-radius-md)", padding: "10px 14px", marginBottom: "1rem", fontSize: "14px", color: "#085041" }}>{success}</div>}
        {error && <div style={{ background: "#FEE8E8", border: "0.5px solid #F5A0A0", borderRadius: "var(--border-radius-md)", padding: "10px 14px", marginBottom: "1rem", fontSize: "14px", color: "#9B1C1C" }}>{error}</div>}

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {mode === "signup" && (
            <input style={inp} placeholder="Full name" value={name} onChange={e => setName(e.target.value)} />
          )}
          <input style={inp} type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSubmit()} />
          {mode !== "forgot" && (
            <input style={inp} type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSubmit()} />
          )}
          {mode === "signup" && (
            <ConsentCheckbox
              checked={consent}
              onChange={setConsent}
              onViewPrivacy={() => window.open("#privacy-policy", "_blank")}
              onViewTerms={() => window.open("#terms", "_blank")}
            />
          )}
          <button style={{ ...btn(true), opacity: loading ? 0.7 : 1, marginTop: "4px" }} onClick={handleSubmit} disabled={loading}>
            {loading ? "Please wait..." : mode === "login" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"}
          </button>
        </div>

        <div style={{ borderTop: "0.5px solid var(--color-border-tertiary)", marginTop: "1.25rem", paddingTop: "1.25rem", display: "flex", flexDirection: "column", gap: "8px", textAlign: "center", fontSize: "13px", color: "var(--color-text-secondary)" }}>
          {mode === "login" && (<>
            <span>Don't have an account? <button onClick={() => { setMode("signup"); setError(""); }} style={{ background: "none", border: "none", color: "#534AB7", cursor: "pointer", fontFamily: "inherit", fontSize: "13px", fontWeight: 500 }}>Sign up free</button></span>
            <button onClick={() => { setMode("forgot"); setError(""); }} style={{ background: "none", border: "none", color: "var(--color-text-secondary)", cursor: "pointer", fontFamily: "inherit", fontSize: "13px" }}>Forgot password?</button>
          </>)}
          {mode === "signup" && <span>Already have an account? <button onClick={() => { setMode("login"); setError(""); }} style={{ background: "none", border: "none", color: "#534AB7", cursor: "pointer", fontFamily: "inherit", fontSize: "13px", fontWeight: 500 }}>Sign in</button></span>}
          {mode === "forgot" && <button onClick={() => { setMode("login"); setError(""); }} style={{ background: "none", border: "none", color: "#534AB7", cursor: "pointer", fontFamily: "inherit", fontSize: "13px" }}>← Back to sign in</button>}
        </div>
      </div>
    </div>
  );
}

// ─── Profile Page ──────────────────────────────────────────────────────────
export function ProfilePage({ user, onLogout, onFilterByProfile, allJobs, onNavigate }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState("profile"); // profile | matches

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

  useEffect(() => { loadProfile(); }, [user]);

  async function loadProfile() {
    setLoading(true);
    try {
      const data = await supaFetch(`/profiles?user_id=eq.${user.id}&select=*`);
      if (data && data.length > 0) {
        const p = data[0];
        setProfile(p);
        setFullName(p.full_name || user.user_metadata?.full_name || "");
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
    } catch (e) { console.log("Profile load:", e.message); }
    setLoading(false);
  }

  async function saveProfile() {
    setSaving(true);
    const data = {
      user_id: user.id,
      full_name: fullName,
      job_title: jobTitle,
      sectors,
      experience_level: experience,
      min_salary: salary,
      preferred_location: location,
      visa_status: visaStatus,
      skills,
      bio,
      updated_at: new Date().toISOString(),
    };
    try {
      if (profile) {
        await supaFetch(`/profiles?user_id=eq.${user.id}`, { method: "PATCH", body: JSON.stringify(data) });
      } else {
        await supaFetch("/profiles", { method: "POST", body: JSON.stringify(data) });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      setProfile(data);
    } catch (e) { alert("Save failed: " + e.message); }
    setSaving(false);
  }

  // Match jobs based on profile
  const matchedJobs = allJobs.filter(j => {
    const sectorMatch = sectors.length === 0 || sectors.includes(j.sector);
    const locationMatch = !location || j.location?.toLowerCase().includes(location.toLowerCase());
    const visaMatch = visaStatus !== "I need visa sponsorship" || j.sponsorship === true;
    return sectorMatch && locationMatch && visaMatch;
  });

  const initials = fullName ? fullName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0,2) : user.email[0].toUpperCase();

  if (loading) return (
    <div style={{ textAlign: "center", padding: "4rem", color: "var(--color-text-secondary)" }}>
      <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>⏳</div>
      <p>Loading your profile...</p>
    </div>
  );

  return (
    <div style={{ maxWidth: "860px", margin: "0 auto", padding: "2rem 1.5rem" }}>

      {/* Header */}
      <div style={{ ...card, marginBottom: "1.5rem", background: "linear-gradient(135deg, rgba(83,74,183,0.08), rgba(29,158,117,0.05))" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
          <div style={{ width: "60px", height: "60px", borderRadius: "50%", background: "linear-gradient(135deg,#534AB7,#1D9E75)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 600, fontSize: "22px", flexShrink: 0 }}>{initials}</div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 500, margin: "0 0 4px" }}>{fullName || "Your Profile"}</h2>
            <p style={{ color: "var(--color-text-secondary)", fontSize: "14px", margin: 0 }}>{user.email}</p>
            {jobTitle && <p style={{ color: "#534AB7", fontSize: "13px", margin: "4px 0 0", fontWeight: 500 }}>{jobTitle}</p>}
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button style={{ ...btn(false), width: "auto", padding: "8px 16px", fontSize: "13px" }} onClick={() => { onFilterByProfile({ sectors, location, visaStatus, experience, salary }); onNavigate("Sponsorship Jobs"); }}>
              🎯 Show my job matches
            </button>
            <button style={{ ...btn(false), width: "auto", padding: "8px 16px", fontSize: "13px", color: "#E24B4A", borderColor: "#E24B4A" }} onClick={() => { clearSession(); onLogout(); }}>
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "1.5rem", background: "var(--color-background-primary)", padding: "4px", borderRadius: "var(--border-radius-md)", border: "0.5px solid var(--color-border-tertiary)", width: "fit-content" }}>
        {[["profile","👤 My Profile"], ["matches", `🎯 My Matches (${matchedJobs.length})`]].map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: "8px 18px", borderRadius: "var(--border-radius-md)", border: "none", background: tab === t ? "#534AB7" : "transparent", color: tab === t ? "#fff" : "var(--color-text-secondary)", fontSize: "13px", fontWeight: tab === t ? 500 : 400, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}>{label}</button>
        ))}
      </div>

      {tab === "profile" && (
        <div style={{ display: "grid", gap: "1rem" }}>

          {/* Basic Info */}
          <div style={card}>
            <h3 style={{ fontSize: "1rem", fontWeight: 500, margin: "0 0 1rem", color: "var(--color-text-primary)" }}>👤 Basic Information</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "12px", color: "var(--color-text-secondary)", display: "block", marginBottom: "6px" }}>Full Name</label>
                <input style={inp} placeholder="Your full name" value={fullName} onChange={e => setFullName(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: "12px", color: "var(--color-text-secondary)", display: "block", marginBottom: "6px" }}>Current / Target Job Title</label>
                <input style={inp} placeholder="e.g. Software Engineer" value={jobTitle} onChange={e => setJobTitle(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: "12px", color: "var(--color-text-secondary)", display: "block", marginBottom: "6px" }}>Preferred Location</label>
                <input style={inp} placeholder="e.g. London, Manchester" value={location} onChange={e => setLocation(e.target.value)} />
              </div>
            </div>
            <div style={{ marginTop: "12px" }}>
              <label style={{ fontSize: "12px", color: "var(--color-text-secondary)", display: "block", marginBottom: "6px" }}>About Me</label>
              <textarea style={{ ...inp, height: "80px", resize: "vertical" }} placeholder="Brief background about yourself..." value={bio} onChange={e => setBio(e.target.value)} />
            </div>
          </div>

          {/* Experience */}
          <div style={card}>
            <h3 style={{ fontSize: "1rem", fontWeight: 500, margin: "0 0 1rem" }}>💼 Experience Level</h3>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {EXPERIENCE_LEVELS.map(lvl => (
                <button key={lvl} style={tag(experience === lvl)} onClick={() => setExperience(experience === lvl ? "" : lvl)}>{lvl}</button>
              ))}
            </div>
          </div>

          {/* Sectors */}
          <div style={card}>
            <h3 style={{ fontSize: "1rem", fontWeight: 500, margin: "0 0 0.5rem" }}>🏢 Preferred Sectors</h3>
            <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", margin: "0 0 1rem" }}>Select all sectors you're interested in — we'll filter jobs accordingly</p>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {SECTORS.map(s => (
                <button key={s} style={tag(sectors.includes(s))} onClick={() => setSectors(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])}>{s}</button>
              ))}
            </div>
          </div>

          {/* Skills */}
          <div style={card}>
            <h3 style={{ fontSize: "1rem", fontWeight: 500, margin: "0 0 0.5rem" }}>⚡ Skills & Keywords</h3>
            <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", margin: "0 0 1rem" }}>Add skills or keywords to match against job titles</p>
            <input style={inp} placeholder="e.g. Python, React, Project Management, NHS, IELTS 7.0" value={skills} onChange={e => setSkills(e.target.value)} />
          </div>

          {/* Salary & Visa */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
            <div style={card}>
              <h3 style={{ fontSize: "1rem", fontWeight: 500, margin: "0 0 1rem" }}>💰 Minimum Salary</h3>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {SALARY_RANGES.map(s => (
                  <button key={s} style={tag(salary === s)} onClick={() => setSalary(s)}>{s}</button>
                ))}
              </div>
            </div>
            <div style={card}>
              <h3 style={{ fontSize: "1rem", fontWeight: 500, margin: "0 0 1rem" }}>🛂 Visa Status</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {VISA_OPTIONS.map(v => (
                  <button key={v} style={{ ...tag(visaStatus === v), textAlign: "left", borderRadius: "var(--border-radius-md)" }} onClick={() => setVisaStatus(v)}>{v}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Save */}
          <button style={{ ...btn(true), padding: "13px", fontSize: "15px", opacity: saving ? 0.7 : 1, background: saved ? "#1D9E75" : "#534AB7" }} onClick={saveProfile} disabled={saving}>
            {saving ? "Saving..." : saved ? "✓ Profile saved!" : "Save profile"}
          </button>

          {/* Danger zone */}
          <DeleteAccountSection user={user} onDeleted={() => { clearSession(); onLogout(); }} />
        </div>
      )}

      {tab === "matches" && (
        <div>
          {matchedJobs.length === 0 ? (
            <div style={{ ...card, textAlign: "center", padding: "3rem" }}>
              <p style={{ fontSize: "2rem", margin: "0 0 1rem" }}>🔍</p>
              <p style={{ fontWeight: 500, marginBottom: "0.5rem" }}>No matches yet</p>
              <p style={{ color: "var(--color-text-secondary)", fontSize: "14px", marginBottom: "1.25rem" }}>Update your profile with sectors, location and visa status to see matching jobs</p>
              <button style={{ ...btn(false), width: "auto", padding: "9px 20px" }} onClick={() => setTab("profile")}>Update my profile</button>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1rem" }}>
                <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", margin: 0 }}>
                  Found <strong>{matchedJobs.length} jobs</strong> matching your profile
                  {sectors.length > 0 && ` in ${sectors.join(", ")}`}
                  {location && ` near ${location}`}
                  {visaStatus === "I need visa sponsorship" && ` with visa sponsorship`}
                </p>
                <button style={{ ...btn(true), width: "auto", padding: "7px 16px", fontSize: "13px", marginLeft: "auto" }}
                  onClick={() => { onFilterByProfile({ sectors, location, visaStatus, experience, salary }); onNavigate("Sponsorship Jobs"); }}>
                  View all on jobs board ↗
                </button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1rem" }}>
                {matchedJobs.slice(0, 12).map((j, i) => (
                  <div key={i} style={{ ...card, display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <p style={{ fontWeight: 500, margin: "0 0 3px", fontSize: "15px", color: "#534AB7" }}>{j.title}</p>
                        <p style={{ color: "var(--color-text-secondary)", fontSize: "13px", margin: 0 }}>{j.company}</p>
                      </div>
                      {j.sponsorship && <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 500, background: "#E1F5EE", color: "#085041", whiteSpace: "nowrap" }}>✓ Sponsorship</span>}
                    </div>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
                      <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: 500, background: "#EEEDFE", color: "#3C3489" }}>{j.sector}</span>
                      <span style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>📍 {j.location}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <p style={{ fontWeight: 500, color: "#3C3489", margin: 0, fontSize: "14px" }}>{j.salary}</p>
                      {j.url && <a href={j.url} target="_blank" rel="noopener noreferrer" style={{ padding: "6px 14px", borderRadius: "var(--border-radius-md)", background: "#534AB7", color: "#fff", fontSize: "13px", textDecoration: "none", fontWeight: 500 }}>Apply ↗</a>}
                    </div>
                  </div>
                ))}
              </div>
              {matchedJobs.length > 12 && (
                <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
                  <button style={{ ...btn(false), width: "auto", padding: "10px 24px" }}
                    onClick={() => { onFilterByProfile({ sectors, location, visaStatus, experience, salary }); onNavigate("Sponsorship Jobs"); }}>
                    View all {matchedJobs.length} matches on jobs board ↗
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Delete Account Section ───────────────────────────────────────────────
function DeleteAccountSection({ user, onDeleted }) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    if (confirm.toLowerCase() !== "delete") { setError('Please type "delete" to confirm'); return; }
    setLoading(true);
    try {
      // Delete profile data
      await supaFetch(`/profiles?user_id=eq.${user.id}`, { method: "DELETE" });
      // Delete auth user via admin endpoint (needs service role — use edge function)
      const res = await fetch("/api/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, token: getToken() })
      });
      if (!res.ok) throw new Error("Account deletion failed");
      onDeleted();
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  }

  return (
    <div style={{ border: "0.5px solid rgba(226,75,74,0.3)", borderRadius: "var(--border-radius-lg)", padding: "1.25rem", marginTop: "0.5rem" }}>
      <h3 style={{ fontSize: "0.95rem", fontWeight: 500, margin: "0 0 0.5rem", color: "#E24B4A" }}>⚠️ Danger Zone</h3>
      {!open ? (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <p style={{ fontSize: "14px", fontWeight: 500, margin: "0 0 3px" }}>Delete my account</p>
            <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", margin: 0 }}>Permanently delete your account and all associated data. This cannot be undone.</p>
          </div>
          <button onClick={() => setOpen(true)} style={{ padding: "8px 18px", borderRadius: "var(--border-radius-md)", border: "0.5px solid #E24B4A", background: "transparent", color: "#E24B4A", fontSize: "13px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
            Delete account
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", margin: 0 }}>
            This will permanently delete your account and all your profile data in accordance with your right to erasure under UK GDPR.
            Type <strong>delete</strong> below to confirm.
          </p>
          {error && <p style={{ fontSize: "13px", color: "#E24B4A", margin: 0 }}>{error}</p>}
          <input
            style={{ padding: "10px 14px", borderRadius: "var(--border-radius-md)", border: "0.5px solid #E24B4A", background: "var(--color-background-secondary)", color: "var(--color-text-primary)", fontSize: "14px", outline: "none", fontFamily: "inherit" }}
            placeholder='Type "delete" to confirm'
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
          />
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={() => { setOpen(false); setConfirm(""); setError(""); }} style={{ flex: 1, padding: "9px", borderRadius: "var(--border-radius-md)", border: "0.5px solid var(--color-border-secondary)", background: "transparent", color: "var(--color-text-secondary)", fontSize: "13px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
              Cancel
            </button>
            <button onClick={handleDelete} disabled={loading} style={{ flex: 1, padding: "9px", borderRadius: "var(--border-radius-md)", border: "none", background: "#E24B4A", color: "#fff", fontSize: "13px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit", opacity: loading ? 0.7 : 1 }}>
              {loading ? "Deleting..." : "Permanently delete"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export { getUser, clearSession };
