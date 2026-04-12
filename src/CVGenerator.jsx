import { useState, useRef } from "react";

const S = {
  card: { background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: "1.5rem" },
  inp: { padding: "10px 14px", borderRadius: "var(--border-radius-md)", border: "0.5px solid var(--color-border-secondary)", background: "var(--color-background-secondary)", color: "var(--color-text-primary)", fontSize: "14px", outline: "none", fontFamily: "inherit", width: "100%", boxSizing: "border-box" },
};

function Btn({ primary, color, children, onClick, disabled, style = {} }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ padding: "10px 22px", borderRadius: "var(--border-radius-md)", fontSize: "14px", fontWeight: 500, cursor: disabled ? "default" : "pointer", fontFamily: "inherit", background: primary ? (color || "#1A3FA8") : "transparent", color: primary ? "#fff" : "var(--color-text-primary)", border: primary ? "none" : "0.5px solid var(--color-border-secondary)", opacity: disabled ? 0.6 : 1, ...style }}>
      {children}
    </button>
  );
}

async function loadScript(src) {
  if (document.querySelector('script[src="' + src + '"]')) return;
  return new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = src; s.onload = res; s.onerror = rej;
    document.head.appendChild(s);
  });
}

async function extractCVText(file) {
  const name = file.name.toLowerCase();
  if (file.type === "application/pdf" || name.endsWith(".pdf")) {
    await loadScript("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js");
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
          const pdf = await window.pdfjsLib.getDocument({ data: e.target.result }).promise;
          let text = "";
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            text += content.items.map(item => item.str).join(" ") + "\n";
          }
          resolve(text);
        } catch (err) { reject(err); }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }
  if (name.endsWith(".docx")) {
    await loadScript("https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js");
    const ab = await file.arrayBuffer();
    const result = await window.mammoth.extractRawText({ arrayBuffer: ab });
    return result.value || "";
  }
  return file.text();
}

async function doDownloadDOCX(cv, cl) {
  await loadScript("https://cdnjs.cloudflare.com/ajax/libs/docx/8.5.0/docx.umd.min.js");
  const { Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle } = window.docx;
  const BLUE = "1A3FA8", DARK = "1a1a2e", GRAY = "6b7280";
  const hr = () => new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: BLUE } }, spacing: { after: 120 } });
  const h = (text) => new Paragraph({ children: [new TextRun({ text, bold: true, color: BLUE, size: 26, font: "Calibri" })], spacing: { before: 240, after: 60 } });
  const p = (text, opts) => new Paragraph({ children: [new TextRun({ text: text || "", size: 22, font: "Calibri", color: DARK, ...(opts || {}) })], spacing: { after: 60 } });
  const b = (text) => new Paragraph({ children: [new TextRun({ text: "• " + text, size: 22, font: "Calibri", color: DARK })], indent: { left: 360 }, spacing: { after: 40 } });

  const children = [];
  children.push(new Paragraph({ children: [new TextRun({ text: cv.name || "", bold: true, size: 48, font: "Calibri", color: DARK })], alignment: AlignmentType.CENTER, spacing: { after: 80 } }));
  const contact = [cv.email, cv.phone, cv.location].filter(Boolean).join("  |  ");
  children.push(new Paragraph({ children: [new TextRun({ text: contact, size: 20, font: "Calibri", color: GRAY })], alignment: AlignmentType.CENTER, spacing: { after: 200 } }));
  children.push(h("PROFESSIONAL SUMMARY")); children.push(hr()); children.push(p(cv.summary));
  if (cv.experience && cv.experience.length > 0) {
    children.push(h("WORK EXPERIENCE")); children.push(hr());
    cv.experience.forEach(function(e) {
      children.push(new Paragraph({ children: [new TextRun({ text: e.title + " | " + e.company, bold: true, size: 24, font: "Calibri", color: DARK })], spacing: { before: 160, after: 40 } }));
      children.push(new Paragraph({ children: [new TextRun({ text: e.startDate + " - " + e.endDate, size: 20, font: "Calibri", color: GRAY, italics: true })], spacing: { after: 80 } }));
      (e.bullets || []).forEach(function(bl) { children.push(b(bl)); });
    });
  }
  if (cv.education && cv.education.length > 0) {
    children.push(h("EDUCATION")); children.push(hr());
    cv.education.forEach(function(e) { children.push(p(e.degree + " | " + e.institution + " | " + e.year + (e.grade ? " | " + e.grade : ""))); });
  }
  if (cv.skills && cv.skills.length > 0) { children.push(h("SKILLS")); children.push(hr()); children.push(p(cv.skills.join("  |  "))); }
  children.push(new Paragraph({ pageBreakBefore: true }));
  children.push(new Paragraph({ children: [new TextRun({ text: "COVER LETTER", bold: true, size: 36, font: "Calibri", color: BLUE })], alignment: AlignmentType.CENTER, spacing: { after: 80 } }));
  children.push(hr());
  [p(cv.name, { bold: true }), p(contact), p(""), p("Dear Hiring Manager,"), p(""), p(cl.opening), p(""), p(cl.body1), p(""), p(cl.body2), p(""), p(cl.closing), p(""), p("Yours sincerely,"), p(""), p(cv.name, { bold: true })].forEach(function(c) { children.push(c); });

  const doc = new Document({ sections: [{ properties: { page: { margin: { top: 720, right: 900, bottom: 720, left: 900 } } }, children: children }] });
  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "CV_CoverLetter.docx";
  a.click();
  URL.revokeObjectURL(url);
}

