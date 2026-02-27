import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function getAccessToken(clientId: string, secret: string, baseUrl: string) {
  const creds = btoa(`${clientId}:${secret}`);
  const res = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${creds}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`PayPal OAuth error: ${t}`);
  }
  return await res.json();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    const PAYPAL_CLIENT_ID = Deno.env.get("PAYPAL_CLIENT_ID") ?? "";
    const PAYPAL_SECRET = Deno.env.get("PAYPAL_SECRET") ?? "";
    const PAYPAL_BASE_URL = Deno.env.get("PAYPAL_BASE_URL") ?? "https://api-m.paypal.com";

    if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET) {
      return new Response(JSON.stringify({ error: "Missing PayPal credentials" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    const { amount, currency = "USD", description = "StatusAds Campaign", return_url, cancel_url } = await req.json();
    if (!amount || !return_url || !cancel_url) {
      return new Response(JSON.stringify({ error: "Missing required fields: amount, return_url, cancel_url" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const token = await getAccessToken(PAYPAL_CLIENT_ID, PAYPAL_SECRET, PAYPAL_BASE_URL);
    const accessToken = token.access_token;

    const orderRes = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: { currency_code: currency, value: String(amount) },
            description,
          },
        ],
        application_context: {
          return_url,
          cancel_url,
          brand_name: "StatusAds",
          shipping_preference: "NO_SHIPPING",
          user_action: "PAY_NOW",
        },
      }),
    });
    const orderData = await orderRes.json();
    if (!orderRes.ok) {
      return new Response(JSON.stringify({ error: orderData }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    const links = (orderData.links as Array<{ href: string; rel: string }> | undefined) || [];
    const approveLink = links.find((l) => l.rel === "approve")?.href;

    return new Response(JSON.stringify({ id: orderData.id, approveLink }), {
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
