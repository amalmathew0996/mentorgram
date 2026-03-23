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

  const { email, otp, token, newPassword } = req.body;
  const secret = process.env.OTP_SECRET || "mentorgram_secret_2026";

  if (!verifyOTP(email, otp, token, secret)) {
    return res.status(400).json({ error: "Invalid or expired code." });
  }

  const supaUrl = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  try {
    // List users to find by email
    const listRes = await fetch(
      `${supaUrl}/auth/v1/admin/users?page=1&per_page=1000`,
      { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } }
    );
    const listData = await listRes.json();
    const user = (listData.users || []).find(u => u.email === email);
    if (!user) return res.status(404).json({ error: "No account found with this email" });

    // Update password
    const updateRes = await fetch(`${supaUrl}/auth/v1/admin/users/${user.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
      body: JSON.stringify({ password: newPassword }),
    });

    if (!updateRes.ok) {
      const err = await updateRes.json();
      throw new Error(err.message || "Failed to update password");
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
