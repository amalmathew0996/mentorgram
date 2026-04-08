export const config = { runtime: "edge" };

// ─── CV Analyser System Prompt ─────────────────────────────────────────────
const CV_SYSTEM_PROMPT = `You are an expert UK university admissions advisor and career counsellor for Mentorgram AI.

A user has uploaded their CV. Analyse it carefully and return a JSON response with this exact structure:

{
  "profile": {
    "name": "extracted name or null",
    "level": "undergraduate | postgraduate | professional",
    "currentField": "their current field/industry",
    "keySkills": ["skill1", "skill2", "skill3", "skill4", "skill5"],
    "experience": "brief summary of experience level",
    "educationBackground": "brief summary of their education"
  },
  "careerPaths": [
    {
      "title": "Career path title",
      "description": "Why this suits them based on their CV",
      "salaryRange": "£X–£Y average UK salary",
      "demandLevel": "High | Medium | Growing",
      "visaSponsorship": true,
      "skills": ["skill needed 1", "skill needed 2"]
    }
  ],
  "ukUniversities": [
    {
      "name": "University name",
      "course": "Specific course/programme name",
      "degreeType": "BSc | MSc | MBA | PGDip | PhD",
      "whyMatch": "1-2 sentences explaining why this matches their CV",
      "entryRequirements": "brief entry requirements",
      "duration": "1 year | 2 years | 3 years | 4 years",
      "avgSalary": "graduate salary range",
      "scholarships": "relevant scholarships",
      "ucasLink": "https://www.ucas.com/search?query=COURSENAME"
    }
  ],
  "gaps": ["skill or qualification gap 1", "skill or qualification gap 2"],
  "summary": "2-3 sentence personalised summary of their profile and recommendation"
}

Rules:
- Return ONLY valid JSON, no markdown, no preamble, no backticks
- Recommend 2-3 career paths maximum
- Recommend 4-6 UK universities with specific real courses tailored to their background
- Focus on courses that build on what they already know or pivot their career effectively
- For ucasLink use: https://www.ucas.com/search?query=ENCODED_COURSE_NAME
- Be specific — name real UK university courses that exist
- salaryRange should reflect realistic UK graduate/professional salaries in GBP
- gaps should be actionable (e.g. "Python programming", "UK work experience", "IELTS certification")`;

// ─── Chat System Prompt ────────────────────────────────────────────────────
const CHAT_SYSTEM_PROMPT = `You are the Mentorgram AI Mentor — a friendly, expert career and education advisor. 
You help students worldwide navigate:
- UK education pathways (GCSEs, A-Levels, BTEC, UCAS applications)
- UK university admissions, scholarships and student visas
- Career planning in high-demand sectors (AI, healthcare, engineering, finance, cybersecurity, green energy)
- UK visa sponsorship jobs and the Skilled Worker visa process
- International student pathways to UK education and employment

Be warm, encouraging, concise and always give actionable next steps. 
Use bullet points for lists. Keep responses under 200 words unless more detail is needed.
Always end with an encouraging note or a follow-up question to help the student further.`;

// ─── CORS headers ──────────────────────────────────────────────────────────
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: CORS });
}

// ─── Handler ───────────────────────────────────────────────────────────────
export default async function handler(req) {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  const url = new URL(req.url);
  const mode = url.searchParams.get("mode"); // "cv" for CV analyser, default = chat

  try {
    const body = await req.json();

    // ── CV Analyser mode ──────────────────────────────────────────────────
    if (mode === "cv") {
      const { cvText } = body;

      if (!cvText || cvText.trim().length < 50) {
        return json({ error: "CV text too short or missing" }, 400);
      }

      const res = await fetch("https://api.anthropic.com/v1/messages", {
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
          messages: [
            {
              role: "user",
              content: "Here is the CV to analyse:\n\n" + cvText.slice(0, 8000),
            },
          ],
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        console.error("Claude CV error:", err);
        return json({ error: "AI analysis failed" }, 500);
      }

      const data = await res.json();
      const raw = data.content?.[0]?.text || "";

      // Strip any accidental markdown fences
      const cleaned = raw.replace(/```json|```/g, "").trim();

      let parsed;
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        console.error("JSON parse failed:", cleaned.slice(0, 300));
        return json({ error: "Failed to parse AI response" }, 500);
      }

      return json({ result: parsed });
    }

    // ── Chat mode (default) ───────────────────────────────────────────────
    const { messages } = body;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
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

    const data = await res.json();
    const reply = data.content?.[0]?.text || "I'm here to help! Could you rephrase your question?";

    return json({ reply });

  } catch (err) {
    if (mode === "cv") {
      return json({ error: "Analysis failed: " + err.message }, 500);
    }
    return json({ reply: "Sorry, I'm having trouble connecting right now. Please try again in a moment." }, 500);
  }
}
