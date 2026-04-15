import { useState, useRef } from "react";
import { extractCVText, downloadDOCX, downloadPDF } from "./CVGeneratorUtils.js";

var CARD = {
  background: "var(--color-background-primary)",
  border: "0.5px solid var(--color-border-tertiary)",
  borderRadius: "var(--border-radius-lg)",
  padding: "1.5rem"
};

var INP = {
  padding: "10px 14px",
  borderRadius: "var(--border-radius-md)",
  border: "0.5px solid var(--color-border-secondary)",
  background: "var(--color-background-secondary)",
  color: "var(--color-text-primary)",
  fontSize: "14px",
  outline: "none",
  fontFamily: "inherit",
  width: "100%",
  boxSizing: "border-box"
};

var BTN_PRIMARY = {
  padding: "10px 22px",
  borderRadius: "var(--border-radius-md)",
  fontSize: "14px",
  fontWeight: 500,
  cursor: "pointer",
  fontFamily: "inherit",
  background: "#1A3FA8",
  color: "#fff",
  border: "none"
};

var BTN_OUTLINE = {
  padding: "10px 22px",
  borderRadius: "var(--border-radius-md)",
  fontSize: "14px",
  fontWeight: 500,
  cursor: "pointer",
  fontFamily: "inherit",
  background: "transparent",
  color: "var(--color-text-primary)",
  border: "0.5px solid var(--color-border-secondary)"
};

var BTN_RED = Object.assign({}, BTN_PRIMARY, { background: "#DC2626" });
var BTN_PURPLE = Object.assign({}, BTN_PRIMARY, { background: "#7C3AED" });

var SPIN_STYLE = {
  width: "12px",
  height: "12px",
  borderRadius: "50%",
  borderTop: "2px solid #1A3FA8",
  borderRight: "2px solid transparent",
  borderBottom: "2px solid transparent",
  borderLeft: "2px solid transparent",
  animation: "cvgen-spin 0.8s linear infinite",
  flexShrink: 0
};

var STEPS = [
  { n: 1, label: "Upload any CV",  desc: "Even an old draft works - we just need basic details" },
  { n: 2, label: "Paste a job",    desc: "URL or description from any job board" },
  { n: 3, label: "Download",       desc: "ATS-optimised CV and cover letter ready to send" }
];

