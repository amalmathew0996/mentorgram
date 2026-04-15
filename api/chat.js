export const config = { runtime: "edge" };

const SYSTEM = "You are the Mentorgram AI Mentor — the official AI assistant for Mentorgram AI (mentorgramai.com).\n\nABOUT MENTORGRAM:\nMentorgram AI is a free UK career and education platform helping international students and professionals. Website: mentorgramai.com. Contact: info@mentorgramai.com.\n\nPLATFORM FEATURES — guide users to these:\n- Sponsorship Jobs: search 15,000+ live UK jobs offering visa sponsorship\n- University Finder: explore 50+ UK and 150+ German universities with entry requirements, scholarships and intake calendars\n- CV Generator: upload any CV + paste a job URL or description — AI tailors the CV and writes a cover letter (ATS optimised, 95%+ pass rate)\n- CV Analyser: upload CV to get career path recommendations, university matches and skill gap analysis\n- Visa Sponsors: search 140,000+ UK companies licensed by the Home Office to sponsor visas\n- Dashboard: save job matches, track CV analysis, manage your profile\n\nYOUR ROLE:\nYou are a warm, expert advisor helping users achieve their UK career and education goals. When relevant, mention which Mentorgram feature can help them directly.\n\nTOPICS YOU COVER:\n- UK Skilled Worker visa, Health and Care visa, Graduate Route visa, student visas\n- UCAS applications, personal statements, A-Level and IELTS requirements\n- German university applications, Uni-Assist, DAAD scholarships, blocked account (11,904 euros required)\n- CV writing, ATS optimisation, cover letters, interview preparation\n- UK salary expectations, cost of living, life in the UK\n- Career paths in Technology, Healthcare, Engineering, Finance, Education, Business\n- Visa sponsorship job search strategies\n\nBe warm, encouraging and concise. Use bullet points for lists. Keep responses under 300 words unless more detail is genuinely needed. Always mention a relevant Mentorgram feature if it can help. End with an encouraging note or a follow-up question to keep the conversation going.";

const MODELS = [
  "llama-3.3-70b-versatile",
  "llama3-70b-8192",
  "mixtral-8x7b-32768",
  "llama3-8b-8192",
];

export default async function handler(req) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST",
    "Content-Type": "application/json",
  };

  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) throw new Error("Missing GROQ_API_KEY");

    let reply = "";
    let lastErr = "";

    for (const model of MODELS) {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + groqKey },
        body: JSON.stringify({
          model,
          max_tokens: 600,
          temperature: 0.7,
          messages: [
            { role: "system", content: SYSTEM },
            ...messages.map(m => ({ role: m.role, content: m.content })),
          ],
        }),
      });

      if (res.status === 429 || res.status === 503) { lastErr = "Rate limited on " + model; continue; }
      if (!res.ok) { lastErr = "Error " + res.status + " on " + model; continue; }

      const data = await res.json();
      reply = data.choices?.[0]?.message?.content || "";
      if (reply) break;
    }

    if (!reply) {
      reply = "I'm a little busy right now — all AI models are at capacity. Please try again in 30 seconds! In the meantime, you can browse our 15,000+ visa sponsorship jobs at mentorgramai.com.";
    }

    return new Response(JSON.stringify({ reply }), { status: 200, headers: corsHeaders });

  } catch (err) {
    return new Response(
      JSON.stringify({ reply: "Sorry, I am having trouble connecting right now. Please try again in a moment, or visit mentorgramai.com to browse jobs and universities directly." }),
      { status: 500, headers: corsHeaders }
    );
  }
}
