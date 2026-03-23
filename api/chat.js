export const config = { runtime: "edge" };

export default async function handler(req) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST",
    "Content-Type": "application/json",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();

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
        system: `You are the Mentorgram AI Mentor — a friendly, expert career and education advisor. 
You help students worldwide navigate:
- UK education pathways (GCSEs, A-Levels, BTEC, UCAS applications)
- UK university admissions, scholarships and student visas
- Career planning in high-demand sectors (AI, healthcare, engineering, finance, cybersecurity, green energy)
- UK visa sponsorship jobs and the Skilled Worker visa process
- International student pathways to UK education and employment

Be warm, encouraging, concise and always give actionable next steps. 
Use bullet points for lists. Keep responses under 200 words unless more detail is needed.
Always end with an encouraging note or a follow-up question to help the student further.`,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
      }),
    });

    const data = await res.json();
    const reply = data.content?.[0]?.text || "I'm here to help! Could you rephrase your question?";

    return new Response(JSON.stringify({ reply }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ reply: "Sorry, I'm having trouble connecting right now. Please try again in a moment." }),
      { status: 500, headers: corsHeaders }
    );
  }
}
