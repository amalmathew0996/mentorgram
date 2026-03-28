import { useState, useEffect, useCallback } from "react";

const ADMIN_PASSWORD_KEY = "mg_admin_pw";

function timeAgo(isoString) {
  if (!isoString) return "Never";
  const diff = Date.now() - new Date(isoString).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return "Just now";
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function timeUntil(isoString) {
  if (!isoString) return "Unknown";
  const diff = new Date(isoString).getTime() - Date.now();
  if (diff < 0) return "Overdue";
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  if (mins < 60)  return `in ${mins}m`;
  return `in ${hours}h ${Math.floor((diff % 3600000) / 60000)}m`;
}

function fmt(n) {
  return (n || 0).toLocaleString();
}

// ─── Login Screen ──────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [pw, setPw]     = useState("");
  const [err, setErr]   = useState(false);
  const [show, setShow] = useState(false);

  function handleLogin() {
    if (!pw.trim()) { setErr(true); return; }
    // Store password in sessionStorage so page refresh doesn't log out
    sessionStorage.setItem(ADMIN_PASSWORD_KEY, pw.trim());
    onLogin(pw.trim());
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-background-tertiary)", fontFamily: "var(--font-sans)" }}>
      <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "16px", padding: "2.5rem 2rem", width: "100%", maxWidth: "380px", boxShadow: "0 8px 40px rgba(0,0,0,0.08)" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ fontSize: "36px", marginBottom: "12px" }}>🔐</div>
          <h1 style={{ fontSize: "1.3rem", fontWeight: 600, margin: "0 0 6px", color: "var(--color-text-primary)" }}>Admin Dashboard</h1>
          <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", margin: 0 }}>Mentorgram AI · Internal only</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <label style={{ fontSize: "13px", fontWeight: 500, color: "var(--color-text-secondary)" }}>Password</label>
          <div style={{ position: "relative" }}>
            <input
              type={show ? "text" : "password"}
              value={pw}
              onChange={e => { setPw(e.target.value); setErr(false); }}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              placeholder="Enter admin password"
              autoFocus
              style={{ width: "100%", padding: "11px 40px 11px 14px", borderRadius: "10px", border: err ? "1.5px solid #E24B4A" : "0.5px solid var(--color-border-secondary)", background: "var(--color-background-secondary)", color: "var(--color-text-primary)", fontSize: "14px", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
            />
            <button onClick={() => setShow(s => !s)} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--color-text-secondary)", fontSize: "14px", padding: "2px 4px" }}>
              {show ? "🙈" : "👁️"}
            </button>
          </div>
          {err && <p style={{ color: "#E24B4A", fontSize: "12px", margin: 0 }}>Please enter your password</p>}
          <button
            onClick={handleLogin}
            style={{ padding: "12px", background: "#1A3FA8", color: "#fff", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", marginTop: "4px" }}>
            Sign in →
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Stat Card ─────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color = "#1A3FA8", icon }) {
  return (
    <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "12px", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "6px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{ fontSize: "12px", color: "var(--color-text-secondary)", fontWeight: 500 }}>{label}</span>
        {icon && <span style={{ fontSize: "18px" }}>{icon}</span>}
      </div>
      <p style={{ fontSize: "28px", fontWeight: 600, margin: 0, color, lineHeight: 1.2 }}>{value}</p>
      {sub && <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", margin: 0 }}>{sub}</p>}
    </div>
  );
}

// ─── Source Bar ─────────────────────────────────────────────────────────────
function SourceBar({ label, count, total, color }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div style={{ marginBottom: "14px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
        <span style={{ fontSize: "13px", color: "var(--color-text-primary)", fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>{fmt(count)} <span style={{ opacity: 0.6 }}>({pct}%)</span></span>
      </div>
      <div style={{ height: "6px", background: "var(--color-background-secondary)", borderRadius: "4px", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: "4px", transition: "width 0.6s ease" }} />
      </div>
    </div>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [password, setPassword]     = useState(() => sessionStorage.getItem(ADMIN_PASSWORD_KEY) || "");
  const [authed, setAuthed]         = useState(false);
  const [authErr, setAuthErr]       = useState(false);
  const [stats, setStats]           = useState(null);
  const [loading, setLoading]       = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const [lastAction, setLastAction] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const fetchStats = useCallback(async (pw) => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin-stats", {
        headers: { "x-admin-password": pw },
      });
      if (r.status === 401) { setAuthErr(true); setAuthed(false); return; }
      const data = await r.json();
      setStats(data);
      setAuthed(true);
      setAuthErr(false);
    } catch (e) {
      setLastAction("❌ Failed to fetch stats");
    }
    setLoading(false);
  }, []);

  function handleLogin(pw) {
    setPassword(pw);
    fetchStats(pw);
  }

  // Auto-refresh stats every 30 seconds
  useEffect(() => {
    if (!authed || !password) return;
    const interval = setInterval(() => fetchStats(password), 30000);
    return () => clearInterval(interval);
  }, [authed, password, fetchStats]);

  // Try auto-login if password was saved in session
  useEffect(() => {
    if (password) fetchStats(password);
  }, []);

  async function triggerRefresh() {
    setRefreshing(true);
    setLastAction("");
    try {
      const r = await fetch("/api/refresh-jobs", {
        headers: { "Authorization": `Bearer ${process.env.CRON_SECRET || "mg_cron_2026"}` },
      });
      const data = await r.json();
      if (data.success) {
        setLastAction(`✅ Refresh complete — ${data.inserted} jobs inserted, ${data.total} total`);
        await fetchStats(password);
      } else {
        setLastAction(`❌ Refresh failed: ${data.error}`);
      }
    } catch {
      setLastAction("❌ Refresh request failed");
    }
    setRefreshing(false);
  }

  async function deleteAllJobs() {
    setDeleting(true);
    setLastAction("");
    try {
      const r = await fetch("/api/admin-stats", {
        method: "DELETE",
        headers: { "x-admin-password": password },
      });
      const data = await r.json();
      if (data.success) {
        setLastAction("✅ All jobs deleted successfully");
        setConfirmDelete(false);
        await fetchStats(password);
      } else {
        setLastAction(`❌ Delete failed: ${data.error}`);
      }
    } catch {
      setLastAction("❌ Delete request failed");
    }
    setDeleting(false);
  }

  if (!authed && !password) return <LoginScreen onLogin={handleLogin} />;
  if (authErr) {
    sessionStorage.removeItem(ADMIN_PASSWORD_KEY);
    return (
      <LoginScreen onLogin={(pw) => { setAuthErr(false); handleLogin(pw); }} />
    );
  }
  if (loading && !stats) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-sans)", color: "var(--color-text-secondary)" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "32px", marginBottom: "12px" }}>⚙️</div>
          <p style={{ fontSize: "14px" }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const s = stats || {};
  const total = s.total || 0;
  const rssTotal = (s.bySource?.jobsac || 0) + (s.bySource?.guardian || 0);

  return (
    <div style={{ fontFamily: "var(--font-sans)", color: "var(--color-text-primary)", minHeight: "100vh", background: "var(--color-background-tertiary)" }}>

      {/* Header */}
      <div style={{ background: "var(--color-background-primary)", borderBottom: "0.5px solid var(--color-border-tertiary)", padding: "0 1.5rem", height: "60px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "20px" }}>⚙️</span>
          <span style={{ fontSize: "16px", fontWeight: 600 }}>Admin Dashboard</span>
          <span style={{ fontSize: "11px", background: "rgba(26,63,168,0.1)", color: "#1A3FA8", padding: "2px 8px", borderRadius: "20px", fontWeight: 500 }}>Mentorgram AI</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button onClick={() => fetchStats(password)} disabled={loading}
            style={{ padding: "6px 14px", borderRadius: "8px", border: "0.5px solid var(--color-border-secondary)", background: "transparent", fontSize: "13px", cursor: "pointer", fontFamily: "inherit", color: "var(--color-text-secondary)", opacity: loading ? 0.5 : 1 }}>
            {loading ? "Refreshing..." : "↻ Refresh stats"}
          </button>
          <button onClick={() => { sessionStorage.removeItem(ADMIN_PASSWORD_KEY); setAuthed(false); setPassword(""); setStats(null); }}
            style={{ padding: "6px 14px", borderRadius: "8px", border: "0.5px solid var(--color-border-secondary)", background: "transparent", fontSize: "13px", cursor: "pointer", fontFamily: "inherit", color: "var(--color-text-secondary)" }}>
            Sign out
          </button>
        </div>
      </div>

      <div style={{ maxWidth: "960px", margin: "0 auto", padding: "2rem 1.5rem" }}>

        {/* Last action message */}
        {lastAction && (
          <div style={{ padding: "10px 16px", borderRadius: "8px", marginBottom: "1.5rem", fontSize: "13px", fontWeight: 500,
            background: lastAction.startsWith("✅") ? "rgba(22,163,74,0.1)" : "rgba(226,75,74,0.1)",
            color: lastAction.startsWith("✅") ? "#16A34A" : "#E24B4A",
            border: `0.5px solid ${lastAction.startsWith("✅") ? "rgba(22,163,74,0.3)" : "rgba(226,75,74,0.3)"}` }}>
            {lastAction}
          </div>
        )}

        {/* Refresh timing */}
        <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "12px", padding: "1.25rem 1.5rem", marginBottom: "1.5rem", display: "flex", gap: "2rem", flexWrap: "wrap", alignItems: "center" }}>
          <div>
            <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", margin: "0 0 4px", fontWeight: 500 }}>LAST REFRESH</p>
            <p style={{ fontSize: "16px", fontWeight: 600, margin: 0, color: "#16A34A" }}>{timeAgo(s.lastRefresh)}</p>
            <p style={{ fontSize: "11px", color: "var(--color-text-secondary)", margin: "2px 0 0" }}>
              {s.lastRefresh ? new Date(s.lastRefresh).toLocaleString("en-GB") : "—"}
            </p>
          </div>
          <div style={{ width: "1px", height: "40px", background: "var(--color-border-tertiary)" }} />
          <div>
            <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", margin: "0 0 4px", fontWeight: 500 }}>NEXT SCHEDULED</p>
            <p style={{ fontSize: "16px", fontWeight: 600, margin: 0, color: "#1A3FA8" }}>{timeUntil(s.nextRefresh)}</p>
            <p style={{ fontSize: "11px", color: "var(--color-text-secondary)", margin: "2px 0 0" }}>Every 2 hours automatically</p>
          </div>
          <div style={{ width: "1px", height: "40px", background: "var(--color-border-tertiary)" }} />
          <div>
            <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", margin: "0 0 4px", fontWeight: 500 }}>SERVER TIME</p>
            <p style={{ fontSize: "14px", fontWeight: 500, margin: 0 }}>{s.serverTime ? new Date(s.serverTime).toLocaleTimeString("en-GB") : "—"}</p>
            <p style={{ fontSize: "11px", color: "var(--color-text-secondary)", margin: "2px 0 0" }}>UTC</p>
          </div>
          <div style={{ marginLeft: "auto" }}>
            <span style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>Expiring in 3 days: </span>
            <span style={{ fontSize: "13px", fontWeight: 600, color: s.expiringSoon > 100 ? "#E24B4A" : "var(--color-text-secondary)" }}>{fmt(s.expiringSoon)}</span>
          </div>
        </div>

        {/* Stat cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
          <StatCard label="Total jobs" value={fmt(total)} sub="In Supabase right now" color="#1A3FA8" icon="💼" />
          <StatCard label="Added today" value={fmt(s.addedToday)} sub={`Yesterday: ${fmt(s.addedYesterday)}`} color={s.addedToday > 0 ? "#16A34A" : "var(--color-text-secondary)"} icon="📅" />
          <StatCard label="From Reed" value={fmt(s.bySource?.reed)} sub={`${total > 0 ? Math.round((s.bySource?.reed/total)*100) : 0}% of total`} color="#E8298A" icon="🔴" />
          <StatCard label="From Adzuna" value={fmt(s.bySource?.adzuna)} sub={`${total > 0 ? Math.round((s.bySource?.adzuna/total)*100) : 0}% of total`} color="#16A34A" icon="🟢" />
          <StatCard label="From RSS feeds" value={fmt(rssTotal)} sub="jobs.ac.uk + Guardian" color="#F59E0B" icon="📡" />
        </div>

        {/* Source breakdown */}
        <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "12px", padding: "1.5rem", marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "14px", fontWeight: 600, margin: "0 0 1.25rem", color: "var(--color-text-primary)" }}>Jobs by source</h2>
          <SourceBar label="Reed"         count={s.bySource?.reed    || 0} total={total} color="#E8298A" />
          <SourceBar label="Adzuna"       count={s.bySource?.adzuna  || 0} total={total} color="#16A34A" />
          <SourceBar label="jobs.ac.uk"   count={s.bySource?.jobsac  || 0} total={total} color="#1A3FA8" />
          <SourceBar label="Guardian Jobs" count={s.bySource?.guardian || 0} total={total} color="#F59E0B" />
        </div>

        {/* Today vs Yesterday */}
        <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "12px", padding: "1.5rem", marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "14px", fontWeight: 600, margin: "0 0 1.25rem", color: "var(--color-text-primary)" }}>Jobs added</h2>
          <div style={{ display: "flex", gap: "2rem", alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", margin: "0 0 6px" }}>Today</p>
              <div style={{ height: "8px", background: "var(--color-background-secondary)", borderRadius: "4px", overflow: "hidden", marginBottom: "6px" }}>
                <div style={{ height: "100%", width: `${Math.min(100, s.addedToday > 0 && s.addedYesterday > 0 ? (s.addedToday / Math.max(s.addedToday, s.addedYesterday)) * 100 : s.addedToday > 0 ? 100 : 0)}%`, background: "#16A34A", borderRadius: "4px", transition: "width 0.6s" }} />
              </div>
              <p style={{ fontSize: "22px", fontWeight: 600, margin: 0, color: "#16A34A" }}>{fmt(s.addedToday)}</p>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", margin: "0 0 6px" }}>Yesterday</p>
              <div style={{ height: "8px", background: "var(--color-background-secondary)", borderRadius: "4px", overflow: "hidden", marginBottom: "6px" }}>
                <div style={{ height: "100%", width: `${Math.min(100, s.addedToday > 0 && s.addedYesterday > 0 ? (s.addedYesterday / Math.max(s.addedToday, s.addedYesterday)) * 100 : s.addedYesterday > 0 ? 100 : 0)}%`, background: "#1A3FA8", borderRadius: "4px", transition: "width 0.6s" }} />
              </div>
              <p style={{ fontSize: "22px", fontWeight: 600, margin: 0, color: "#1A3FA8" }}>{fmt(s.addedYesterday)}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "12px", padding: "1.5rem" }}>
          <h2 style={{ fontSize: "14px", fontWeight: 600, margin: "0 0 1.25rem", color: "var(--color-text-primary)" }}>Actions</h2>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>

            {/* Manual refresh */}
            <button onClick={triggerRefresh} disabled={refreshing}
              style={{ padding: "10px 20px", borderRadius: "10px", background: "#1A3FA8", color: "#fff", border: "none", fontSize: "14px", fontWeight: 500, cursor: refreshing ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: refreshing ? 0.7 : 1, display: "flex", alignItems: "center", gap: "8px" }}>
              {refreshing ? (
                <><span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>⟳</span> Refreshing...</>
              ) : "↻ Trigger refresh now"}
            </button>

            {/* Delete all — two-step confirm */}
            {!confirmDelete ? (
              <button onClick={() => setConfirmDelete(true)}
                style={{ padding: "10px 20px", borderRadius: "10px", background: "rgba(226,75,74,0.1)", color: "#E24B4A", border: "0.5px solid rgba(226,75,74,0.3)", fontSize: "14px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
                🗑 Delete all jobs
              </button>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 16px", background: "rgba(226,75,74,0.08)", border: "0.5px solid rgba(226,75,74,0.3)", borderRadius: "10px" }}>
                <span style={{ fontSize: "13px", color: "#E24B4A", fontWeight: 500 }}>Are you sure? This deletes all {fmt(total)} jobs.</span>
                <button onClick={deleteAllJobs} disabled={deleting}
                  style={{ padding: "6px 14px", borderRadius: "8px", background: "#E24B4A", color: "#fff", border: "none", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", opacity: deleting ? 0.7 : 1 }}>
                  {deleting ? "Deleting..." : "Yes, delete all"}
                </button>
                <button onClick={() => setConfirmDelete(false)}
                  style={{ padding: "6px 14px", borderRadius: "8px", background: "transparent", color: "var(--color-text-secondary)", border: "0.5px solid var(--color-border-secondary)", fontSize: "13px", cursor: "pointer", fontFamily: "inherit" }}>
                  Cancel
                </button>
              </div>
            )}
          </div>

          <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", margin: "1rem 0 0", lineHeight: 1.6 }}>
            Manual refresh runs the current rotation group and upserts new jobs. It uses ~20 Adzuna API calls.
            Auto-refresh runs every 2 hours via Vercel cron. Daily budget: ~120 Adzuna calls (limit: 250).
          </p>
        </div>

        <p style={{ fontSize: "11px", color: "var(--color-text-secondary)", textAlign: "center", marginTop: "1.5rem" }}>
          Stats auto-refresh every 30 seconds · Mentorgram Admin · {new Date().getFullYear()}
        </p>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
