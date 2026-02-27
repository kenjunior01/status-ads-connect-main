import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    const { banner_id, type } = await req.json();
    if (!banner_id || !["impression", "click"].includes(type)) {
      return new Response(JSON.stringify({ error: "bad_request" }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
    }
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const { data: exists } = await (await fetch(`${supabaseUrl}/rest/v1/sponsored_banner_stats?banner_id=eq.${banner_id}&select=*`, {
      headers: { "apikey": supabaseKey, "Authorization": `Bearer ${supabaseKey}` },
    })).json();

    const current = (exists || [])[0];
    const impressions = (current?.impressions || 0) + (type === "impression" ? 1 : 0);
    const clicks = (current?.clicks || 0) + (type === "click" ? 1 : 0);

    if (current?.id) {
      await fetch(`${supabaseUrl}/rest/v1/sponsored_banner_stats?id=eq.${current.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "apikey": supabaseKey, "Authorization": `Bearer ${supabaseKey}`, "Prefer": "return=representation" },
        body: JSON.stringify({ impressions, clicks, updated_at: new Date().toISOString() }),
      });
    } else {
      await fetch(`${supabaseUrl}/rest/v1/sponsored_banner_stats`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": supabaseKey, "Authorization": `Bearer ${supabaseKey}`, "Prefer": "return=representation" },
        body: JSON.stringify({ banner_id, impressions, clicks }),
      });
    }

    await fetch(`${supabaseUrl}/rest/v1/sponsored_banner_events`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": supabaseKey, "Authorization": `Bearer ${supabaseKey}`, "Prefer": "return=representation" },
      body: JSON.stringify({ banner_id, type }),
    });

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 });
  }
});
