export const config = { runtime: "nodejs" };

function verifyOTP(email, otp, token, secret) {
  const now = Math.floor(Date.now() / 600000);
  for (const w of [now, now - 1]) {
    const expected = Buffer.from(`${email}:${otp}:${w}:${secret.slice(0,8)}`).toString("base64");
    if (token === expected) return true;
  }
  return false;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { email, otp, token, password, name } = req.body || {};
  if (!email || !otp || !token || !password) {
    return res.status(400).json({ error: "Missing fields: " + JSON.stringify({ email: !!email, otp: !!otp, token: !!token, password: !!password }) });
  }

  const secret = process.env.OTP_SECRET || "mentorgram_secret_2026";
  const supaUrl = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

  // Debug: check env vars exist (don't log actual values)
  if (!supaUrl) return res.status(500).json({ error: "Missing VITE_SUPABASE_URL" });
  if (!serviceKey) return res.status(500).json({ error: "Missing SUPABASE_SERVICE_ROLE_KEY" });
  if (!anonKey) return res.status(500).json({ error: "Missing VITE_SUPABASE_ANON_KEY" });

  // Verify OTP
  if (!verifyOTP(email, otp, token, secret)) {
    return res.status(400).json({ error: "Invalid or expired code — please request a new one" });
  }

  try {
    // Step 1 — Create user via Supabase admin API
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

    // Step 2 — Log user in to get session
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
