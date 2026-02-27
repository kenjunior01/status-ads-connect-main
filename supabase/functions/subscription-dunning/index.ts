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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const nowIso = new Date().toISOString();
    const graceDays = parseInt(Deno.env.get("DUNNING_GRACE_DAYS") ?? "7", 10);
    const graceMs = graceDays * 24 * 60 * 60 * 1000;
    const pastDueBefore = new Date(Date.now() - graceMs).toISOString();

    const subRes = await fetch(`${supabaseUrl}/rest/v1/user_subscriptions?select=*`, {
      headers: { "apikey": supabaseKey, "Authorization": `Bearer ${supabaseKey}` },
    });
    const subs = await subRes.json();

    let setPastDue = 0;
    let canceled = 0;
    for (const s of subs || []) {
      const endMs = s?.current_period_end ? new Date(s.current_period_end).getTime() : 0;
      const isActive = s?.status === "active";
      if (isActive && endMs > 0 && endMs < Date.now()) {
        await fetch(`${supabaseUrl}/rest/v1/user_subscriptions?id=eq.${s.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", "apikey": supabaseKey, "Authorization": `Bearer ${supabaseKey}`, "Prefer": "return=representation" },
          body: JSON.stringify({ status: "past_due", updated_at: nowIso }),
        });
        setPastDue += 1;
        const renewAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        await fetch(`${supabaseUrl}/rest/v1/reminders`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "apikey": supabaseKey, "Authorization": `Bearer ${supabaseKey}`, "Prefer": "return=representation" },
          body: JSON.stringify({ user_id: s.user_id, title: "Sua assinatura está em atraso", description: "Renove para manter as publicações.", trigger_at: renewAt, type: "subscription_past_due" }),
        });
      }
      if (s?.status === "past_due" && s?.updated_at && new Date(s.updated_at).toISOString() < pastDueBefore) {
        await fetch(`${supabaseUrl}/rest/v1/user_subscriptions?id=eq.${s.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", "apikey": supabaseKey, "Authorization": `Bearer ${supabaseKey}`, "Prefer": "return=representation" },
          body: JSON.stringify({ status: "canceled", updated_at: nowIso }),
        });
        canceled += 1;
      }
    }

    return new Response(JSON.stringify({ ok: true, setPastDue, canceled }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 });
  }
});
