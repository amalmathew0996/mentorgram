export const config = { runtime: "edge" };

const SYSTEM_MAIN = "You are an expert university admissions advisor for Mentorgram AI covering both UK and German universities. Analyse the CV provided and return ONLY a valid JSON object with no markdown, no backticks, no explanation. The JSON must have these exact keys: profile (object with name, level, currentField, keySkills array, experience, educationBackground), careerPaths (array of 2-3 objects with title, description, salaryRange in GBP, demandLevel as High or Medium or Growing, visaSponsorship as boolean, skills array), universities (array of EXACTLY 10 objects - 5 UK and 5 German - each with name, country as UK or Germany, course, degreeType, whyMatch, entryRequirements, duration, fees, avgSalary, scholarships), gaps (array of strings), summary (string). Do NOT include any URLs. Return only the JSON object.";

const SYSTEM_MORE = "You are a university admissions advisor. Based on the candidate profile below, suggest 10 MORE university programmes they have not already been shown - 5 from UK universities and 5 from German universities. Return ONLY a valid JSON object with one key: universities (array of 10 objects each with name, country as UK or Germany, course, degreeType, whyMatch, entryRequirements, duration, fees, avgSalary, scholarships). Use different universities and courses from the first batch. Do NOT include any URLs. Return only the JSON object.";

async function callGroq(apiKey, messages, maxTokens) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": "Bearer " + apiKey },
    body: JSON.stringify({ model: "llama-3.3-70b-versatile", temperature: 0.4, max_tokens: maxTokens, messages }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error("Groq " + res.status + ": " + err.slice(0, 150));
  }
  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content || "";
  const first = raw.indexOf("{");
  const last = raw.lastIndexOf("}");
  if (first === -1 || last === -1) throw new Error("No JSON in response");
  return JSON.parse(raw.slice(first, last + 1));
}

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
      return new Response(JSON.stringify({ error: "Missing GROQ_API_KEY" }), { status: 500, headers: cors });
    }

    const levelInstruction = degreeLevel === "PhD"
      ? "IMPORTANT: The user wants PhD programmes only. All 10 university entries must be PhD or doctoral programmes. Include funded positions, research groups and potential supervisors."
      : degreeLevel === "Masters"
      ? "IMPORTANT: The user wants Masters programmes only (MSc, MA, MBA, MRes, MPhil). All 10 entries must be taught or research masters degrees. Include scholarship and funding details."
      : degreeLevel === "Undergraduate"
      ? "IMPORTANT: The user wants Undergraduate programmes only (BSc, BA, BEng, LLB). All 10 entries must be bachelor degree programmes."
      : "Include a good mix of degree levels (undergraduate, masters and PhD) suited to their background.";

    const cvSnippet = cvText.slice(0, 6000);
    const userPrompt = levelInstruction + "\n\nCV:\n\n" + cvSnippet;

    // ── Call 1: main analysis + first 10 universities ──────────────────────
    let mainResult;
    try {
      mainResult = await callGroq(apiKey, [
        { role: "system", content: SYSTEM_MAIN },
        { role: "user",   content: userPrompt },
      ], 3000);
    } catch (e) {
      return new Response(JSON.stringify({ error: "Analysis failed: " + e.message }), { status: 500, headers: cors });
    }

    const firstBatch = mainResult.universities || [];

    // ── Call 2: 10 more universities (parallel) ────────────────────────────
    const alreadyShown = firstBatch.map(u => u.name).join(", ");
    const profileSummary = "Field: " + (mainResult.profile?.currentField || "unknown") +
      ". Skills: " + (mainResult.profile?.keySkills || []).join(", ") +
      ". Level: " + (degreeLevel || mainResult.profile?.level || "unknown") +
      ". Already recommended: " + alreadyShown;

    let secondBatch = [];
    try {
      const moreResult = await callGroq(apiKey, [
        { role: "system", content: SYSTEM_MORE },
        { role: "user",   content: levelInstruction + "\n\nCandidate profile: " + profileSummary },
      ], 2500);
      secondBatch = moreResult.universities || [];
    } catch {
      // Second call failing is non-fatal — we still return first batch
    }

    // Merge, deduplicate by name, limit to 20
    const allUnis = [...firstBatch];
    const seen = new Set(firstBatch.map(u => (u.name || "").toLowerCase()));
    for (const u of secondBatch) {
      if (!seen.has((u.name || "").toLowerCase())) {
        allUnis.push(u);
        seen.add((u.name || "").toLowerCase());
      }
    }

    return new Response(JSON.stringify({
      result: { ...mainResult, universities: allUnis.slice(0, 20) }
    }), { status: 200, headers: cors });

  } catch (err) {
    return new Response(JSON.stringify({ error: "Handler error: " + err.message }), { status: 500, headers: cors });
  }
}