export default function CVGenerator(props) {
  var user        = props.user;
  var propCvText  = props.cvText || "";
  var onSignIn    = props.onSignIn;

  var stepState       = useState(1);           var step        = stepState[0];       var setStep        = stepState[1];
  var cvTextState     = useState(propCvText);  var cvText      = cvTextState[0];     var setCvText      = cvTextState[1];
  var cvFileState     = useState(propCvText ? "Profile CV" : ""); var cvFileName = cvFileState[0]; var setCvFileName = cvFileState[1];
  var cvLoadState     = useState(false);       var cvLoading   = cvLoadState[0];     var setCvLoading   = cvLoadState[1];
  var jobUrlState     = useState("");          var jobUrl      = jobUrlState[0];     var setJobUrl      = jobUrlState[1];
  var jobDescState    = useState("");          var jobDesc     = jobDescState[0];    var setJobDesc     = jobDescState[1];
  var modeState       = useState("url");       var inputMode   = modeState[0];       var setInputMode   = modeState[1];
  var loadingState    = useState(false);       var loading     = loadingState[0];    var setLoading     = loadingState[1];
  var errorState      = useState("");          var error       = errorState[0];      var setError       = errorState[1];
  var resultState     = useState(null);        var result      = resultState[0];     var setResult      = resultState[1];
  var dlState         = useState("");          var downloading = dlState[0];         var setDownloading = dlState[1];
  var signInState     = useState(false);       var showSignIn  = signInState[0];     var setShowSignIn  = signInState[1];
  var fileRef = useRef(null);

  function handleFile(file) {
    if (!file) return;
    setCvLoading(true);
    setError("");
    extractCVText(file).then(function(text) {
      if (!text || text.trim().length < 30) {
        setError("Could not read this file. Try PDF or paste text below.");
      } else {
        setCvText(text);
        setCvFileName(file.name);
      }
      setCvLoading(false);
    }).catch(function(err) {
      setError("Could not read file: " + err.message);
      setCvLoading(false);
    });
  }

  function generate() {
    var jobContent = inputMode === "url" ? jobUrl : jobDesc;
    if (!cvText.trim()) { setError("Please upload a CV or paste your CV text first."); return; }
    if (!jobContent.trim()) { setError("Please provide a job URL or description."); return; }
    setLoading(true);
    setError("");
    setResult(null);
    fetch("/api/generate-docs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cvText: cvText,
        jobDescription: inputMode === "text" ? jobDesc : "",
        jobUrl: inputMode === "url" ? jobUrl : ""
      })
    }).then(function(res) {
      return res.json().then(function(data) {
        if (!res.ok || data.error) throw new Error(data.error || "Generation failed");
        setResult(data);
        setStep(3);
        setLoading(false);
      });
    }).catch(function(err) {
      setError(err.message);
      setLoading(false);
    });
  }

  function handleDownload(fmt) {
    if (!user) { setShowSignIn(true); return; }
    if (!result || !result.data) return;
    setDownloading(fmt);
    setError("");
    var cv = result.data.cv;
    var cl = result.data.coverLetter;
    var p  = fmt === "docx" ? downloadDOCX(cv, cl) : downloadPDF(cv, cl);
    p.then(function() {
      setDownloading("");
    }).catch(function(err) {
      setError("Download failed: " + err.message);
      setDownloading("");
    });
  }

  function reset() {
    setResult(null);
    setStep(1);
    setJobUrl("");
    setJobDesc("");
    setError("");
    setShowSignIn(false);
    setCvText(propCvText);
    setCvFileName(propCvText ? "Profile CV" : "");
  }

  var cv       = result && result.data && result.data.cv;
  var cl       = result && result.data && result.data.coverLetter;
  var atsScore = cv && cv.atsScore;
  var atsColor = atsScore >= 85 ? "#16A34A" : atsScore >= 70 ? "#D97706" : "#DC2626";
  var atsLabel = atsScore >= 85 ? "Excellent" : atsScore >= 70 ? "Good" : "Needs Work";
  var atsMsg   = atsScore >= 85
    ? "Your CV is well-optimised and should pass ATS screening."
    : atsScore >= 70
    ? "Good match. A few more keywords would improve your score."
    : "Consider adding more keywords from the job description.";

  var atsRingDeg    = (atsScore || 0) * 3.6;
  var atsRingBg     = "conic-gradient(" + atsColor + " " + atsRingDeg + "deg,#2d2d2d 0deg)";

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "2rem 1.5rem" }}>
      <style>{"@keyframes cvgen-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}"}</style>

      <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: "1.5rem", marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
          <span style={{ fontSize: "40px" }}>🎯</span>
          <div>
            <h2 style={{ margin: "0 0 6px", fontSize: "1.3rem", fontWeight: 600 }}>CV and Cover Letter Generator</h2>
            <p style={{ margin: 0, fontSize: "14px", color: "var(--color-text-secondary)", lineHeight: 1.7 }}>
              Upload any CV as a starting point, paste a job URL or description, and we will tailor your CV and write a cover letter that is 95 percent ATS friendly and keyword-matched to that specific role.
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginBottom: "1.25rem" }}>
        {STEPS.map(function(s) {
          var isActive = step === s.n;
          var isDone   = step > s.n;
          return (
            <div key={s.n}
              onClick={function() { if (isDone) setStep(s.n); }}
              style={{ padding: "1rem", borderRadius: "var(--border-radius-lg)", cursor: isDone ? "pointer" : "default",
                background: isActive ? "var(--color-background-primary)" : "var(--color-background-primary)",
                border: isActive ? "1.5px solid #1A3FA8" : isDone ? "0.5px solid #16A34A" : "0.5px solid var(--color-border-tertiary)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <div style={{ width: "24px", height: "24px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700,
                  background: isDone ? "#16A34A" : isActive ? "#1A3FA8" : "var(--color-background-secondary)",
                  color: isDone || isActive ? "#fff" : "var(--color-text-secondary)" }}>
                  {isDone ? "+" : s.n}
                </div>
                <p style={{ fontWeight: 600, margin: 0, fontSize: "13px",
                  color: isActive ? "#1A3FA8" : isDone ? "#16A34A" : "var(--color-text-secondary)" }}>
                  {s.label}
                </p>
              </div>
              <p style={{ fontSize: "11px", color: "var(--color-text-secondary)", margin: 0, paddingLeft: "32px" }}>{s.desc}</p>
            </div>
          );
        })}
      </div>

      {step === 1 && (
        <div style={CARD}>
          <div style={{ display: "flex", gap: "10px", alignItems: "flex-start", marginBottom: "1.25rem", padding: "10px 14px", background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)" }}>
            <span style={{ fontSize: "20px" }}>💡</span>
            <p style={{ margin: 0, fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
              <strong style={{ color: "var(--color-text-primary)" }}>Upload any CV</strong> — it does not need to be perfect. We just need basic details like your name, experience and skills. Even an old or rough draft works.
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
            {cvLoading && <p style={{ margin: 0, color: "var(--color-text-secondary)" }}>Reading your CV...</p>}
            {!cvLoading && cvFileName && (
              <div>
                <p style={{ fontWeight: 600, margin: "0 0 4px", color: "#16A34A" }}>+ {cvFileName}</p>
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
            style={{ padding: "10px 14px", borderRadius: "var(--border-radius-md)", border: "0.5px solid var(--color-border-secondary)", background: "var(--color-background-secondary)", color: "var(--color-text-primary)", fontSize: "14px", outline: "none", fontFamily: "inherit", width: "100%", boxSizing: "border-box", minHeight: "130px", resize: "vertical" }} />
          {error && <p style={{ color: "#E24B4A", fontSize: "13px", margin: "8px 0 0" }}>Warning: {error}</p>}
          <button
            onClick={function() { if (!cvText.trim()) { setError("Please upload or paste your CV first."); return; } setError(""); setStep(2); }}
            disabled={cvLoading}
            style={{ marginTop: "1rem", width: "100%", padding: "13px", fontSize: "15px", borderRadius: "var(--border-radius-md)", background: "#1A3FA8", color: "#fff", border: "none", fontWeight: 500, cursor: "pointer", fontFamily: "inherit", opacity: cvLoading ? 0.6 : 1 }}>
            Next: Paste the job
          </button>
        </div>
      )}

      {step === 2 && (
        <div style={CARD}>
          <div style={{ display: "flex", gap: "8px", marginBottom: "1.25rem" }}>
            <button onClick={function() { setInputMode("url"); }}
              style={{ padding: "8px 18px", borderRadius: "20px", fontSize: "13px", fontWeight: inputMode === "url" ? 600 : 400, cursor: "pointer", fontFamily: "inherit", border: "none",
                background: inputMode === "url" ? "#1A3FA8" : "var(--color-background-secondary)",
                color: inputMode === "url" ? "#fff" : "var(--color-text-secondary)" }}>
              Link: Paste job URL
            </button>
            <button onClick={function() { setInputMode("text"); }}
              style={{ padding: "8px 18px", borderRadius: "20px", fontSize: "13px", fontWeight: inputMode === "text" ? 600 : 400, cursor: "pointer", fontFamily: "inherit", border: "none",
                background: inputMode === "text" ? "#1A3FA8" : "var(--color-background-secondary)",
                color: inputMode === "text" ? "#fff" : "var(--color-text-secondary)" }}>
              Paste job description
            </button>
          </div>
          {inputMode === "url" && (
            <div>
              <label style={{ fontSize: "12px", color: "var(--color-text-secondary)", display: "block", marginBottom: "6px", fontWeight: 500 }}>Job URL from Reed, Indeed, LinkedIn etc.</label>
              <input style={INP} value={jobUrl} onChange={function(e) { setJobUrl(e.target.value); }} placeholder="Paste job URL here..." />
              <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", margin: "6px 0 0" }}>If the URL does not work, switch to paste job description mode</p>
            </div>
          )}
          {inputMode === "text" && (
            <div>
              <label style={{ fontSize: "12px", color: "var(--color-text-secondary)", display: "block", marginBottom: "6px", fontWeight: 500 }}>Paste the full job description</label>
              <textarea style={{ padding: "10px 14px", borderRadius: "var(--border-radius-md)", border: "0.5px solid var(--color-border-secondary)", background: "var(--color-background-secondary)", color: "var(--color-text-primary)", fontSize: "14px", outline: "none", fontFamily: "inherit", width: "100%", boxSizing: "border-box", minHeight: "180px", resize: "vertical" }}
                value={jobDesc} onChange={function(e) { setJobDesc(e.target.value); }}
                placeholder="Paste the full job posting here..." />
            </div>
          )}
          {error && <p style={{ color: "#E24B4A", fontSize: "13px", margin: "10px 0 0" }}>Warning: {error}</p>}
          <div style={{ display: "flex", gap: "8px", marginTop: "1rem" }}>
            <button onClick={function() { setStep(1); }} style={BTN_OUTLINE}>Back</button>
            <button onClick={generate} disabled={loading}
              style={{ flex: 1, padding: "12px", fontSize: "15px", borderRadius: "var(--border-radius-md)", background: "#1A3FA8", color: "#fff", border: "none", fontWeight: 500, cursor: loading ? "default" : "pointer", fontFamily: "inherit", opacity: loading ? 0.7 : 1 }}>
              {loading ? "Generating..." : "Generate CV and Cover Letter"}
            </button>
          </div>
          {loading && (
            <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "6px" }}>
              {["Analysing job description...", "Matching your skills to requirements...", "Optimising for ATS keywords...", "Writing your tailored cover letter..."].map(function(msg, i) {
                return (
                  <div key={i} style={{ display: "flex", gap: "10px", alignItems: "center", padding: "8px 12px", background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)" }}>
                    <div style={SPIN_STYLE} />
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
            <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: "2.5rem", textAlign: "center" }}>
              <div style={{ fontSize: "48px", marginBottom: "1rem" }}>🔒</div>
              <h3 style={{ margin: "0 0 8px", fontSize: "1.1rem", fontWeight: 600 }}>Sign in to download your documents</h3>
              <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", margin: "0 0 1.5rem", lineHeight: 1.6 }}>Your tailored CV and cover letter are ready. Create a free account to download them.</p>
              <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
                {onSignIn && <button onClick={onSignIn} style={{ padding: "12px 28px", fontSize: "15px", borderRadius: "var(--border-radius-md)", background: "#1A3FA8", color: "#fff", border: "none", fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>Sign in or Register - it is free</button>}
                <button onClick={function() { setShowSignIn(false); }} style={BTN_OUTLINE}>Back to preview</button>
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gap: "1rem" }}>

              <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: "1.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                  <div>
                    <p style={{ fontWeight: 600, margin: "0 0 4px", fontSize: "15px" }}>Ready - {result.jobTitle} at {result.company}</p>
                    {!user && <p style={{ fontSize: "12px", color: "#7C3AED", margin: 0 }}>Sign in to download your documents</p>}
                  </div>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <button onClick={function() { handleDownload("pdf"); }} disabled={!!downloading}
                      style={{ padding: "9px 18px", fontSize: "13px", borderRadius: "var(--border-radius-md)", background: "#DC2626", color: "#fff", border: "none", fontWeight: 500, cursor: downloading ? "default" : "pointer", fontFamily: "inherit", opacity: downloading ? 0.7 : 1 }}>
                      {downloading === "pdf" ? "Please wait..." : user ? "Download PDF" : "Get PDF - Sign in"}
                    </button>
                    <button onClick={function() { handleDownload("docx"); }} disabled={!!downloading}
                      style={{ padding: "9px 18px", fontSize: "13px", borderRadius: "var(--border-radius-md)", background: "#1A3FA8", color: "#fff", border: "none", fontWeight: 500, cursor: downloading ? "default" : "pointer", fontFamily: "inherit", opacity: downloading ? 0.7 : 1 }}>
                      {downloading === "docx" ? "Please wait..." : user ? "Download Word" : "Get Word - Sign in"}
                    </button>
                  </div>
                </div>
                {error && <p style={{ color: "#E24B4A", fontSize: "13px", margin: "10px 0 0" }}>Warning: {error}</p>}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: "1rem", alignItems: "start" }}>

                <div style={{ display: "grid", gap: "1rem" }}>
                  <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: "1.5rem" }}>
                    <p style={{ fontWeight: 600, margin: "0 0 1rem", fontSize: "14px" }}>ATS Score</p>
                    <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", marginBottom: "1rem" }}>
                      <div style={{ width: "90px", height: "90px", borderRadius: "50%", background: atsRingBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
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
                            return <span key={i} style={{ padding: "2px 8px", borderRadius: "20px", fontSize: "11px", background: "#dcfce7", color: "#16A34A", fontWeight: 500 }}>+ {k}</span>;
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {result.data.skillsToUpgrade && result.data.skillsToUpgrade.length > 0 && (
                    <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: "1.5rem" }}>
                      <p style={{ fontWeight: 600, margin: "0 0 4px", fontSize: "14px" }}>Skills to Develop for This Role</p>
                      <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", margin: "0 0 12px" }}>These skills appear in the job but were not found in your CV:</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {result.data.skillsToUpgrade.map(function(s, i) {
                          var isHigh = s.priority === "High";
                          var isMed  = s.priority === "Medium";
                          var icon   = isHigh ? "High" : isMed ? "Mid" : "Low";
                          var col    = isHigh ? "#DC2626" : isMed ? "#D97706" : "#16A34A";
                          return (
                            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "8px 12px", background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)" }}>
                              <div style={{ flex: 1 }}>
                                <p style={{ fontWeight: 600, margin: "0 0 2px", fontSize: "13px" }}>{s.skill}</p>
                                <p style={{ fontSize: "11px", color: "var(--color-text-secondary)", margin: 0 }}>{s.howToGet}</p>
                              </div>
                              <span style={{ fontSize: "10px", padding: "2px 7px", borderRadius: "20px", color: col, fontWeight: 600, whiteSpace: "nowrap", flexShrink: 0, border: "0.5px solid currentColor" }}>{icon}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {cl && (
                    <div style={CARD}>
                      <p style={{ fontWeight: 600, margin: "0 0 1rem", fontSize: "14px" }}>Cover Letter</p>
                      <div style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", padding: "1.25rem", fontFamily: "Georgia, serif", fontSize: "12px", lineHeight: 1.8, maxHeight: "320px", overflowY: "auto" }}>
                        <p style={{ margin: "0 0 10px", color: "var(--color-text-secondary)", fontSize: "11px" }}>Dear Hiring Manager,</p>
                        <p style={{ margin: "0 0 10px" }}>{cl.opening}</p>
                        <p style={{ margin: "0 0 10px" }}>{cl.body1}</p>
                        <p style={{ margin: "0 0 10px" }}>{cl.body2}</p>
                        <p style={{ margin: "0 0 10px" }}>{cl.closing}</p>
                        <p style={{ margin: "0 0 4px", color: "var(--color-text-secondary)", fontSize: "11px" }}>Yours sincerely,</p>
                        <p style={{ margin: 0, fontWeight: 600 }}>{cv && cv.name}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ position: "sticky", top: "80px" }}>
                  <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", overflow: "hidden" }}>
                    <div style={{ padding: "12px 16px", borderBottom: "0.5px solid var(--color-border-tertiary)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <p style={{ fontWeight: 600, margin: 0, fontSize: "14px" }}>CV Preview</p>
                      <span style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>Scroll to read</span>
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
                                    {(e.bullets || []).map(function(b, j) {
                                      return <p key={j} style={{ margin: "0 0 2px", fontSize: "9px", paddingLeft: "10px" }}>- {b}</p>;
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
                                {cv.skills.map(function(sk, i) {
                                  return <span key={i} style={{ padding: "2px 6px", background: "#EFF6FF", color: "#1A3FA8", borderRadius: "4px", fontSize: "9px", fontWeight: 500 }}>{sk}</span>;
                                })}
                              </div>
                            </div>
                          )}
                          {cv.certifications && cv.certifications.length > 0 && (
                            <div>
                              <p style={{ fontWeight: 700, fontSize: "9px", color: "#1A3FA8", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 6px", borderBottom: "0.5px solid #1A3FA8", paddingBottom: "2px" }}>Certifications</p>
                              {cv.certifications.map(function(c, i) {
                                return <p key={i} style={{ margin: "0 0 2px", fontSize: "9px", paddingLeft: "10px" }}>- {c}</p>;
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </div>

              <button onClick={reset} style={{ padding: "10px", fontSize: "13px", width: "100%", borderRadius: "var(--border-radius-md)", background: "transparent", color: "var(--color-text-primary)", border: "0.5px solid var(--color-border-secondary)", cursor: "pointer", fontFamily: "inherit" }}>
                Generate for another job
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
