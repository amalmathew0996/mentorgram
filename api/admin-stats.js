export const config = { runtime: "nodejs", maxDuration: 30 };

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "mentorgram-admin-2026";

export default async function handler(req, res) {
  // Check admin password from header
  const auth = req.headers["x-admin-password"];
  if (auth !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Unauthorised" });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({ error: "Missing env vars" });
  }

  const headers = {
    "apikey":        serviceKey,
    "Authorization": `Bearer ${serviceKey}`,
    "Content-Type":  "application/json",
  };

  // DELETE all jobs
  if (req.method === "DELETE") {
    await fetch(`${supabaseUrl}/rest/v1/jobs?id=neq.00000000-0000-0000-0000-000000000000`, {
      method: "DELETE",
      headers: { ...headers, "Prefer": "return=minimal" },
    });
    return res.status(200).json({ success: true, message: "All jobs deleted" });
  }

  // GET stats
  try {
    const now = new Date();
    const todayStart  = new Date(now); todayStart.setHours(0,0,0,0);
    const yesterdayStart = new Date(todayStart); yesterdayStart.setDate(yesterdayStart.getDate() - 1);

    // Run all queries in parallel
    const [
      totalRes,
      reedRes,
      adzunaRes,
      jobsacRes,
      guardianRes,
      todayRes,
      yesterdayRes,
      newestRes,
      expiringSoonRes,
    ] = await Promise.all([
      // Total count
      fetch(`${supabaseUrl}/rest/v1/jobs?select=id`, {
        headers: { ...headers, "Prefer": "count=exact", "Range": "0-0" },
      }),
      // By source counts
      fetch(`${supabaseUrl}/rest/v1/jobs?select=id&source=eq.Reed`, {
        headers: { ...headers, "Prefer": "count=exact", "Range": "0-0" },
      }),
      fetch(`${supabaseUrl}/rest/v1/jobs?select=id&source=eq.Adzuna`, {
        headers: { ...headers, "Prefer": "count=exact", "Range": "0-0" },
      }),
      fetch(`${supabaseUrl}/rest/v1/jobs?select=id&source=eq.jobs.ac.uk`, {
        headers: { ...headers, "Prefer": "count=exact", "Range": "0-0" },
      }),
      fetch(`${supabaseUrl}/rest/v1/jobs?select=id&source=eq.Guardian+Jobs`, {
        headers: { ...headers, "Prefer": "count=exact", "Range": "0-0" },
      }),
      // Jobs added today
      fetch(`${supabaseUrl}/rest/v1/jobs?select=id&created_at=gte.${todayStart.toISOString()}`, {
        headers: { ...headers, "Prefer": "count=exact", "Range": "0-0" },
      }),
      // Jobs added yesterday
      fetch(`${supabaseUrl}/rest/v1/jobs?select=id&created_at=gte.${yesterdayStart.toISOString()}&created_at=lt.${todayStart.toISOString()}`, {
        headers: { ...headers, "Prefer": "count=exact", "Range": "0-0" },
      }),
      // Most recently added job (to determine last refresh time)
      fetch(`${supabaseUrl}/rest/v1/jobs?select=created_at&order=created_at.desc&limit=1`, {
        headers,
      }),
      // Jobs expiring in next 3 days
      fetch(`${supabaseUrl}/rest/v1/jobs?select=id&expires_at=lt.${new Date(Date.now() + 3*24*60*60*1000).toISOString()}`, {
        headers: { ...headers, "Prefer": "count=exact", "Range": "0-0" },
      }),
    ]);

    const getCount = (r) => {
      const match = (r.headers.get("content-range") || "").match(/\/(\d+)/);
      return match ? parseInt(match[1]) : 0;
    };

    const newestData = await newestRes.json();
    const lastRefresh = newestData?.[0]?.created_at || null;

    // Calculate next scheduled refresh (every 2 hours from last refresh)
    let nextRefresh = null;
    if (lastRefresh) {
      const last = new Date(lastRefresh);
      nextRefresh = new Date(last.getTime() + 2 * 60 * 60 * 1000).toISOString();
    }

    return res.status(200).json({
      total:        getCount(totalRes),
      bySource: {
        reed:        getCount(reedRes),
        adzuna:      getCount(adzunaRes),
        jobsac:      getCount(jobsacRes),
        guardian:    getCount(guardianRes),
      },
      addedToday:     getCount(todayRes),
      addedYesterday: getCount(yesterdayRes),
      expiringSoon:   getCount(expiringSoonRes),
      lastRefresh,
      nextRefresh,
      serverTime:   now.toISOString(),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
