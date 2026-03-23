import nodemailer from "nodemailer";

export const config = { runtime: "nodejs" };

// Simple in-memory OTP store (edge-compatible via KV or just use short-lived tokens)
// For edge runtime we'll use a signed token approach instead

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function signOTP(email, otp, secret) {
  const payload = `${email}:${otp}:${Math.floor(Date.now() / 600000)}`;
  return Buffer.from(payload + ":" + secret.slice(0, 8)).toString("base64");
}

export function verifyOTP(email, otp, token, secret) {
  const expected = signOTP(email, otp, secret);
  return token === expected;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { email, type = "signup" } = req.body;
    if (!email) return res.status(400).json({ error: "Email required" });

    const otp = generateOTP();
    const secret = process.env.OTP_SECRET || "mentorgram_secret_2026";
    const token = signOTP(email, otp, secret);

    const transporter = nodemailer.createTransport({
      host: "smtp.zoho.eu",
      port: 465,
      secure: true,
      auth: {
        user: process.env.ZOHO_EMAIL,
        pass: process.env.ZOHO_PASSWORD,
      },
    });

    const subjects = {
      signup: "Verify your Mentorgram account",
      reset: "Reset your Mentorgram password",
    };

    const titles = {
      signup: "Verify your email address",
      reset: "Reset your password",
    };

    const descriptions = {
      signup: "Enter this code to verify your email and activate your Mentorgram account.",
      reset: "Enter this code to reset your password.",
    };

    await transporter.sendMail({
      from: `"Mentorgram AI" <${process.env.ZOHO_EMAIL}>`,
      to: email,
      subject: subjects[type] || subjects.signup,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <div style="background: linear-gradient(135deg, #534AB7, #1D9E75); padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">Mentorgram AI</h1>
            <p style="color: rgba(255,255,255,0.85); margin: 6px 0 0; font-size: 14px;">AI-Powered Education & Career Platform</p>
          </div>
          <div style="background: #f9f9f9; padding: 32px 24px; border-radius: 0 0 12px 12px; border: 1px solid #e0e0e0; border-top: none; text-align: center;">
            <h2 style="color: #1a1a1a; font-size: 20px; margin: 0 0 8px;">${titles[type]}</h2>
            <p style="color: #666; font-size: 14px; margin: 0 0 28px; line-height: 1.6;">${descriptions[type]}</p>
            <div style="background: white; border: 2px solid #534AB7; border-radius: 12px; padding: 20px; display: inline-block; margin-bottom: 24px;">
              <p style="font-size: 11px; color: #666; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 1px;">Your verification code</p>
              <p style="font-size: 42px; font-weight: 700; letter-spacing: 10px; color: #534AB7; margin: 0; font-family: monospace;">${otp}</p>
            </div>
            <p style="color: #999; font-size: 12px; margin: 0;">This code expires in <strong>10 minutes</strong>.</p>
            <p style="color: #999; font-size: 12px; margin: 8px 0 0;">If you didn't request this, please ignore this email.</p>
          </div>
          <p style="text-align: center; color: #ccc; font-size: 11px; margin-top: 16px;">© 2026 Mentorgram AI · mentorgramai.com</p>
        </div>
      `,
    });

    // Return token so frontend can verify without storing server-side
    return res.status(200).json({ success: true, token });
  } catch (err) {
    console.error("OTP send error:", err);
    return res.status(500).json({ error: "Failed to send email: " + err.message });
  }
}
