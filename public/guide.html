import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";

export const config = { runtime: "nodejs" };

export default async function handler(req, res) {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };

  if (req.method === "OPTIONS") return res.status(200).json({});
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { email, consent } = req.body || {};

  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "Valid email required" });
  }
  if (!consent) {
    return res.status(400).json({ error: "Consent required" });
  }

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

    // Fetch the PDF from the public URL (more reliable in serverless than filesystem)
    let pdfBuffer;
    try {
      // Try filesystem first (works locally and some Vercel configs)
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
        // Fallback: fetch from our own domain
        const pdfRes = await fetch("https://mentorgramai.com/sponsorship-guide.pdf");
        if (pdfRes.ok) {
          pdfBuffer = Buffer.from(await pdfRes.arrayBuffer());
        }
      }
    } catch (e) {
      console.error("PDF load error:", e.message);
    }

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

            <!-- Header -->
            <div style="background:linear-gradient(135deg,#1a3fa8,#0d2478);padding:40px 36px;text-align:center;">
              <img src="https://mentorgramai.com/logo.png" alt="Mentorgram" width="56" height="56" style="border-radius:14px;display:block;margin:0 auto 16px;" />
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:800;letter-spacing:-0.02em;">Your Free Guide is Attached!</h1>
              <p style="margin:10px 0 0;color:#b0c4f8;font-size:15px;">How to Land a UK Visa-Sponsored Role</p>
            </div>

            <!-- Body -->
            <div style="padding:36px;">
              <p style="margin:0 0 16px;color:#1a1a2e;font-size:16px;line-height:1.6;">Hi,</p>
              <p style="margin:0 0 16px;color:#1a1a2e;font-size:15px;line-height:1.7;">
                Thank you for downloading our free guide. Your PDF is attached to this email — simply open the attachment to start reading.
              </p>

              <!-- What's inside box -->
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

              <!-- CTA Button -->
              <div style="text-align:center;margin:24px 0;">
                <a href="https://mentorgramai.com/jobs"
                   style="display:inline-block;padding:14px 32px;background:#1a3fa8;color:#ffffff;text-decoration:none;border-radius:10px;font-size:16px;font-weight:700;letter-spacing:-0.01em;">
                  Search Sponsored Jobs →
                </a>
              </div>

              <p style="margin:24px 0 0;color:#64748b;font-size:13px;line-height:1.6;">
                Good luck with your job search! If you have any questions, reply to this email or reach us at
                <a href="mailto:info@mentorgramai.com" style="color:#1a3fa8;">info@mentorgramai.com</a>
              </p>
            </div>

            <!-- Footer -->
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
      attachments: pdfBuffer ? [
        {
          filename: "Mentorgram_UK_Sponsorship_Guide.pdf",
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ] : [],
    });

    // Also notify yourself as a lead
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
    console.error("Email error:", err);
    return res.status(500).json({ error: "Failed to send email. Please try again." });
  }
}
