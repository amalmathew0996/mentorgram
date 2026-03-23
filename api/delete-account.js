export const config = { runtime: "edge" };

export default async function handler(req) {
  const corsHeaders = { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" };
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  try {
    const { user_id, token } = await req.json();
    if (!user_id || !token) throw new Error("Missing user_id or token");

    const supaUrl = process.env.VITE_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Verify the token belongs to this user by calling Supabase auth
    const verifyRes = await fetch(`${supaUrl}/auth/v1/user`, {
      headers: { apikey: process.env.VITE_SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` }
    });
    const userData = await verifyRes.json();
    if (userData.id !== user_id) throw new Error("Unauthorised");

    // Delete user via admin API (requires service role key)
    const deleteRes = await fetch(`${supaUrl}/auth/v1/admin/users/${user_id}`, {
      method: "DELETE",
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }
    });

    if (!deleteRes.ok) {
      const err = await deleteRes.json();
      throw new Error(err.message || "Failed to delete user");
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
}
