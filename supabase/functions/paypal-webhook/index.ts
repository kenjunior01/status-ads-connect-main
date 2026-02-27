import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method === "GET") {
    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
  }
  try {
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || req.headers.get("x-real-ip") || "unknown";
    const windowStart = new Date(Date.now() - 5000).toISOString();
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const rlRes = await fetch(`${supabaseUrl}/rest/v1/function_logs?provider=eq.paypal&created_at=gte.${windowStart}&message=eq.${encodeURIComponent(ip)}`, {
      headers: { "apikey": supabaseKey, "Authorization": `Bearer ${supabaseKey}` },
    });
    const rl = await rlRes.json();
    if ((rl || []).length >= 10) {
      await fetch(`${supabaseUrl}/rest/v1/function_logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": supabaseKey, "Authorization": `Bearer ${supabaseKey}`, "Prefer": "return=representation" },
        body: JSON.stringify({ provider: "paypal", level: "error", message: `rate_limited ${ip}` }),
      });
      return new Response(JSON.stringify({ error: "rate_limited" }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 429 });
    }
    await fetch(`${supabaseUrl}/rest/v1/function_logs`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": supabaseKey, "Authorization": `Bearer ${supabaseKey}`, "Prefer": "return=representation" },
      body: JSON.stringify({ provider: "paypal", level: "info", message: ip }),
    });
    const raw = await req.text();
    // supabaseUrl, supabaseKey declared above
    const paypalClient = Deno.env.get("PAYPAL_CLIENT_ID") ?? "";
    const paypalSecret = Deno.env.get("PAYPAL_CLIENT_SECRET") ?? "";
    const webhookId = Deno.env.get("PAYPAL_WEBHOOK_ID") ?? "";
    const paypalBase = Deno.env.get("PAYPAL_BASE") ?? "https://api-m.paypal.com";
    const tId = req.headers.get("paypal-transmission-id") ?? "";
    const tTime = req.headers.get("paypal-transmission-time") ?? "";
    const certUrl = req.headers.get("paypal-cert-url") ?? "";
    const authAlgo = req.headers.get("paypal-auth-algo") ?? "";
    const tSig = req.headers.get("paypal-transmission-sig") ?? "";
    const body = JSON.parse(raw || "{}");
    const { user_id, subscription_id, campaign_id, status, amount, event_id } = body;

    if (!paypalClient || !paypalSecret || !webhookId || !tId || !tTime || !certUrl || !authAlgo || !tSig) {
      return new Response(JSON.stringify({ error: "unauthorized" }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 });
    }

    const tokenRes = await fetch(`${paypalBase}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        "Authorization": "Basic " + btoa(`${paypalClient}:${paypalSecret}`),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });
    const tokenJson = await tokenRes.json();
    const accessToken = tokenJson.access_token;
    if (!accessToken) {
      return new Response(JSON.stringify({ error: "unauthorized" }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 });
    }

    const verifyRes = await fetch(`${paypalBase}/v1/notifications/verify-webhook-signature`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        auth_algo: authAlgo,
        cert_url: certUrl,
        transmission_id: tId,
        transmission_sig: tSig,
        transmission_time: tTime,
        webhook_id: webhookId,
        webhook_event: body,
      }),
    });
    const verifyJson = await verifyRes.json();
    if (verifyJson.verification_status !== "SUCCESS") {
      return new Response(JSON.stringify({ error: "unauthorized" }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 });
    }

    const update = async () => {
      if (subscription_id && user_id) {
        const subRes = await fetch(`${supabaseUrl}/rest/v1/user_subscriptions?id=eq.${subscription_id}`, {
          headers: { "apikey": supabaseKey, "Authorization": `Bearer ${supabaseKey}` },
        });
        const subs = await subRes.json();
        const currentEnd = subs?.[0]?.current_period_end ? new Date(subs[0].current_period_end).getTime() : Date.now();
        const base = Math.max(Date.now(), currentEnd);
        const next = new Date(base + 30 * 24 * 60 * 60 * 1000).toISOString();
        await fetch(`${supabaseUrl}/rest/v1/user_subscriptions?id=eq.${subscription_id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", "apikey": supabaseKey, "Authorization": `Bearer ${supabaseKey}`, "Prefer": "return=representation" },
          body: JSON.stringify({ status: status || "active", current_period_end: next, updated_at: new Date().toISOString() }),
        });
        const renewAt = new Date(new Date(next).getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
        await fetch(`${supabaseUrl}/rest/v1/reminders`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "apikey": supabaseKey, "Authorization": `Bearer ${supabaseKey}`, "Prefer": "return=representation" },
          body: JSON.stringify({ user_id, title: "Renovação de assinatura em 3 dias", description: "Garanta a permanência das publicações.", trigger_at: renewAt, type: "subscription_renewal" }),
        });
      }
      if (campaign_id) {
        await fetch(`${supabaseUrl}/rest/v1/campaigns?id=eq.${campaign_id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", "apikey": supabaseKey, "Authorization": `Bearer ${supabaseKey}`, "Prefer": "return=representation" },
          body: JSON.stringify({ escrow_status: "payment_confirmed" }),
        });
      }
      const idToUse = event_id || tId || "";
      const existsRes = await fetch(`${supabaseUrl}/rest/v1/payment_events?event_id=eq.${encodeURIComponent(idToUse)}`, {
        headers: { "apikey": supabaseKey, "Authorization": `Bearer ${supabaseKey}` },
      });
      const existing = await existsRes.json();
      if (!event_id || !existing?.length) {
        await fetch(`${supabaseUrl}/rest/v1/payment_events`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "apikey": supabaseKey, "Authorization": `Bearer ${supabaseKey}`, "Prefer": "return=representation" },
          body: JSON.stringify({ provider: "paypal", user_id, campaign_id, subscription_id, status: status || "confirmed", amount, event_id: idToUse || null, payload: body }),
        });
      }
    };

    await update();
    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
  } catch (e) {
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      await fetch(`${supabaseUrl}/rest/v1/function_logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": supabaseKey, "Authorization": `Bearer ${supabaseKey}`, "Prefer": "return=representation" },
        body: JSON.stringify({ provider: "paypal", level: "error", message: e instanceof Error ? e.message : String(e) }),
      });
    } catch { /* noop */ }
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 });
  }
});