async function doDownloadPDF(cv, cl) {
  await loadScript("https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js");
  const { PDFDocument, rgb, StandardFonts } = window.PDFLib;
  const pdfDoc = await PDFDocument.create();
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const normFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const BLUE = rgb(0.10, 0.25, 0.66), DARK = rgb(0.10, 0.10, 0.14), GRAY = rgb(0.42, 0.44, 0.50), GREEN = rgb(0.09, 0.64, 0.29);
  const margin = 50, pageW = 595, pageH = 842, colW = pageW - margin * 2;
  let page = pdfDoc.addPage([pageW, pageH]), y = pageH - margin;

  function newPage() { page = pdfDoc.addPage([pageW, pageH]); y = pageH - margin; }
  function chk(n) { if (y - n < margin) newPage(); }
  function txt(text, opts) {
    const font = (opts && opts.font) || normFont;
    const size = (opts && opts.size) || 10;
    const color = (opts && opts.color) || DARK;
    const indent = (opts && opts.indent) || 0;
    if (!text) return;
    const words = text.split(" "); let line = ""; const lines = [];
    words.forEach(function(w) {
      const test = line ? line + " " + w : w;
      if (font.widthOfTextAtSize(test, size) > colW - indent) { if (line) lines.push(line); line = w; } else { line = test; }
    });
    if (line) lines.push(line);
    lines.forEach(function(l) { chk(size + 4); page.drawText(l, { x: margin + indent, y: y, size: size, font: font, color: color }); y -= size + 4; });
  }
  function hdg(text) { chk(30); y -= 8; txt(text, { font: boldFont, size: 11, color: BLUE }); chk(4); page.drawLine({ start: { x: margin, y: y + 2 }, end: { x: pageW - margin, y: y + 2 }, thickness: 0.8, color: BLUE }); y -= 6; }

  const contact = [cv.email, cv.phone, cv.location].filter(Boolean).join("  |  ");
  const nameW = boldFont.widthOfTextAtSize(cv.name || "", 20);
  page.drawText(cv.name || "", { x: (pageW - nameW) / 2, y: y, size: 20, font: boldFont, color: DARK }); y -= 26;
  const cW = normFont.widthOfTextAtSize(contact, 9);
  page.drawText(contact, { x: Math.max(margin, (pageW - cW) / 2), y: y, size: 9, font: normFont, color: GRAY }); y -= 18;
  if (cv.atsScore) {
    const t = "ATS Score: " + cv.atsScore + "%";
    const aW = normFont.widthOfTextAtSize(t, 8);
    page.drawText(t, { x: Math.max(margin, (pageW - aW) / 2), y: y, size: 8, font: normFont, color: GREEN }); y -= 16;
  }
  y -= 4;
  hdg("PROFESSIONAL SUMMARY"); txt(cv.summary || ""); y -= 4;
  if (cv.experience && cv.experience.length > 0) {
    hdg("WORK EXPERIENCE");
    cv.experience.forEach(function(e) {
      y -= 4;
      txt(e.title + "  |  " + e.company, { font: boldFont, size: 10 });
      txt(e.startDate + " - " + e.endDate, { size: 9, color: GRAY });
      (e.bullets || []).forEach(function(bl) { txt("• " + bl, { size: 9, indent: 10 }); });
    });
    y -= 4;
  }
  if (cv.education && cv.education.length > 0) {
    hdg("EDUCATION");
    cv.education.forEach(function(e) { txt(e.degree + "  |  " + e.institution + "  |  " + e.year, { size: 10 }); });
    y -= 4;
  }
  if (cv.skills && cv.skills.length > 0) { hdg("SKILLS"); txt(cv.skills.join("  |  "), { size: 9 }); y -= 4; }

  newPage();
  const clTitle = "COVER LETTER";
  const clW = boldFont.widthOfTextAtSize(clTitle, 16);
  page.drawText(clTitle, { x: (pageW - clW) / 2, y: y, size: 16, font: boldFont, color: BLUE }); y -= 22;
  page.drawLine({ start: { x: margin, y: y + 4 }, end: { x: pageW - margin, y: y + 4 }, thickness: 0.8, color: BLUE }); y -= 16;
  txt(cv.name || "", { font: boldFont }); txt(contact, { color: GRAY, size: 9 }); y -= 10;
  txt("Dear Hiring Manager,"); y -= 6;
  txt(cl.opening || ""); y -= 6; txt(cl.body1 || ""); y -= 6; txt(cl.body2 || ""); y -= 6; txt(cl.closing || ""); y -= 10;
  txt("Yours sincerely,"); y -= 14; txt(cv.name || "", { font: boldFont });

  const bytes = await pdfDoc.save();
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "CV_CoverLetter.pdf"; a.click();
  URL.revokeObjectURL(url);
}

