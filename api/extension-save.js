// /api/extension-save.js
// Receives job data from the Chrome extension and saves to Supabase applications table

export const config = { runtime: "nodejs" };

export default async function handler(req, res) {
  // CORS headers so extension can call this
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");

    if (!token) {
      return res.status(401).json({ error: "No auth token provided" });
    }

    const { title, company, location, description, url, source, user_id } = req.body || {};

    if (!title || !company) {
      return res.status(400).json({ error: "Missing job title or company" });
    }

    if (!user_id) {
      return res.status(400).json({ error: "Missing user_id" });
    }

    const supaUrl = process.env.VITE_SUPABASE_URL;
    const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

    if (!supaUrl || !anonKey) {
      return res.status(500).json({ error: "Server config missing" });
    }

    // Verify the token and get the user (this checks auth)
    const userRes = await fetch(`${supaUrl}/auth/v1/user`, {
      headers: {
        "apikey": anonKey,
        "Authorization": `Bearer ${token}`
      }
    });

    if (!userRes.ok) {
      return res.status(401).json({ error: "Invalid or expired auth token" });
    }

    const userData = await userRes.json();

    // Make sure the user_id in the request matches the authenticated user
    if (userData.id !== user_id) {
      return res.status(403).json({ error: "User ID mismatch" });
    }

    // Detect job type from title/description
    const text = `${title} ${description || ""}`.toLowerCase();
    const type = /phd/.test(text) ? "PhD" :
                 /master|msc|ma /i.test(title) ? "Masters" :
                 /intern/.test(text) ? "Internship" : "Job";

    // Detect sponsorship mentions
    const mentionsSponsorship = /visa sponsor|sponsorship|tier 2|skilled worker|sponsored/i.test(text);

    // Save to applications table
    const appRes = await fetch(`${supaUrl}/rest/v1/applications`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": anonKey,
        "Authorization": `Bearer ${token}`,
        "Prefer": "return=representation"
      },
      body: JSON.stringify({
        user_id,
        title: title.slice(0, 200),
        company: company.slice(0, 200),
        location: location ? location.slice(0, 150) : null,
        url: url || null,
        type,
        status: "Want to apply",
        notes: [
          source ? `Source: ${source}` : null,
          mentionsSponsorship ? "✓ Mentions visa sponsorship" : null,
          description ? description.slice(0, 400) : null
        ].filter(Boolean).join(" · "),
        reminder_days: null,
        reminder_sent: false
      })
    });

    if (!appRes.ok) {
      const err = await appRes.text();
      return res.status(500).json({ error: "Failed to save: " + err.slice(0, 200) });
    }

    const saved = await appRes.json();

    return res.status(200).json({
      success: true,
      application: Array.isArray(saved) ? saved[0] : saved
    });

  } catch (err) {
    console.error("[extension-save]", err);
    return res.status(500).json({ error: "Server error: " + err.message });
  }
}
