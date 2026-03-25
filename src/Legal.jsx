import { useState, useEffect } from "react";

const S = {
  page: { maxWidth: "760px", margin: "0 auto", padding: "2rem 1.5rem" },
  card: { background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: "2rem" },
  h1: { fontSize: "1.8rem", fontWeight: 500, margin: "0 0 0.5rem", color: "var(--color-text-primary)" },
  h2: { fontSize: "1.1rem", fontWeight: 500, margin: "1.75rem 0 0.5rem", color: "var(--color-text-primary)" },
  p: { fontSize: "14px", lineHeight: 1.8, color: "var(--color-text-secondary)", margin: "0 0 0.75rem" },
  li: { fontSize: "14px", lineHeight: 1.8, color: "var(--color-text-secondary)", marginBottom: "4px" },
  updated: { fontSize: "13px", color: "var(--color-text-secondary)", margin: "0 0 2rem", borderBottom: "0.5px solid var(--color-border-tertiary)", paddingBottom: "1rem" },
};

// ─── Privacy Policy ────────────────────────────────────────────────────────
export function PrivacyPage() {
  return (
    <div style={S.page}>
      <h1 style={S.h1}>Privacy Policy</h1>
      <p style={S.updated}>Last updated: March 2026 · Mentorgram AI Limited</p>
      <div style={S.card}>

        <p style={S.p}>This Privacy Policy explains how <strong>Mentorgram AI</strong> ("we", "us", "our") collects, uses, stores and protects your personal data when you use our platform at <strong>mentorgramai.com</strong>. We are committed to protecting your privacy in accordance with the <strong>UK General Data Protection Regulation (UK GDPR)</strong> and the <strong>Data Protection Act 2018</strong>.</p>

        <h2 style={S.h2}>1. Who We Are</h2>
        <p style={S.p}>Mentorgram AI is an AI-powered education and career guidance platform based in the United Kingdom. Our contact details are:</p>
        <ul style={{ paddingLeft: "1.25rem", margin: "0 0 0.75rem" }}>
          <li style={S.li}>Email: info@mentorgramai.com</li>
          <li style={S.li}>Website: mentorgramai.com</li>
          <li style={S.li}>Jurisdiction: England and Wales</li>
        </ul>

        <h2 style={S.h2}>2. What Personal Data We Collect</h2>
        <p style={S.p}>When you create an account or use our platform, we may collect:</p>
        <ul style={{ paddingLeft: "1.25rem", margin: "0 0 0.75rem" }}>
          <li style={S.li}><strong>Account data:</strong> your name and email address</li>
          <li style={S.li}><strong>Profile data:</strong> job title, preferred sectors, experience level, preferred location, skills, visa status, and a personal bio — all provided voluntarily by you</li>
          <li style={S.li}><strong>Usage data:</strong> pages visited, features used, and session activity (collected via Vercel Analytics)</li>
          <li style={S.li}><strong>Communications:</strong> messages sent via the contact form</li>
        </ul>
        <p style={S.p}>We do <strong>not</strong> collect sensitive personal data such as racial or ethnic origin, health data, or financial information.</p>

        <h2 style={S.h2}>3. Why We Collect Your Data (Lawful Basis)</h2>
        <ul style={{ paddingLeft: "1.25rem", margin: "0 0 0.75rem" }}>
          <li style={S.li}><strong>Contract performance:</strong> to provide the service you signed up for (job matching, AI mentoring)</li>
          <li style={S.li}><strong>Legitimate interests:</strong> to improve our platform and prevent fraud</li>
          <li style={S.li}><strong>Consent:</strong> for optional features like marketing communications (you may withdraw at any time)</li>
        </ul>

        <h2 style={S.h2}>4. How We Use Your Data</h2>
        <ul style={{ paddingLeft: "1.25rem", margin: "0 0 0.75rem" }}>
          <li style={S.li}>To create and manage your account</li>
          <li style={S.li}>To provide personalised job recommendations based on your profile</li>
          <li style={S.li}>To power the AI Mentor chat (conversations are not stored permanently)</li>
          <li style={S.li}>To respond to contact form enquiries</li>
          <li style={S.li}>To improve and develop our platform</li>
        </ul>

        <h2 style={S.h2}>5. Who We Share Your Data With</h2>
        <p style={S.p}>We do not sell your personal data. We share data only with trusted third-party processors necessary to operate the platform:</p>
        <ul style={{ paddingLeft: "1.25rem", margin: "0 0 0.75rem" }}>
          <li style={S.li}><strong>Supabase</strong> (database and authentication) — EU/UK infrastructure, GDPR compliant</li>
          <li style={S.li}><strong>Vercel</strong> (hosting and analytics) — GDPR compliant</li>
          <li style={S.li}><strong>Anthropic</strong> (AI processing) — used for AI Mentor responses only</li>
          <li style={S.li}><strong>Zoho</strong> (email) — for contact form responses</li>
        </ul>

        <h2 style={S.h2}>6. How Long We Keep Your Data</h2>
        <ul style={{ paddingLeft: "1.25rem", margin: "0 0 0.75rem" }}>
          <li style={S.li}>Account and profile data: retained until you delete your account</li>
          <li style={S.li}>Contact form messages: 12 months</li>
          <li style={S.li}>AI chat conversations: not stored — each session is ephemeral</li>
          <li style={S.li}>Analytics data: 12 months</li>
        </ul>

        <h2 style={S.h2}>7. Your Rights Under UK GDPR</h2>
        <p style={S.p}>You have the following rights regarding your personal data:</p>
        <ul style={{ paddingLeft: "1.25rem", margin: "0 0 0.75rem" }}>
          <li style={S.li}><strong>Right of access</strong> — request a copy of your data</li>
          <li style={S.li}><strong>Right to rectification</strong> — correct inaccurate data</li>
          <li style={S.li}><strong>Right to erasure</strong> — delete your account and all associated data</li>
          <li style={S.li}><strong>Right to restriction</strong> — limit how we process your data</li>
          <li style={S.li}><strong>Right to data portability</strong> — receive your data in a portable format</li>
          <li style={S.li}><strong>Right to object</strong> — object to processing based on legitimate interests</li>
          <li style={S.li}><strong>Right to withdraw consent</strong> — at any time, where processing is based on consent</li>
        </ul>
        <p style={S.p}>To exercise any of these rights, email us at <strong>info@mentorgramai.com</strong>. We will respond within 30 days.</p>

        <h2 style={S.h2}>8. Cookies</h2>
        <p style={S.p}>We use essential cookies required to operate the platform (authentication tokens). We also use analytics cookies to understand how the platform is used. You can control cookie preferences via the cookie banner shown on your first visit. See our Cookie Policy for details.</p>

        <h2 style={S.h2}>9. Data Security</h2>
        <p style={S.p}>We use industry-standard security measures including HTTPS encryption, secure authentication via Supabase, and environment variable protection for all API keys. No system is 100% secure, but we take all reasonable steps to protect your data.</p>

        <h2 style={S.h2}>10. International Transfers</h2>
        <p style={S.p}>We store data primarily in the EU/UK. Where data is processed outside the UK (e.g. by Anthropic in the USA), we ensure appropriate safeguards are in place in accordance with UK GDPR Chapter V.</p>

        <h2 style={S.h2}>11. Children's Privacy</h2>
        <p style={S.p}>Our platform is not intended for children under 13. We do not knowingly collect data from children under 13. If you believe a child has provided us with personal data, please contact us immediately.</p>

        <h2 style={S.h2}>12. Changes to This Policy</h2>
        <p style={S.p}>We may update this policy periodically. We will notify you of significant changes by email or via the platform. Continued use after changes constitutes acceptance.</p>

        <h2 style={S.h2}>13. Complaints</h2>
        <p style={S.p}>If you are unhappy with how we handle your data, you have the right to lodge a complaint with the <strong>Information Commissioner's Office (ICO)</strong> at ico.org.uk or by calling 0303 123 1113.</p>
      </div>
    </div>
  );
}

