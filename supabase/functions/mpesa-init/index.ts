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
    const CONSUMER_KEY = Deno.env.get("MPESA_CONSUMER_KEY") ?? "";
    const CONSUMER_SECRET = Deno.env.get("MPESA_CONSUMER_SECRET") ?? "";
    const SHORTCODE = Deno.env.get("MPESA_SHORTCODE") ?? "";
    const PASSKEY = Deno.env.get("MPESA_PASSKEY") ?? "";
    const CALLBACK_URL = Deno.env.get("MPESA_CALLBACK_URL") ?? "";
    const BASE_URL = Deno.env.get("MPESA_BASE_URL") ?? "https://api.safaricom.co.ke";

    if (!CONSUMER_KEY || !CONSUMER_SECRET || !SHORTCODE || !PASSKEY || !CALLBACK_URL) {
      return new Response(JSON.stringify({ error: "Missing M-Pesa config" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    const { amount, phone, accountRef = "StatusAds", description = "Campaign Payment" } = await req.json();
    if (!amount || !phone) {
      return new Response(JSON.stringify({ error: "Missing required fields: amount, phone" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const oauthRes = await fetch(`${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: { "Authorization": `Basic ${btoa(`${CONSUMER_KEY}:${CONSUMER_SECRET}`)}` },
    });
    const oauthData = await oauthRes.json();
    if (!oauthRes.ok) {
      return new Response(JSON.stringify({ error: oauthData }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }
    const accessToken = oauthData.access_token;

    const timestamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
    const password = btoa(`${SHORTCODE}${PASSKEY}${timestamp}`);

    const stkRes = await fetch(`${BASE_URL}/mpesa/stkpush/v1/processrequest`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        BusinessShortCode: SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: amount,
        PartyA: phone,
        PartyB: SHORTCODE,
        PhoneNumber: phone,
        CallBackURL: CALLBACK_URL,
        AccountReference: accountRef,
        TransactionDesc: description,
      }),
    });
    const stkData = await stkRes.json();
    if (!stkRes.ok) {
      return new Response(JSON.stringify({ error: stkData }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    return new Response(JSON.stringify(stkData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
