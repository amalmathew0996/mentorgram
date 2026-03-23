import { useState } from "react";
import { ConsentCheckbox } from "./Legal.jsx";

const SUPA_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPA_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

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
  return data.token;
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

const EyeIcon = ({ visible }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {visible ? (
      <>
        <path d="M1 12s4-6.5 11-6.5S23 12 23 12s-4 6.5-11 6.5S1 12 1 12z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ) : (
      <>
        <path d="M3 3l18 18" />
        <path d="M10.6 10.6A2 2 0 0013.4 13.4" />
        <path d="M9.2 5.4A11.3 11.3 0 0112 5c7 0 11 7 11 7a21.1 21.1 0 01-4.2 4.8" />
        <path d="M6.3 6.3A21.3 21.3 0 001 12s4 7 11 7a11.6 11.6 0 005.7-1.5" />
      </>
    )}
  </svg>
);

const S = {
  wrap: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "2rem 1.5rem",
    background:
      "radial-gradient(circle at top, rgba(83,74,183,0.14), transparent 30%), linear-gradient(180deg, #0b0b0f 0%, #111116 100%)"
  },
  box: {
    width: "100%",
    maxWidth: "460px"
  },
  logo: {
    width: "60px",
    height: "60px",
    borderRadius: "18px",
    background: "linear-gradient(135deg,#6C63FF,#21C7A8)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontWeight: 700,
    fontSize: "28px",
    margin: "0 auto 1.4rem",
    boxShadow: "0 12px 30px rgba(83,74,183,0.28)"
  },
  card: {
    background: "rgba(24,24,30,0.88)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "24px",
    padding: "2rem",
    boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
    backdropFilter: "blur(14px)"
  },
  inp: {
    padding: "14px 16px",
    borderRadius: "14px",
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.04)",
    color: "#F5F7FB",
    fontSize: "15px",
    outline: "none",
    fontFamily: "inherit",
    width: "100%",
    boxSizing: "border-box",
    transition: "all 0.18s ease",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)"
  },
  btn: (primary) => ({
    padding: "14px",
    borderRadius: "14px",
    background: primary ? "linear-gradient(135deg,#6257ff,#5546d7)" : "transparent",
    color: primary ? "#fff" : "var(--color-text-secondary)",
    border: primary ? "none" : "1px solid rgba(255,255,255,0.08)",
    fontSize: "15px",
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
    width: "100%",
    transition: "all 0.18s ease",
    boxShadow: primary ? "0 10px 24px rgba(83,74,183,0.28)" : "none"
  }),
  label: {
    fontSize: "13px",
    fontWeight: 600,
    color: "rgba(255,255,255,0.72)",
    display: "block",
    marginBottom: "8px"
  },
  err: {
    background: "rgba(255, 84, 84, 0.10)",
    border: "1px solid rgba(255, 84, 84, 0.24)",
    borderRadius: "14px",
    padding: "12px 14px",
    fontSize: "13px",
    color: "#ffb4b4"
  },
  ok: {
    background: "rgba(33, 199, 168, 0.10)",
    border: "1px solid rgba(33, 199, 168, 0.24)",
    borderRadius: "14px",
    padding: "12px 14px",
    fontSize: "13px",
    color: "#a7f3df"
  },
  link: {
    background: "none",
    border: "none",
    color: "#8d82ff",
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: "13px",
    fontWeight: 600,
    padding: 0
  }
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
            borderRadius: "14px",
            border: d.trim() ? "1.5px solid #6257ff" : "1px solid rgba(255,255,255,0.10)",
            background: "rgba(255,255,255,0.04)",
            color: "#F5F7FB",
            outline: "none",
            fontFamily: "monospace",
            transition: "border-color 0.15s",
            opacity: disabled ? 0.6 : 1,
            boxSizing: "border-box"
          }}
          maxLength={1}
          value={d.trim()}
          inputMode="numeric"
          disabled={disabled}
          onChange={e => {
            const v = e.target.value.replace(/\D/g, "").slice(-1);
            const newVal = digits.map((x, j) => (j === i ? v : x)).join("").replace(/ /g, "");
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
                onChange(digits.map((x, j) => (j === i - 1 ? "" : x)).join("").replace(/ /g, ""));
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
  const [step, setStep] = useState("entry");
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
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [newPasswordFocused, setNewPasswordFocused] = useState(false);

  function focusInput(e) {
    e.currentTarget.style.border = "1px solid rgba(109,99,255,0.85)";
    e.currentTarget.style.boxShadow = "0 0 0 4px rgba(98,87,255,0.12)";
  }

  function blurInput(e) {
    e.currentTarget.style.border = "1px solid rgba(255,255,255,0.10)";
    e.currentTarget.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.03)";
  }

  function startTimer() {
    setResendTimer(60);
    const t = setInterval(() => {
      setResendTimer(n => {
        if (n <= 1) {
          clearInterval(t);
          return 0;
        }
        return n - 1;
      });
    }, 1000);
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
          <div style={{ textAlign: "center", marginBottom: "2.2rem" }}>
            <div style={S.logo}>✉</div>
            <h1 style={{ fontSize: "2.2rem", fontWeight: 700, margin: "0 0 0.65rem", letterSpacing: "-0.03em", color: "#fff" }}>
              Check your email
            </h1>
            <p style={{ color: "rgba(255,255,255,0.62)", fontSize: "1rem", margin: 0, lineHeight: 1.6 }}>
              Enter the 6-digit code sent to
            </p>
            <p style={{ fontSize: "15px", fontWeight: 600, margin: "6px 0 0", color: "#fff" }}>{email}</p>
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
                      style={{
                        ...S.inp,
                        paddingRight: "44px",
                        border: newPasswordFocused ? "1px solid rgba(109,99,255,0.85)" : S.inp.border,
                        boxShadow: newPasswordFocused
                          ? "0 0 0 4px rgba(98,87,255,0.12)"
                          : "inset 0 1px 0 rgba(255,255,255,0.03)"
                      }}
                      type={showNewPassword ? "text" : "password"}
                      placeholder="At least 8 characters"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      onFocus={() => setNewPasswordFocused(true)}
                      onBlur={() => setNewPasswordFocused(false)}
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
                        cursor: "pointer",
                        color: "rgba(255,255,255,0.56)",
                        padding: 0,
                        display: "flex",
                        alignItems: "center"
                      }}
                      onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.88)")}
                      onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.56)")}
                    >
                      <EyeIcon visible={showNewPassword} />
                    </button>
                  </div>
                </div>
              )}

              <button
                style={{ ...S.btn(true), opacity: loading || otp.length < 6 ? 0.65 : 1 }}
                onClick={isReset ? handleResetPassword : handleVerifyOTP}
                disabled={loading || otp.length < 6}
              >
                {loading ? "Verifying..." : isReset ? "Reset password" : "Verify & create account"}
              </button>

              <p style={{ textAlign: "center", fontSize: "13px", color: "rgba(255,255,255,0.62)", margin: 0 }}>
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
                style={{ ...S.btn(false), fontSize: "13px", padding: "10px" }}
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
        <div style={{ textAlign: "center", marginBottom: "2.2rem" }}>
          <div style={S.logo}>M</div>
          <h1 style={{ fontSize: "2.2rem", fontWeight: 700, margin: "0 0 0.65rem", letterSpacing: "-0.03em", color: "#fff" }}>
            {mode === "login" ? "Welcome back" : mode === "signup" ? "Create your account" : "Reset your password"}
          </h1>
          <p style={{ color: "rgba(255,255,255,0.62)", fontSize: "1rem", margin: 0, lineHeight: 1.6 }}>
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
                  onFocus={focusInput}
                  onBlur={blurInput}
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
                onFocus={focusInput}
                onBlur={blurInput}
                onKeyDown={e => e.key === "Enter" && (mode === "login" ? handleLogin() : mode === "signup" ? handleSignup() : handleForgot())}
              />
            </div>

            {mode !== "forgot" && (
              <div>
                <label style={S.label}>Password</label>
                <div style={{ position: "relative" }}>
                  <input
                    style={{
                      ...S.inp,
                      paddingRight: "44px",
                      border: passwordFocused ? "1px solid rgba(109,99,255,0.85)" : S.inp.border,
                      boxShadow: passwordFocused
                        ? "0 0 0 4px rgba(98,87,255,0.12)"
                        : "inset 0 1px 0 rgba(255,255,255,0.03)"
                    }}
                    type={showPassword ? "text" : "password"}
                    placeholder={mode === "signup" ? "At least 8 characters" : "Your password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
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
                      cursor: "pointer",
                      color: "rgba(255,255,255,0.56)",
                      padding: 0,
                      display: "flex",
                      alignItems: "center"
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.88)")}
                    onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.56)")}
                  >
                    <EyeIcon visible={showPassword} />
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
              style={{ ...S.btn(true), opacity: loading ? 0.7 : 1, marginTop: "6px" }}
              onClick={mode === "login" ? handleLogin : mode === "signup" ? handleSignup : handleForgot}
              disabled={loading}
            >
              {loading ? "Please wait..." : mode === "login" ? "Sign in" : mode === "signup" ? "Create account & verify email" : "Send reset code"}
            </button>
          </div>

          <div
            style={{
              borderTop: "1px solid rgba(255,255,255,0.08)",
              marginTop: "1.4rem",
              paddingTop: "1.2rem",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              textAlign: "center"
            }}
          >
            {mode === "login" && (
              <>
                <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.62)", margin: 0 }}>
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
                    color: "rgba(255,255,255,0.62)",
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
              <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.62)", margin: 0 }}>
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
