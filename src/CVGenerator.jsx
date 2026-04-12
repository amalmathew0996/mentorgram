import { useState, useRef } from "react";

// ── Generate DOCX using docx library loaded from CDN ─────────────────────
async function downloadDOCX(cv, cl, jobTitle, company) {
  if (!window.docx) {
    await new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/docx/8.5.0/docx.umd.min.js";
      s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
  }
  const { Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle } = window.docx;
  const BLUE = "1A3FA8", DARK = "1a1a2e", GRAY = "6b7280";

  const hr = () => new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: BLUE } }, spacing: { after: 120 } });
  const heading = (text) => new Paragraph({ children: [new TextRun({ text, bold: true, color: BLUE, size: 26, font: "Calibri" })], spacing: { before: 240, after: 60 } });
  const body = (text, opts = {}) => new Paragraph({ children: [new TextRun({ text: text || "", size: 22, font: "Calibri", color: DARK, ...opts })], spacing: { after: 60 } });
  const bullet = (text) => new Paragraph({ children: [new TextRun({ text: "• " + text, size: 22, font: "Calibri", color: DARK })], indent: { left: 360 }, spacing: { after: 40 } });

  const sections = [];
  sections.push(new Paragraph({ children: [new TextRun({ text: cv.name || "", bold: true, size: 48, font: "Calibri", color: DARK })], alignment: AlignmentType.CENTER, spacing: { after: 80 } }));
  const contact = [cv.email, cv.phone, cv.location].filter(Boolean).join("  |  ");
  sections.push(new Paragraph({ children: [new TextRun({ text: contact, size: 20, font: "Calibri", color: GRAY })], alignment: AlignmentType.CENTER, spacing: { after: 200 } }));
  if (cv.atsScore) sections.push(new Paragraph({ children: [new TextRun({ text: `ATS Score: ${cv.atsScore}%  |  Keywords: ${(cv.keywordsMatched||[]).join(", ")}`, size: 18, font: "Calibri", color: "16A34A", italics: true })], alignment: AlignmentType.CENTER, spacing: { after: 200 } }));

  sections.push(heading("PROFESSIONAL SUMMARY")); sections.push(hr()); sections.push(body(cv.summary));
  if (cv.experience?.length > 0) {
    sections.push(heading("WORK EXPERIENCE")); sections.push(hr());
    cv.experience.forEach(e => {
      sections.push(new Paragraph({ children: [new TextRun({ text: e.title, bold: true, size: 24, font: "Calibri", color: DARK }), new TextRun({ text: "  |  " + e.company + (e.location ? "  |  " + e.location : ""), size: 22, font: "Calibri", color: GRAY })], spacing: { before: 160, after: 40 } }));
      sections.push(new Paragraph({ children: [new TextRun({ text: `${e.startDate} – ${e.endDate}`, size: 20, font: "Calibri", color: GRAY, italics: true })], spacing: { after: 80 } }));
      (e.bullets||[]).forEach(b => sections.push(bullet(b)));
    });
  }
  if (cv.education?.length > 0) {
    sections.push(heading("EDUCATION")); sections.push(hr());
    cv.education.forEach(e => sections.push(new Paragraph({ children: [new TextRun({ text: `${e.degree}  |  ${e.institution}  |  ${e.year}${e.grade ? "  |  "+e.grade : ""}`, size: 22, font: "Calibri", color: DARK })], spacing: { before: 120, after: 80 } })));
  }
  if (cv.skills?.length > 0) { sections.push(heading("SKILLS")); sections.push(hr()); sections.push(body(cv.skills.join("  •  "))); }
  if (cv.certifications?.length > 0) { sections.push(heading("CERTIFICATIONS")); sections.push(hr()); cv.certifications.forEach(c => sections.push(bullet(c))); }

  sections.push(new Paragraph({ pageBreakBefore: true }));
  sections.push(new Paragraph({ children: [new TextRun({ text: "COVER LETTER", bold: true, size: 36, font: "Calibri", color: BLUE })], alignment: AlignmentType.CENTER, spacing: { after: 40 } }));
  sections.push(hr());
  [body(""), body(cv.name||"", { bold: true }), body(contact), body(""), body("Dear Hiring Manager,"), body(""), body(cl.opening||""), body(""), body(cl.body1||""), body(""), body(cl.body2||""), body(""), body(cl.closing||""), body(""), body("Yours sincerely,"), body(""), body(cv.name||"", { bold: true })].forEach(p => sections.push(p));

  const doc = new Document({ sections: [{ properties: { page: { margin: { top: 720, right: 900, bottom: 720, left: 900 } } }, children: sections }] });
  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = `CV_${(cv.name||"").replace(/\s+/g,"_")}.docx`; a.click();
  URL.revokeObjectURL(url);
}

