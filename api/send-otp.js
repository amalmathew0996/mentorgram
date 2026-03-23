import nodemailer from "nodemailer";

export const config = { runtime: "nodejs" };

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function makeToken(email, otp, secret) {
  const window = Math.floor(Date.now() / 600000);
  const raw = `${email}|${otp}|${window}|${secret}`;
  return Buffer.from(raw).toString("base64url");
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { email, type = "signup" } = req.body || {};
  if (!email) return res.status(400).json({ error: "Email required" });

  const otp = generateOTP();
  const secret = process.env.OTP_SECRET || "mentorgram_2026";
  const token = makeToken(email, otp, secret);

  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.zoho.eu",
      port: 465,
      secure: true,
      auth: {
        user: process.env.ZOHO_EMAIL,
        pass: process.env.ZOHO_PASSWORD,
      },
    });

    const isReset = type === "reset";

    await transporter.sendMail({
      from: `"Mentorgram AI" <${process.env.ZOHO_EMAIL}>`,
      to: email,
      subject: isReset ? "Reset your Mentorgram password" : "Verify your Mentorgram account",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;">
          <div style="background:linear-gradient(135deg,#534AB7,#1D9E75);padding:28px 24px;border-radius:14px 14px 0 0;text-align:center;">
            <div style="width:54px;height:54px;background:rgba(255,255,255,0.15);border-radius:14px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px;">
              <span style="font-size:26px;">✉</span>
            </div>
            <h1 style="color:white;margin:0;font-size:22px;font-weight:700;">Mentorgram AI</h1>
          </div>
          <div style="background:#f9f9f9;padding:32px 24px;border-radius:0 0 14px 14px;border:1px solid #e8e8e8;border-top:none;text-align:center;">
            <h2 style="color:#1a1a1a;font-size:20px;margin:0 0 8px;">${isReset ? "Reset your password" : "Verify your email"}</h2>
            <p style="color:#666;font-size:14px;margin:0 0 28px;line-height:1.6;">
              ${isReset ? "Enter this code to reset your password." : "Enter this code to activate your Mentorgram account."}
            </p>
            <div style="background:white;border:2px solid #534AB7;border-radius:14px;padding:24px 20px;display:inline-block;margin-bottom:24px;min-width:200px;">
              <p style="font-size:11px;color:#888;margin:0 0 10px;text-transform:uppercase;letter-spacing:2px;font-weight:600;">Your code</p>
              <p style="font-size:46px;font-weight:800;letter-spacing:12px;color:#534AB7;margin:0;font-family:monospace;">${otp}</p>
            </div>
            <p style="color:#aaa;font-size:12px;margin:0;">Expires in <strong>10 minutes</strong>. If you didn't request this, ignore this email.</p>
          </div>
          <p style="text-align:center;color:#ccc;font-size:11px;margin-top:16px;">© 2026 Mentorgram AI · mentorgramai.com</p>
        </div>
      `,
    });

    return res.status(200).json({ success: true, token });
  } catch (err) {
    console.error("send-otp error:", err.message);
    return res.status(500).json({ error: "Failed to send email: " + err.message });
  }
}
