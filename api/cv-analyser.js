export const config = { runtime: "edge" };

const SYSTEM = "You are an expert UK university admissions advisor for Mentorgram AI. Analyse the CV provided and return ONLY a valid JSON object with no markdown, no backticks, no explanation before or after. The JSON must have these exact keys: profile (object with name, level, currentField, keySkills array, experience, educationBackground), careerPaths (array of 2-3 objects with title, description, salaryRange in GBP, demandLevel as High or Medium or Growing, visaSponsorship as boolean, skills array), ukUniversities (array of 4-6 objects with name, course, degreeType, whyMatch, entryRequirements, duration, avgSalary, scholarships, ucasLink), gaps (array of strings), summary (string). Return only the JSON object starting with { and ending with }.";

export default async function handler(req) {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };

  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const { cvText } = await req.json();

    if (!cvText || cvText.trim().length < 50) {
      return new Response(JSON.stringify({ error: "CV text too short" }), { status: 400, headers: cors });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing GEMINI_API_KEY env variable" }), { status: 500, headers: cors });
    }

    const prompt = SYSTEM + "\n\nCV to analyse:\n\n" + cvText.slice(0, 8000);

    const apiRes = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + apiKey,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!apiRes.ok) {
      const err = await apiRes.text();
      console.error("Gemini error:", apiRes.status, err);
      return new Response(JSON.stringify({ error: "AI error " + apiRes.status + ": " + err.slice(0, 200) }), { status: 500, headers: cors });
    }

    const data = await apiRes.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!raw) {
      return new Response(JSON.stringify({ error: "Empty response from AI" }), { status: 500, headers: cors });
    }

    // Robustly extract JSON
    const first = raw.indexOf("{");
    const last = raw.lastIndexOf("}");
    if (first === -1 || last === -1) {
      return new Response(JSON.stringify({ error: "Bad AI response format" }), { status: 500, headers: cors });
    }

    let parsed;
    try {
      parsed = JSON.parse(raw.slice(first, last + 1));
    } catch (e) {
      return new Response(JSON.stringify({ error: "JSON parse failed: " + e.message }), { status: 500, headers: cors });
    }

    return new Response(JSON.stringify({ result: parsed }), { status: 200, headers: cors });

  } catch (err) {
    return new Response(JSON.stringify({ error: "Handler error: " + err.message }), { status: 500, headers: cors });
  }
}