export default function CVGenerator({ user, cvText: propCvText, onSignIn }) {
  const [step, setStep] = useState(1);
  const [cvText, setCvText] = useState(propCvText || "");
  const [cvFileName, setCvFileName] = useState(propCvText ? "Profile CV" : "");
  const [cvLoading, setCvLoading] = useState(false);
  const [jobUrl, setJobUrl] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [inputMode, setInputMode] = useState("url");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [downloading, setDownloading] = useState("");
  const [showSignIn, setShowSignIn] = useState(false);
  const fileRef = useRef(null);

  async function handleFile(file) {
    if (!file) return;
    setCvLoading(true); setError("");
    try {
      const text = await extractCVText(file);
      if (!text || text.trim().length < 30) { setError("Could not read this file. Try PDF or paste text below."); setCvLoading(false); return; }
      setCvText(text); setCvFileName(file.name);
    } catch (err) { setError("Could not read file: " + err.message); }
    setCvLoading(false);
  }

  async function generate() {
    const jobContent = inputMode === "url" ? jobUrl : jobDesc;
    if (!cvText.trim()) { setError("Please upload a CV or paste your CV text first."); return; }
    if (!jobContent.trim()) { setError("Please provide a job URL or description."); return; }
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch("/api/generate-docs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cvText: cvText, jobDescription: inputMode === "text" ? jobDesc : "", jobUrl: inputMode === "url" ? jobUrl : "" }),
      });
      let data;
      try { data = await res.json(); } catch (e) { throw new Error("Server error"); }
      if (!res.ok || data.error) throw new Error(data.error || "Generation failed");
      setResult(data);
      setStep(3);
    } catch (err) { setError(err.message); }
    setLoading(false);
  }

  async function handleDownload(fmt) {
    if (!user) { setShowSignIn(true); return; }
    if (!result || !result.data) return;
    setDownloading(fmt); setError("");
    try {
      const cv = result.data.cv;
      const cl = result.data.coverLetter;
      if (fmt === "docx") { await doDownloadDOCX(cv, cl); }
      else { await doDownloadPDF(cv, cl); }
    } catch (err) { setError("Download failed: " + err.message); }
    setDownloading("");
  }

  function reset() {
    setResult(null); setStep(1); setJobUrl(""); setJobDesc(""); setError("");
    setShowSignIn(false); setCvText(propCvText || ""); setCvFileName(propCvText ? "Profile CV" : "");
  }

  const STEPS = [
    { n: 1, label: "Upload any CV", desc: "Just to get basic details — even an old draft works" },
    { n: 2, label: "Paste a job", desc: "URL or description from any job board" },
    { n: 3, label: "Download", desc: "ATS-optimised CV + cover letter ready to send" },
  ];

  const cv = result && result.data && result.data.cv;
  const cl = result && result.data && result.data.coverLetter;
  const atsScore = cv && cv.atsScore;
  const atsColor = atsScore >= 85 ? "#16A34A" : atsScore >= 70 ? "#D97706" : "#DC2626";
  const atsLabel = atsScore >= 85 ? "Excellent" : atsScore >= 70 ? "Good" : "Needs Work";
  const circumference = 2 * Math.PI * 38;

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "2rem 1.5rem", display: "grid", gap: "1.25rem" }}>

      {/* Header */}
      <div style={{ ...S.card, background: "linear-gradient(135deg, rgba(26,63,168,0.08), rgba(22,163,74,0.04))", borderColor: "rgba(26,63,168,0.2)" }}>
        <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
          <span style={{ fontSize: "40px" }}>🎯</span>
          <div>
            <h2 style={{ margin: "0 0 6px", fontSize: "1.3rem", fontWeight: 600 }}>CV and Cover Letter Generator</h2>
            <p style={{ margin: 0, fontSize: "14px", color: "var(--color-text-secondary)", lineHeight: 1.7 }}>
              Upload <strong>any CV</strong> as a starting point, paste a job URL or description, and we will tailor your CV and write a cover letter that is 95% ATS friendly and keyword-matched to that specific role.
            </p>
          </div>
        </div>
      </div>

      {/* Steps */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
        {STEPS.map(function(s) {
          return (
            <div key={s.n}
              onClick={function() { if (s.n < step) setStep(s.n); }}
              style={{ ...S.card, padding: "1rem", borderColor: step === s.n ? "#1A3FA8" : step > s.n ? "rgba(22,163,74,0.4)" : "var(--color-border-tertiary)", background: step === s.n ? "rgba(26,63,168,0.05)" : step > s.n ? "rgba(22,163,74,0.04)" : "var(--color-background-primary)", cursor: s.n < step ? "pointer" : "default" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: step > s.n ? "#16A34A" : step === s.n ? "#1A3FA8" : "var(--color-background-secondary)", color: step >= s.n ? "#fff" : "var(--color-text-secondary)", fontSize: "12px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {step > s.n ? "✓" : s.n}
                </div>
                <p style={{ fontWeight: 600, margin: 0, fontSize: "13px", color: step === s.n ? "#1A3FA8" : step > s.n ? "#16A34A" : "var(--color-text-secondary)" }}>{s.label}</p>
              </div>
              <p style={{ fontSize: "11px", color: "var(--color-text-secondary)", margin: 0, paddingLeft: "32px", lineHeight: 1.4 }}>{s.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Step 1: Upload CV */}
      {step === 1 && (
        <div style={S.card}>
          <div style={{ display: "flex", gap: "10px", alignItems: "flex-start", marginBottom: "1.25rem", padding: "10px 14px", background: "rgba(26,63,168,0.06)", borderRadius: "var(--border-radius-md)" }}>
            <span style={{ fontSize: "20px" }}>💡</span>
            <p style={{ margin: 0, fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
              <strong style={{ color: "var(--color-text-primary)" }}>Upload any CV</strong> — it does not need to be perfect. We just need basic details like your name, experience and skills to tailor it. Even an old or rough draft works.
            </p>
          </div>
          <div
            onClick={function() { fileRef.current && fileRef.current.click(); }}
            onDragOver={function(e) { e.preventDefault(); e.currentTarget.style.borderColor = "#1A3FA8"; }}
            onDragLeave={function(e) { e.currentTarget.style.borderColor = "var(--color-border-secondary)"; }}
            onDrop={function(e) { e.preventDefault(); e.currentTarget.style.borderColor = "var(--color-border-secondary)"; handleFile(e.dataTransfer.files[0]); }}
            style={{ border: "2px dashed var(--color-border-secondary)", borderRadius: "var(--border-radius-lg)", padding: "2.5rem", textAlign: "center", cursor: "pointer", marginBottom: "1rem", background: "var(--color-background-secondary)" }}>
            <input ref={fileRef} type="file" accept=".pdf,.txt,.doc,.docx" style={{ display: "none" }} onChange={function(e) { handleFile(e.target.files[0]); }} />
            <div style={{ fontSize: "40px", marginBottom: "10px" }}>📄</div>
            {cvLoading ? (
              <p style={{ color: "var(--color-text-secondary)", margin: 0 }}>Reading your CV...</p>
            ) : cvFileName ? (
              <div>
                <p style={{ fontWeight: 600, margin: "0 0 4px", color: "#16A34A" }}>✓ {cvFileName}</p>
                <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", margin: 0 }}>Click to use a different file</p>
              </div>
            ) : (
              <div>
                <p style={{ fontWeight: 500, margin: "0 0 6px" }}>Drop your CV here or click to upload</p>
                <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", margin: 0 }}>PDF, DOCX, TXT — any version, even an old draft</p>
              </div>
            )}
          </div>
          <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", textAlign: "center", margin: "0 0 8px" }}>— or paste your CV text below —</p>
          <textarea value={cvText} onChange={function(e) { setCvText(e.target.value); setCvFileName(""); }}
            placeholder="Paste your CV content here — name, experience, skills, education..."
            style={{ ...S.inp, minHeight: "130px", resize: "vertical" }} />
          {error && <p style={{ color: "#E24B4A", fontSize: "13px", margin: "8px 0 0" }}>⚠️ {error}</p>}
          <Btn primary onClick={function() { if (!cvText.trim()) { setError("Please upload or paste your CV first."); return; } setError(""); setStep(2); }} style={{ marginTop: "1rem", width: "100%", padding: "13px", fontSize: "15px" }} disabled={cvLoading}>
            Next: Paste the job →
          </Btn>
        </div>
      )}

      {/* Step 2: Job input */}
      {step === 2 && (
        <div style={S.card}>
          <div style={{ display: "flex", gap: "8px", marginBottom: "1.25rem" }}>
            {[{ key: "url", label: "🔗 Paste job URL" }, { key: "text", label: "📋 Paste job description" }].map(function(m) {
              return (
                <button key={m.key} onClick={function() { setInputMode(m.key); }}
                  style={{ padding: "8px 18px", borderRadius: "20px", fontSize: "13px", fontWeight: inputMode === m.key ? 600 : 400, cursor: "pointer", fontFamily: "inherit", border: "none", background: inputMode === m.key ? "#1A3FA8" : "var(--color-background-secondary)", color: inputMode === m.key ? "#fff" : "var(--color-text-secondary)" }}>
                  {m.label}
                </button>
              );
            })}
          </div>
          {inputMode === "url" ? (
            <div>
              <label style={{ fontSize: "12px", color: "var(--color-text-secondary)", display: "block", marginBottom: "6px", fontWeight: 500 }}>Job URL from Reed, Indeed, LinkedIn etc.</label>
              <input style={S.inp} value={jobUrl} onChange={function(e) { setJobUrl(e.target.value); }} placeholder="https://www.reed.co.uk/jobs/software-engineer..." />
              <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", margin: "6px 0 0" }}>💡 If the URL does not work, switch to paste job description mode</p>
            </div>
          ) : (
            <div>
              <label style={{ fontSize: "12px", color: "var(--color-text-secondary)", display: "block", marginBottom: "6px", fontWeight: 500 }}>Paste the full job description</label>
              <textarea style={{ ...S.inp, minHeight: "180px", resize: "vertical" }} value={jobDesc} onChange={function(e) { setJobDesc(e.target.value); }}
                placeholder="Paste the full job posting here including responsibilities, requirements and company info..." />
            </div>
          )}
          {error && <p style={{ color: "#E24B4A", fontSize: "13px", margin: "10px 0 0", lineHeight: 1.5 }}>⚠️ {error}</p>}
          <div style={{ display: "flex", gap: "8px", marginTop: "1rem" }}>
            <Btn onClick={function() { setStep(1); }} style={{ padding: "12px 20px" }}>← Back</Btn>
            <Btn primary onClick={generate} disabled={loading} style={{ flex: 1, padding: "12px", fontSize: "15px" }}>
              {loading ? "✨ Generating..." : "✨ Generate CV and Cover Letter"}
            </Btn>
          </div>
          {loading && (
            <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "6px" }}>
              <style dangerouslySetInnerHTML={{ __html: ".spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}" }} />
              {["Analysing job description...", "Matching your skills to requirements...", "Optimising for ATS keywords...", "Writing your tailored cover letter..."].map(function(msg, i) {
                return (
                  <div key={i} style={{ display: "flex", gap: "10px", alignItems: "center", padding: "8px 12px", background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)" }}>
                    <div className="spin" style={{ width: "12px", height: "12px", border: "2px solid rgba(26,63,168,0.2)", borderTopColor: "#1A3FA8", borderRadius: "50%", flexShrink: 0 }} />
                    <span style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>{msg}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Step 3: Results */}
      {step === 3 && result && result.data && (
        <div style={{ display: "grid", gap: "1rem" }}>

          {/* Sign in gate */}
          {showSignIn && !user ? (
            <div style={{ ...S.card, textAlign: "center", padding: "2.5rem", borderColor: "rgba(26,63,168,0.25)" }}>
              <div style={{ fontSize: "48px", marginBottom: "1rem" }}>🔒</div>
              <h3 style={{ margin: "0 0 8px", fontSize: "1.1rem", fontWeight: 600 }}>Sign in to download your documents</h3>
              <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", margin: "0 0 1.5rem", lineHeight: 1.6 }}>Your tailored CV and cover letter are ready. Create a free account to download them.</p>
              <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
                {onSignIn && <Btn primary onClick={onSignIn} style={{ padding: "12px 28px", fontSize: "15px" }}>Sign in / Register — it is free</Btn>}
                <Btn onClick={function() { setShowSignIn(false); }} style={{ padding: "12px 20px" }}>← Back to preview</Btn>
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gap: "1rem" }}>

              {/* Download bar */}
              <div style={{ ...S.card, background: "linear-gradient(135deg, rgba(22,163,74,0.08), transparent)", borderColor: "rgba(22,163,74,0.2)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                  <div>
                    <p style={{ fontWeight: 600, margin: "0 0 4px", fontSize: "15px" }}>✅ {result.jobTitle} at {result.company}</p>
                    {!user && <p style={{ fontSize: "12px", color: "#7C3AED", margin: 0 }}>Sign in to download your documents</p>}
                  </div>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <Btn primary color="#DC2626" onClick={function() { handleDownload("pdf"); }} disabled={!!downloading} style={{ padding: "9px 18px", fontSize: "13px" }}>
                      {downloading === "pdf" ? "⏳" : "📄"} {user ? "Download PDF" : "Get PDF — Sign in"}
                    </Btn>
                    <Btn primary onClick={function() { handleDownload("docx"); }} disabled={!!downloading} style={{ padding: "9px 18px", fontSize: "13px" }}>
                      {downloading === "docx" ? "⏳" : "📝"} {user ? "Download Word" : "Get Word — Sign in"}
                    </Btn>
                  </div>
                </div>
                {error && <p style={{ color: "#E24B4A", fontSize: "13px", margin: "10px 0 0" }}>⚠️ {error}</p>}
              </div>

              {/* Two column layout */}
              <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: "1rem", alignItems: "start" }}>

                {/* LEFT: ATS + Skills + Cover Letter */}
                <div style={{ display: "grid", gap: "1rem" }}>

                  {/* ATS Score */}
                  <div style={{ ...S.card, borderColor: atsScore >= 85 ? "rgba(22,163,74,0.3)" : atsScore >= 70 ? "rgba(245,158,11,0.3)" : "rgba(220,38,38,0.3)" }}>
                    <p style={{ fontWeight: 600, margin: "0 0 1rem", fontSize: "14px" }}>🎯 ATS Score</p>
                    <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", marginBottom: "1rem" }}>
                      <div style={{ position: "relative", width: "90px", height: "90px", flexShrink: 0 }}>
                        <svg width="90" height="90" viewBox="0 0 90 90">
                          <circle cx="45" cy="45" r="38" fill="none" stroke="var(--color-background-secondary)" strokeWidth="8" />
                          <circle cx="45" cy="45" r="38" fill="none" stroke={atsColor} strokeWidth="8"
                            strokeDasharray={circumference}
                            strokeDashoffset={circumference * (1 - (atsScore || 0) / 100)}
                            strokeLinecap="round"
                            transform="rotate(-90 45 45)" />
                        </svg>
                        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ fontWeight: 700, fontSize: "20px", color: atsColor }}>{atsScore || 0}%</span>
                        </div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 600, margin: "0 0 4px", fontSize: "14px", color: atsColor }}>{atsLabel}</p>
                        <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", margin: 0, lineHeight: 1.5 }}>
                          {atsScore >= 85 ? "Your CV is well-optimised and should pass ATS screening." : atsScore >= 70 ? "Good match. A few more keywords would improve your score." : "Consider adding more keywords from the job description."}
                        </p>
                      </div>
                    </div>
                    {cv && cv.keywordsMatched && cv.keywordsMatched.length > 0 && (
                      <div>
                        <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 6px" }}>Keywords matched</p>
                        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                          {cv.keywordsMatched.map(function(k, i) {
                            return <span key={i} style={{ padding: "2px 8px", borderRadius: "20px", fontSize: "11px", background: "rgba(22,163,74,0.12)", color: "#16A34A", fontWeight: 500 }}>✓ {k}</span>;
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Skills to upgrade */}
                  {result.data.skillsToUpgrade && result.data.skillsToUpgrade.length > 0 && (
                    <div style={{ ...S.card, borderColor: "rgba(245,158,11,0.25)", background: "rgba(245,158,11,0.03)" }}>
                      <p style={{ fontWeight: 600, margin: "0 0 4px", fontSize: "14px" }}>⚡ Skills to Develop for This Role</p>
                      <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", margin: "0 0 12px" }}>These skills appear in the job but were not found in your CV:</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {result.data.skillsToUpgrade.map(function(s, i) {
                          const icon = s.priority === "High" ? "🔴" : s.priority === "Medium" ? "🟡" : "🟢";
                          const badgeColor = s.priority === "High" ? "#DC2626" : s.priority === "Medium" ? "#D97706" : "#16A34A";
                          const badgeBg = s.priority === "High" ? "rgba(220,38,38,0.1)" : s.priority === "Medium" ? "rgba(245,158,11,0.1)" : "rgba(22,163,74,0.1)";
                          return (
                            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "8px 12px", background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)" }}>
                              <span style={{ fontSize: "14px", flexShrink: 0 }}>{icon}</span>
                              <div style={{ flex: 1 }}>
                                <p style={{ fontWeight: 600, margin: "0 0 2px", fontSize: "13px" }}>{s.skill}</p>
                                <p style={{ fontSize: "11px", color: "var(--color-text-secondary)", margin: 0 }}>{s.howToGet}</p>
                              </div>
                              <span style={{ fontSize: "10px", padding: "2px 7px", borderRadius: "20px", background: badgeBg, color: badgeColor, fontWeight: 600, whiteSpace: "nowrap", flexShrink: 0 }}>{s.priority}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Cover letter */}
                  {cl && (
                    <div style={S.card}>
                      <p style={{ fontWeight: 600, margin: "0 0 1rem", fontSize: "14px" }}>✉️ Cover Letter</p>
                      <div style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", padding: "1.25rem", fontFamily: "Georgia, serif", fontSize: "12px", lineHeight: 1.8, maxHeight: "320px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px" }}>
                        <p style={{ margin: 0, color: "var(--color-text-secondary)", fontSize: "11px" }}>Dear Hiring Manager,</p>
                        <p style={{ margin: 0 }}>{cl.opening}</p>
                        <p style={{ margin: 0 }}>{cl.body1}</p>
                        <p style={{ margin: 0 }}>{cl.body2}</p>
                        <p style={{ margin: 0 }}>{cl.closing}</p>
                        <p style={{ margin: 0, color: "var(--color-text-secondary)", fontSize: "11px" }}>Yours sincerely,<br /><strong>{cv && cv.name}</strong></p>
                      </div>
                    </div>
                  )}
                </div>

                {/* RIGHT: CV Preview */}
                <div style={{ position: "sticky", top: "80px" }}>
                  <div style={{ ...S.card, padding: 0, overflow: "hidden" }}>
                    <div style={{ padding: "12px 16px", borderBottom: "0.5px solid var(--color-border-tertiary)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <p style={{ fontWeight: 600, margin: 0, fontSize: "14px" }}>📄 CV Preview</p>
                      <span style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>Scroll to read full CV</span>
                    </div>
                    <div style={{ background: "#fff", color: "#1a1a2e", maxHeight: "680px", overflowY: "auto", padding: "28px 24px", fontFamily: "Arial, sans-serif", fontSize: "11px", lineHeight: 1.6 }}>
                      {cv && (
                        <div>
                          <div style={{ textAlign: "center", marginBottom: "16px", paddingBottom: "10px", borderBottom: "2px solid #1A3FA8" }}>
                            <p style={{ fontWeight: 700, fontSize: "18px", margin: "0 0 4px", color: "#1a1a2e" }}>{cv.name}</p>
                            <p style={{ fontSize: "10px", color: "#6b7280", margin: "0 0 4px" }}>
                              {[cv.email, cv.phone, cv.location].filter(Boolean).join("  |  ")}
                            </p>
                            {cv.atsScore && (
                              <p style={{ fontSize: "9px", color: "#16A34A", margin: 0, fontWeight: 600 }}>ATS Score: {cv.atsScore}%</p>
                            )}
                          </div>

                          {cv.summary && (
                            <div style={{ marginBottom: "12px" }}>
                              <p style={{ fontWeight: 700, fontSize: "9px", color: "#1A3FA8", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 4px", borderBottom: "0.5px solid #1A3FA8", paddingBottom: "2px" }}>Professional Summary</p>
                              <p style={{ margin: 0, fontSize: "10px" }}>{cv.summary}</p>
                            </div>
                          )}

                          {cv.experience && cv.experience.length > 0 && (
                            <div style={{ marginBottom: "12px" }}>
                              <p style={{ fontWeight: 700, fontSize: "9px", color: "#1A3FA8", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 6px", borderBottom: "0.5px solid #1A3FA8", paddingBottom: "2px" }}>Work Experience</p>
                              {cv.experience.map(function(e, i) {
                                return (
                                  <div key={i} style={{ marginBottom: "10px" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                                      <p style={{ fontWeight: 700, margin: "0 0 1px", fontSize: "10px" }}>{e.title}</p>
                                      <p style={{ fontSize: "9px", color: "#6b7280", margin: 0 }}>{e.startDate} – {e.endDate}</p>
                                    </div>
                                    <p style={{ fontSize: "9px", color: "#6b7280", margin: "0 0 3px" }}>{e.company}{e.location ? " · " + e.location : ""}</p>
                                    {(e.bullets || []).map(function(b, j) {
                                      return <p key={j} style={{ margin: "0 0 2px", fontSize: "9px", paddingLeft: "10px" }}>• {b}</p>;
                                    })}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {cv.education && cv.education.length > 0 && (
                            <div style={{ marginBottom: "12px" }}>
                              <p style={{ fontWeight: 700, fontSize: "9px", color: "#1A3FA8", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 6px", borderBottom: "0.5px solid #1A3FA8", paddingBottom: "2px" }}>Education</p>
                              {cv.education.map(function(e, i) {
                                return (
                                  <div key={i} style={{ marginBottom: "6px" }}>
                                    <p style={{ fontWeight: 700, margin: "0 0 1px", fontSize: "10px" }}>{e.degree}</p>
                                    <p style={{ fontSize: "9px", color: "#6b7280", margin: 0 }}>{e.institution} · {e.year}{e.grade ? " · " + e.grade : ""}</p>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {cv.skills && cv.skills.length > 0 && (
                            <div style={{ marginBottom: "12px" }}>
                              <p style={{ fontWeight: 700, fontSize: "9px", color: "#1A3FA8", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 6px", borderBottom: "0.5px solid #1A3FA8", paddingBottom: "2px" }}>Skills</p>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                                {cv.skills.map(function(s, i) {
                                  return <span key={i} style={{ padding: "2px 6px", background: "#EFF6FF", color: "#1A3FA8", borderRadius: "4px", fontSize: "9px", fontWeight: 500 }}>{s}</span>;
                                })}
                              </div>
                            </div>
                          )}

                          {cv.certifications && cv.certifications.length > 0 && (
                            <div>
                              <p style={{ fontWeight: 700, fontSize: "9px", color: "#1A3FA8", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 6px", borderBottom: "0.5px solid #1A3FA8", paddingBottom: "2px" }}>Certifications</p>
                              {cv.certifications.map(function(c, i) {
                                return <p key={i} style={{ margin: "0 0 2px", fontSize: "9px", paddingLeft: "10px" }}>• {c}</p>;
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          <Btn onClick={reset} style={{ padding: "10px", fontSize: "13px", width: "100%" }}>
            ↺ Generate for another job
          </Btn>
        </div>
      )}

    </div>
  </div>
  );
}
