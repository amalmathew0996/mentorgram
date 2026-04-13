// ✅ Node.js runtime — needs npm packages for PDF/DOCX generation
export const config = { runtime: "nodejs", maxDuration: 30 };

const GROQ_SYSTEM = `You are an expert UK career coach and ATS (Applicant Tracking System) specialist.

Your job is to take a candidate's CV/profile and a job description, then produce:
1. A tailored, ATS-optimised CV
2. A professional cover letter

CRITICAL ATS RULES:
- Mirror exact keywords and phrases from the job description
- Use standard section headings: Professional Summary, Work Experience, Education, Skills, Certifications
- No tables, no columns, no graphics, no text boxes — plain linear text only
- Use standard bullet points (-)
- Include job title keywords in the Professional Summary
- Match required skills verbatim from the job posting
- Quantify achievements where possible (e.g. "increased efficiency by 30%")
- Keep CV to 1-2 pages max

Return ONLY a valid JSON object with this structure:
{
  "cv": {
    "name": "candidate full name",
    "email": "email",
    "phone": "phone",
    "location": "location",
    "linkedin": "linkedin url or empty",
    "summary": "2-3 sentence professional summary tailored to this job, using keywords from JD",
    "experience": [
      {
        "title": "Job Title",
        "company": "Company Name",
        "location": "City, Country",
        "startDate": "Jan 2020",
        "endDate": "Present",
        "bullets": ["Achievement or responsibility using keywords from JD", "..."]
      }
    ],
    "education": [
      {
        "degree": "BSc Computer Science",
        "institution": "University Name",
        "year": "2019",
        "grade": "2:1"
      }
    ],
    "skills": ["Skill 1", "Skill 2"],
    "certifications": ["Certification 1"],
    "atsScore": 92,
    "keywordsMatched": ["keyword1", "keyword2"]
  },
  "skillsToUpgrade": [
    {
      "skill": "Skill name from job description not in CV",
      "priority": "High or Medium or Low",
      "howToGet": "One sentence on quickest way to get this skill (course, cert, project)"
    }
  ],
  "coverLetter": {
    "opening": "paragraph 1 — who you are and why this role",
    "body1": "paragraph 2 — your most relevant experience matching the JD",
    "body2": "paragraph 3 — skills and achievements that match their requirements",
    "closing": "paragraph 4 — enthusiasm and call to action"
  },
  "jobTitle": "extracted job title",
  "company": "extracted company name"
}

Return ONLY the JSON, no markdown, no backticks.`;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Content-Type", "application/json");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // Parse body
  let body;
  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch { return res.status(400).json({ error: "Invalid JSON body" }); }

  const { cvText, jobDescription, jobUrl, format } = body;

  if (!cvText || cvText.trim().length < 50) {
    return res.status(400).json({ error: "CV text is required. Please upload your CV first in the CV Analysis tab." });
  }

  const jobContent = jobDescription || jobUrl || "";
  if (!jobContent.trim()) {
    return res.status(400).json({ error: "Please provide a job description or job URL." });
  }

  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) return res.status(500).json({ error: "Missing GROQ_API_KEY" });

  try {
    // ── Step 1: If URL provided, fetch the page text ────────────────────
    let jd = jobDescription || "";
    if (!jd && jobUrl) {
      try {
        const pageRes = await fetch(jobUrl, {
          headers: { "User-Agent": "Mozilla/5.0 (compatible; MentogramBot/1.0)" },
          signal: AbortSignal.timeout(8000),
        });
        if (pageRes.ok) {
          const html = await pageRes.text();
          // Strip HTML tags and extract text
          jd = html
            .replace(/<script[\s\S]*?<\/script>/gi, "")
            .replace(/<style[\s\S]*?<\/style>/gi, "")
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 6000);
        }
      } catch {
        return res.status(400).json({ error: "Could not fetch the job URL. Please paste the job description text instead." });
      }
    }

    if (!jd || jd.trim().length < 50) {
      return res.status(400).json({ error: "Could not extract job description. Please paste the text directly." });
    }

    // ── Step 2: Call Groq to generate tailored CV + cover letter ─────────
    const prompt = `CANDIDATE CV:\n${cvText.slice(0, 4000)}\n\nJOB DESCRIPTION:\n${jd.slice(0, 3000)}\n\nGenerate a tailored ATS-optimised CV and cover letter for this candidate applying to this role.`;

    // Try models in order — fallback if rate limited
    const MODELS = [
      "llama-3.3-70b-versatile",
      "llama-3.1-70b-versatile",
      "llama3-70b-8192",
      "mixtral-8x7b-32768",
      "llama3-8b-8192",
    ];

    let raw = "";
    let lastErr = "";
    for (const model of MODELS) {
      const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + groqKey },
        body: JSON.stringify({
          model: model,
          temperature: 0.3,
          max_tokens: 3000,
          messages: [
            { role: "system", content: GROQ_SYSTEM },
            { role: "user", content: prompt },
          ],
        }),
      });
      if (groqRes.status === 429 || groqRes.status === 503) {
        lastErr = "Rate limited on " + model;
        continue; // try next model
      }
      if (!groqRes.ok) {
        const err = await groqRes.text();
        lastErr = "AI error " + groqRes.status + " on " + model + ": " + err.slice(0, 100);
        continue;
      }
      const groqData = await groqRes.json();
      raw = groqData.choices?.[0]?.message?.content || "";
      if (raw) break; // success
    }

    if (!raw) {
      return res.status(429).json({ error: "All AI models are currently busy. Please try again in 30 seconds. (" + lastErr + ")" });
    }
    const first = raw.indexOf("{");
    const last = raw.lastIndexOf("}");
    if (first === -1 || last === -1) return res.status(500).json({ error: "AI returned unexpected format" });

    let parsed;
    try { parsed = JSON.parse(raw.slice(first, last + 1)); }
    catch (e) { return res.status(500).json({ error: "Could not parse AI response" }); }

    // Return the structured data — client generates the download files
    return res.status(200).json({
      success: true,
      data: parsed,
      jobTitle: parsed.jobTitle || "Role",
      company: parsed.company || "Company",
    });

  } catch (err) {
    return res.status(500).json({ error: "Handler error: " + err.message });
  }
}
