// Stripe webhook — auto-sends Telegram channel invite when someone pays
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
      member_limit: 1, // one-time use link
      expire_date: Math.floor(Date.now() / 1000) + 86400, // expires in 24 hours
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
      ...(opts.headers || {}),
    },
  });
  if (res.status === 204) return null;
  return res.json();
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(200).json({ ok: true });

  try {
    // Read raw body for Stripe signature verification
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const rawBody = Buffer.concat(chunks).toString("utf8");
    const sig = req.headers["stripe-signature"];

    // Verify Stripe signature if webhook secret is set
    let event;
    if (WEBHOOK_SECRET && sig) {
      // Simple manual verification
      const crypto = require("crypto");
      const parts = sig.split(",");
      const timestamp = parts.find(p => p.startsWith("t="))?.slice(2);
      const sigHash = parts.find(p => p.startsWith("v1="))?.slice(3);
      const payload = timestamp + "." + rawBody;
      const expected = crypto.createHmac("sha256", WEBHOOK_SECRET).update(payload).digest("hex");
      if (expected !== sigHash) {
        return res.status(400).json({ error: "Invalid signature" });
      }
      event = JSON.parse(rawBody);
    } else {
      event = JSON.parse(rawBody);
    }

    // Handle successful payment
    if (event.type === "checkout.session.completed" || event.type === "customer.subscription.created") {
      const session = event.data.object;
      const customerEmail = session.customer_email || session.customer_details?.email;
      const customerId = session.customer;

      console.log("Payment received from:", customerEmail);

      // Find user in Supabase by email
      if (customerEmail) {
        const profiles = await supaFetch("/profiles?email=eq." + encodeURIComponent(customerEmail) + "&select=*");
        const profile = profiles && profiles[0];

        if (profile && profile.telegram_chat_id) {
          // User already connected Telegram — send invite link directly
          const inviteLink = await getChannelInviteLink();
          if (inviteLink) {
            await sendTelegram(profile.telegram_chat_id,
              "🎉 <b>Welcome to Mentorgram Premium!</b>\n\n" +
              "Your payment was successful. Here is your exclusive link to join our Premium Jobs channel:\n\n" +
              "👉 " + inviteLink + "\n\n" +
              "This link is <b>one-time use</b> and expires in 24 hours.\n\n" +
              "📋 You will receive 5 curated visa sponsorship jobs every Friday!\n\n" +
              "Questions? Contact us at info@mentorgramai.com"
            );
          }
          // Update profile with premium status
          await supaFetch("/profiles?user_id=eq." + profile.user_id, {
            method: "PATCH",
            body: JSON.stringify({ is_premium: true, stripe_customer_id: customerId, updated_at: new Date().toISOString() }),
          });
        } else {
          // User hasn't connected Telegram yet — they'll do it on success page
          // Save premium status so success page knows
          if (profile) {
            await supaFetch("/profiles?user_id=eq." + profile.user_id, {
              method: "PATCH",
              body: JSON.stringify({ is_premium: true, stripe_customer_id: customerId, updated_at: new Date().toISOString() }),
            });
          }
          console.log("User paid but no Telegram connected yet:", customerEmail);
        }
      }
    }

    // Handle subscription cancellation
    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object;
      const customerId = subscription.customer;

      // Find profile by stripe_customer_id and revoke premium
      const profiles = await supaFetch("/profiles?stripe_customer_id=eq." + customerId + "&select=*");
      const profile = profiles && profiles[0];

      if (profile) {
        await supaFetch("/profiles?user_id=eq." + profile.user_id, {
          method: "PATCH",
          body: JSON.stringify({ is_premium: false, updated_at: new Date().toISOString() }),
        });
        // Notify user
        if (profile.telegram_chat_id) {
          await sendTelegram(profile.telegram_chat_id,
            "👋 Your Mentorgram Premium subscription has been cancelled.\n\n" +
            "You will no longer receive weekly job alerts. You can resubscribe anytime at mentorgramai.com/premium\n\n" +
            "Thank you for being a member!"
          );
        }
      }
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error("Stripe webhook error:", err.message);
    return res.status(200).json({ received: true }); // Always 200 to Stripe
  }
}
