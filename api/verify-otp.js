export const config = { runtime: "nodejs" };

function checkToken(email, otp, token, secret) {
  const now = Math.floor(Date.now() / 600000);
  for (const w of [now, now - 1]) {
    const expected = Buffer.from(`${email}|${otp}|${w}|${secret}`).toString("base64url");
    if (token === expected) return true;
  }
  return false;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { email, otp, token, password, name } = req.body || {};

  const secret  = process.env.OTP_SECRET || "mentorgram_2026";
  const supaUrl = process.env.VITE_SUPABASE_URL;
  const svcKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supaUrl)  return res.status(500).json({ error: "Missing VITE_SUPABASE_URL" });
  if (!svcKey)   return res.status(500).json({ error: "Missing SUPABASE_SERVICE_ROLE_KEY" });
  if (!anonKey)  return res.status(500).json({ error: "Missing VITE_SUPABASE_ANON_KEY" });
  if (!email || !otp || !token || !password)
    return res.status(400).json({ error: "Missing required fields" });

  // Verify OTP token
  if (!checkToken(email, otp, token, secret))
    return res.status(400).json({ error: "Invalid or expired code — please request a new one" });

  try {
    // Step 1: Try to create the user
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
    let crData = {};
    try { crData = JSON.parse(crText); } catch {}

    const alreadyExists =
      crText.toLowerCase().includes("already") ||
      crText.toLowerCase().includes("duplicate") ||
      crText.toLowerCase().includes("exists") ||
      cr.status === 422;

    if (!cr.ok && !alreadyExists) {
      return res.status(400).json({
        error: `Could not create account (${cr.status}): ${crData.message || crData.msg || crText.slice(0, 200)}`,
      });
    }

    // Step 2: If user already existed, update their password so login works
    if (alreadyExists && crData.id) {
      // crData has the user if it returned 422 with the user object
      await fetch(`${supaUrl}/auth/v1/admin/users/${crData.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          apikey: svcKey,
          Authorization: `Bearer ${svcKey}`,
        },
        body: JSON.stringify({ password, email_confirm: true }),
      });
    } else if (alreadyExists) {
      // Need to look up user ID first then update password
      const listRes = await fetch(
        `${supaUrl}/auth/v1/admin/users?page=1&per_page=1000`,
        { headers: { apikey: svcKey, Authorization: `Bearer ${svcKey}` } }
      );
      const listData = await listRes.json();
      const existingUser = (listData.users || []).find(u => u.email === email);
      if (existingUser) {
        await fetch(`${supaUrl}/auth/v1/admin/users/${existingUser.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            apikey: svcKey,
            Authorization: `Bearer ${svcKey}`,
          },
          body: JSON.stringify({ password, email_confirm: true }),
        });
      }
    }

    // Step 3: Small delay to let Supabase propagate the password change
    await new Promise(r => setTimeout(r, 500));

    // Step 4: Sign user in
    const lr = await fetch(`${supaUrl}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: anonKey },
      body: JSON.stringify({ email, password }),
    });

    const lrText = await lr.text();
    let lrData = {};
    try { lrData = JSON.parse(lrText); } catch {}

    if (!lr.ok) {
      return res.status(400).json({
        error: `Almost there! Account created but login failed. Please try signing in manually. (${lrData.error_description || lrData.msg || "invalid_credentials"})`,
      });
    }

    return res.status(200).json({ success: true, session: lrData, user: lrData.user });

  } catch (err) {
    return res.status(500).json({ error: "Server error: " + err.message });
  }
}
