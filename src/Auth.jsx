import { useState } from "react";
import { ConsentCheckbox } from "./Legal.jsx";

const SUPA_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPA_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

async function supaAuth(endpoint, body) {
  const res = await fetch(`${SUPA_URL}/auth/v1/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: SUPA_KEY },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || data.msg || data.message || "Something went wrong");
  return data;
}

const S = {
  wrap: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 1.5rem" },
  box: { width: "100%", maxWidth: "420px" },
  logo: { width: "52px", height: "52px", borderRadius: "14px", background: "linear-gradient(135deg,#534AB7,#1D9E75)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "22px", margin: "0 auto 1.25rem" },
  card: { background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: "2rem" },
  inp: { padding: "11px 14px", borderRadius: "var(--border-radius-md)", border: "0.5px solid var(--color-border-secondary)", background: "var(--color-background-secondary)", color: "var(--color-text-primary)", fontSize: "15px", outline: "none", fontFamily: "inherit", width: "100%", boxSizing: "border-box", transition: "border-color 0.15s" },
  btn: (primary) => ({ padding: "12px", borderRadius: "var(--border-radius-md)", background: primary ? "#534AB7" : "transparent", color: primary ? "#fff" : "var(--color-text-secondary)", border: primary ? "none" : "0.5px solid var(--color-border-secondary)", fontSize: "15px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit", width: "100%", opacity: 1 }),
  label: { fontSize: "13px", fontWeight: 500, color: "var(--color-text-secondary)", display: "block", marginBottom: "6px" },
  err: { background: "#FEE8E8", border: "0.5px solid #F5A0A0", borderRadius: "var(--border-radius-md)", padding: "10px 14px", fontSize: "13px", color: "#9B1C1C" },
  ok: { background: "#E1F5EE", border: "0.5px solid #5DCAA5", borderRadius: "var(--border-radius-md)", padding: "10px 14px", fontSize: "13px", color: "#085041" },
  link: { background: "none", border: "none", color: "#534AB7", cursor: "pointer", fontFamily: "inherit", fontSize: "13px", fontWeight: 500, padding: 0 },
  otpBox: { display: "flex", gap: "8px", justifyContent: "center" },
  otpInp: { width: "44px", height: "52px", textAlign: "center", fontSize: "20px", fontWeight: 600, borderRadius: "var(--border-radius-md)", border: "0.5px solid var(--color-border-secondary)", background: "var(--color-background-secondary)", color: "var(--color-text-primary)", outline: "none", fontFamily: "inherit" },
};

// ─── OTP Input ─────────────────────────────────────────────────────────────
function OTPInput({ value, onChange, disabled }) {
  const digits = (value + "      ").slice(0, 6).split("");
  function handleKey(e, idx) {
    const v = e.target.value.replace(/\D/g, "").slice(-1);
    const newVal = digits.map((d, i) => i === idx ? v : d).join("").replace(/ /g, "");
    onChange(newVal);
    if (v && idx < 5) {
      const next = e.target.parentElement.children[idx + 1];
      if (next) next.focus();
    }
    if (e.key === "Backspace" && !v && idx > 0) {
      const prev = e.target.parentElement.children[idx - 1];
      if (prev) prev.focus();
    }
  }
  function handlePaste(e) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    onChange(pasted);
    e.preventDefault();
  }
  return (
    <div style={S.otpBox}>
      {digits.map((d, i) => (
        <input
          key={i}
          style={{ ...S.otpInp, borderColor: d.trim() ? "#534AB7" : undefined, opacity: disabled ? 0.6 : 1 }}
          maxLength={1}
          value={d.trim()}
          onChange={e => handleKey(e, i)}
          onKeyDown={e => { if (e.key === "Backspace" && !e.target.value && i > 0) { const prev = e.target.parentElement.children[i - 1]; if (prev) { prev.focus(); const newVal = digits.map((d2, j) => j === i - 1 ? "" : d2).join("").replace(/ /g, ""); onChange(newVal); } } }}
          onPaste={handlePaste}
          disabled={disabled}
          inputMode="numeric"
        />
      ))}
    </div>
  );
}

// ─── Auth Flow ─────────────────────────────────────────────────────────────
export default function AuthPage({ onLogin, onNavToHome }) {
  const [step, setStep] = useState("entry"); // entry | otp | reset-otp
  const [mode, setMode] = useState("signup"); // signup | login | forgot
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [resendTimer, setResendTimer] = useState(0);

  function startResendTimer() {
    setResendTimer(60);
    const interval = setInterval(() => {
      setResendTimer(t => { if (t <= 1) { clearInterval(interval); return 0; } return t - 1; });
    }, 1000);
  }

  async function handleSignup() {
    if (!name || !email || !password) { setError("Please fill in all fields"); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (!consent) { setError("Please accept the Terms & Conditions and Privacy Policy"); return; }
    setLoading(true); setError("");
    try {
      await supaAuth("signup", { email, password, data: { full_name: name }, options: { emailRedirectTo: window.location.origin } });
      setStep("otp");
      setInfo(`We've sent a 6-digit code to ${email}. Check your inbox (and spam folder).`);
      startResendTimer();
    } catch (e) { setError(e.message); }
    setLoading(false);
  }

  async function handleVerifyOTP() {
    if (otp.length < 6) { setError("Please enter the full 6-digit code"); return; }
    setLoading(true); setError("");
    try {
      const data = await supaAuth("verify", { type: "signup", email, token: otp });
      localStorage.setItem("mg_session", JSON.stringify(data));
      localStorage.setItem("mg_user", JSON.stringify(data.user));
      onLogin(data.user);
    } catch (e) { setError("Invalid or expired code. Please try again."); }
    setLoading(false);
  }

  async function handleLogin() {
    if (!email || !password) { setError("Please fill in all fields"); return; }
    setLoading(true); setError("");
    try {
      const data = await supaAuth("token?grant_type=password", { email, password });
      localStorage.setItem("mg_session", JSON.stringify(data));
      localStorage.setItem("mg_user", JSON.stringify(data.user));
      onLogin(data.user);
    } catch (e) { setError("Incorrect email or password"); }
    setLoading(false);
  }

  async function handleForgot() {
    if (!email) { setError("Please enter your email address"); return; }
    setLoading(true); setError("");
    try {
      await supaAuth("recover", { email });
      setStep("reset-otp");
      setInfo(`We've sent a 6-digit reset code to ${email}.`);
      startResendTimer();
    } catch (e) { setError(e.message); }
    setLoading(false);
  }

  async function handleResetPassword() {
    if (otp.length < 6) { setError("Please enter the 6-digit code"); return; }
    if (newPassword.length < 8) { setError("New password must be at least 8 characters"); return; }
    setLoading(true); setError("");
    try {
      const verifyData = await supaAuth("verify", { type: "recovery", email, token: otp });
      // Update password using the session token
      const res = await fetch(`${SUPA_URL}/auth/v1/user`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", apikey: SUPA_KEY, Authorization: `Bearer ${verifyData.access_token}` },
        body: JSON.stringify({ password: newPassword })
      });
      if (!res.ok) throw new Error("Failed to update password");
      setInfo("Password updated! You can now sign in.");
      setStep("entry"); setMode("login"); setOtp(""); setPassword("");
    } catch (e) { setError("Invalid or expired code."); }
    setLoading(false);
  }

  async function handleResend() {
    if (resendTimer > 0) return;
    setLoading(true); setError("");
    try {
      if (step === "otp") await supaAuth("resend", { type: "signup", email });
      else await supaAuth("recover", { email });
      setInfo("New code sent! Check your inbox.");
      startResendTimer();
    } catch (e) { setError(e.message); }
    setLoading(false);
  }

  // ── OTP Verification Screen ──
  if (step === "otp" || step === "reset-otp") {
    const isReset = step === "reset-otp";
    return (
      <div style={S.wrap}>
        <div style={S.box}>
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <div style={S.logo}>✉</div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 500, margin: "0 0 0.4rem" }}>Check your email</h1>
            <p style={{ color: "var(--color-text-secondary)", fontSize: "14px", margin: 0 }}>Enter the 6-digit code we sent to</p>
            <p style={{ color: "var(--color-text-primary)", fontSize: "14px", fontWeight: 500, margin: "4px 0 0" }}>{email}</p>
          </div>
          <div style={S.card}>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {error && <div style={S.err}>{error}</div>}
              {info && <div style={S.ok}>{info}</div>}
              <div>
                <label style={{ ...S.label, textAlign: "center", marginBottom: "12px" }}>Enter your code</label>
                <OTPInput value={otp} onChange={v => { setOtp(v); setError(""); }} disabled={loading} />
              </div>
              {isReset && (
                <div>
                  <label style={S.label}>New password</label>
                  <input style={S.inp} type="password" placeholder="At least 8 characters" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                </div>
              )}
              <button style={{ ...S.btn(true), opacity: loading || otp.length < 6 ? 0.6 : 1 }}
                onClick={isReset ? handleResetPassword : handleVerifyOTP} disabled={loading || otp.length < 6}>
                {loading ? "Verifying..." : isReset ? "Reset password" : "Verify email"}
              </button>
              <div style={{ textAlign: "center", fontSize: "13px", color: "var(--color-text-secondary)" }}>
                Didn't get a code?{" "}
                <button onClick={handleResend} disabled={resendTimer > 0} style={{ ...S.link, opacity: resendTimer > 0 ? 0.5 : 1 }}>
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend code"}
                </button>
              </div>
              <button onClick={() => { setStep("entry"); setOtp(""); setError(""); setInfo(""); }} style={{ ...S.btn(false), fontSize: "13px", padding: "8px" }}>← Back</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Entry Screen ──
  return (
    <div style={S.wrap}>
      <div style={S.box}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={S.logo}>M</div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 500, margin: "0 0 0.4rem" }}>
            {mode === "login" ? "Welcome back" : mode === "signup" ? "Create your account" : "Reset your password"}
          </h1>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "14px", margin: 0 }}>
            {mode === "signup" ? "Get personalised UK job recommendations" : mode === "login" ? "Sign in to your Mentorgram account" : "We'll send you a reset code"}
          </p>
        </div>

        <div style={S.card}>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {error && <div style={S.err}>{error}</div>}
            {info && <div style={S.ok}>{info}</div>}

            {mode === "signup" && (
              <div>
                <label style={S.label}>Full name</label>
                <input style={S.inp} placeholder="Your full name" value={name} onChange={e => setName(e.target.value)} />
              </div>
            )}
            <div>
              <label style={S.label}>Email address</label>
              <input style={S.inp} type="email" placeholder="you@email.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && (mode === "login" ? handleLogin() : mode === "signup" ? handleSignup() : handleForgot())} />
            </div>
            {mode !== "forgot" && (
              <div>
                <label style={S.label}>Password</label>
                <input style={S.inp} type="password" placeholder={mode === "signup" ? "At least 8 characters" : "Your password"} value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && (mode === "login" ? handleLogin() : handleSignup())} />
              </div>
            )}
            {mode === "signup" && (
              <ConsentCheckbox checked={consent} onChange={setConsent}
                onViewPrivacy={() => window.open("/", "_blank")}
                onViewTerms={() => window.open("/", "_blank")} />
            )}
            <button style={{ ...S.btn(true), opacity: loading ? 0.7 : 1, marginTop: "4px" }}
              onClick={mode === "login" ? handleLogin : mode === "signup" ? handleSignup : handleForgot} disabled={loading}>
              {loading ? "Please wait..." : mode === "login" ? "Sign in" : mode === "signup" ? "Create account & verify email" : "Send reset code"}
            </button>
          </div>

          <div style={{ borderTop: "0.5px solid var(--color-border-tertiary)", marginTop: "1.25rem", paddingTop: "1.25rem", display: "flex", flexDirection: "column", gap: "10px", textAlign: "center" }}>
            {mode === "login" && (<>
              <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", margin: 0 }}>
                Don't have an account?{" "}
                <button onClick={() => { setMode("signup"); setError(""); setInfo(""); }} style={S.link}>Sign up free</button>
              </p>
              <button onClick={() => { setMode("forgot"); setError(""); setInfo(""); }} style={{ background: "none", border: "none", color: "var(--color-text-secondary)", cursor: "pointer", fontFamily: "inherit", fontSize: "13px" }}>
                Forgot password?
              </button>
            </>)}
            {mode === "signup" && (
              <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", margin: 0 }}>
                Already have an account?{" "}
                <button onClick={() => { setMode("login"); setError(""); setInfo(""); }} style={S.link}>Sign in</button>
              </p>
            )}
            {mode === "forgot" && (
              <button onClick={() => { setMode("login"); setError(""); setInfo(""); }} style={S.link}>← Back to sign in</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
