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

  const { email, otp, token, newPassword } = req.body || {};
  const secret  = process.env.OTP_SECRET || "mentorgram_2026";
  const supaUrl = process.env.VITE_SUPABASE_URL;
  const svcKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!checkToken(email, otp, token, secret))
    return res.status(400).json({ error: "Invalid or expired code" });

  try {
    // Find user by email via admin list
    const lr = await fetch(`${supaUrl}/auth/v1/admin/users?page=1&per_page=1000`, {
      headers: { apikey: svcKey, Authorization: `Bearer ${svcKey}` },
    });
    const ld = await lr.json();
    const user = (ld.users || []).find(u => u.email === email);
    if (!user) return res.status(404).json({ error: "No account found with this email" });

    // Update password
    const ur = await fetch(`${supaUrl}/auth/v1/admin/users/${user.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        apikey: svcKey,
        Authorization: `Bearer ${svcKey}`,
      },
      body: JSON.stringify({ password: newPassword }),
    });

    if (!ur.ok) {
      const ud = await ur.json();
      throw new Error(ud.message || "Failed to update password");
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
