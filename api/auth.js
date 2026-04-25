// /api/auth.js — Consolidated auth endpoint
// Replaces: send-otp.js, verify-otp.js, delete-account.js
// Usage: POST /api/auth?action=send-otp | verify-otp | delete-account

import nodemailer from "nodemailer";

export const config = { runtime: "nodejs" };

// ── Helpers ──
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function signOTP(email, otp, secret) {
  const w = Math.floor(Date.now() / 600000);
  return Buffer.from(`${email}:${otp}:${w}:${secret.slice(0,8)}`).toString("base64");
}

function verifyOTP(email, otp, token, secret) {
  // Accept current and previous 10-min window
  const now = Math.floor(Date.now() / 600000);
  for (const w of [now, now - 1]) {
    const expected = Buffer.from(`${email}:${otp}:${w}:${secret.slice(0,8)}`).toString("base64");
    if (token === expected) return true;
  }
  return false;
}

// ═══════════════════════════════════════════════════════════════
// ACTION 1: send-otp (sends OTP code via Zoho email)
// ═══════════════════════════════════════════════════════════════
async function handleSendOtp(req, res) {
  const { email, type = "signup" } = req.body || {};
  if (!email) return res.status(400).json({ error: "Email required" });

  try {
    const otp = generateOTP();
    const secret = process.env.OTP_SECRET || "mentorgram_secret_2026";
    const token = signOTP(email, otp, secret);

    const transporter = nodemailer.createTransport({
      host: "smtp.zoho.eu",
      port: 465,
      secure: true,
      auth: {
        user: process.env.ZOHO_EMAIL,
        pass: process.env.ZOHO_PASSWORD,
      },
    });

    const subjects = {
      signup: "Verify your Mentorgram account",
      reset: "Reset your Mentorgram password",
    };
    const titles = {
      signup: "Verify your email address",
      reset: "Reset your password",
    };
    const descriptions = {
      signup: "Enter this code to verify your email and activate your Mentorgram account.",
      reset: "Enter this code to reset your password.",
    };

    await transporter.sendMail({
      from: `"Mentorgram AI" <${process.env.ZOHO_EMAIL}>`,
      to: email,
      subject: subjects[type] || subjects.signup,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <div style="background: linear-gradient(135deg, #534AB7, #1D9E75); padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">Mentorgram AI</h1>
            <p style="color: rgba(255,255,255,0.85); margin: 6px 0 0; font-size: 14px;">AI-Powered Education & Career Platform</p>
          </div>
          <div style="background: #f9f9f9; padding: 32px 24px; border-radius: 0 0 12px 12px; border: 1px solid #e0e0e0; border-top: none; text-align: center;">
            <h2 style="color: #1a1a1a; font-size: 20px; margin: 0 0 8px;">${titles[type] || titles.signup}</h2>
            <p style="color: #666; font-size: 14px; margin: 0 0 28px; line-height: 1.6;">${descriptions[type] || descriptions.signup}</p>
            <div style="background: white; border: 2px solid #534AB7; border-radius: 12px; padding: 20px; display: inline-block; margin-bottom: 24px;">
              <p style="font-size: 11px; color: #666; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 1px;">Your verification code</p>
              <p style="font-size: 42px; font-weight: 700; letter-spacing: 10px; color: #534AB7; margin: 0; font-family: monospace;">${otp}</p>
            </div>
            <p style="color: #999; font-size: 12px; margin: 0;">This code expires in <strong>10 minutes</strong>.</p>
            <p style="color: #999; font-size: 12px; margin: 8px 0 0;">If you didn't request this, please ignore this email.</p>
          </div>
          <p style="text-align: center; color: #ccc; font-size: 11px; margin-top: 16px;">© 2026 Mentorgram AI · mentorgramai.com</p>
        </div>
      `,
    });

    return res.status(200).json({ success: true, token });
  } catch (err) {
    console.error("OTP send error:", err);
    return res.status(500).json({ error: "Failed to send email: " + err.message });
  }
}

// ═══════════════════════════════════════════════════════════════
// ACTION 2: verify-otp (verifies OTP, creates user, logs in)
// ═══════════════════════════════════════════════════════════════
async function handleVerifyOtp(req, res) {
  const { email, otp, token, password, name } = req.body || {};
  if (!email || !otp || !token || !password) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const secret = process.env.OTP_SECRET || "mentorgram_secret_2026";
  const supaUrl = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supaUrl) return res.status(500).json({ error: "Missing VITE_SUPABASE_URL" });
  if (!serviceKey) return res.status(500).json({ error: "Missing SUPABASE_SERVICE_ROLE_KEY" });
  if (!anonKey) return res.status(500).json({ error: "Missing VITE_SUPABASE_ANON_KEY" });

  if (!verifyOTP(email, otp, token, secret)) {
    return res.status(400).json({ error: "Invalid or expired code — please request a new one" });
  }

  try {
    // Step 1 — Create user
    const createRes = await fetch(`${supaUrl}/auth/v1/admin/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": serviceKey,
        "Authorization": `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: name || "" },
      }),
    });

    const createText = await createRes.text();
    let createData = {};
    try { createData = JSON.parse(createText); } catch { createData = { raw: createText }; }

    const isAlreadyExists = createText.toLowerCase().includes("already") ||
      createText.toLowerCase().includes("duplicate") ||
      createText.toLowerCase().includes("exists");

    if (!createRes.ok && !isAlreadyExists) {
      return res.status(400).json({
        error: `Account creation failed (${createRes.status}): ${createData.message || createData.msg || createData.error || createText.slice(0, 200)}`
      });
    }

    // Step 2 — Log in
    const loginRes = await fetch(`${supaUrl}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": anonKey },
      body: JSON.stringify({ email, password }),
    });

    const loginText = await loginRes.text();
    let loginData = {};
    try { loginData = JSON.parse(loginText); } catch { loginData = { raw: loginText }; }

    if (!loginRes.ok) {
      return res.status(400).json({
        error: `Login failed (${loginRes.status}): ${loginData.error_description || loginData.message || loginText.slice(0, 200)}`
      });
    }

    return res.status(200).json({ success: true, session: loginData, user: loginData.user });
  } catch (err) {
    return res.status(500).json({ error: "Exception: " + err.message });
  }
}

