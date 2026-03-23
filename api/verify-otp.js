export const config = { runtime: "nodejs" };

function checkToken(email, otp, token, secret) {
  const now = Math.floor(Date.now() / 600000);
  for (const w of [now, now - 1]) {
    const raw = `${email}|${otp}|${w}|${secret}`;
    const expected = Buffer.from(raw).toString("base64url");
    if (token === expected) return true;
  }
  return false;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { email, otp, token, password, name } = req.body || {};

  const secret   = process.env.OTP_SECRET      || "mentorgram_2026";
  const supaUrl  = process.env.VITE_SUPABASE_URL;
  const svcKey   = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey  = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supaUrl)  return res.status(500).json({ error: "Missing VITE_SUPABASE_URL" });
  if (!svcKey)   return res.status(500).json({ error: "Missing SUPABASE_SERVICE_ROLE_KEY" });
  if (!anonKey)  return res.status(500).json({ error: "Missing VITE_SUPABASE_ANON_KEY" });
  if (!email || !otp || !token || !password)
    return res.status(400).json({ error: "Missing required fields" });

  if (!checkToken(email, otp, token, secret))
    return res.status(400).json({ error: "Invalid or expired code — please request a new one" });

  try {
    // Create user (email_confirm: true skips Supabase's own email)
    const cr = await fetch(`${supaUrl}/auth/v1/admin/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: svcKey,
        Authorization: `Bearer ${svcKey}`,
      },
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: name || "" },
      }),
    });

    const crText = await cr.text();
    const crData = JSON.parse(crText || "{}");

    const alreadyExists =
      crText.toLowerCase().includes("already") ||
      crText.toLowerCase().includes("duplicate") ||
      crText.toLowerCase().includes("exists");

    if (!cr.ok && !alreadyExists) {
      return res.status(400).json({
        error: `Could not create account (${cr.status}): ${crData.message || crData.msg || crText.slice(0, 150)}`,
      });
    }

    // Sign user in
    const lr = await fetch(`${supaUrl}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: anonKey },
      body: JSON.stringify({ email, password }),
    });

    const lrText = await lr.text();
    const lrData = JSON.parse(lrText || "{}");

    if (!lr.ok) {
      return res.status(400).json({
        error: `Login failed (${lr.status}): ${lrData.error_description || lrData.message || lrText.slice(0, 150)}`,
      });
    }

    return res.status(200).json({ success: true, session: lrData, user: lrData.user });

  } catch (err) {
    return res.status(500).json({ error: "Server error: " + err.message });
  }
}
