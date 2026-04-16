// Combined webhook handler — Telegram + Stripe
export const config = { runtime: "nodejs", maxDuration: 30 };

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID;
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const SUPA_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function sendTelegram(chatId, text) {
  await fetch("https://api.telegram.org/bot" + BOT_TOKEN + "/sendMessage", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", disable_web_page_preview: true }),
  });
}

async function getChannelInviteLink() {
  const res = await fetch("https://api.telegram.org/bot" + BOT_TOKEN + "/createChatInviteLink", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: CHANNEL_ID,
      member_limit: 1,
      expire_date: Math.floor(Date.now() / 1000) + 86400,
    }),
  });
  const data = await res.json();
  return data.result?.invite_link;
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

async function handleTelegram(body) {
  const message = body.message || body.edited_message;
  if (!message) return;

  const chatId = message.chat.id;
  const text = (message.text || "").trim();
  const firstName = message.from?.first_name || "there";

  if (text.startsWith("/start")) {
    const code = text.split(" ")[1];
    if (code && code.length > 10) {
      await supaFetch("/profiles?user_id=eq." + code, {
        method: "PATCH",
        body: JSON.stringify({ telegram_chat_id: String(chatId), updated_at: new Date().toISOString() }),
      });
      // Generate a one-time invite link to the premium channel
      var inviteLink = await getChannelInviteLink();

      var welcomeMsg = "✅ <b>Connected to Mentorgram!</b>\n\n" +
        "Hi " + firstName + "! 👋 Welcome to Mentorgram Premium!\n\n";

      if (inviteLink) {
        welcomeMsg += "👉 <b>Join your Premium Jobs channel here:</b>\n" + inviteLink + "\n\n" +
          "⚠️ This link is one-time use — join now before it expires!\n\n";
      }

      welcomeMsg += "📋 You will receive 5 curated UK visa sponsorship jobs every Friday matched to your profile.\n\n" +
        "🌐 Update your preferences at mentorgramai.com\n\n" +
        "Type /stop at any time to unsubscribe.";

      await sendTelegram(chatId, welcomeMsg);
    } else {
      await sendTelegram(chatId,
        "👋 <b>Welcome to Mentorgram AI!</b>\n\n" +
        "To connect your account and receive weekly job alerts, visit:\n\n" +
        "🌐 mentorgramai.com → My Profile → Connect Telegram\n\n" +
        "Then click <b>Connect Telegram</b> to link your account."
      );
    }
  } else if (text === "/stop") {
    await supaFetch("/profiles?telegram_chat_id=eq." + chatId, {
      method: "PATCH",
      body: JSON.stringify({ telegram_chat_id: null, updated_at: new Date().toISOString() }),
    });
    await sendTelegram(chatId, "✅ You have been unsubscribed from Mentorgram job alerts. Reconnect anytime from your dashboard.");
  } else if (text === "/help") {
    await sendTelegram(chatId,
      "<b>Mentorgram AI Bot</b>\n\n" +
      "I send weekly UK visa sponsorship job alerts every Friday.\n\n" +
      "/stop — unsubscribe\n/help — show this message\n\n" +
      "Visit mentorgramai.com to manage your preferences."
    );
  }
}

async function handleStripe(rawBody, sig) {
  const crypto = require("crypto");
  let event;

  if (WEBHOOK_SECRET && sig) {
    const parts = sig.split(",");
    const timestamp = parts.find(p => p.startsWith("t="))?.slice(2);
    const sigHash = parts.find(p => p.startsWith("v1="))?.slice(3);
    const payload = timestamp + "." + rawBody;
    const expected = crypto.createHmac("sha256", WEBHOOK_SECRET).update(payload).digest("hex");
    if (expected !== sigHash) throw new Error("Invalid signature");
    event = JSON.parse(rawBody);
  } else {
    event = JSON.parse(rawBody);
  }

  if (event.type === "checkout.session.completed" || event.type === "customer.subscription.created") {
    const session = event.data.object;
    const customerEmail = session.customer_email || session.customer_details?.email;
    const customerId = session.customer;

    if (customerEmail) {
      const profiles = await supaFetch("/profiles?email=eq." + encodeURIComponent(customerEmail) + "&select=*");
      const profile = profiles && profiles[0];

      if (profile) {
        await supaFetch("/profiles?user_id=eq." + profile.user_id, {
          method: "PATCH",
          body: JSON.stringify({ is_premium: true, stripe_customer_id: customerId, updated_at: new Date().toISOString() }),
        });

        if (profile.telegram_chat_id) {
          const inviteLink = await getChannelInviteLink();
          if (inviteLink) {
            await sendTelegram(profile.telegram_chat_id,
              "🎉 <b>Welcome to Mentorgram Premium!</b>\n\n" +
              "Your payment was successful! Here is your exclusive channel link:\n\n" +
              "👉 " + inviteLink + "\n\n" +
              "⚠️ This link is one-time use and expires in 24 hours.\n\n" +
              "📋 You will receive 5 curated jobs every Friday!"
            );
          }
        }
      }
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const customerId = event.data.object.customer;
    const profiles = await supaFetch("/profiles?stripe_customer_id=eq." + customerId + "&select=*");
    const profile = profiles && profiles[0];
    if (profile) {
      await supaFetch("/profiles?user_id=eq." + profile.user_id, {
        method: "PATCH",
        body: JSON.stringify({ is_premium: false, updated_at: new Date().toISOString() }),
      });
      if (profile.telegram_chat_id) {
        await sendTelegram(profile.telegram_chat_id,
          "👋 Your Mentorgram Premium subscription has been cancelled.\n\n" +
          "Resubscribe anytime at mentorgramai.com/premium"
        );
      }
    }
  }
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).json({ ok: true });
  if (req.method === "GET") return res.status(200).json({ ok: true });

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const rawBody = Buffer.concat(chunks).toString("utf8");

  try {
    const stripeSignature = req.headers["stripe-signature"];

    if (stripeSignature) {
      // This is a Stripe webhook
      await handleStripe(rawBody, stripeSignature);
    } else {
      // This is a Telegram webhook
      const body = JSON.parse(rawBody);
      await handleTelegram(body);
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Webhook error:", err.message);
    return res.status(200).json({ ok: true });
  }
}
