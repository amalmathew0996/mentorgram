import { useState, useRef, useEffect } from "react";

var CARD = { background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: "1.5rem" };
var INP = { padding: "10px 14px", borderRadius: "var(--border-radius-md)", border: "0.5px solid var(--color-border-secondary)", background: "var(--color-background-secondary)", color: "var(--color-text-primary)", fontSize: "14px", outline: "none", fontFamily: "inherit", width: "100%", boxSizing: "border-box" };
var SPIN_CSS = ".cvgen-spin" + "{" + "animation:cvgen-spin 1s linear infinite" + "}" + "@keyframes cvgen-spin" + "{" + "from" + "{" + "transform:rotate" + "(0deg)" + "}" + "to" + "{" + "transform:rotate" + "(360deg)" + "}" + "}";

function mkBtn(primary, col) {
  return { padding: "10px 22px", borderRadius: "var(--border-radius-md)", fontSize: "14px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit", background: primary ? (col || "#1A3FA8") : "transparent", color: primary ? "#fff" : "var(--color-text-primary)", border: primary ? "none" : "0.5px solid var(--color-border-secondary)" };
}

function atsRingStyle(score, color) {
  var deg = (score || 0) * 3.6;
  return { width: "90px", height: "90px", borderRadius: "50%", background: "conic-gradient(" + color + " " + deg + "deg, var(--color-background-secondary) 0deg" + ")", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 };
}

function loadScript(src) {
  if (document.querySelector('script[src="' + src + '"]')) return Promise.resolve();
  return new Promise(function(res, rej) {
    var s = document.createElement("script");
    s.src = src;
    s.onload = res;
    s.onerror = rej;
    document.head.appendChild(s);
  });
}

