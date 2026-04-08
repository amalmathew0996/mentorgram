export const config = { runtime: "edge" };

const SYSTEM = "You are an expert university admissions advisor for Mentorgram AI covering both UK and German universities. Analyse the CV provided and return ONLY a valid JSON object with no markdown, no backticks, no explanation before or after. The JSON must have these exact keys: profile (object with name, level, currentField, keySkills array, experience, educationBackground), careerPaths (array of 2-3 objects with title, description, salaryRange in GBP, demandLevel as High or Medium or Growing, visaSponsorship as boolean, skills array), universities (array of 6-10 objects with name, country as UK or Germany, course, degreeType, whyMatch, entryRequirements, duration, fees, avgSalary, scholarships), gaps (array of strings), summary (string). Include a mix of UK and German universities. Do NOT include any URLs or links - those will be generated separately. Return only the JSON object starting with { and ending with }.";

export default async function handler(req) {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };

  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const { cvText, degreeLevel } = await req.json();

    if (!cvText || cvText.trim().length < 50) {
      return new Response(JSON.stringify({ error: "CV text too short" }), { status: 400, headers: cors });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing GROQ_API_KEY env variable" }), { status: 500, headers: cors });
    }

    const levelInstruction = degreeLevel === "PhD"
      ? "The user is specifically looking for PhD programmes. Focus on PhD and doctoral research opportunities. Include funded PhD positions, research groups, and supervisors where possible. For ukUniversities/universities, all or most entries should be PhD programmes."
      : degreeLevel === "Masters"
      ? "The user is specifically looking for Masters programmes (MSc, MA, MBA, MRes, MPhil). Focus on taught and research masters degrees. Include funding and scholarship options."
      : degreeLevel === "Undergraduate"
      ? "The user is specifically looking for Undergraduate programmes (BSc, BA, BEng, LLB). Focus on bachelor degrees with entry requirements suited to their background."
      : "Include a mix of degree levels suited to their background.";

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
          { role: "user", content: levelInstruction + "\n\nCV to analyse:\n\n" + cvText.slice(0, 8000) },
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
