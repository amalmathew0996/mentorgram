import { useState, useRef } from "react";

// ── Generate plain text CV (ATS safe) ────────────────────────────────────
function buildCVText(cv, cl, jobTitle, company) {
  const lines = [];
  lines.push(cv.name || "");
  if (cv.email)    lines.push(cv.email);
  if (cv.phone)    lines.push(cv.phone);
  if (cv.location) lines.push(cv.location);
  if (cv.linkedin) lines.push(cv.linkedin);
  lines.push("");
  lines.push("PROFESSIONAL SUMMARY");
  lines.push("─".repeat(40));
  lines.push(cv.summary || "");
  lines.push("");
  if (cv.experience?.length > 0) {
    lines.push("WORK EXPERIENCE");
    lines.push("─".repeat(40));
    cv.experience.forEach(e => {
      lines.push(`${e.title} | ${e.company}${e.location ? " | " + e.location : ""}`);
      lines.push(`${e.startDate} – ${e.endDate}`);
      (e.bullets || []).forEach(b => lines.push("- " + b));
      lines.push("");
    });
  }
  if (cv.education?.length > 0) {
    lines.push("EDUCATION");
    lines.push("─".repeat(40));
    cv.education.forEach(e => {
      lines.push(`${e.degree} | ${e.institution} | ${e.year}${e.grade ? " | " + e.grade : ""}`);
    });
    lines.push("");
  }
  if (cv.skills?.length > 0) {
    lines.push("SKILLS");
    lines.push("─".repeat(40));
    lines.push(cv.skills.join(" | "));
    lines.push("");
  }
  if (cv.certifications?.length > 0) {
    lines.push("CERTIFICATIONS");
    lines.push("─".repeat(40));
    cv.certifications.forEach(c => lines.push("- " + c));
  }

  lines.push("");
  lines.push("═".repeat(50));
  lines.push("COVER LETTER");
  lines.push("═".repeat(50));
  lines.push("");
  lines.push(`Hiring Manager`);
  lines.push(company || "");
  lines.push("");
  lines.push(`Dear Hiring Manager,`);
  lines.push("");
  lines.push(cl.opening || "");
  lines.push("");
  lines.push(cl.body1 || "");
  lines.push("");
  lines.push(cl.body2 || "");
  lines.push("");
  lines.push(cl.closing || "");
  lines.push("");
  lines.push("Yours sincerely,");
  lines.push(cv.name || "");

  return lines.join("\n");
}

