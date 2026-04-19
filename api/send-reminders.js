// /api/send-reminders.js — Daily cron: emails reminders for upcoming deadlines via Resend
// Reads from the `applications` table. Runs daily at 9am via Vercel cron.
export const config = { runtime: "nodejs" };

const SUPA_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPA_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || "Mentorgram AI <reminders@mentorgramai.com>";

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!RESEND_API_KEY) {
    return res.status(500).json({ error: "RESEND_API_KEY not configured" });
  }
  if (!SUPA_URL || !SUPA_SERVICE_KEY) {
    return res.status(500).json({ error: "Supabase env vars not configured" });
  }

  try {
    // Get all applications with a deadline, a reminder_days set, and not yet reminded
    const todayISO = new Date().toISOString().split("T")[0];

    const appsRes = await fetch(
      `${SUPA_URL}/rest/v1/applications?deadline=not.is.null&reminder_days=not.is.null&reminder_sent=eq.false&select=*`,
      { headers: { apikey: SUPA_SERVICE_KEY, Authorization: `Bearer ${SUPA_SERVICE_KEY}` } }
    );

    if (!appsRes.ok) {
      const errText = await appsRes.text();
      return res.status(500).json({ error: "Supabase fetch failed", details: errText });
    }

    const applications = await appsRes.json();
    if (!Array.isArray(applications) || applications.length === 0) {
      return res.status(200).json({ ok: true, sent: 0, message: "No applications need reminders" });
    }

    // Filter to those where (deadline - reminder_days) <= today
    const dueNow = applications.filter(app => {
      if (!app.deadline || !app.reminder_days) return false;
      const deadline = new Date(app.deadline);
      const remindOn = new Date(deadline.getTime() - app.reminder_days * 86400000);
      remindOn.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      // Trigger if today >= remind date AND deadline hasn't passed by more than a day
      const dayAfterDeadline = new Date(deadline.getTime() + 86400000);
      return today >= remindOn && today <= dayAfterDeadline;
    });

    if (dueNow.length === 0) {
      return res.status(200).json({ ok: true, sent: 0, checked: applications.length, message: "None due today" });
    }

    // Batch-fetch user emails (unique user IDs only)
    const userIds = [...new Set(dueNow.map(a => a.user_id))];
    const userEmails = {};
    for (const uid of userIds) {
      try {
        const uRes = await fetch(`${SUPA_URL}/auth/v1/admin/users/${uid}`, {
          headers: { apikey: SUPA_SERVICE_KEY, Authorization: `Bearer ${SUPA_SERVICE_KEY}` }
        });
        if (uRes.ok) {
          const u = await uRes.json();
          if (u?.email) userEmails[uid] = u.email;
        }
      } catch { /* skip */ }
    }

    let sentCount = 0;
    const results = [];

    for (const app of dueNow) {
      const email = userEmails[app.user_id];
      if (!email) { results.push({ id: app.id, error: "No email" }); continue; }

      try {
        const deadline = new Date(app.deadline);
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const daysUntil = Math.ceil((deadline - today) / 86400000);

        const urgency = daysUntil < 0 ? "⚠️ OVERDUE"
          : daysUntil === 0 ? "🚨 DUE TODAY"
          : daysUntil === 1 ? "⏰ Due tomorrow"
          : `📅 Due in ${daysUntil} days`;

        const emailHtml = `
<!DOCTYPE html>
<html>
<body style="margin: 0; padding: 0; background: #f4f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;">
  <div style="max-width: 560px; margin: 0 auto; padding: 24px;">
    <div style="background: linear-gradient(135deg, #1A3FA8, #7C3AED); padding: 28px 24px; border-radius: 12px 12px 0 0; color: #fff;">
      <h1 style="margin: 0 0 6px; font-size: 22px; font-weight: 600;">${urgency}</h1>
      <p style="margin: 0; opacity: 0.9; font-size: 14px;">Application reminder from Mentorgram AI</p>
    </div>

    <div style="background: #fff; padding: 24px; border: 1px solid #e5e7eb; border-top: none;">
      <div style="margin-bottom: 8px;">
        <span style="display: inline-block; font-size: 11px; padding: 3px 10px; border-radius: 20px; background: rgba(124,58,237,0.1); color: #7C3AED; font-weight: 600; letter-spacing: 0.02em;">${app.type || "Job"}</span>
      </div>
      <h2 style="margin: 0 0 6px; font-size: 20px; font-weight: 700; color: #1f2937;">${escapeHtml(app.title)}</h2>
      <p style="margin: 0 0 16px; color: #4b5563; font-size: 14px;">${escapeHtml(app.company)}${app.location ? " · " + escapeHtml(app.location) : ""}</p>

      <div style="background: #fef3c7; border-left: 3px solid #D97706; padding: 12px 14px; border-radius: 4px; margin-bottom: 20px;">
        <p style="margin: 0; font-size: 14px; color: #92400e; font-weight: 600;">
          Deadline: ${deadline.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      ${app.notes ? `<div style="background: #f9fafb; border-radius: 8px; padding: 12px 14px; margin-bottom: 20px;"><p style="margin: 0 0 4px; font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Your notes</p><p style="margin: 0; font-size: 13px; color: #374151; line-height: 1.5;">${escapeHtml(app.notes)}</p></div>` : ""}

      ${app.url ? `<a href="${escapeAttr(app.url)}" style="display: inline-block; padding: 12px 24px; background: #1A3FA8; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; margin-right: 8px;">View Application →</a>` : ""}
      <a href="https://mentorgramai.com" style="display: inline-block; padding: 12px 24px; background: #fff; color: #1A3FA8; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; border: 1px solid #e5e7eb;">Open Mentorgram</a>
    </div>

    <div style="background: #fff; padding: 16px 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
      <p style="margin: 0; font-size: 12px; color: #9ca3af; line-height: 1.6;">
        You set this reminder when you added the application to your Mentorgram tracker. You can change or remove reminders anytime from your dashboard.
      </p>
    </div>
  </div>
</body>
</html>
`;

        const resendRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
          body: JSON.stringify({
            from: FROM_EMAIL,
            to: email,
            subject: `${urgency}: ${app.title} at ${app.company}`,
            html: emailHtml,
          }),
        });

        if (resendRes.ok) {
          // Mark application as reminded so we don't send twice
          await fetch(`${SUPA_URL}/rest/v1/applications?id=eq.${app.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", apikey: SUPA_SERVICE_KEY, Authorization: `Bearer ${SUPA_SERVICE_KEY}` },
            body: JSON.stringify({ reminder_sent: true, reminder_sent_at: new Date().toISOString() }),
          });
          sentCount++;
          results.push({ id: app.id, email, ok: true });
        } else {
          const errTxt = await resendRes.text();
          results.push({ id: app.id, error: errTxt.slice(0, 200) });
        }
      } catch (err) {
        results.push({ id: app.id, error: err.message });
      }
    }

    return res.status(200).json({ ok: true, sent: sentCount, checked: applications.length, results });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

function escapeHtml(s) {
  return String(s || "").replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}
function escapeAttr(s) {
  return String(s || "").replace(/"/g, "&quot;");
}
