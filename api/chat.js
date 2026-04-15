export const config = { runtime: "edge" };

const SYSTEM = `You are the Mentorgram AI Mentor — a friendly, expert career and education advisor.
You help students worldwide navigate:
- UK education pathways (GCSEs, A-Levels, BTEC, UCAS applications)
- UK university admissions, scholarships and student visas
- Career planning in high-demand sectors (AI, healthcare, engineering, finance, cybersecurity)
- UK visa sponsorship jobs and the Skilled Worker visa process
- German university applications, DAAD scholarships, free tuition
- International student pathways to UK and German education and employment

Be warm, encouraging, concise and always give actionable next steps.
Use bullet points for lists. Keep responses under 250 words unless more detail is needed.
Always end with an encouraging note or a follow-up question to help the student further.`;

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
      reply = "I'm a little busy right now — all AI models are at capacity. Please try again in 30 seconds!";
    }

    return new Response(JSON.stringify({ reply }), { status: 200, headers: corsHeaders });

  } catch (err) {
    return new Response(
      JSON.stringify({ reply: "Sorry, I'm having trouble connecting right now. Please try again in a moment." }),
      { status: 500, headers: corsHeaders }
    );
  }
}
