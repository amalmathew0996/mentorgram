Here’s the full updated Auth.jsx with show/hide password added for both password fields.

import { useState } from "react";
import { ConsentCheckbox } from "./Legal.jsx";

const SUPA_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPA_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create user via Supabase Admin API (through our own backend)
async function createUser(email, password, name) {
  const res = await fetch("/api/create-user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, name }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to create account");
  return data;
}

async function loginUser(email, password) {
  const res = await fetch(`${SUPA_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: SUPA_KEY },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || "Incorrect email or password");
  return data;
}

async function sendOTP(email, type = "signup") {
  const res = await fetch("/api/send-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, type }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to send code");
  return data.token; // signed token returned from server
}

async function verifyAndLogin(email, otp, token, password, name) {
  const res = await fetch("/api/verify-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp, token, password, name }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Invalid or expired code");
  return data;
}

async function resetPassword(email, otp, token, newPassword) {
  const res = await fetch("/api/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp, token, newPassword }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to reset password");
  return data;
}

const S = {
  wrap: { minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 1.5rem" },
  box: { width: "100%", maxWidth: "420px" },
  logo: { width: "52px", height: "52px", borderRadius: "14px", background: "linear-gradient(135deg,#534AB7,#1D9E75)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "22px", margin: "0 auto 1.25rem" },
  card: { background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: "2rem" },
  inp: { padding: "11px 14px", borderRadius: "var(--border-radius-md)", border: "0.5px solid var(--color-border-secondary)", background: "var(--color-background-secondary)", color: "var(--color-text-primary)", fontSize: "15px", outline: "none", fontFamily: "inherit", width: "100%", boxSizing: "border-box" },
  btn: (primary) => ({ padding: "12px", borderRadius: "var(--border-radius-md)", background: primary ? "#534AB7" : "transparent", color: primary ? "#fff" : "var(--color-text-secondary)", border: primary ? "none" : "0.5px solid var(--color-border-secondary)", fontSize: "15px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit", width: "100%", transition: "opacity 0.15s" }),
  label: { fontSize: "13px", fontWeight: 500, color: "var(--color-text-secondary)", display: "block", marginBottom: "6px" },
  err: { background: "#FEE8E8", border: "0.5px solid #F5A0A0", borderRadius: "var(--border-radius-md)", padding: "10px 14px", fontSize: "13px", color: "#9B1C1C" },
  ok: { background: "#E1F5EE", border: "0.5px solid #5DCAA5", borderRadius: "var(--border-radius-md)", padding: "10px 14px", fontSize: "13px", color: "#085041" },
  link: { background: "none", border: "none", color: "#534AB7", cursor: "pointer", fontFamily: "inherit", fontSize: "13px", fontWeight: 500, padding: 0 },
};

function OTPInput({ value, onChange, disabled }) {
  const digits = (value + "      ").slice(0, 6).split("");
  return (
    <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
      {digits.map((d, i) => (
        <input
          key={i}
          style={{
            width: "44px",
            height: "52px",
            textAlign: "center",
            fontSize: "22px",
            fontWeight: 700,
            borderRadius: "var(--border-radius-md)",
            border: d.trim() ? "1.5px solid #534AB7" : "0.5px solid var(--color-border-secondary)",
            background: "var(--color-background-secondary)",
            color: "var(--color-text-primary)",
            outline: "none",
            fontFamily: "monospace",
            transition: "border-color 0.15s",
            opacity: disabled ? 0.6 : 1
          }}
          maxLength={1}
          value={d.trim()}
          inputMode="numeric"
          disabled={disabled}
          onChange={e => {
            const v = e.target.value.replace(/\D/g, "").slice(-1);
            const newVal = digits.map((x, j) => j === i ? v : x).join("").replace(/ /g, "");
            onChange(newVal);
            if (v && i < 5) {
              const next = e.target.parentElement.children[i + 1];
              if (next) next.focus();
            }
          }}
          onKeyDown={e => {
            if (e.key === "Backspace" && !e.target.value && i > 0) {
              const prev = e.target.parentElement.children[i - 1];
              if (prev) {
                prev.focus();
                onChange(digits.map((x, j) => j === i - 1 ? "" : x).join("").replace(/ /g, ""));
              }
            }
          }}
          onPaste={e => {
            const p = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
            onChange(p);
            e.preventDefault();
          }}
        />
      ))}
    </div>
  );
}

export default function AuthPage({ onLogin }) {
  const [step, setStep] = useState("entry"); // entry | otp | reset-otp
  const [mode, setMode] = useState("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [otpToken, setOtpToken] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  function startTimer() {
    setResendTimer(60);
    const t = setInterval(() => setResendTimer(n => {
      if (n <= 1) {
        clearInterval(t);
        return 0;
      }
      return n - 1;
    }), 1000);
  }

  async function handleSignup() {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("Please fill in all fields");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (!consent) {
      setError("Please accept the Terms & Conditions and Privacy Policy");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = await sendOTP(email, "signup");
      setOtpToken(token);
      setStep("otp");
      setInfo(`We've sent a 6-digit code to ${email}. Check your inbox and spam folder.`);
      startTimer();
    } catch (e) {
      setError(e.message);
    }

    setLoading(false);
  }

  async function handleVerifyOTP() {
    if (otp.length < 6) {
      setError("Please enter all 6 digits");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await verifyAndLogin(email, otp, otpToken, password, name);
      localStorage.setItem("mg_session", JSON.stringify(data.session));
      localStorage.setItem("mg_user", JSON.stringify(data.user));
      onLogin(data.user);
    } catch (e) {
      setError(e.message);
    }

    setLoading(false);
  }

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await loginUser(email, password);
      localStorage.setItem("mg_session", JSON.stringify(data));
      localStorage.setItem("mg_user", JSON.stringify(data.user));
      onLogin(data.user);
    } catch (e) {
      setError(e.message);
    }

    setLoading(false);
  }

  async function handleForgot() {
    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = await sendOTP(email, "reset");
      setOtpToken(token);
      setStep("reset-otp");
      setInfo(`We've sent a reset code to ${email}.`);
      startTimer();
    } catch (e) {
      setError(e.message);
    }

    setLoading(false);
  }

  async function handleResetPassword() {
    if (otp.length < 6) {
      setError("Please enter all 6 digits");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await resetPassword(email, otp, otpToken, newPassword);
      setStep("entry");
      setMode("login");
      setOtp("");
      setInfo("Password updated! Please sign in.");
    } catch (e) {
      setError(e.message);
    }

    setLoading(false);
  }

  async function handleResend() {
    if (resendTimer > 0) return;

    setLoading(true);
    setError("");
    setInfo("");

    try {
      const token = await sendOTP(email, step === "otp" ? "signup" : "reset");
      setOtpToken(token);
      setOtp("");
      setInfo("New code sent! Check your inbox.");
      startTimer();
    } catch (e) {
      setError(e.message);
    }

    setLoading(false);
  }

  if (step === "otp" || step === "reset-otp") {
    const isReset = step === "reset-otp";

    return (
      <div style={S.wrap}>
        <div style={S.box}>
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <div style={{ ...S.logo, fontSize: "26px" }}>✉</div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 500, margin: "0 0 0.4rem" }}>Check your email</h1>
            <p style={{ color: "var(--color-text-secondary)", fontSize: "14px", margin: 0 }}>Enter the 6-digit code sent to</p>
            <p style={{ fontSize: "15px", fontWeight: 500, margin: "4px 0 0" }}>{email}</p>
          </div>

          <div style={S.card}>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {error && <div style={S.err}>{error}</div>}
              {info && <div style={S.ok}>{info}</div>}

              <div>
                <label style={{ ...S.label, textAlign: "center", display: "block", marginBottom: "14px" }}>
                  Enter your 6-digit code
                </label>
                <OTPInput value={otp} onChange={v => { setOtp(v); setError(""); }} disabled={loading} />
              </div>

              {isReset && (
                <div>
                  <label style={S.label}>New password</label>
                  <div style={{ position: "relative" }}>
                    <input
                      style={{ ...S.inp, paddingRight: "70px" }}
                      type={showNewPassword ? "text" : "password"}
                      placeholder="At least 8 characters"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(v => !v)}
                      style={{
                        position: "absolute",
                        right: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        color: "#534AB7",
                        cursor: "pointer",
                        fontSize: "13px",
                        fontWeight: 500,
                        padding: 0
                      }}
                    >
                      {showNewPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>
              )}

              <button
                style={{ ...S.btn(true), opacity: loading || otp.length < 6 ? 0.6 : 1 }}
                onClick={isReset ? handleResetPassword : handleVerifyOTP}
                disabled={loading || otp.length < 6}
              >
                {loading ? "Verifying..." : isReset ? "Reset password" : "Verify & create account"}
              </button>

              <p style={{ textAlign: "center", fontSize: "13px", color: "var(--color-text-secondary)", margin: 0 }}>
                Didn't get a code?{" "}
                <button
                  onClick={handleResend}
                  disabled={resendTimer > 0 || loading}
                  style={{ ...S.link, opacity: resendTimer > 0 ? 0.5 : 1 }}
                >
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend code"}
                </button>
              </p>

              <button
                onClick={() => {
                  setStep("entry");
                  setOtp("");
                  setError("");
                  setInfo("");
                }}
                style={{ ...S.btn(false), fontSize: "13px", padding: "8px" }}
              >
                ← Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={S.wrap}>
      <div style={S.box}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={S.logo}>M</div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 500, margin: "0 0 0.4rem" }}>
            {mode === "login" ? "Welcome back" : mode === "signup" ? "Create your account" : "Reset your password"}
          </h1>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "14px", margin: 0 }}>
            {mode === "signup"
              ? "Get personalised UK job recommendations"
              : mode === "login"
              ? "Sign in to your Mentorgram account"
              : "We'll send you a 6-digit reset code"}
          </p>
        </div>

        <div style={S.card}>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {error && <div style={S.err}>{error}</div>}
            {info && <div style={S.ok}>{info}</div>}

            {mode === "signup" && (
              <div>
                <label style={S.label}>Full name</label>
                <input
                  style={S.inp}
                  placeholder="Your full name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
            )}

            <div>
              <label style={S.label}>Email address</label>
              <input
                style={S.inp}
                type="email"
                placeholder="you@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && (mode === "login" ? handleLogin() : mode === "signup" ? handleSignup() : handleForgot())}
              />
            </div>

            {mode !== "forgot" && (
              <div>
                <label style={S.label}>Password</label>
                <div style={{ position: "relative" }}>
                  <input
                    style={{ ...S.inp, paddingRight: "70px" }}
                    type={showPassword ? "text" : "password"}
                    placeholder={mode === "signup" ? "At least 8 characters" : "Your password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && (mode === "login" ? handleLogin() : handleSignup())}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      color: "#534AB7",
                      cursor: "pointer",
                      fontSize: "13px",
                      fontWeight: 500,
                      padding: 0
                    }}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
            )}

            {mode === "signup" && (
              <ConsentCheckbox
                checked={consent}
                onChange={setConsent}
                onViewPrivacy={() => window.open("https://mentorgramai.com", "_blank")}
                onViewTerms={() => window.open("https://mentorgramai.com", "_blank")}
              />
            )}

            <button
              style={{ ...S.btn(true), opacity: loading ? 0.7 : 1, marginTop: "4px" }}
              onClick={mode === "login" ? handleLogin : mode === "signup" ? handleSignup : handleForgot}
              disabled={loading}
            >
              {loading ? "Please wait..." : mode === "login" ? "Sign in" : mode === "signup" ? "Create account & verify email" : "Send reset code"}
            </button>
          </div>

          <div
            style={{
              borderTop: "0.5px solid var(--color-border-tertiary)",
              marginTop: "1.25rem",
              paddingTop: "1.25rem",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              textAlign: "center"
            }}
          >
            {mode === "login" && (
              <>
                <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", margin: 0 }}>
                  Don't have an account?{" "}
                  <button
                    onClick={() => {
                      setMode("signup");
                      setError("");
                      setInfo("");
                    }}
                    style={S.link}
                  >
                    Sign up free
                  </button>
                </p>
                <button
                  onClick={() => {
                    setMode("forgot");
                    setError("");
                    setInfo("");
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--color-text-secondary)",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    fontSize: "13px"
                  }}
                >
                  Forgot password?
                </button>
              </>
            )}

            {mode === "signup" && (
              <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", margin: 0 }}>
                Already have an account?{" "}
                <button
                  onClick={() => {
                    setMode("login");
                    setError("");
                    setInfo("");
                  }}
                  style={S.link}
                >
                  Sign in
                </button>
              </p>
            )}

            {mode === "forgot" && (
              <button
                onClick={() => {
                  setMode("login");
                  setError("");
                  setInfo("");
                }}
                style={S.link}
              >
                ← Back to sign in
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

One small note: createUser() is still in this file but not being used. You can leave it for now, but later it’s better to remove unused code.
