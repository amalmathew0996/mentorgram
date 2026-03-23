export const config = { runtime: "nodejs" };

function verifyOTP(email, otp, token, secret) {
  const now = Math.floor(Date.now() / 600000);
  for (const window of [now, now - 1]) {
    const payload = `${email}:${otp}:${window}`;
    const expected = Buffer.from(payload + ":" + secret.slice(0, 8)).toString("base64");
    if (token === expected) return true;
  }
  return false;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { email, otp, token, password, name } = req.body;
  if (!email || !otp || !token || !password) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const secret = process.env.OTP_SECRET || "mentorgram_secret_2026";

  // Verify OTP token
  if (!verifyOTP(email, otp, token, secret)) {
    return res.status(400).json({ error: "Invalid or expired code. Please request a new one." });
  }

  const supaUrl = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supaUrl || !serviceKey || !anonKey) {
    return res.status(500).json({ error: "Server configuration error — missing Supabase keys" });
  }

  try {
    // Step 1: Try to create the user (admin API — bypasses email confirmation)
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

    const createData = await createRes.json();

    // If not created and it's not a "already exists" error, fail
    if (!createRes.ok) {
      const msg = createData.message || createData.error || "";
      // "already registered" is fine — user exists, just log them in
      if (!msg.toLowerCase().includes("already") && !msg.toLowerCase().includes("duplicate") && !msg.toLowerCase().includes("exists")) {
        console.error("Create user error:", JSON.stringify(createData));
        return res.status(400).json({ error: "Could not create account: " + msg });
      }
    }

    // Step 2: Log the user in to get a session
    const loginRes = await fetch(`${supaUrl}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": anonKey,
      },
      body: JSON.stringify({ email, password }),
    });

    const loginData = await loginRes.json();

    if (!loginRes.ok) {
      console.error("Login error:", JSON.stringify(loginData));
      return res.status(400).json({ error: loginData.error_description || loginData.message || "Login failed after account creation" });
    }

    return res.status(200).json({
      success: true,
      session: loginData,
      user: loginData.user,
    });

  } catch (err) {
    console.error("verify-otp error:", err);
    return res.status(500).json({ error: "Server error: " + err.message });
  }
}
