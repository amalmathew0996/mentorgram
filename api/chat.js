// ✅ nodejs runtime — more reliable for large CV payloads and JSON parsing
export const config = { runtime: "nodejs" };

// ─── CV Analyser System Prompt ─────────────────────────────────────────────
const CV_SYSTEM_PROMPT = [
  "You are an expert UK university admissions advisor and career counsellor for Mentorgram AI.",
  "",
  "A user has uploaded their CV. Analyse it and return ONLY a raw JSON object.",
  "No markdown, no backticks, no explanation. Start with { and end with }.",
  "",
  "Required JSON structure:",
  "{",
  '  "profile": {',
  '    "name": "extracted name or null",',
  '    "level": "undergraduate or postgraduate or professional",',
  '    "currentField": "their current field",',
  '    "keySkills": ["skill1", "skill2", "skill3", "skill4", "skill5"],',
  '    "experience": "brief summary",',
  '    "educationBackground": "brief summary"',
  "  },",
  '  "careerPaths": [',
  "    {",
  '      "title": "Career path title",',
  '      "description": "Why this suits them",',
  '      "salaryRange": "GBP X to GBP Y average UK salary",',
  '      "demandLevel": "High or Medium or Growing",',
  '      "visaSponsorship": true,',
  '      "skills": ["skill1", "skill2"]',
  "    }",
  "  ],",
  '  "ukUniversities": [',
  "    {",
  '      "name": "University name",',
  '      "course": "Specific course name",',
  '      "degreeType": "BSc or MSc or MBA or PGDip or PhD",',
  '      "whyMatch": "Why this matches their CV",',
  '      "entryRequirements": "brief entry requirements",',
  '      "duration": "1 year or 2 years or 3 years",',
  '      "avgSalary": "graduate salary range in GBP",',
  '      "scholarships": "relevant scholarships",',
  '      "ucasLink": "https://www.ucas.com/search?query=CourseName"',
  "    }",
  "  ],",
  '  "gaps": ["gap1", "gap2"],',
  '  "summary": "2-3 sentence personalised summary"',
  "}",
  "",
  "Rules:",
  "- Recommend 2-3 career paths",
  "- Recommend 4-6 UK universities with specific real courses",
  "- Return ONLY the JSON object, nothing else",
].join("\n");

// ─── Chat System Prompt ────────────────────────────────────────────────────
const CHAT_SYSTEM_PROMPT = [
  "You are the Mentorgram AI Mentor - a friendly, expert career and education advisor.",
  "You help students worldwide navigate:",
  "- UK education pathways (GCSEs, A-Levels, BTEC, UCAS applications)",
  "- UK university admissions, scholarships and student visas",
  "- Career planning in high-demand sectors (AI, healthcare, engineering, finance, cybersecurity, green energy)",
  "- UK visa sponsorship jobs and the Skilled Worker visa process",
  "- International student pathways to UK education and employment",
  "",
  "Be warm, encouraging, concise and always give actionable next steps.",
  "Use bullet points for lists. Keep responses under 200 words unless more detail is needed.",
  "Always end with an encouraging note or a follow-up question to help the student further.",
].join("\n");

// ─── Handler ───────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Content-Type", "application/json");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // ✅ Manually parse body — Vercel nodejs runtime does NOT auto-parse JSON
  let body;
  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch (e) {
    return res.status(400).json({ error: "Invalid JSON body" });
  }

  const mode = new URL(req.url, "https://mentorgramai.com").searchParams.get("mode");

  // ── CV Analyser mode ────────────────────────────────────────────────────
  if (mode === "cv") {
    const { cvText } = body;

    if (!cvText || String(cvText).trim().length < 50) {
      return res.status(400).json({ error: "CV text too short or missing" });
    }

    try {
      const apiRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2000,
          system: CV_SYSTEM_PROMPT,
          messages: [{ role: "user", content: "Analyse this CV and return the JSON:\n\n" + String(cvText).slice(0, 8000) }],
        }),
      });

      if (!apiRes.ok) {
        const errText = await apiRes.text();
        console.error("Claude CV API error:", apiRes.status, errText);
        return res.status(500).json({ error: "AI service error: " + apiRes.status });
      }

      const data = await apiRes.json();
      const raw = data.content?.[0]?.text || "";

      if (!raw) return res.status(500).json({ error: "Empty response from AI" });

      // Robustly extract JSON — find first { and last }
      const firstBrace = raw.indexOf("{");
      const lastBrace  = raw.lastIndexOf("}");
      if (firstBrace === -1 || lastBrace === -1) {
        console.error("No JSON found in response:", raw.slice(0, 200));
        return res.status(500).json({ error: "AI returned unexpected format" });
      }

      let parsed;
      try {
        parsed = JSON.parse(raw.slice(firstBrace, lastBrace + 1));
      } catch (parseErr) {
        console.error("JSON parse error:", parseErr.message, raw.slice(firstBrace, firstBrace + 300));
        return res.status(500).json({ error: "Could not parse AI response" });
      }

      return res.status(200).json({ result: parsed });

    } catch (err) {
      console.error("CV analyser error:", err.message);
      return res.status(500).json({ error: "Request failed: " + err.message });
    }
  }

  // ── Chat mode (default) ─────────────────────────────────────────────────
  try {
    const { messages } = body;

    const apiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: CHAT_SYSTEM_PROMPT,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
      }),
    });

    const data = await apiRes.json();
    const reply = data.content?.[0]?.text || "I'm here to help! Could you rephrase your question?";
    return res.status(200).json({ reply });

  } catch (err) {
    console.error("Chat error:", err.message);
    return res.status(500).json({ reply: "Sorry, I'm having trouble connecting right now. Please try again in a moment." });
  }
}
