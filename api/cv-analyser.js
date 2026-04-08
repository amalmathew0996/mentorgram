export const config = { runtime: "nodejs" };

const SYSTEM_PROMPT = `You are an expert UK university admissions advisor and career counsellor for Mentorgram AI.

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
      "visaSponsorship": true or false,
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
- Return ONLY valid JSON, no markdown, no preamble
- Recommend 2-3 career paths maximum
- Recommend 4-6 UK universities with specific courses tailored to their background
- Focus on courses that build on what they already know or pivot their career effectively
- For ucasLink use: https://www.ucas.com/search?query=ENCODED_COURSE_NAME
- Be specific — name real UK university courses that exist
- salaryRange should reflect realistic UK graduate/professional salaries
- gaps should be actionable (e.g. "Python programming", "UK work experience", "IELTS certification")`;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { cvText } = req.body;

  if (!cvText || cvText.trim().length < 50) {
    return res.status(400).json({ error: "CV text too short or missing" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Missing API key" });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `Here is the CV to analyse:\n\n${cvText.slice(0, 8000)}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Claude API error:", err);
      return res.status(500).json({ error: "AI analysis failed" });
    }

    const data = await response.json();
    const raw = data.content?.[0]?.text || "";

    // Strip any accidental markdown fences
    const cleaned = raw.replace(/```json|```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("JSON parse failed:", cleaned.slice(0, 200));
      return res.status(500).json({ error: "Failed to parse AI response" });
    }

    return res.status(200).json({ result: parsed });
  } catch (err) {
    console.error("cv-analyser error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