// ─── Terms & Conditions ────────────────────────────────────────────────────
export function TermsPage() {
  return (
    <div style={S.page}>
      <h1 style={S.h1}>Terms & Conditions</h1>
      <p style={S.updated}>Last updated: March 2026 · Mentorgram AI Limited</p>
      <div style={S.card}>

        <p style={S.p}>These Terms and Conditions ("Terms") govern your use of the Mentorgram AI platform at <strong>mentorgramai.com</strong>. By creating an account or using our platform, you agree to these Terms. Please read them carefully.</p>

        <h2 style={S.h2}>1. About Mentorgram AI</h2>
        <p style={S.p}>Mentorgram AI provides AI-powered education and career guidance, UK university information, and a job listings board. We are based in the United Kingdom and operate under English law.</p>

        <h2 style={S.h2}>2. Eligibility</h2>
        <p style={S.p}>You must be at least 13 years old to use this platform. By registering, you confirm you meet this requirement.</p>

        <h2 style={S.h2}>3. Your Account</h2>
        <ul style={{ paddingLeft: "1.25rem", margin: "0 0 0.75rem" }}>
          <li style={S.li}>You are responsible for keeping your login credentials secure</li>
          <li style={S.li}>You must provide accurate information when registering</li>
          <li style={S.li}>You must not share your account with others</li>
          <li style={S.li}>You may delete your account at any time from your Profile page</li>
        </ul>

        <h2 style={S.h2}>4. Use of the Platform</h2>
        <p style={S.p}>You agree not to:</p>
        <ul style={{ paddingLeft: "1.25rem", margin: "0 0 0.75rem" }}>
          <li style={S.li}>Use the platform for any unlawful purpose</li>
          <li style={S.li}>Attempt to scrape, copy, or reverse-engineer any part of the platform</li>
          <li style={S.li}>Submit false or misleading information</li>
          <li style={S.li}>Harass, abuse, or harm other users</li>
          <li style={S.li}>Attempt to gain unauthorised access to any part of the platform</li>
        </ul>

        <h2 style={S.h2}>5. AI Mentor Disclaimer</h2>
        <p style={S.p}>The AI Mentor provides general educational and career guidance only. It does <strong>not</strong> constitute legal, financial, immigration, or professional advice. Visa and immigration information is provided for general guidance only — always consult a qualified immigration adviser or solicitor for your specific situation. Mentorgram AI accepts no liability for decisions made based on AI-generated content.</p>

        <h2 style={S.h2}>6. Job Listings</h2>
        <p style={S.p}>Job listings are sourced from third-party providers (Indeed, Reed, Adzuna). We do not verify the accuracy of job listings and are not responsible for the content of external job adverts or the conduct of employers. We do not guarantee that any job listed offers visa sponsorship — always verify directly with the employer.</p>

        <h2 style={S.h2}>7. Intellectual Property</h2>
        <p style={S.p}>All content on the platform including the Mentorgram AI brand, design, and technology is owned by or licensed to Mentorgram AI. You may not reproduce or use our content without written permission.</p>

        <h2 style={S.h2}>8. Limitation of Liability</h2>
        <p style={S.p}>To the fullest extent permitted by law, Mentorgram AI shall not be liable for any indirect, incidental, or consequential loss arising from your use of the platform. Our total liability shall not exceed £100.</p>

        <h2 style={S.h2}>9. Termination</h2>
        <p style={S.p}>We reserve the right to suspend or terminate your account if you breach these Terms. You may terminate your account at any time from your Profile settings.</p>

        <h2 style={S.h2}>10. Changes to These Terms</h2>
        <p style={S.p}>We may update these Terms from time to time. We will notify you of material changes. Continued use of the platform after changes constitutes acceptance.</p>

        <h2 style={S.h2}>11. Governing Law</h2>
        <p style={S.p}>These Terms are governed by the laws of England and Wales. Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales.</p>

        <h2 style={S.h2}>12. Contact</h2>
        <p style={S.p}>For any questions about these Terms, contact us at info@mentorgramai.com.</p>
      </div>
    </div>
  );
}