function extractCVText(file) {
  var name = file.name.toLowerCase();
  if (file.type === "application/pdf" || name.indexOf(".pdf") !== -1) {
    return loadScript("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js").then(function() {
      return new Promise(function(resolve, reject) {
        var reader = new FileReader();
        reader.onload = function(e) {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
          window.pdfjsLib.getDocument({ data: e.target.result }).promise.then(function(pdf) {
            var text = "";
            var pages = [];
            for (var i = 1; i <= pdf.numPages; i++) { pages.push(i); }
            var chain = Promise.resolve();
            pages.forEach(function(p) {
              chain = chain.then(function() {
                return pdf.getPage(p).then(function(page) {
                  return page.getTextContent().then(function(content) {
                    text += content.items.map(function(item) { return item.str; }).join(" ") + "\n";
                  });
                });
              });
            });
            chain.then(function() { resolve(text); }).catch(reject);
          }).catch(reject);
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
      });
    });
  }
  if (name.indexOf(".docx") !== -1) {
    return loadScript("https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js").then(function() {
      return file.arrayBuffer().then(function(ab) {
        return window.mammoth.extractRawText({ arrayBuffer: ab }).then(function(r) { return r.value || ""; });
      });
    });
  }
  return file.text();
}

function doDownloadDOCX(cv, cl) {
  return loadScript("https://cdnjs.cloudflare.com/ajax/libs/docx/8.5.0/docx.umd.min.js").then(function() {
    var D = window.docx;
    var BLUE = "1A3FA8", DARK = "1a1a2e", GRAY = "6b7280";
    function hr() { return new D.Paragraph({ border: { bottom: { style: D.BorderStyle.SINGLE, size: 4, color: BLUE } }, spacing: { after: 120 } }); }
    function h(text) { return new D.Paragraph({ children: [new D.TextRun({ text: text, bold: true, color: BLUE, size: 26, font: "Calibri" })], spacing: { before: 240, after: 60 } }); }
    function p(text, opts) { return new D.Paragraph({ children: [new D.TextRun(Object.assign({ text: text || "", size: 22, font: "Calibri", color: DARK }, opts || {}))], spacing: { after: 60 } }); }
    function b(text) { return new D.Paragraph({ children: [new D.TextRun({ text: "- " + text, size: 22, font: "Calibri", color: DARK })], indent: { left: 360 }, spacing: { after: 40 } }); }
    var contact = [cv.email, cv.phone, cv.location].filter(Boolean).join("  |  ");
    var children = [];
    children.push(new D.Paragraph({ children: [new D.TextRun({ text: cv.name || "", bold: true, size: 48, font: "Calibri", color: DARK })], alignment: D.AlignmentType.CENTER, spacing: { after: 80 } }));
    children.push(new D.Paragraph({ children: [new D.TextRun({ text: contact, size: 20, font: "Calibri", color: GRAY })], alignment: D.AlignmentType.CENTER, spacing: { after: 200 } }));
    children.push(h("PROFESSIONAL SUMMARY")); children.push(hr()); children.push(p(cv.summary));
    if (cv.experience && cv.experience.length > 0) {
      children.push(h("WORK EXPERIENCE")); children.push(hr());
      cv.experience.forEach(function(e) {
        children.push(new D.Paragraph({ children: [new D.TextRun({ text: e.title + " | " + e.company, bold: true, size: 24, font: "Calibri", color: DARK })], spacing: { before: 160, after: 40 } }));
        children.push(new D.Paragraph({ children: [new D.TextRun({ text: e.startDate + " - " + e.endDate, size: 20, font: "Calibri", color: GRAY, italics: true })], spacing: { after: 80 } }));
        (e.bullets || []).forEach(function(bl) { children.push(b(bl)); });
      });
    }
    if (cv.education && cv.education.length > 0) {
      children.push(h("EDUCATION")); children.push(hr());
      cv.education.forEach(function(e) { children.push(p(e.degree + " | " + e.institution + " | " + e.year + (e.grade ? " | " + e.grade : ""))); });
    }
    if (cv.skills && cv.skills.length > 0) { children.push(h("SKILLS")); children.push(hr()); children.push(p(cv.skills.join("  |  "))); }
    if (cv.certifications && cv.certifications.length > 0) { children.push(h("CERTIFICATIONS")); children.push(hr()); cv.certifications.forEach(function(c) { children.push(b(c)); }); }
    children.push(new D.Paragraph({ pageBreakBefore: true }));
    children.push(new D.Paragraph({ children: [new D.TextRun({ text: "COVER LETTER", bold: true, size: 36, font: "Calibri", color: BLUE })], alignment: D.AlignmentType.CENTER, spacing: { after: 80 } }));
    children.push(hr());
    [p(cv.name, { bold: true }), p(contact), p(""), p("Dear Hiring Manager,"), p(""), p(cl.opening), p(""), p(cl.body1), p(""), p(cl.body2), p(""), p(cl.closing), p(""), p("Yours sincerely,"), p(""), p(cv.name, { bold: true })].forEach(function(c) { children.push(c); });
    var doc = new D.Document({ sections: [{ properties: { page: { margin: { top: 720, right: 900, bottom: 720, left: 900 } } }, children: children }] });
    return D.Packer.toBlob(doc).then(function(blob) {
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url; a.download = "CV_CoverLetter.docx"; a.click();
      URL.revokeObjectURL(url);
    });
  });
}

function doDownloadPDF(cv, cl) {
  return loadScript("https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js").then(function() {
    var PL = window.PDFLib;
    return PL.PDFDocument.create().then(function(pdfDoc) {
      return Promise.all([pdfDoc.embedFont(PL.StandardFonts.HelveticaBold), pdfDoc.embedFont(PL.StandardFonts.Helvetica)]).then(function(fonts) {
        var boldFont = fonts[0], normFont = fonts[1];
        var BLUE = PL.rgb(0.10, 0.25, 0.66), DARK = PL.rgb(0.10, 0.10, 0.14), GRAY = PL.rgb(0.42, 0.44, 0.50), GREEN = PL.rgb(0.09, 0.64, 0.29);
        var margin = 50, pageW = 595, pageH = 842, colW = pageW - margin * 2;
        var page = pdfDoc.addPage([pageW, pageH]), y = pageH - margin;
        function newPage() { page = pdfDoc.addPage([pageW, pageH]); y = pageH - margin; }
        function chk(n) { if (y - n < margin) newPage(); }
        function txt(text, opts) {
          var font = (opts && opts.font) || normFont, size = (opts && opts.size) || 10, color = (opts && opts.color) || DARK, indent = (opts && opts.indent) || 0;
          if (!text) return;
          var words = text.split(" "), line = "", lines = [];
          words.forEach(function(w) { var test = line ? line + " " + w : w; if (font.widthOfTextAtSize(test, size) > colW - indent) { if (line) lines.push(line); line = w; } else { line = test; } });
          if (line) lines.push(line);
          lines.forEach(function(l) { chk(size + 4); page.drawText(l, { x: margin + indent, y: y, size: size, font: font, color: color }); y -= size + 4; });
        }
        function hdg(text) { chk(30); y -= 8; txt(text, { font: boldFont, size: 11, color: BLUE }); chk(4); page.drawLine({ start: { x: margin, y: y + 2 }, end: { x: pageW - margin, y: y + 2 }, thickness: 0.8, color: BLUE }); y -= 6; }
        var contact = [cv.email, cv.phone, cv.location].filter(Boolean).join("  |  ");
        var nameW = boldFont.widthOfTextAtSize(cv.name || "", 20);
        page.drawText(cv.name || "", { x: (pageW - nameW) / 2, y: y, size: 20, font: boldFont, color: DARK }); y -= 26;
        var cW = normFont.widthOfTextAtSize(contact, 9);
        page.drawText(contact, { x: Math.max(margin, (pageW - cW) / 2), y: y, size: 9, font: normFont, color: GRAY }); y -= 18;
        if (cv.atsScore) { var t = "ATS Score: " + cv.atsScore + "%"; var aW = normFont.widthOfTextAtSize(t, 8); page.drawText(t, { x: Math.max(margin, (pageW - aW) / 2), y: y, size: 8, font: normFont, color: GREEN }); y -= 16; }
        y -= 4;
        hdg("PROFESSIONAL SUMMARY"); txt(cv.summary || ""); y -= 4;
        if (cv.experience && cv.experience.length > 0) { hdg("WORK EXPERIENCE"); cv.experience.forEach(function(e) { y -= 4; txt(e.title + "  |  " + e.company, { font: boldFont, size: 10 }); txt(e.startDate + " - " + e.endDate, { size: 9, color: GRAY }); (e.bullets || []).forEach(function(bl) { txt("- " + bl, { size: 9, indent: 10 }); }); }); y -= 4; }
        if (cv.education && cv.education.length > 0) { hdg("EDUCATION"); cv.education.forEach(function(e) { txt(e.degree + "  |  " + e.institution + "  |  " + e.year, { size: 10 }); }); y -= 4; }
        if (cv.skills && cv.skills.length > 0) { hdg("SKILLS"); txt(cv.skills.join("  |  "), { size: 9 }); y -= 4; }
        newPage();
        var clTitle = "COVER LETTER"; var clW = boldFont.widthOfTextAtSize(clTitle, 16);
        page.drawText(clTitle, { x: (pageW - clW) / 2, y: y, size: 16, font: boldFont, color: BLUE }); y -= 22;
        page.drawLine({ start: { x: margin, y: y + 4 }, end: { x: pageW - margin, y: y + 4 }, thickness: 0.8, color: BLUE }); y -= 16;
        txt(cv.name || "", { font: boldFont }); txt(contact, { color: GRAY, size: 9 }); y -= 10;
        txt("Dear Hiring Manager,"); y -= 6;
        txt(cl.opening || ""); y -= 6; txt(cl.body1 || ""); y -= 6; txt(cl.body2 || ""); y -= 6; txt(cl.closing || ""); y -= 10;
        txt("Yours sincerely,"); y -= 14; txt(cv.name || "", { font: boldFont });
        return pdfDoc.save().then(function(bytes) {
          var blob = new Blob([bytes], { type: "application/pdf" });
          var url = URL.createObjectURL(blob);
          var a = document.createElement("a");
          a.href = url; a.download = "CV_CoverLetter.pdf"; a.click();
          URL.revokeObjectURL(url);
        });
      });
    });
  });
}

export default function CVGenerator(props) {
  var user = props.user;
  var propCvText = props.cvText || "";
  var onSignIn = props.onSignIn;

  var s1 = useState(1); var step = s1[0]; var setStep = s1[1];
  var s2 = useState(propCvText); var cvText = s2[0]; var setCvText = s2[1];
  var s3 = useState(propCvText ? "Profile CV" : ""); var cvFileName = s3[0]; var setCvFileName = s3[1];
  var s4 = useState(false); var cvLoading = s4[0]; var setCvLoading = s4[1];
  var s5 = useState(""); var jobUrl = s5[0]; var setJobUrl = s5[1];
  var s6 = useState(""); var jobDesc = s6[0]; var setJobDesc = s6[1];
  var s7 = useState("url"); var inputMode = s7[0]; var setInputMode = s7[1];
  var s8 = useState(false); var loading = s8[0]; var setLoading = s8[1];
  var s9 = useState(""); var error = s9[0]; var setError = s9[1];
  var s10 = useState(null); var result = s10[0]; var setResult = s10[1];
  var s11 = useState(""); var downloading = s11[0]; var setDownloading = s11[1];
  var s12 = useState(false); var showSignIn = s12[0]; var setShowSignIn = s12[1];
  var fileRef = useRef(null);

  function handleFile(file) {
    if (!file) return;
    setCvLoading(true); setError("");
    extractCVText(file).then(function(text) {
      if (!text || text.trim().length < 30) { setError("Could not read this file. Try PDF or paste text below."); setCvLoading(false); return; }
      setCvText(text); setCvFileName(file.name); setCvLoading(false);
    }).catch(function(err) { setError("Could not read file: " + err.message); setCvLoading(false); });
  }

  function generate() {
    var jobContent = inputMode === "url" ? jobUrl : jobDesc;
    if (!cvText.trim()) { setError("Please upload a CV or paste your CV text first."); return; }
    if (!jobContent.trim()) { setError("Please provide a job URL or description."); return; }
    setLoading(true); setError(""); setResult(null);
    fetch("/api/generate-docs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cvText: cvText, jobDescription: inputMode === "text" ? jobDesc : "", jobUrl: inputMode === "url" ? jobUrl : "" }),
    }).then(function(res) {
      return res.json().then(function(data) {
        if (!res.ok || data.error) throw new Error(data.error || "Generation failed");
        setResult(data); setStep(3); setLoading(false);
      });
    }).catch(function(err) { setError(err.message); setLoading(false); });
  }

  function handleDownload(fmt) {
    if (!user) { setShowSignIn(true); return; }
    if (!result || !result.data) return;
    setDownloading(fmt); setError("");
    var cv = result.data.cv;
    var cl = result.data.coverLetter;
    var p = fmt === "docx" ? doDownloadDOCX(cv, cl) : doDownloadPDF(cv, cl);
    p.then(function() { setDownloading(""); }).catch(function(err) { setError("Download failed: " + err.message); setDownloading(""); });
  }

  function reset() {
    setResult(null); setStep(1); setJobUrl(""); setJobDesc(""); setError("");
    setShowSignIn(false); setCvText(propCvText); setCvFileName(propCvText ? "Profile CV" : "");
  }

  var cv = result && result.data && result.data.cv;
  var cl = result && result.data && result.data.coverLetter;
  var atsScore = cv && cv.atsScore;
  var atsColor = atsScore >= 85 ? "#16A34A" : atsScore >= 70 ? "#D97706" : "#DC2626";
  var atsLabel = atsScore >= 85 ? "Excellent" : atsScore >= 70 ? "Good" : "Needs Work";
  var atsMsg = atsScore >= 85 ? "Your CV is well-optimised and should pass ATS screening." : atsScore >= 70 ? "Good match. A few more keywords would improve your score." : "Consider adding more keywords from the job description.";

  var STEPS = [
    { n: 1, label: "Upload any CV", desc: "Even an old draft works - we just need basic details" },
    { n: 2, label: "Paste a job", desc: "URL or description from any job board" },
    { n: 3, label: "Download", desc: "ATS-optimised CV and cover letter ready to send" },
  ];


  var STY_HEADER_BG = "linear-gradient(135deg, rgba(26,63,168,0.08), rgba(22,163,74,0.04))";
  var STY_HEADER_BORDER = "rgba(26,63,168,0.2)";
  var STY_STEP_ACTIVE_BG = "rgba(26,63,168,0.05)";
  var STY_STEP_DONE_BG = "rgba(22,163,74,0.04)";
  var STY_STEP_ACTIVE_BORDER = "#1A3FA8";
  var STY_STEP_DONE_BORDER = "rgba(22,163,74,0.4)";
  var STY_TIP_BG = "rgba(26,63,168,0.06)";
  var STY_SPIN_BORDER = "2px solid rgba(26,63,168,0.2)";
  var STY_SIGNIN_BORDER = "rgba(26,63,168,0.25)";
  var STY_DOWNLOAD_BG = "linear-gradient(135deg, rgba(22,163,74,0.08), transparent)";
  var STY_DOWNLOAD_BORDER = "rgba(22,163,74,0.2)";
  var STY_ATS_BORDER_GREEN = "rgba(22,163,74,0.3)";
  var STY_ATS_BORDER_AMBER = "rgba(245,158,11,0.3)";
  var STY_ATS_BORDER_RED = "rgba(220,38,38,0.3)";
  var STY_KW_BG = "rgba(22,163,74,0.12)";
  var STY_SKILL_BORDER = "rgba(245,158,11,0.25)";
  var STY_SKILL_BG = "rgba(245,158,11,0.03)";
  var STY_SKILL_ITEM_BG = "rgba(220,38,38,0.1)";
  var STY_SKILL_MED_BG = "rgba(245,158,11,0.1)";
  var STY_SKILL_LOW_BG = "rgba(22,163,74,0.1)";

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "2rem 1.5rem" }}>
      <style>{SPIN_CSS}</style>

      <div style={{ ...CARD, marginBottom: "1.25rem", background: STY_HEADER_BG, borderColor: STY_HEADER_BORDER }}>
        <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
          <span style={{ fontSize: "40px" }}>🎯</span>
          <div>
            <h2 style={{ margin: "0 0 6px", fontSize: "1.3rem", fontWeight: 600 }}>CV and Cover Letter Generator</h2>
            <p style={{ margin: 0, fontSize: "14px", color: "var(--color-text-secondary)", lineHeight: 1.7 }}>
              Upload any CV as a starting point, paste a job URL or description, and we will tailor your CV and write a cover letter that is 95% ATS friendly and keyword-matched to that specific role.
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginBottom: "1.25rem" }}>
        {STEPS.map(function(s) {
          return (
            <div key={s.n} onClick={function() { if (s.n < step) setStep(s.n); }}
              style={{ ...CARD, padding: "1rem", cursor: s.n < step ? "pointer" : "default", borderColor: step === s.n ? STY_STEP_ACTIVE_BORDER : step > s.n ? STY_STEP_DONE_BORDER : "var(--color-border-tertiary)", background: step === s.n ? STY_STEP_ACTIVE_BG : step > s.n ? STY_STEP_DONE_BG : "var(--color-background-primary)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: step > s.n ? "#16A34A" : step === s.n ? "#1A3FA8" : "var(--color-background-secondary)", color: step >= s.n ? "#fff" : "var(--color-text-secondary)", fontSize: "12px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {step > s.n ? "+" : s.n}
                </div>
                <p style={{ fontWeight: 600, margin: 0, fontSize: "13px", color: step === s.n ? "#1A3FA8" : step > s.n ? "#16A34A" : "var(--color-text-secondary)" }}>{s.label}</p>
              </div>
              <p style={{ fontSize: "11px", color: "var(--color-text-secondary)", margin: 0, paddingLeft: "32px" }}>{s.desc}</p>
            </div>
          );
        })}
      </div>

      {step === 1 && (
        <div style={CARD}>
          <div style={{ display: "flex", gap: "10px", alignItems: "flex-start", marginBottom: "1.25rem", padding: "10px 14px", background: STY_TIP_BG, borderRadius: "var(--border-radius-md)" }}>
            <span style={{ fontSize: "20px" }}>💡</span>
            <p style={{ margin: 0, fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
              Upload any CV - it does not need to be perfect. We just need basic details like your name, experience and skills to tailor it. Even an old or rough draft works.
            </p>
          </div>
          <div
            onClick={function() { if (fileRef.current) fileRef.current.click(); }}
            onDragOver={function(e) { e.preventDefault(); e.currentTarget.style.borderColor = "#1A3FA8"; }}
            onDragLeave={function(e) { e.currentTarget.style.borderColor = "var(--color-border-secondary)"; }}
            onDrop={function(e) { e.preventDefault(); e.currentTarget.style.borderColor = "var(--color-border-secondary)"; handleFile(e.dataTransfer.files[0]); }}
            style={{ border: "2px dashed var(--color-border-secondary)", borderRadius: "var(--border-radius-lg)", padding: "2.5rem", textAlign: "center", cursor: "pointer", marginBottom: "1rem", background: "var(--color-background-secondary)" }}>
            <input ref={fileRef} type="file" accept=".pdf,.txt,.doc,.docx" style={{ display: "none" }} onChange={function(e) { handleFile(e.target.files[0]); }} />
            <div style={{ fontSize: "40px", marginBottom: "10px" }}>📄</div>
            {cvLoading && <p style={{ color: "var(--color-text-secondary)", margin: 0 }}>Reading your CV...</p>}
            {!cvLoading && cvFileName && (
              <div>
                <p style={{ fontWeight: 600, margin: "0 0 4px", color: "#16A34A" }}>✓ {cvFileName}</p>
                <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", margin: 0 }}>Click to use a different file</p>
              </div>
            )}
            {!cvLoading && !cvFileName && (
              <div>
                <p style={{ fontWeight: 500, margin: "0 0 6px" }}>Drop your CV here or click to upload</p>
                <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", margin: 0 }}>PDF, DOCX, TXT - any version, even an old draft</p>
              </div>
            )}
          </div>
          <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", textAlign: "center", margin: "0 0 8px" }}>- or paste your CV text below -</p>
          <textarea value={cvText} onChange={function(e) { setCvText(e.target.value); setCvFileName(""); }}
            placeholder="Paste your CV content here..."
            style={{ ...INP, minHeight: "130px", resize: "vertical" }} />
          {error && <p style={{ color: "#E24B4A", fontSize: "13px", margin: "8px 0 0" }}>⚠️ {error}</p>}
          <button onClick={function() { if (!cvText.trim()) { setError("Please upload or paste your CV first."); return; } setError(""); setStep(2); }}
            disabled={cvLoading}
            style={{ ...mkBtn(true), marginTop: "1rem", width: "100%", padding: "13px", fontSize: "15px", opacity: cvLoading ? 0.6 : 1 }}>
            Next: Paste the job →
          </button>
        </div>
      )}

      {step === 2 && (
        <div style={CARD}>
          <div style={{ display: "flex", gap: "8px", marginBottom: "1.25rem" }}>
            <button onClick={function() { setInputMode("url"); }} style={{ padding: "8px 18px", borderRadius: "20px", fontSize: "13px", fontWeight: inputMode === "url" ? 600 : 400, cursor: "pointer", fontFamily: "inherit", border: "none", background: inputMode === "url" ? "#1A3FA8" : "var(--color-background-secondary)", color: inputMode === "url" ? "#fff" : "var(--color-text-secondary)" }}>
              🔗 Paste job URL
            </button>
            <button onClick={function() { setInputMode("text"); }} style={{ padding: "8px 18px", borderRadius: "20px", fontSize: "13px", fontWeight: inputMode === "text" ? 600 : 400, cursor: "pointer", fontFamily: "inherit", border: "none", background: inputMode === "text" ? "#1A3FA8" : "var(--color-background-secondary)", color: inputMode === "text" ? "#fff" : "var(--color-text-secondary)" }}>
              📋 Paste job description
            </button>
          </div>
          {inputMode === "url" && (
            <div>
              <label style={{ fontSize: "12px", color: "var(--color-text-secondary)", display: "block", marginBottom: "6px", fontWeight: 500 }}>Job URL from Reed, Indeed, LinkedIn etc.</label>
              <input style={INP} value={jobUrl} onChange={function(e) { setJobUrl(e.target.value); }} placeholder="https://www.reed.co.uk/jobs/..." />
              <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", margin: "6px 0 0" }}>If the URL does not work, switch to paste job description mode</p>
            </div>
          )}
          {inputMode === "text" && (
            <div>
              <label style={{ fontSize: "12px", color: "var(--color-text-secondary)", display: "block", marginBottom: "6px", fontWeight: 500 }}>Paste the full job description</label>
              <textarea style={{ ...INP, minHeight: "180px", resize: "vertical" }} value={jobDesc} onChange={function(e) { setJobDesc(e.target.value); }}
                placeholder="Paste the full job posting here including responsibilities, requirements and company info..." />
            </div>
          )}
          {error && <p style={{ color: "#E24B4A", fontSize: "13px", margin: "10px 0 0" }}>⚠️ {error}</p>}
          <div style={{ display: "flex", gap: "8px", marginTop: "1rem" }}>
            <button onClick={function() { setStep(1); }} style={{ ...mkBtn(false), padding: "12px 20px" }}>← Back</button>
            <button onClick={generate} disabled={loading} style={{ ...mkBtn(true), flex: 1, padding: "12px", fontSize: "15px", opacity: loading ? 0.7 : 1 }}>
              {loading ? "✨ Generating..." : "✨ Generate CV and Cover Letter"}
            </button>
          </div>
          {loading && (
            <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "6px" }}>
              {["Analysing job description...", "Matching your skills to requirements...", "Optimising for ATS keywords...", "Writing your tailored cover letter..."].map(function(msg, i) {
                return (
                  <div key={i} style={{ display: "flex", gap: "10px", alignItems: "center", padding: "8px 12px", background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)" }}>
                    <div className="cvgen-spin" style={{ width: "12px", height: "12px", border: STY_SPIN_BORDER, borderTopColor: "#1A3FA8", borderRadius: "50%", flexShrink: 0 }} />
                    <span style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>{msg}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {step === 3 && result && result.data && (
        <div>
          {showSignIn && !user ? (
            <div style={{ ...CARD, textAlign: "center", padding: "2.5rem", borderColor: STY_SIGNIN_BORDER }}>
              <div style={{ fontSize: "48px", marginBottom: "1rem" }}>🔒</div>
              <h3 style={{ margin: "0 0 8px", fontSize: "1.1rem", fontWeight: 600 }}>Sign in to download your documents</h3>
              <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", margin: "0 0 1.5rem", lineHeight: 1.6 }}>Your tailored CV and cover letter are ready. Create a free account to download them.</p>
              <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
                {onSignIn && <button onClick={onSignIn} style={{ ...mkBtn(true), padding: "12px 28px", fontSize: "15px" }}>Sign in / Register - it is free</button>}
                <button onClick={function() { setShowSignIn(false); }} style={{ ...mkBtn(false), padding: "12px 20px" }}>← Back to preview</button>
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gap: "1rem" }}>
              <div style={{ ...CARD, background: STY_DOWNLOAD_BG, borderColor: STY_DOWNLOAD_BORDER }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                  <div>
                    <p style={{ fontWeight: 600, margin: "0 0 4px", fontSize: "15px" }}>✅ {result.jobTitle} at {result.company}</p>
                    {!user && <p style={{ fontSize: "12px", color: "#7C3AED", margin: 0 }}>Sign in to download your documents</p>}
                  </div>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <button onClick={function() { handleDownload("pdf"); }} disabled={!!downloading} style={{ ...mkBtn(true, "#DC2626"), padding: "9px 18px", fontSize: "13px", opacity: downloading ? 0.7 : 1 }}>
                      {downloading === "pdf" ? "⏳" : "📄"} {user ? "Download PDF" : "Get PDF - Sign in"}
                    </button>
                    <button onClick={function() { handleDownload("docx"); }} disabled={!!downloading} style={{ ...mkBtn(true), padding: "9px 18px", fontSize: "13px", opacity: downloading ? 0.7 : 1 }}>
                      {downloading === "docx" ? "⏳" : "📝"} {user ? "Download Word" : "Get Word - Sign in"}
                    </button>
                  </div>
                </div>
                {error && <p style={{ color: "#E24B4A", fontSize: "13px", margin: "10px 0 0" }}>⚠️ {error}</p>}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: "1rem", alignItems: "start" }}>
                <div style={{ display: "grid", gap: "1rem" }}>

                  <div style={{ ...CARD, borderColor: atsScore >= 85 ? STY_ATS_BORDER_GREEN : atsScore >= 70 ? STY_ATS_BORDER_AMBER : STY_ATS_BORDER_RED }}>
                    <p style={{ fontWeight: 600, margin: "0 0 1rem", fontSize: "14px" }}>🎯 ATS Score</p>
                    <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", marginBottom: "1rem" }}>
                      <div style={atsRingStyle(atsScore, atsColor)}>
                        <div style={{ width: "70px", height: "70px", borderRadius: "50%", background: "var(--color-background-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ fontWeight: 700, fontSize: "18px", color: atsColor }}>{atsScore || 0}%</span>
                        </div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 600, margin: "0 0 4px", fontSize: "14px", color: atsColor }}>{atsLabel}</p>
                        <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", margin: 0, lineHeight: 1.5 }}>{atsMsg}</p>
                      </div>
                    </div>
                    {cv && cv.keywordsMatched && cv.keywordsMatched.length > 0 && (
                      <div>
                        <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 6px" }}>Keywords matched</p>
                        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                          {cv.keywordsMatched.map(function(k, i) {
                            return <span key={i} style={{ padding: "2px 8px", borderRadius: "20px", fontSize: "11px", background: STY_KW_BG, color: "#16A34A", fontWeight: 500 }}>✓ {k}</span>;
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {result.data.skillsToUpgrade && result.data.skillsToUpgrade.length > 0 && (
                    <div style={{ ...CARD, borderColor: STY_SKILL_BORDER, background: STY_SKILL_BG }}>
                      <p style={{ fontWeight: 600, margin: "0 0 4px", fontSize: "14px" }}>⚡ Skills to Develop for This Role</p>
                      <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", margin: "0 0 12px" }}>These skills appear in the job but were not found in your CV:</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {result.data.skillsToUpgrade.map(function(s, i) {
                          var icon = s.priority === "High" ? "🔴" : s.priority === "Medium" ? "🟡" : "🟢";
                          var badgeColor = s.priority === "High" ? "#DC2626" : s.priority === "Medium" ? "#D97706" : "#16A34A";
                          var badgeBg = s.priority === "High" ? STY_SKILL_ITEM_BG : s.priority === "Medium" ? STY_SKILL_MED_BG : STY_SKILL_LOW_BG;
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

                  {cl && (
                    <div style={CARD}>
                      <p style={{ fontWeight: 600, margin: "0 0 1rem", fontSize: "14px" }}>✉️ Cover Letter</p>
                      <div style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", padding: "1.25rem", fontFamily: "Georgia, serif", fontSize: "12px", lineHeight: 1.8, maxHeight: "320px", overflowY: "auto" }}>
                        <p style={{ margin: "0 0 10px", color: "var(--color-text-secondary)", fontSize: "11px" }}>Dear Hiring Manager,</p>
                        <p style={{ margin: "0 0 10px" }}>{cl.opening}</p>
                        <p style={{ margin: "0 0 10px" }}>{cl.body1}</p>
                        <p style={{ margin: "0 0 10px" }}>{cl.body2}</p>
                        <p style={{ margin: "0 0 10px" }}>{cl.closing}</p>
                        <p style={{ margin: 0, color: "var(--color-text-secondary)", fontSize: "11px" }}>Yours sincerely,</p>
                        <p style={{ margin: 0, fontWeight: 600 }}>{cv && cv.name}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ position: "sticky", top: "80px" }}>
                  <div style={{ ...CARD, padding: 0, overflow: "hidden" }}>
                    <div style={{ padding: "12px 16px", borderBottom: "0.5px solid var(--color-border-tertiary)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <p style={{ fontWeight: 600, margin: 0, fontSize: "14px" }}>📄 CV Preview</p>
                      <span style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>Scroll to read full CV</span>
                    </div>
                    <div style={{ background: "#fff", color: "#1a1a2e", maxHeight: "680px", overflowY: "auto", padding: "28px 24px", fontFamily: "Arial, sans-serif", fontSize: "11px", lineHeight: 1.6 }}>
                      {cv && (
                        <div>
                          <div style={{ textAlign: "center", marginBottom: "16px", paddingBottom: "10px", borderBottom: "2px solid #1A3FA8" }}>
                            <p style={{ fontWeight: 700, fontSize: "18px", margin: "0 0 4px", color: "#1a1a2e" }}>{cv.name}</p>
                            <p style={{ fontSize: "10px", color: "#6b7280", margin: "0 0 4px" }}>{[cv.email, cv.phone, cv.location].filter(Boolean).join("  |  ")}</p>
                            {cv.atsScore && <p style={{ fontSize: "9px", color: "#16A34A", margin: 0, fontWeight: 600 }}>ATS Score: {cv.atsScore}%</p>}
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
                                      <p style={{ fontSize: "9px", color: "#6b7280", margin: 0 }}>{e.startDate} - {e.endDate}</p>
                                    </div>
                                    <p style={{ fontSize: "9px", color: "#6b7280", margin: "0 0 3px" }}>{e.company}{e.location ? " - " + e.location : ""}</p>
                                    {(e.bullets || []).map(function(b, j) { return <p key={j} style={{ margin: "0 0 2px", fontSize: "9px", paddingLeft: "10px" }}>- {b}</p>; })}
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
                                    <p style={{ fontSize: "9px", color: "#6b7280", margin: 0 }}>{e.institution} - {e.year}{e.grade ? " - " + e.grade : ""}</p>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          {cv.skills && cv.skills.length > 0 && (
                            <div style={{ marginBottom: "12px" }}>
                              <p style={{ fontWeight: 700, fontSize: "9px", color: "#1A3FA8", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 6px", borderBottom: "0.5px solid #1A3FA8", paddingBottom: "2px" }}>Skills</p>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                                {cv.skills.map(function(sk, i) { return <span key={i} style={{ padding: "2px 6px", background: "#EFF6FF", color: "#1A3FA8", borderRadius: "4px", fontSize: "9px", fontWeight: 500 }}>{sk}</span>; })}
                              </div>
                            </div>
                          )}
                          {cv.certifications && cv.certifications.length > 0 && (
                            <div>
                              <p style={{ fontWeight: 700, fontSize: "9px", color: "#1A3FA8", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 6px", borderBottom: "0.5px solid #1A3FA8", paddingBottom: "2px" }}>Certifications</p>
                              {cv.certifications.map(function(c, i) { return <p key={i} style={{ margin: "0 0 2px", fontSize: "9px", paddingLeft: "10px" }}>- {c}</p>; })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <button onClick={reset} style={{ ...mkBtn(false), padding: "10px", fontSize: "13px", width: "100%" }}>
                ↺ Generate for another job
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  </div>
  );
}
