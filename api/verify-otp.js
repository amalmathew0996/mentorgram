import nodemailer from "nodemailer";

export const config = { runtime: "nodejs" };

function signOTP(email, otp, secret) {
  const payload = `${email}:${otp}:${Math.floor(Date.now() / 600000)}`;
  return btoa(payload + ":" + secret.slice(0, 8));
}

function verifyOTP(email, otp, token, secret) {
  // Check current and previous window (10 min each)
  const now = Math.floor(Date.now() / 600000);
  for (const window of [now, now - 1]) {
    const payload = `${email}:${otp}:${window}`;
    const expected = btoa(payload + ":" + secret.slice(0, 8));
    if (token === expected) return true;
  }
  return false;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { email, otp, token, password, name } = req.body;
  const secret = process.env.OTP_SECRET || "mentorgram_secret_2026";

  if (!verifyOTP(email, otp, token, secret)) {
    return res.status(400).json({ error: "Invalid or expired code. Please try again." });
  }

  try {
    const supaUrl = process.env.VITE_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Create user in Supabase (email already verified since we did OTP ourselves)
    const createRes = await fetch(`${supaUrl}/auth/v1/admin/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
      body: JSON.stringify({ email, password, email_confirm: true, user_metadata: { full_name: name } }),
    });

    let userData = await createRes.json();

    // If user already exists, that's fine — just log them in
    if (!createRes.ok && !userData.message?.includes("already registered")) {
      throw new Error(userData.message || "Failed to create account");
    }

    // Now sign them in to get session
    const loginRes = await fetch(`${supaUrl}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: process.env.VITE_SUPABASE_ANON_KEY },
      body: JSON.stringify({ email, password }),
    });
    const session = await loginRes.json();
    if (!loginRes.ok) throw new Error(session.error_description || "Login failed");

    return res.status(200).json({ success: true, session, user: session.user });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
