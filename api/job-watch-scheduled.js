import { timingSafeEqual } from "node:crypto";
import { fetchWatchJobs } from "./live-jobs.js";
import { matchJobs, splitTerms } from "../src/jobWatchUtils.js";
import { siteURL } from "../lib/jobWatchSites.js";

export const config = { runtime: "nodejs", maxDuration: 60 };

export function validSecret(header, secret) {
  if (!secret || !header) return false;
  const actual = Buffer.from(header), expected = Buffer.from(`Bearer ${secret}`);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function scheduledFilters(preference, profile = {}) {
  const titles = splitTerms([profile.job_title, ...(preference.additional_job_titles || [])].filter(Boolean).join(","));
  if (!titles.length) throw new Error("Add at least one job title and save your preferences.");
  if (titles.length > 10) throw new Error("Use up to ten distinct job titles including your profile title.");
  const customSites = (preference.custom_sites || []).filter(site => site.enabled).slice(0, 5).map(site => siteURL(site.url).href);
  const sources = (preference.sources || []).filter(s => ["nhs_jobs", "nhs_scotland", "trac", "jobs_ac_uk"].includes(s));
  if (!sources.length && !customSites.length) throw new Error("Select at least one source and save preferences.");
  return { titles, locations: splitTerms([profile.preferred_location, ...(preference.additional_locations || [])].filter(Boolean).join(",")), sources, customSites, sponsorshipRequired: preference.sponsorship_required === true };
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!validSecret(req.headers?.authorization, process.env.JOB_WATCH_CRON_SECRET)) return res.status(401).json({ error: "Unauthorized" });
  const base = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) return res.status(500).json({ error: "Job Watch server configuration is incomplete" });
  const db = async (path, options = {}) => {
    const response = await fetch(`${base}/rest/v1${path}`, { ...options, headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=representation", ...options.headers }, signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error("Job Watch database request failed");
    return response.status === 204 ? null : response.json();
  };
  try {
    const due = await db("/rpc/claim_job_watch_schedules", { method: "POST", body: "{}" });
    const outcomes = await Promise.all(due.map(async pref => {
      let runId;
      let success = false;
      try {
        const inserted = await db("/job_watch_runs", { method: "POST", body: JSON.stringify({ user_id: pref.user_id, run_kind: "scheduled", status: "running" }) });
        runId = inserted[0].id;
        const profiles = await db(`/profiles?user_id=eq.${encodeURIComponent(pref.user_id)}&select=job_title,preferred_location&limit=1`);
        const filters = scheduledFilters(pref, profiles?.[0]);
        const summary = `${filters.titles.join(", ")} · ${filters.locations.join(", ") || "All locations"}${filters.sponsorshipRequired ? " · Sponsorship indicated only" : ""}`;
        // Stored results are bounded and paged; live sources run concurrently.
        const [live, stored] = await Promise.allSettled([
          fetchWatchJobs({ selected: filters.sources, titles: filters.titles, customSites: filters.customSites }),
          Promise.all([0, 1000, 2000].map(offset => db(`/jobs?select=*&order=created_at.desc&limit=1000&offset=${offset}`))).then(pages => pages.flat()),
        ]);
        if ((live.status === "rejected" || !live.value.available) && stored.status === "rejected") throw new Error("Job sources are unavailable. The schedule will retry in 15 minutes.");
        const warnings = live.status === "fulfilled" ? [...live.value.warnings] : ["Live search unavailable; stored listings only."];
        if (stored.status === "rejected") warnings.push("Stored listings unavailable; live results only.");
        if (stored.status === "fulfilled" && stored.value.length === 3000) warnings.push("Searched the latest 3,000 stored listings; older listings may be missing.");
        const combined = [...(live.status === "fulfilled" ? live.value.jobs : []), ...(stored.status === "fulfilled" ? stored.value.map(job => ({ ...job, origin: "stored" })) : [])];
        const matches = matchJobs(combined, filters);
        if (matches.length > 200) warnings.push("Showing the first 200 matches. Narrow your titles or locations for fewer results.");
        await db(`/job_watch_runs?id=eq.${runId}`, { method: "PATCH", body: JSON.stringify({ status: "complete", completed_at: new Date().toISOString(), jobs: matches.slice(0, 200), warnings, summary }) });
        success = true;
      } catch (error) {
        if (runId) await db(`/job_watch_runs?id=eq.${runId}`, { method: "PATCH", body: JSON.stringify({ status: "failed", completed_at: new Date().toISOString(), error: error.message }) }).catch(() => {});
      } finally {
        await db("/rpc/finish_job_watch_schedule", { method: "POST", body: JSON.stringify({ p_user_id: pref.user_id, p_lock: pref.watch_lock, p_success: success, p_due_at: pref.next_run_at }) });
      }
      return { success };
    }));
    return res.status(200).json({ processed: outcomes.length, succeeded: outcomes.filter(r => r.success).length });
  } catch {
    return res.status(500).json({ error: "Scheduled Job Watch could not complete. Check server configuration and database setup." });
  }
}
