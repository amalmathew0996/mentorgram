export function jobKey(job) {
  try {
    const url = new URL(job.url); url.hash = '';
    for (const key of [...url.searchParams.keys()]) if (/^utm_|^(gclid|fbclid)$/i.test(key)) url.searchParams.delete(key);
    url.searchParams.sort();
    return url.href;
  } catch { return `${job.title}|${job.company}|${job.location}`; }
}
export function countdown(schedule, now) {
  if (!schedule?.schedule_enabled) return 'Automatic searches are off';
  const due = Date.parse(schedule.next_run_at);
  if (!Number.isFinite(due)) return 'Next run is not set';
  const seconds = Math.ceil((due - now) / 1000);
  if (seconds <= 0) return 'Due now — waiting for the scheduler';
  return `Next run in ${Math.floor(seconds / 3600)}h ${Math.floor(seconds % 3600 / 60)}m ${seconds % 60}s`;
}
export function nextScheduleTime(enabled, frequency, nextRun, saved, now = Date.now()) {
  if (!enabled) return null;
  if (frequency === '6_hours') {
    if (saved?.schedule_enabled && saved.check_frequency === frequency && saved.next_run_at) return saved.next_run_at;
    return new Date(now + 6 * 3600000).toISOString();
  }
  return nextRun && Date.parse(nextRun) > now ? nextRun : new Date(now).toISOString();
}
export function recordDiscovery(seen, jobs, run, previousJobs = []) {
  const updated = { ...seen };
  for (const job of previousJobs) if (!updated[jobKey(job)]) updated[jobKey(job)] = 'previous';
  for (const job of jobs) if (!updated[jobKey(job)]) updated[jobKey(job)] = run;
  return { seen: updated, newKeys: jobs.filter(job => updated[jobKey(job)] === run).map(jobKey) };
}