// ── Generate PDF using pdf-lib ────────────────────────────────────────────
async function downloadPDF(cv, cl, jobTitle, company) {
  if (!window.PDFLib) {
    await new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js";
      s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
  }
  const { PDFDocument, rgb, StandardFonts } = window.PDFLib;
  const pdfDoc = await PDFDocument.create();
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const normalFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const BLUE = rgb(0.10,0.25,0.66), DARK = rgb(0.10,0.10,0.14), GRAY = rgb(0.42,0.44,0.50), GREEN = rgb(0.09,0.64,0.29);
  const margin = 50, pageW = 595, pageH = 842, colW = pageW - margin*2;
  let page = pdfDoc.addPage([pageW, pageH]), y = pageH - margin;

  function newPage() { page = pdfDoc.addPage([pageW,pageH]); y = pageH - margin; }
  function checkSpace(n=30) { if (y-n < margin) newPage(); }
  function drawText(text, opts={}) {
    const { font=normalFont, size=10, color=DARK, x=margin, indent=0 } = opts;
    if (!text) return;
    const words = text.split(" "); let line = ""; const lines = [];
    words.forEach(w => { const test = line ? line+" "+w : w; if (font.widthOfTextAtSize(test,size) > colW-indent) { if(line) lines.push(line); line=w; } else line=test; });
    if (line) lines.push(line);
    lines.forEach(l => { checkSpace(size+4); page.drawText(l,{x:x+indent,y,size,font,color}); y-=size+4; });
  }
  function drawHeading(text) { checkSpace(30); y-=8; drawText(text,{font:boldFont,size:11,color:BLUE}); checkSpace(4); page.drawLine({start:{x:margin,y:y+2},end:{x:pageW-margin,y:y+2},thickness:0.8,color:BLUE}); y-=6; }

  const nameW = boldFont.widthOfTextAtSize(cv.name||"",20);
  page.drawText(cv.name||"",{x:(pageW-nameW)/2,y,size:20,font:boldFont,color:DARK}); y-=26;
  const contact=[cv.email,cv.phone,cv.location].filter(Boolean).join("  |  ");
  const cW=normalFont.widthOfTextAtSize(contact,9);
  page.drawText(contact,{x:Math.max(margin,(pageW-cW)/2),y,size:9,font:normalFont,color:GRAY}); y-=18;
  if (cv.atsScore) { const t=`ATS Score: ${cv.atsScore}%  |  Keywords: ${(cv.keywordsMatched||[]).slice(0,5).join(", ")}`; const aW=normalFont.widthOfTextAtSize(t,8); page.drawText(t,{x:Math.max(margin,(pageW-aW)/2),y,size:8,font:normalFont,color:GREEN}); y-=16; } y-=4;
  drawHeading("PROFESSIONAL SUMMARY"); drawText(cv.summary||""); y-=4;
  if (cv.experience?.length>0) { drawHeading("WORK EXPERIENCE"); cv.experience.forEach(e => { y-=4; drawText(`${e.title}  |  ${e.company}${e.location?" | "+e.location:""}`,{font:boldFont,size:10}); drawText(`${e.startDate} – ${e.endDate}`,{size:9,color:GRAY}); (e.bullets||[]).forEach(b=>drawText("• "+b,{size:9,indent:10})); }); y-=4; }
  if (cv.education?.length>0) { drawHeading("EDUCATION"); cv.education.forEach(e=>drawText(`${e.degree}  |  ${e.institution}  |  ${e.year}${e.grade?" | "+e.grade:""}`,{size:10})); y-=4; }
  if (cv.skills?.length>0) { drawHeading("SKILLS"); drawText(cv.skills.join("  •  "),{size:9}); y-=4; }
  if (cv.certifications?.length>0) { drawHeading("CERTIFICATIONS"); cv.certifications.forEach(c=>drawText("• "+c,{size:9,indent:10})); }

  newPage();
  const clTitle="COVER LETTER"; const clW=boldFont.widthOfTextAtSize(clTitle,16);
  page.drawText(clTitle,{x:(pageW-clW)/2,y,size:16,font:boldFont,color:BLUE}); y-=22;
  page.drawLine({start:{x:margin,y:y+4},end:{x:pageW-margin,y:y+4},thickness:0.8,color:BLUE}); y-=16;
  drawText(cv.name||"",{font:boldFont}); drawText(contact,{color:GRAY,size:9}); y-=10;
  drawText("Dear Hiring Manager,"); y-=6;
  drawText(cl.opening||""); y-=6; drawText(cl.body1||""); y-=6; drawText(cl.body2||""); y-=6; drawText(cl.closing||""); y-=10;
  drawText("Yours sincerely,"); y-=14; drawText(cv.name||"",{font:boldFont});

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes],{type:"application/pdf"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href=url; a.download=`CV_${(cv.name||"").replace(/\s+/g,"_")}.pdf`; a.click();
  URL.revokeObjectURL(url);
}

