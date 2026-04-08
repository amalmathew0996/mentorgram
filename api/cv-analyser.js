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

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing GROQ_API_KEY env variable" }), { status: 500, headers: cors });
    }

    const apiRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + apiKey,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        temperature: 0.3,
        max_tokens: 2048,
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: "CV to analyse:\n\n" + cvText.slice(0, 8000) },
        ],
      }),
    });

    if (!apiRes.ok) {
      const err = await apiRes.text();
      console.error("Groq error:", apiRes.status, err);
      return new Response(JSON.stringify({ error: "AI error " + apiRes.status + ": " + err.slice(0, 200) }), { status: 500, headers: cors });
    }

    const data = await apiRes.json();
    const raw = data.choices?.[0]?.message?.content || "";

    if (!raw) {
      return new Response(JSON.stringify({ error: "Empty response from AI" }), { status: 500, headers: cors });
    }

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
