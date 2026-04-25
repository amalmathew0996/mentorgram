// /api/email.js — Consolidated email endpoint
// Replaces: contact.js, send-guide.js
// Usage: POST /api/email?action=contact | send-guide

import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";

export const config = { runtime: "nodejs" };

function getTransporter() {
  return nodemailer.createTransport({
    host: "smtp.zoho.eu",
    port: 465,
    secure: true,
    auth: {
      user: process.env.ZOHO_EMAIL,
      pass: process.env.ZOHO_PASSWORD,
    },
  });
}

// ═══════════════════════════════════════════════════════════════
// ACTION 1: contact (contact form submissions)
// ═══════════════════════════════════════════════════════════════
async function handleContact(req, res) {
  const { name, email, subject, message } = req.body || {};

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    await getTransporter().sendMail({
      from: `"Mentorgram Contact" <${process.env.ZOHO_EMAIL}>`,
      to: process.env.ZOHO_EMAIL,
      replyTo: email,
      subject: `Mentorgram: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #534AB7, #1D9E75); padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="color: white; margin: 0;">New Contact Message</h2>
            <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0;">via mentorgramai.com</p>
          </div>
          <div style="background: #f9f9f9; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e0e0e0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666; width: 80px;"><strong>Name:</strong></td>
                <td style="padding: 8px 0;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;"><strong>Email:</strong></td>
                <td style="padding: 8px 0;"><a href="mailto:${email}">${email}</a></td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;"><strong>Subject:</strong></td>
                <td style="padding: 8px 0;">${subject}</td>
              </tr>
            </table>
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 16px 0;" />
            <p style="color: #666; margin: 0 0 8px;"><strong>Message:</strong></p>
            <p style="color: #333; line-height: 1.6; white-space: pre-wrap;">${message}</p>
          </div>
          <p style="color: #999; font-size: 12px; text-align: center; margin-top: 16px;">
            Reply directly to this email to respond to ${name}
          </p>
        </div>
      `,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Contact email error:", error);
    return res.status(500).json({ error: "Failed to send email" });
  }
}

// ═══════════════════════════════════════════════════════════════
// ACTION 2: send-guide (UK sponsorship guide PDF)
// ═══════════════════════════════════════════════════════════════
async function handleSendGuide(req, res) {
  const { email, consent } = req.body || {};

  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "Valid email required" });
  }
  if (!consent) {
    return res.status(400).json({ error: "Consent required" });
  }

  try {
    const transporter = getTransporter();

    // Try to load the PDF attachment
    let pdfBuffer;
    try {
      const possiblePaths = [
        path.join(process.cwd(), "public", "sponsorship-guide.pdf"),
        path.join(process.cwd(), "dist", "sponsorship-guide.pdf"),
        path.join("/var/task", "public", "sponsorship-guide.pdf"),
        path.join("/var/task", "dist", "sponsorship-guide.pdf"),
      ];
      let loaded = false;
      for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
          pdfBuffer = fs.readFileSync(p);
          loaded = true;
          break;
        }
      }
      if (!loaded) {
        const pdfRes = await fetch("https://mentorgramai.com/sponsorship-guide.pdf");
        if (pdfRes.ok) {
          pdfBuffer = Buffer.from(await pdfRes.arrayBuffer());
        }
      }
    } catch (e) {
      console.error("PDF load error:", e.message);
    }

    // Send guide to user
    await transporter.sendMail({
      from: `"Mentorgram AI" <${process.env.ZOHO_EMAIL}>`,
      to: email,
      subject: "Your Free Guide: How to Land a UK Visa-Sponsored Role 🇬🇧",
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"/></head>
        <body style="margin:0;padding:0;background:#f0f4ff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
          <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(26,63,168,0.1);">
            <div style="background:linear-gradient(135deg,#1a3fa8,#0d2478);padding:40px 36px;text-align:center;">
              <img src="https://mentorgramai.com/logo.png" alt="Mentorgram" width="56" height="56" style="border-radius:14px;display:block;margin:0 auto 16px;" />
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:800;letter-spacing:-0.02em;">Your Free Guide is Attached!</h1>
              <p style="margin:10px 0 0;color:#b0c4f8;font-size:15px;">How to Land a UK Visa-Sponsored Role</p>
            </div>
            <div style="padding:36px;">
              <p style="margin:0 0 16px;color:#1a1a2e;font-size:16px;line-height:1.6;">Hi,</p>
              <p style="margin:0 0 16px;color:#1a1a2e;font-size:15px;line-height:1.7;">
                Thank you for downloading our free guide. Your PDF is attached to this email — simply open the attachment to start reading.
              </p>
              <div style="background:#f0f4ff;border-radius:12px;padding:20px 24px;margin:24px 0;">
                <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#1a3fa8;text-transform:uppercase;letter-spacing:0.05em;">What's inside your guide:</p>
                <div style="display:flex;flex-direction:column;gap:8px;">
                  ${[
                    "How the UK Skilled Worker visa & sponsorship system works",
                    "7 best sources for finding sponsored jobs",
                    "CV & cover letter formula with template phrases",
                    "Interview prep + full visa timeline",
                    "5 costly mistakes and how to avoid them",
                    "Your 7-step action plan to start today",
                  ].map(item => `
                    <div style="display:flex;align-items:flex-start;gap:10px;">
                      <span style="color:#1a3fa8;font-weight:700;flex-shrink:0;margin-top:1px;">→</span>
                      <span style="font-size:14px;color:#374151;line-height:1.5;">${item}</span>
                    </div>`).join("")}
                </div>
              </div>
              <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.7;">
                While you're applying, search our live jobs board for UK roles that offer visa sponsorship:
              </p>
              <div style="text-align:center;margin:24px 0;">
                <a href="https://mentorgramai.com/jobs" style="display:inline-block;padding:14px 32px;background:#1a3fa8;color:#ffffff;text-decoration:none;border-radius:10px;font-size:16px;font-weight:700;letter-spacing:-0.01em;">
                  Search Sponsored Jobs →
                </a>
              </div>
              <p style="margin:24px 0 0;color:#64748b;font-size:13px;line-height:1.6;">
                Good luck with your job search! If you have any questions, reply to this email or reach us at
                <a href="mailto:info@mentorgramai.com" style="color:#1a3fa8;">info@mentorgramai.com</a>
              </p>
            </div>
            <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 36px;text-align:center;">
              <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6;">
                © 2026 Mentorgram AI · <a href="https://mentorgramai.com" style="color:#1a3fa8;text-decoration:none;">mentorgramai.com</a><br/>
                You received this because you requested our free guide.<br/>
                <a href="https://mentorgramai.com/privacy" style="color:#94a3b8;">Privacy Policy</a> ·
                <a href="https://mentorgramai.com/terms" style="color:#94a3b8;">Terms</a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      attachments: pdfBuffer ? [{
        filename: "Mentorgram_UK_Sponsorship_Guide.pdf",
        content: pdfBuffer,
        contentType: "application/pdf",
      }] : [],
    });

    // Notify yourself
    await transporter.sendMail({
      from: `"Mentorgram AI" <${process.env.ZOHO_EMAIL}>`,
      to: process.env.ZOHO_EMAIL,
      subject: `🎯 New Lead: ${email} downloaded the sponsorship guide`,
      html: `
        <p><strong>New guide download lead!</strong></p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Time:</strong> ${new Date().toUTCString()}</p>
        <p><strong>Consented to marketing:</strong> Yes</p>
        <p><strong>Source:</strong> Instagram guide landing page</p>
      `,
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Guide email error:", err);
    return res.status(500).json({ error: "Failed to send email. Please try again." });
  }
}

// ═══════════════════════════════════════════════════════════════
// ROUTER
// ═══════════════════════════════════════════════════════════════
export default async function handler(req, res) {
  // CORS for the lead magnet page
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Content-Type", "application/json");

  if (req.method === "OPTIONS") return res.status(200).json({});
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const action = req.query.action;

  switch (action) {
    case "contact":     return handleContact(req, res);
    case "send-guide":  return handleSendGuide(req, res);
    default:
      return res.status(400).json({ error: "Unknown action. Use: contact | send-guide" });
  }
}
