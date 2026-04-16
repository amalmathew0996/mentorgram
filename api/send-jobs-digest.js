// Weekly job digest — runs every Friday at 2pm UTC
// Posts to Telegram channel AND sends personal DMs to subscribers
export const config = { runtime: "nodejs", maxDuration: 60 };

const SUPA_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID;
const CRON_SECRET = process.env.CRON_SECRET;

async function sendTelegram(chatId, text) {
  const res = await fetch("https://api.telegram.org/bot" + BOT_TOKEN + "/sendMessage", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", disable_web_page_preview: true }),
  });
  return res.ok;
}

async function supaFetch(path) {
  const res = await fetch(SUPA_URL + "/rest/v1" + path, {
    headers: {
      "Content-Type": "application/json",
      apikey: SUPA_KEY,
      Authorization: "Bearer " + SUPA_KEY,
    },
  });
  if (res.status === 204) return null;
  return res.json();
}

function formatChannelPost(jobs) {
  const date = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
  let msg = "🎯 <b>Weekly Visa Sponsorship Jobs — " + date + "</b>\n\n";
  msg += "This week's top UK visa sponsorship opportunities:\n\n";
  jobs.slice(0, 10).forEach(function(job, i) {
    msg += (i + 1) + ". <b>" + job.title + "</b>\n";
    msg += "   🏢 " + job.company + "\n";
    msg += "   📍 " + job.location + "\n";
    if (job.salary) msg += "   💰 " + job.salary + "\n";
    msg += "   ✅ Visa Sponsorship Offered\n";
    if (job.url) msg += "   🔗 <a href='" + job.url + "'>Apply now</a>\n";
    msg += "\n";
  });
  msg += "─────────────────────\n";
  msg += "🔍 <a href='https://mentorgramai.com/jobs'>Browse 15,000+ more jobs</a>\n";
  msg += "💼 <a href='https://mentorgramai.com/cv-generator'>Generate your tailored CV</a>\n\n";
  msg += "📩 Share this channel with friends looking for UK jobs!";
  return msg;
}

export default async function handler(req, res) {
  const auth = req.headers.authorization || "";
  if (auth !== "Bearer " + CRON_SECRET) {
    return res.status(401).json({ error: "Unauthorised" });
  }

  try {
    // Get latest jobs from Supabase
    const jobsData = await supaFetch("/jobs?select=title,company,location,salary,sector,sponsorship,url&sponsorship=eq.true&order=created_at.desc&limit=500");
    const allJobs = jobsData || [];

    if (allJobs.length === 0) {
      return res.status(200).json({ message: "No jobs found", sent: 0 });
    }

    // Shuffle for variety
    const shuffled = allJobs.sort(function() { return Math.random() - 0.5; });

    // 1. Post to the premium channel (all members see it)
    const channelMsg = formatChannelPost(shuffled);
    const channelOk = await sendTelegram(CHANNEL_ID, channelMsg);
    console.log("Channel post:", channelOk ? "sent" : "failed");

    // 2. Send personalised DMs to subscribers who connected their Telegram
    const profiles = await supaFetch("/profiles?telegram_chat_id=not.is.null&is_premium=eq.true&select=*");
    const subscribers = profiles || [];

    let sent = 0;
    let failed = 0;

    for (const profile of subscribers) {
      if (!profile.telegram_chat_id) continue;
      try {
        // Filter jobs by their preferences
        const sectors = profile.sectors || [];
        const location = (profile.preferred_location || "").toLowerCase();
        let matched = shuffled.filter(function(j) {
          const sectorOk = sectors.length === 0 || sectors.includes(j.sector);
          const locOk = !location || (j.location || "").toLowerCase().includes(location);
          return sectorOk && locOk;
        });
        if (matched.length === 0) matched = shuffled; // fallback to all jobs

        const name = profile.full_name ? profile.full_name.split(" ")[0] : "there";
        let msg = "👋 Hi <b>" + name + "</b>! Here are your personalised jobs this week:\n\n";
        matched.slice(0, 10).forEach(function(job, i) {
          msg += (i + 1) + ". <b>" + job.title + "</b>\n";
          msg += "   🏢 " + job.company + "\n";
          msg += "   📍 " + job.location + "\n";
          if (job.salary) msg += "   💰 " + job.salary + "\n";
          if (job.url) msg += "   🔗 <a href='" + job.url + "'>Apply now</a>\n";
          msg += "\n";
        });
        msg += "🔍 <a href='https://mentorgramai.com/jobs'>Browse all jobs</a> · Type /stop to unsubscribe";

        const ok = await sendTelegram(profile.telegram_chat_id, msg);
        if (ok) sent++; else failed++;
        await new Promise(function(r) { setTimeout(r, 50); });
      } catch(e) {
        failed++;
      }
    }

    return res.status(200).json({
      message: "Digest sent",
      channel: channelOk,
      subscribers: subscribers.length,
      sent,
      failed,
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