// ── Generate DOCX using docx library loaded from CDN ─────────────────────
async function downloadDOCX(cv, cl, jobTitle, company) {
  // Load docx from CDN if not already loaded
  if (!window.docx) {
    await new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/docx/8.5.0/docx.umd.min.js";
      s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
  }

  const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle, Table, TableRow, TableCell, WidthType, UnderlineType } = window.docx;

  const BLUE = "1A3FA8";
  const DARK = "1a1a2e";
  const GRAY = "6b7280";

  const hr = () => new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: BLUE } },
    spacing: { after: 120 },
  });

  const heading = (text) => new Paragraph({
    children: [new TextRun({ text, bold: true, color: BLUE, size: 26, font: "Calibri" })],
    spacing: { before: 240, after: 60 },
  });

  const body = (text, opts = {}) => new Paragraph({
    children: [new TextRun({ text, size: 22, font: "Calibri", color: DARK, ...opts })],
    spacing: { after: 60 },
  });

  const bullet = (text) => new Paragraph({
    children: [new TextRun({ text: "• " + text, size: 22, font: "Calibri", color: DARK })],
    indent: { left: 360 },
    spacing: { after: 40 },
  });

  const sections = [];

  // ── CV SECTION ──────────────────────────────────────────────────────────
  // Name
  sections.push(new Paragraph({
    children: [new TextRun({ text: cv.name || "", bold: true, size: 48, font: "Calibri", color: DARK })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 80 },
  }));

  // Contact
  const contact = [cv.email, cv.phone, cv.location, cv.linkedin].filter(Boolean).join("  |  ");
  sections.push(new Paragraph({
    children: [new TextRun({ text: contact, size: 20, font: "Calibri", color: GRAY })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
  }));

  // ATS score badge
  if (cv.atsScore) {
    sections.push(new Paragraph({
      children: [new TextRun({ text: `ATS Score: ${cv.atsScore}%  |  Keywords matched: ${(cv.keywordsMatched || []).join(", ")}`, size: 18, font: "Calibri", color: "16A34A", italics: true })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }));
  }

  // Summary
  sections.push(heading("PROFESSIONAL SUMMARY"));
  sections.push(hr());
  sections.push(body(cv.summary || ""));

  // Experience
  if (cv.experience?.length > 0) {
    sections.push(heading("WORK EXPERIENCE"));
    sections.push(hr());
    cv.experience.forEach(e => {
      sections.push(new Paragraph({
        children: [
          new TextRun({ text: e.title, bold: true, size: 24, font: "Calibri", color: DARK }),
          new TextRun({ text: "  |  " + e.company + (e.location ? "  |  " + e.location : ""), size: 22, font: "Calibri", color: GRAY }),
        ],
        spacing: { before: 160, after: 40 },
      }));
      sections.push(new Paragraph({
        children: [new TextRun({ text: `${e.startDate} – ${e.endDate}`, size: 20, font: "Calibri", color: GRAY, italics: true })],
        spacing: { after: 80 },
      }));
      (e.bullets || []).forEach(b => sections.push(bullet(b)));
    });
  }

  // Education
  if (cv.education?.length > 0) {
    sections.push(heading("EDUCATION"));
    sections.push(hr());
    cv.education.forEach(e => {
      sections.push(new Paragraph({
        children: [
          new TextRun({ text: e.degree, bold: true, size: 22, font: "Calibri", color: DARK }),
          new TextRun({ text: "  |  " + e.institution + "  |  " + e.year + (e.grade ? "  |  " + e.grade : ""), size: 22, font: "Calibri", color: GRAY }),
        ],
        spacing: { before: 120, after: 80 },
      }));
    });
  }

  // Skills
  if (cv.skills?.length > 0) {
    sections.push(heading("SKILLS"));
    sections.push(hr());
    sections.push(body(cv.skills.join("  •  ")));
  }

  // Certifications
  if (cv.certifications?.length > 0) {
    sections.push(heading("CERTIFICATIONS"));
    sections.push(hr());
    cv.certifications.forEach(c => sections.push(bullet(c)));
  }

  // ── PAGE BREAK ──────────────────────────────────────────────────────────
  sections.push(new Paragraph({ pageBreakBefore: true }));

  // ── COVER LETTER ────────────────────────────────────────────────────────
  sections.push(new Paragraph({
    children: [new TextRun({ text: "COVER LETTER", bold: true, size: 36, font: "Calibri", color: BLUE })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 40 },
  }));
  sections.push(hr());
  sections.push(body(""));
  sections.push(body(cv.name || ""));
  sections.push(body(contact));
  sections.push(body(""));
  sections.push(body("Hiring Manager"));
  sections.push(body(company || ""));
  sections.push(body(""));
  sections.push(body("Dear Hiring Manager,"));
  sections.push(body(""));
  sections.push(body(cl.opening || ""));
  sections.push(body(""));
  sections.push(body(cl.body1 || ""));
  sections.push(body(""));
  sections.push(body(cl.body2 || ""));
  sections.push(body(""));
  sections.push(body(cl.closing || ""));
  sections.push(body(""));
  sections.push(body("Yours sincerely,"));
  sections.push(body(""));
  sections.push(body(cv.name || "", { bold: true }));

  const doc = new Document({
    sections: [{ properties: { page: { margin: { top: 720, right: 900, bottom: 720, left: 900 } } }, children: sections }],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `CV_CoverLetter_${(cv.name || "candidate").replace(/\s+/g, "_")}.docx`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Generate PDF using pdf-lib from CDN ──────────────────────────────────
async function downloadPDF(cv, cl, jobTitle, company) {
  if (!window.PDFLib) {
    await new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js";
      s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
  }

  const { PDFDocument, rgb, StandardFonts, PageSizes } = window.PDFLib;

  const pdfDoc = await PDFDocument.create();
  const boldFont   = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const normalFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const BLUE  = rgb(0.10, 0.25, 0.66);
  const DARK  = rgb(0.10, 0.10, 0.14);
  const GRAY  = rgb(0.42, 0.44, 0.50);
  const GREEN = rgb(0.09, 0.64, 0.29);
  const margin = 50;
  const pageW  = 595; // A4
  const pageH  = 842;
  const colW   = pageW - margin * 2;

  let page = pdfDoc.addPage([pageW, pageH]);
  let y = pageH - margin;

  function newPage() {
    page = pdfDoc.addPage([pageW, pageH]);
    y = pageH - margin;
  }

  function checkSpace(needed = 30) {
    if (y - needed < margin) newPage();
  }

  function drawText(text, opts = {}) {
    const { font = normalFont, size = 10, color = DARK, x = margin, maxWidth = colW, indent = 0 } = opts;
    if (!text) return;
    const words = text.split(" ");
    let line = "";
    const lines = [];
    words.forEach(w => {
      const test = line ? line + " " + w : w;
      if (font.widthOfTextAtSize(test, size) > maxWidth - indent) {
        if (line) lines.push(line);
        line = w;
      } else { line = test; }
    });
    if (line) lines.push(line);
    lines.forEach(l => {
      checkSpace(size + 4);
      page.drawText(l, { x: x + indent, y, size, font, color });
      y -= size + 4;
    });
  }

  function drawHeading(text) {
    checkSpace(30);
    y -= 8;
    drawText(text, { font: boldFont, size: 11, color: BLUE });
    // Underline
    checkSpace(4);
    page.drawLine({ start: { x: margin, y: y + 2 }, end: { x: pageW - margin, y: y + 2 }, thickness: 0.8, color: BLUE });
    y -= 6;
  }

  // ── CV ──────────────────────────────────────────────────────────────────
  // Name
  checkSpace(24);
  const nameW = boldFont.widthOfTextAtSize(cv.name || "", 20);
  page.drawText(cv.name || "", { x: (pageW - nameW) / 2, y, size: 20, font: boldFont, color: DARK });
  y -= 26;

  // Contact
  const contact = [cv.email, cv.phone, cv.location].filter(Boolean).join("  |  ");
  const cW = normalFont.widthOfTextAtSize(contact, 9);
  page.drawText(contact, { x: Math.max(margin, (pageW - cW) / 2), y, size: 9, font: normalFont, color: GRAY });
  y -= 18;

  // ATS score
  if (cv.atsScore) {
    const atsText = `ATS Score: ${cv.atsScore}%  |  Keywords: ${(cv.keywordsMatched || []).slice(0, 5).join(", ")}`;
    const aW = normalFont.widthOfTextAtSize(atsText, 8);
    page.drawText(atsText, { x: Math.max(margin, (pageW - aW) / 2), y, size: 8, font: normalFont, color: GREEN });
    y -= 16;
  }
  y -= 4;

  // Summary
  drawHeading("PROFESSIONAL SUMMARY");
  drawText(cv.summary || "");
  y -= 4;

  // Experience
  if (cv.experience?.length > 0) {
    drawHeading("WORK EXPERIENCE");
    cv.experience.forEach(e => {
      checkSpace(20);
      y -= 4;
      drawText(`${e.title}  |  ${e.company}${e.location ? "  |  " + e.location : ""}`, { font: boldFont, size: 10 });
      drawText(`${e.startDate} – ${e.endDate}`, { size: 9, color: GRAY });
      (e.bullets || []).forEach(b => drawText("• " + b, { size: 9, indent: 10 }));
    });
    y -= 4;
  }

  // Education
  if (cv.education?.length > 0) {
    drawHeading("EDUCATION");
    cv.education.forEach(e => {
      drawText(`${e.degree}  |  ${e.institution}  |  ${e.year}${e.grade ? "  |  " + e.grade : ""}`, { size: 10 });
    });
    y -= 4;
  }

  // Skills
  if (cv.skills?.length > 0) {
    drawHeading("SKILLS");
    drawText(cv.skills.join("  •  "), { size: 9 });
    y -= 4;
  }

  // Certs
  if (cv.certifications?.length > 0) {
    drawHeading("CERTIFICATIONS");
    cv.certifications.forEach(c => drawText("• " + c, { size: 9, indent: 10 }));
  }

  // ── COVER LETTER (new page) ─────────────────────────────────────────────
  newPage();
  const clTitle = "COVER LETTER";
  const clW = boldFont.widthOfTextAtSize(clTitle, 16);
  page.drawText(clTitle, { x: (pageW - clW) / 2, y, size: 16, font: boldFont, color: BLUE });
  y -= 22;
  page.drawLine({ start: { x: margin, y: y + 4 }, end: { x: pageW - margin, y: y + 4 }, thickness: 0.8, color: BLUE });
  y -= 16;

  drawText(cv.name || "", { font: boldFont });
  drawText(contact, { color: GRAY, size: 9 });
  y -= 10;
  drawText("Hiring Manager");
  drawText(company || "");
  y -= 10;
  drawText("Dear Hiring Manager,");
  y -= 6;
  drawText(cl.opening || "");
  y -= 6;
  drawText(cl.body1 || "");
  y -= 6;
  drawText(cl.body2 || "");
  y -= 6;
  drawText(cl.closing || "");
  y -= 10;
  drawText("Yours sincerely,");
  y -= 14;
  drawText(cv.name || "", { font: boldFont });

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `CV_CoverLetter_${(cv.name || "candidate").replace(/\s+/g, "_")}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────
export default function CVGenerator({ user, cvText, onNavigateToCV }) {
  const [jobUrl, setJobUrl]         = useState("");
  const [jobDesc, setJobDesc]       = useState("");
  const [inputMode, setInputMode]   = useState("url"); // "url" | "text"
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const [result, setResult]         = useState(null);
  const [downloading, setDownloading] = useState("");

  const hasCv = cvText && cvText.trim().length > 50;

  async function generate() {
    if (!hasCv) { setError("Please upload and analyse your CV first in the CV Analysis tab."); return; }
    const jobContent = inputMode === "url" ? jobUrl : jobDesc;
    if (!jobContent.trim()) { setError("Please provide a job URL or job description."); return; }

    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch("/api/generate-docs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cvText,
          jobDescription: inputMode === "text" ? jobDesc : "",
          jobUrl: inputMode === "url" ? jobUrl : "",
        }),
      });
      let data;
      try { data = await res.json(); } catch { throw new Error("Server error"); }
      if (!res.ok || data.error) throw new Error(data.error || "Generation failed");
      setResult(data);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  async function download(fmt) {
    if (!result?.data) return;
    setDownloading(fmt);
    try {
      const { cv, coverLetter } = result.data;
      if (fmt === "docx") await downloadDOCX(cv, coverLetter, result.jobTitle, result.company);
      else await downloadPDF(cv, coverLetter, result.jobTitle, result.company);
    } catch (err) {
      setError("Download failed: " + err.message);
    }
    setDownloading("");
  }

  const card = { background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: "1.5rem" };
  const inp  = { padding: "10px 14px", borderRadius: "var(--border-radius-md)", border: "0.5px solid var(--color-border-secondary)", background: "var(--color-background-secondary)", color: "var(--color-text-primary)", fontSize: "14px", outline: "none", fontFamily: "inherit", width: "100%", boxSizing: "border-box" };
  const btn  = (primary, color) => ({ padding: "10px 22px", borderRadius: "var(--border-radius-md)", fontSize: "14px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit", background: primary ? (color || "#1A3FA8") : "transparent", color: primary ? "#fff" : "var(--color-text-primary)", border: primary ? "none" : "0.5px solid var(--color-border-secondary)" });

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem 1.5rem", display: "grid", gap: "1.25rem" }}>
      {/* Header */}
      <div style={{ ...card, background: "linear-gradient(135deg, rgba(26,63,168,0.08), rgba(22,163,74,0.04))", borderColor: "rgba(26,63,168,0.2)" }}>
        <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
          <span style={{ fontSize: "40px" }}>🎯</span>
          <div>
            <h2 style={{ margin: "0 0 6px", fontSize: "1.3rem", fontWeight: 600 }}>CV & Cover Letter Generator</h2>
            <p style={{ margin: 0, fontSize: "14px", color: "var(--color-text-secondary)", lineHeight: 1.7 }}>
              Paste a job URL or description and we'll tailor your CV and write a cover letter — ATS-optimised, keyword-matched, ready to send.
            </p>
          </div>
        </div>
      </div>

      {/* CV status */}
      {!hasCv ? (
        <div style={{ ...card, borderColor: "rgba(220,38,38,0.2)", background: "rgba(220,38,38,0.04)" }}>
          <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: "24px" }}>⚠️</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 600, margin: "0 0 4px" }}>No CV found</p>
              <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", margin: 0 }}>Upload and analyse your CV first so we can tailor it to the job.</p>
            </div>
            {onNavigateToCV && <button onClick={onNavigateToCV} style={{ ...btn(true, "#7C3AED"), padding: "9px 18px", fontSize: "13px" }}>Upload CV →</button>}
          </div>
        </div>
      ) : (
        <div style={{ padding: "10px 16px", background: "rgba(22,163,74,0.08)", border: "0.5px solid rgba(22,163,74,0.2)", borderRadius: "var(--border-radius-md)", fontSize: "13px", color: "#16A34A", fontWeight: 500 }}>
          ✅ CV loaded and ready — paste a job below to generate your tailored documents
        </div>
      )}

      {/* Input mode toggle */}
      <div style={card}>
        <div style={{ display: "flex", gap: "8px", marginBottom: "1.25rem" }}>
          {[{ key: "url", label: "🔗 Paste job URL" }, { key: "text", label: "📋 Paste job description" }].map(m => (
            <button key={m.key} onClick={() => setInputMode(m.key)}
              style={{ padding: "8px 18px", borderRadius: "20px", fontSize: "13px", fontWeight: inputMode === m.key ? 600 : 400, cursor: "pointer", fontFamily: "inherit", border: "none", background: inputMode === m.key ? "#1A3FA8" : "var(--color-background-secondary)", color: inputMode === m.key ? "#fff" : "var(--color-text-secondary)" }}>
              {m.label}
            </button>
          ))}
        </div>

        {inputMode === "url" ? (
          <div>
            <label style={{ fontSize: "12px", color: "var(--color-text-secondary)", display: "block", marginBottom: "6px", fontWeight: 500 }}>Job URL (Reed, LinkedIn, Indeed, etc.)</label>
            <input style={inp} value={jobUrl} onChange={e => setJobUrl(e.target.value)}
              placeholder="https://www.reed.co.uk/jobs/software-engineer..." />
            <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", margin: "6px 0 0" }}>💡 If the URL doesn't work, switch to "Paste job description" mode</p>
          </div>
        ) : (
          <div>
            <label style={{ fontSize: "12px", color: "var(--color-text-secondary)", display: "block", marginBottom: "6px", fontWeight: 500 }}>Job description</label>
            <textarea style={{ ...inp, minHeight: "180px", resize: "vertical" }}
              value={jobDesc} onChange={e => setJobDesc(e.target.value)}
              placeholder="Paste the full job description here — including requirements, responsibilities and company info..." />
          </div>
        )}

        {error && <p style={{ color: "#E24B4A", fontSize: "13px", margin: "10px 0 0", lineHeight: 1.5 }}>⚠️ {error}</p>}

        <button onClick={generate} disabled={loading || !hasCv}
          style={{ ...btn(true), marginTop: "1rem", width: "100%", padding: "13px", fontSize: "15px", opacity: loading || !hasCv ? 0.6 : 1, cursor: loading || !hasCv ? "default" : "pointer" }}>
          {loading ? "✨ Generating your documents..." : "✨ Generate Tailored CV & Cover Letter"}
        </button>

        {loading && (
          <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "6px" }}>
            <style>{".spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}"}</style>
            {["Analysing job description...", "Matching your skills to requirements...", "Optimising for ATS keywords...", "Writing cover letter..."].map((msg, i) => (
              <div key={i} style={{ display: "flex", gap: "10px", alignItems: "center", padding: "8px 12px", background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)" }}>
                <div className="spin" style={{ width: "12px", height: "12px", border: "2px solid rgba(26,63,168,0.2)", borderTopColor: "#1A3FA8", borderRadius: "50%", flexShrink: 0 }} />
                <span style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>{msg}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Results */}
      {result?.data && (
        <div style={{ display: "grid", gap: "1rem" }}>
          {/* ATS Score */}
          <div style={{ ...card, background: "linear-gradient(135deg, rgba(22,163,74,0.08), transparent)", borderColor: "rgba(22,163,74,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
              <div>
                <p style={{ fontWeight: 600, margin: "0 0 4px", fontSize: "15px" }}>
                  ✅ Documents ready — {result.jobTitle} at {result.company}
                </p>
                {result.data.cv?.atsScore && (
                  <p style={{ fontSize: "13px", color: "#16A34A", margin: "0 0 4px", fontWeight: 500 }}>
                    ATS Score: {result.data.cv.atsScore}% · Keywords matched: {(result.data.cv.keywordsMatched || []).join(", ")}
                  </p>
                )}
                <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", margin: 0 }}>
                  CV + Cover Letter tailored for this specific role. Download in your preferred format.
                </p>
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button onClick={() => download("pdf")} disabled={!!downloading}
                  style={{ ...btn(true, "#DC2626"), padding: "10px 20px", opacity: downloading ? 0.7 : 1, display: "flex", alignItems: "center", gap: "6px" }}>
                  {downloading === "pdf" ? "⏳" : "📄"} Download PDF
                </button>
                <button onClick={() => download("docx")} disabled={!!downloading}
                  style={{ ...btn(true, "#1A3FA8"), padding: "10px 20px", opacity: downloading ? 0.7 : 1, display: "flex", alignItems: "center", gap: "6px" }}>
                  {downloading === "docx" ? "⏳" : "📝"} Download Word
                </button>
              </div>
            </div>
          </div>

          {/* CV Preview */}
          <div style={card}>
            <p style={{ fontWeight: 600, margin: "0 0 1rem", fontSize: "15px" }}>📄 CV Preview</p>
            <div style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", padding: "1.5rem", fontFamily: "Georgia, serif", fontSize: "13px", lineHeight: 1.7 }}>
              <p style={{ fontWeight: 700, fontSize: "18px", margin: "0 0 4px", textAlign: "center" }}>{result.data.cv?.name}</p>
              <p style={{ textAlign: "center", color: "var(--color-text-secondary)", fontSize: "12px", margin: "0 0 16px" }}>
                {[result.data.cv?.email, result.data.cv?.phone, result.data.cv?.location].filter(Boolean).join("  |  ")}
              </p>
              <p style={{ fontWeight: 700, color: "#1A3FA8", margin: "12px 0 4px", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Professional Summary</p>
              <p style={{ margin: "0 0 12px", fontSize: "13px" }}>{result.data.cv?.summary}</p>

              {result.data.cv?.experience?.length > 0 && (
                <>
                  <p style={{ fontWeight: 700, color: "#1A3FA8", margin: "12px 0 4px", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Work Experience</p>
                  {result.data.cv.experience.slice(0, 2).map((e, i) => (
                    <div key={i} style={{ marginBottom: "10px" }}>
                      <p style={{ fontWeight: 600, margin: "0 0 2px" }}>{e.title} | {e.company}</p>
                      <p style={{ color: "var(--color-text-secondary)", fontSize: "12px", margin: "0 0 4px" }}>{e.startDate} – {e.endDate}</p>
                      {(e.bullets || []).slice(0, 2).map((b, j) => <p key={j} style={{ margin: "0 0 2px", fontSize: "12px", paddingLeft: "12px" }}>• {b}</p>)}
                    </div>
                  ))}
                </>
              )}

              {result.data.cv?.skills?.length > 0 && (
                <>
                  <p style={{ fontWeight: 700, color: "#1A3FA8", margin: "12px 0 4px", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Skills</p>
                  <p style={{ fontSize: "12px", margin: 0 }}>{result.data.cv.skills.join("  •  ")}</p>
                </>
              )}
            </div>
          </div>

          {/* Cover Letter Preview */}
          <div style={card}>
            <p style={{ fontWeight: 600, margin: "0 0 1rem", fontSize: "15px" }}>✉️ Cover Letter Preview</p>
            <div style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", padding: "1.5rem", fontFamily: "Georgia, serif", fontSize: "13px", lineHeight: 1.8, display: "flex", flexDirection: "column", gap: "12px" }}>
              <p style={{ margin: 0, color: "var(--color-text-secondary)", fontSize: "12px" }}>Dear Hiring Manager,</p>
              <p style={{ margin: 0 }}>{result.data.coverLetter?.opening}</p>
              <p style={{ margin: 0 }}>{result.data.coverLetter?.body1}</p>
              <p style={{ margin: 0 }}>{result.data.coverLetter?.body2}</p>
              <p style={{ margin: 0 }}>{result.data.coverLetter?.closing}</p>
              <p style={{ margin: 0, color: "var(--color-text-secondary)", fontSize: "12px" }}>Yours sincerely,<br /><strong>{result.data.cv?.name}</strong></p>
            </div>
          </div>

          {/* Generate another */}
          <button onClick={() => { setResult(null); setJobUrl(""); setJobDesc(""); setError(""); }}
            style={{ ...btn(false), padding: "10px", fontSize: "13px", width: "100%" }}>
            ↺ Generate for another job
          </button>
        </div>
      )}
    </div>
  );
}