// ── Extract CV text from file ─────────────────────────────────────────────
async function extractCVText(file) {
  const name = file.name.toLowerCase();
  if (file.type === "application/pdf" || name.endsWith(".pdf")) {
    if (!window.pdfjsLib) {
      await new Promise((res,rej) => { const s=document.createElement("script"); s.src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"; s.onload=res; s.onerror=rej; document.head.appendChild(s); });
    }
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
          const pdf = await window.pdfjsLib.getDocument({ data: e.target.result }).promise;
          let text = "";
          for (let i=1;i<=pdf.numPages;i++) { const page=await pdf.getPage(i); const content=await page.getTextContent(); text+=content.items.map(item=>item.str).join(" ")+"\n"; }
          resolve(text);
        } catch(err) { reject(err); }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }
  if (name.endsWith(".docx")) {
    if (!window.mammoth) await new Promise((res,rej) => { const s=document.createElement("script"); s.src="https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js"; s.onload=res; s.onerror=rej; document.head.appendChild(s); });
    const arrayBuffer = await file.arrayBuffer();
    const result = await window.mammoth.extractRawText({ arrayBuffer });
    return result.value || "";
  }
  return file.text();
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────
export default function CVGenerator({ user, cvText: propCvText, onNavigateToCV, onSignIn }) {
  const [step, setStep]             = useState(1); // 1=upload CV, 2=paste job, 3=results
  const [cvText, setCvText]         = useState(propCvText || "");
  const [cvFileName, setCvFileName] = useState(propCvText ? "Profile CV" : "");
  const [cvLoading, setCvLoading]   = useState(false);
  const [jobUrl, setJobUrl]         = useState("");
  const [jobDesc, setJobDesc]       = useState("");
  const [inputMode, setInputMode]   = useState("url");
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const [result, setResult]         = useState(null);
  const [downloading, setDownloading] = useState("");
  const [showSignIn, setShowSignIn] = useState(false);
  const fileRef = useRef(null);

  const card = { background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: "1.5rem" };
  const inp  = { padding: "10px 14px", borderRadius: "var(--border-radius-md)", border: "0.5px solid var(--color-border-secondary)", background: "var(--color-background-secondary)", color: "var(--color-text-primary)", fontSize: "14px", outline: "none", fontFamily: "inherit", width: "100%", boxSizing: "border-box" };
  const btnStyle = (primary, color) => ({ padding: "10px 22px", borderRadius: "var(--border-radius-md)", fontSize: "14px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit", background: primary ? (color||"#1A3FA8") : "transparent", color: primary ? "#fff" : "var(--color-text-primary)", border: primary ? "none" : "0.5px solid var(--color-border-secondary)" });

  async function handleFile(file) {
    if (!file) return;
    setCvLoading(true); setError("");
    try {
      const text = await extractCVText(file);
      if (!text || text.trim().length < 30) { setError("Could not read this file. Try PDF or paste text below."); setCvLoading(false); return; }
      setCvText(text); setCvFileName(file.name);
    } catch(err) { setError("Could not read file: " + err.message); }
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
        body: JSON.stringify({ cvText, jobDescription: inputMode==="text"?jobDesc:"", jobUrl: inputMode==="url"?jobUrl:"" }),
      });
      let data; try { data=await res.json(); } catch { throw new Error("Server error"); }
      if (!res.ok||data.error) throw new Error(data.error||"Generation failed");
      setResult(data); setStep(3);
    } catch(err) { setError(err.message); }
    setLoading(false);
  }

  async function handleDownload(fmt) {
    // ✅ Fix 1: Gate download behind sign-in
    if (!user) { setShowSignIn(true); return; }
    setDownloading(fmt); setError("");
    try {
      const { cv, coverLetter } = result.data;
      if (fmt==="docx") await downloadDOCX(cv, coverLetter, result.jobTitle, result.company);
      else await downloadPDF(cv, coverLetter, result.jobTitle, result.company);
    } catch(err) { setError("Download failed: " + err.message); }
    setDownloading("");
  }

  const STEPS = [
    { n: 1, label: "Upload any CV", desc: "Just to get basic details — we'll tailor it to the job" },
    { n: 2, label: "Paste a job",   desc: "URL or description from any job board" },
    { n: 3, label: "Download",      desc: "ATS-optimised CV + cover letter ready to send" },
  ];

  return (
    <div style={{ maxWidth: "820px", margin: "0 auto", padding: "2rem 1.5rem", display: "grid", gap: "1.25rem" }}>

      {/* Header */}
      <div style={{ ...card, background: "linear-gradient(135deg, rgba(26,63,168,0.08), rgba(22,163,74,0.04))", borderColor: "rgba(26,63,168,0.2)" }}>
        <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
          <span style={{ fontSize: "40px" }}>🎯</span>
          <div>
            <h2 style={{ margin: "0 0 6px", fontSize: "1.3rem", fontWeight: 600 }}>CV & Cover Letter Generator</h2>
            <p style={{ margin: 0, fontSize: "14px", color: "var(--color-text-secondary)", lineHeight: 1.7 }}>
              Upload <strong>any CV</strong> as a starting point — paste a job URL or description — and we'll tailor your CV and write a cover letter that's 95%+ ATS friendly and keyword-matched to that specific role.
            </p>
          </div>
        </div>
      </div>

      {/* ✅ Fix 3: Steps */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
        {STEPS.map(s => (
          <div key={s.n} onClick={() => s.n < step && setStep(s.n)}
            style={{ ...card, padding: "1rem", borderColor: step === s.n ? "#1A3FA8" : step > s.n ? "rgba(22,163,74,0.4)" : "var(--color-border-tertiary)", background: step === s.n ? "rgba(26,63,168,0.05)" : step > s.n ? "rgba(22,163,74,0.04)" : "var(--color-background-primary)", cursor: s.n < step ? "pointer" : "default", transition: "all 0.15s" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: step > s.n ? "#16A34A" : step === s.n ? "#1A3FA8" : "var(--color-background-secondary)", color: step >= s.n ? "#fff" : "var(--color-text-secondary)", fontSize: "12px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {step > s.n ? "✓" : s.n}
              </div>
              <p style={{ fontWeight: 600, margin: 0, fontSize: "13px", color: step === s.n ? "#1A3FA8" : step > s.n ? "#16A34A" : "var(--color-text-secondary)" }}>{s.label}</p>
            </div>
            <p style={{ fontSize: "11px", color: "var(--color-text-secondary)", margin: 0, paddingLeft: "32px", lineHeight: 1.4 }}>{s.desc}</p>
          </div>
        ))}
      </div>

      {/* ── STEP 1: Upload CV ── */}
      {step === 1 && (
        <div style={card}>
          <div style={{ display: "flex", gap: "10px", alignItems: "flex-start", marginBottom: "1.25rem", padding: "10px 14px", background: "rgba(26,63,168,0.06)", borderRadius: "var(--border-radius-md)", border: "0.5px solid rgba(26,63,168,0.15)" }}>
            <span style={{ fontSize: "20px" }}>💡</span>
            <p style={{ margin: 0, fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
              <strong style={{ color: "var(--color-text-primary)" }}>Upload any CV</strong> — it doesn't need to be perfect. We just need basic details (your name, experience, skills) to tailor it to the job. Even an old or rough draft works.
            </p>
          </div>

          <div onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor="#1A3FA8"; }}
            onDragLeave={e => { e.currentTarget.style.borderColor="var(--color-border-secondary)"; }}
            onDrop={e => { e.preventDefault(); e.currentTarget.style.borderColor="var(--color-border-secondary)"; handleFile(e.dataTransfer.files[0]); }}
            style={{ border: "2px dashed var(--color-border-secondary)", borderRadius: "var(--border-radius-lg)", padding: "2.5rem", textAlign: "center", cursor: "pointer", marginBottom: "1rem", background: "var(--color-background-secondary)", transition: "border-color 0.2s" }}>
            <input ref={fileRef} type="file" accept=".pdf,.txt,.doc,.docx" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
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
                <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", margin: 0 }}>PDF, DOCX, TXT · Any version, even an old draft</p>
              </div>
            )}
          </div>

          <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", textAlign: "center", margin: "0 0 8px" }}>— or paste your CV text below —</p>
          <textarea value={cvText} onChange={e => { setCvText(e.target.value); setCvFileName(""); }}
            placeholder="Paste your CV content here — name, experience, skills, education..."
            style={{ ...inp, minHeight: "130px", resize: "vertical" }} />

          {error && <p style={{ color: "#E24B4A", fontSize: "13px", margin: "8px 0 0" }}>⚠️ {error}</p>}

          <button onClick={() => { if (!cvText.trim()) { setError("Please upload or paste your CV first."); return; } setError(""); setStep(2); }}
            disabled={cvLoading}
            style={{ ...btnStyle(true), marginTop: "1rem", width: "100%", padding: "13px", fontSize: "15px", opacity: cvLoading ? 0.6 : 1 }}>
            Next: Paste the job →
          </button>
        </div>
      )}

      {/* ── STEP 2: Job input ── */}
      {step === 2 && (
        <div style={card}>
          <div style={{ display: "flex", gap: "8px", marginBottom: "1.25rem" }}>
            {[{ key: "url", label: "🔗 Paste job URL" }, { key: "text", label: "📋 Paste job description" }].map(m => (
              <button key={m.key} onClick={() => setInputMode(m.key)}
                style={{ padding: "8px 18px", borderRadius: "20px", fontSize: "13px", fontWeight: inputMode===m.key?600:400, cursor: "pointer", fontFamily: "inherit", border: "none", background: inputMode===m.key?"#1A3FA8":"var(--color-background-secondary)", color: inputMode===m.key?"#fff":"var(--color-text-secondary)" }}>
                {m.label}
              </button>
            ))}
          </div>

          {inputMode === "url" ? (
            <div>
              <label style={{ fontSize: "12px", color: "var(--color-text-secondary)", display: "block", marginBottom: "6px", fontWeight: 500 }}>Job URL — from Reed, Indeed, LinkedIn, Glassdoor, etc.</label>
              <input style={inp} value={jobUrl} onChange={e => setJobUrl(e.target.value)} placeholder="https://www.reed.co.uk/jobs/software-engineer-12345..." />
              <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", margin: "6px 0 0" }}>💡 If the URL doesn't work (some sites block scraping), switch to "Paste job description" mode</p>
            </div>
          ) : (
            <div>
              <label style={{ fontSize: "12px", color: "var(--color-text-secondary)", display: "block", marginBottom: "6px", fontWeight: 500 }}>Paste the full job description</label>
              <textarea style={{ ...inp, minHeight: "180px", resize: "vertical" }} value={jobDesc} onChange={e => setJobDesc(e.target.value)}
                placeholder="Paste the full job posting here — responsibilities, requirements, about the company..." />
            </div>
          )}

          {error && <p style={{ color: "#E24B4A", fontSize: "13px", margin: "10px 0 0", lineHeight: 1.5 }}>⚠️ {error}</p>}

          <div style={{ display: "flex", gap: "8px", marginTop: "1rem" }}>
            <button onClick={() => setStep(1)} style={{ ...btnStyle(false), padding: "12px 20px" }}>← Back</button>
            <button onClick={generate} disabled={loading}
              style={{ ...btnStyle(true), flex: 1, padding: "12px", fontSize: "15px", opacity: loading ? 0.7 : 1 }}>
              {loading ? "✨ Generating..." : "✨ Generate CV & Cover Letter"}
            </button>
          </div>

          {loading && (
            <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "6px" }}>
              <style>{".spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}"}</style>
              {["Analysing job description...", "Matching your skills to requirements...", "Optimising for ATS keywords...", "Writing your tailored cover letter..."].map((msg, i) => (
                <div key={i} style={{ display: "flex", gap: "10px", alignItems: "center", padding: "8px 12px", background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)" }}>
                  <div className="spin" style={{ width:"12px",height:"12px",border:"2px solid rgba(26,63,168,0.2)",borderTopColor:"#1A3FA8",borderRadius:"50%",flexShrink:0 }} />
                  <span style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>{msg}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── STEP 3: Results ── */}
      {step === 3 && result?.data && (
        <div style={{ display: "grid", gap: "1rem" }}>

          {/* ✅ Fix 1: Sign-in gate on download */}
          {showSignIn && !user ? (
            <div style={{ ...card, background: "linear-gradient(135deg, rgba(26,63,168,0.08), rgba(124,58,237,0.06))", borderColor: "rgba(26,63,168,0.25)", textAlign: "center", padding: "2.5rem" }}>
              <div style={{ fontSize: "48px", marginBottom: "1rem" }}>🔒</div>
              <h3 style={{ margin: "0 0 8px", fontSize: "1.1rem", fontWeight: 600 }}>Sign in to download your documents</h3>
              <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", margin: "0 0 1.5rem", lineHeight: 1.6 }}>
                Your tailored CV and cover letter are ready! Create a free account to download them — and save your results for future use.
              </p>
              <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
                {onSignIn && (
                  <button onClick={onSignIn}
                    style={{ ...btnStyle(true), padding: "12px 28px", fontSize: "15px" }}>
                    Sign in / Register — it's free
                  </button>
                )}
                <button onClick={() => setShowSignIn(false)}
                  style={{ ...btnStyle(false), padding: "12px 20px" }}>
                  ← Back to preview
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Download card */}
              <div style={{ ...card, background: "linear-gradient(135deg, rgba(22,163,74,0.08), transparent)", borderColor: "rgba(22,163,74,0.2)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                  <div>
                    <p style={{ fontWeight: 600, margin: "0 0 4px", fontSize: "15px" }}>
                      ✅ Ready — {result.jobTitle} at {result.company}
                    </p>
                    {result.data.cv?.atsScore && (
                      <p style={{ fontSize: "13px", color: "#16A34A", margin: "0 0 4px", fontWeight: 500 }}>
                        ATS Score: {result.data.cv.atsScore}% · Matched: {(result.data.cv.keywordsMatched||[]).join(", ")}
                      </p>
                    )}
                    {!user && <p style={{ fontSize: "12px", color: "#7C3AED", margin: 0 }}>Sign in to download ↓</p>}
                  </div>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <button onClick={() => handleDownload("pdf")} disabled={!!downloading}
                      style={{ ...btnStyle(true, "#DC2626"), padding: "10px 20px", opacity: downloading?0.7:1, display:"flex",alignItems:"center",gap:"6px" }}>
                      {downloading==="pdf" ? "⏳" : "📄"} {user ? "Download PDF" : "Get PDF — Sign in"}
                    </button>
                    <button onClick={() => handleDownload("docx")} disabled={!!downloading}
                      style={{ ...btnStyle(true, "#1A3FA8"), padding: "10px 20px", opacity: downloading?0.7:1, display:"flex",alignItems:"center",gap:"6px" }}>
                      {downloading==="docx" ? "⏳" : "📝"} {user ? "Download Word" : "Get Word — Sign in"}
                    </button>
                  </div>
                </div>
                {error && <p style={{ color: "#E24B4A", fontSize: "13px", margin: "10px 0 0" }}>⚠️ {error}</p>}
              </div>

              {/* CV Preview */}
              <div style={card}>
                <p style={{ fontWeight: 600, margin: "0 0 1rem", fontSize: "15px" }}>📄 Your Tailored CV</p>
                <div style={{ background:"var(--color-background-secondary)",borderRadius:"var(--border-radius-md)",padding:"1.5rem",fontFamily:"Georgia, serif",fontSize:"13px",lineHeight:1.7 }}>
                  <p style={{ fontWeight:700,fontSize:"18px",margin:"0 0 4px",textAlign:"center" }}>{result.data.cv?.name}</p>
                  <p style={{ textAlign:"center",color:"var(--color-text-secondary)",fontSize:"12px",margin:"0 0 16px" }}>{[result.data.cv?.email,result.data.cv?.phone,result.data.cv?.location].filter(Boolean).join("  |  ")}</p>
                  <p style={{ fontWeight:700,color:"#1A3FA8",margin:"12px 0 4px",fontSize:"11px",textTransform:"uppercase",letterSpacing:"0.05em" }}>Professional Summary</p>
                  <p style={{ margin:"0 0 12px",fontSize:"13px" }}>{result.data.cv?.summary}</p>
                  {result.data.cv?.experience?.length>0 && <>
                    <p style={{ fontWeight:700,color:"#1A3FA8",margin:"12px 0 4px",fontSize:"11px",textTransform:"uppercase",letterSpacing:"0.05em" }}>Work Experience</p>
                    {result.data.cv.experience.slice(0,2).map((e,i) => (
                      <div key={i} style={{ marginBottom:"10px" }}>
                        <p style={{ fontWeight:600,margin:"0 0 2px" }}>{e.title} | {e.company}</p>
                        <p style={{ color:"var(--color-text-secondary)",fontSize:"12px",margin:"0 0 4px" }}>{e.startDate} – {e.endDate}</p>
                        {(e.bullets||[]).slice(0,2).map((b,j)=><p key={j} style={{ margin:"0 0 2px",fontSize:"12px",paddingLeft:"12px" }}>• {b}</p>)}
                      </div>
                    ))}
                  </>}
                  {result.data.cv?.skills?.length>0 && <>
                    <p style={{ fontWeight:700,color:"#1A3FA8",margin:"12px 0 4px",fontSize:"11px",textTransform:"uppercase",letterSpacing:"0.05em" }}>Skills</p>
                    <p style={{ fontSize:"12px",margin:0 }}>{result.data.cv.skills.join("  •  ")}</p>
                  </>}
                </div>
              </div>

              {/* Cover Letter Preview */}
              <div style={card}>
                <p style={{ fontWeight:600,margin:"0 0 1rem",fontSize:"15px" }}>✉️ Your Cover Letter</p>
                <div style={{ background:"var(--color-background-secondary)",borderRadius:"var(--border-radius-md)",padding:"1.5rem",fontFamily:"Georgia, serif",fontSize:"13px",lineHeight:1.8,display:"flex",flexDirection:"column",gap:"12px" }}>
                  <p style={{ margin:0,color:"var(--color-text-secondary)",fontSize:"12px" }}>Dear Hiring Manager,</p>
                  <p style={{ margin:0 }}>{result.data.coverLetter?.opening}</p>
                  <p style={{ margin:0 }}>{result.data.coverLetter?.body1}</p>
                  <p style={{ margin:0 }}>{result.data.coverLetter?.body2}</p>
                  <p style={{ margin:0 }}>{result.data.coverLetter?.closing}</p>
                  <p style={{ margin:0,color:"var(--color-text-secondary)",fontSize:"12px" }}>Yours sincerely,<br /><strong>{result.data.cv?.name}</strong></p>
                </div>
              </div>
            </>
          )}

          <button onClick={() => { setResult(null); setStep(1); setJobUrl(""); setJobDesc(""); setError(""); setShowSignIn(false); }}
            style={{ ...btnStyle(false), padding:"10px",fontSize:"13px",width:"100%" }}>
            ↺ Generate for another job
          </button>
        </div>
      )}
    </div>
  );
}