// ═══════════════════════════════════════════════════════════════
// ACTION 3: delete-account
// ═══════════════════════════════════════════════════════════════
async function handleDeleteAccount(req, res) {
  const { user_id, token } = req.body || {};
  if (!user_id || !token) {
    return res.status(400).json({ error: "Missing user_id or token" });
  }

  const supaUrl = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supaUrl || !serviceKey || !anonKey) {
    return res.status(500).json({ error: "Server config missing" });
  }

  try {
    // Verify token belongs to user
    const verifyRes = await fetch(`${supaUrl}/auth/v1/user`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${token}` },
    });
    const userData = await verifyRes.json();
    if (userData.id !== user_id) {
      return res.status(401).json({ error: "Unauthorised" });
    }

    // Delete user
    const deleteRes = await fetch(`${supaUrl}/auth/v1/admin/users/${user_id}`, {
      method: "DELETE",
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
    });

    if (!deleteRes.ok) {
      const errText = await deleteRes.text();
      return res.status(500).json({ error: "Delete failed: " + errText.slice(0, 200) });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// ═══════════════════════════════════════════════════════════════
// ROUTER
// ═══════════════════════════════════════════════════════════════
export default async function handler(req, res) {
  // Set JSON content type immediately so even errors return JSON
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const action = req.query.action;

  try {
    switch (action) {
      case "send-otp":        return await handleSendOtp(req, res);
      case "verify-otp":      return await handleVerifyOtp(req, res);
      case "delete-account":  return await handleDeleteAccount(req, res);
      default:
        return res.status(400).json({ error: "Unknown action. Use: send-otp | verify-otp | delete-account" });
    }
  } catch (err) {
    console.error("Auth endpoint error:", err);
    return res.status(500).json({
      error: err.message || "Server error",
      details: err.stack ? err.stack.split("\n").slice(0, 3).join(" | ") : "no stack"
    });
  }
}
