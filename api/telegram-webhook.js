// Telegram webhook — handles /start command and saves chat_id to Supabase
export const config = { runtime: "nodejs", maxDuration: 10 };

const SUPA_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

async function sendMessage(chatId, text) {
  await fetch("https://api.telegram.org/bot" + BOT_TOKEN + "/sendMessage", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });
}

async function supaFetch(path, opts = {}) {
  const res = await fetch(SUPA_URL + "/rest/v1" + path, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      apikey: SUPA_KEY,
      Authorization: "Bearer " + SUPA_KEY,
      Prefer: "return=representation",
      ...(opts.headers || {}),
    },
  });
  if (res.status === 204) return null;
  return res.json();
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method !== "POST") return res.status(200).json({ ok: true });

  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = JSON.parse(Buffer.concat(chunks).toString("utf8"));

    const message = body.message || body.edited_message;
    if (!message) return res.status(200).json({ ok: true });

    const chatId = message.chat.id;
    const text = (message.text || "").trim();
    const firstName = message.from?.first_name || "there";

    // /start CODE — user clicked the connect link from Mentorgram dashboard
    if (text.startsWith("/start")) {
      const parts = text.split(" ");
      const code = parts[1]; // this is the user_id from Mentorgram

      if (code && code.length > 10) {
        // Save telegram_chat_id to their profile
        await supaFetch("/profiles?user_id=eq." + code, {
          method: "PATCH",
          body: JSON.stringify({ telegram_chat_id: String(chatId), updated_at: new Date().toISOString() }),
        });

        await sendMessage(chatId,
          "✅ <b>Connected to Mentorgram!</b>\n\n" +
          "Hi " + firstName + "! 👋 You'll now receive weekly UK visa sponsorship job alerts every Friday.\n\n" +
          "📋 Jobs will be matched to your profile sectors and preferences.\n\n" +
          "🔧 To update your preferences, visit your dashboard at mentorgramai.com\n\n" +
          "Type /stop at any time to unsubscribe."
        );
      } else {
        await sendMessage(chatId,
          "👋 <b>Welcome to Mentorgram AI!</b>\n\n" +
          "To connect your account and receive weekly job alerts, please go to your dashboard at:\n\n" +
          "🌐 mentorgramai.com → My Profile → Notifications\n\n" +
          "Then click <b>Connect Telegram</b> to get your personalised link."
        );
      }
    }

    // /stop — unsubscribe
    else if (text === "/stop") {
      // Find profile by chat_id and remove it
      await supaFetch("/profiles?telegram_chat_id=eq." + chatId, {
        method: "PATCH",
        body: JSON.stringify({ telegram_chat_id: null, updated_at: new Date().toISOString() }),
      });
      await sendMessage(chatId, "✅ You've been unsubscribed from Mentorgram job alerts. You can reconnect anytime from your dashboard.");
    }

    // /help
    else if (text === "/help") {
      await sendMessage(chatId,
        "<b>Mentorgram AI Bot</b>\n\n" +
        "I send you weekly UK visa sponsorship job alerts every Friday.\n\n" +
        "Commands:\n" +
        "/stop — unsubscribe from alerts\n" +
        "/help — show this message\n\n" +
        "Visit mentorgramai.com to update your job preferences."
      );
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Telegram webhook error:", err.message);
    return res.status(200).json({ ok: true }); // always 200 to Telegram
  }
}