// ─── Cookie Banner ─────────────────────────────────────────────────────────
export function CookieBanner({ onAccept, onReject }) {
  return (
    <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 9999, padding: "1rem 1.5rem", background: "var(--color-background-primary)", borderTop: "0.5px solid var(--color-border-tertiary)", boxShadow: "0 -4px 20px rgba(0,0,0,0.1)" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto", display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: "260px" }}>
          <p style={{ fontSize: "14px", fontWeight: 500, margin: "0 0 4px", color: "var(--color-text-primary)" }}>🍪 We use cookies</p>
          <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", margin: 0 }}>
            We use essential cookies to keep you logged in, and optional analytics cookies to improve the platform.
            See our{" "}
            <a href="#privacy" style={{ color: "#1A3FA8" }}>Privacy Policy</a> for details.
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
          <button onClick={onReject} style={{ padding: "9px 20px", borderRadius: "var(--border-radius-md)", border: "0.5px solid var(--color-border-secondary)", background: "transparent", color: "var(--color-text-secondary)", fontSize: "13px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
            Essential only
          </button>
          <button onClick={onAccept} style={{ padding: "9px 20px", borderRadius: "var(--border-radius-md)", border: "none", background: "#1A3FA8", color: "#fff", fontSize: "13px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Consent Checkbox ──────────────────────────────────────────────────────
export function ConsentCheckbox({ checked, onChange, onViewPrivacy, onViewTerms }) {
  return (
    <label style={{ display: "flex", gap: "10px", alignItems: "flex-start", cursor: "pointer", marginTop: "4px" }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        style={{ marginTop: "2px", width: "16px", height: "16px", accentColor: "#1A3FA8", flexShrink: 0 }}
      />
      <span style={{ fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
        I agree to the{" "}
        <button onClick={onViewTerms} style={{ background: "none", border: "none", color: "#1A3FA8", cursor: "pointer", fontFamily: "inherit", fontSize: "13px", fontWeight: 500, padding: 0 }}>
          Terms & Conditions
        </button>
        {" "}and{" "}
        <button onClick={onViewPrivacy} style={{ background: "none", border: "none", color: "#1A3FA8", cursor: "pointer", fontFamily: "inherit", fontSize: "13px", fontWeight: 500, padding: 0 }}>
          Privacy Policy
        </button>
        . I understand my data will be processed to provide personalised job recommendations.
      </span>
    </label>
  );
}

// ─── Legal Modal ───────────────────────────────────────────────────────────
export function LegalModal({ type, onClose }) {
  if (!type) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.55)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "1rem",
        backdropFilter: "blur(3px)",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "var(--color-background-primary)",
          borderRadius: "var(--border-radius-lg)",
          border: "0.5px solid var(--color-border-tertiary)",
          width: "100%", maxWidth: "680px",
          maxHeight: "80vh",
          display: "flex", flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 24px 60px rgba(0,0,0,0.25)",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "1.1rem 1.4rem",
          borderBottom: "0.5px solid var(--color-border-tertiary)",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "32px", height: "32px",
              flexShrink: 0, overflow: "hidden",
            }}>
              <img src="/logo.png" alt="Mentorgram" style={{ width: "32px", height: "32px", objectFit: "cover", borderRadius: "22%", display: "block" }} />
            </div>
            <span style={{ fontWeight: 500, fontSize: "16px", color: "var(--color-text-primary)" }}>
              {type === "terms" ? "Terms & Conditions" : "Privacy Policy"}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "var(--color-background-secondary)",
              border: "0.5px solid var(--color-border-secondary)",
              borderRadius: "var(--border-radius-md)",
              width: "32px", height: "32px",
              cursor: "pointer", display: "flex", alignItems: "center",
              justifyContent: "center", flexShrink: 0, color: "var(--color-text-secondary)",
              fontSize: "18px", lineHeight: 1,
            }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Scrollable content */}
        <div style={{ overflowY: "auto", flex: 1, padding: "1.4rem" }}>
          {type === "terms" ? <TermsPage /> : <PrivacyPage />}
        </div>

        {/* Footer */}
        <div style={{
          padding: "0.9rem 1.4rem",
          borderTop: "0.5px solid var(--color-border-tertiary)",
          display: "flex", justifyContent: "flex-end",
          flexShrink: 0,
        }}>
          <button
            onClick={onClose}
            style={{
              padding: "9px 24px",
              borderRadius: "var(--border-radius-md)",
              background: "#1A3FA8", color: "#fff",
              border: "none", fontSize: "14px", fontWeight: 500,
              cursor: "pointer", fontFamily: "inherit",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
