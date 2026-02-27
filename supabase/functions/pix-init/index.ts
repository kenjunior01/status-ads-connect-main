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
    const { amount, pix_key, description = "Ticker Subscription" } = await req.json();
    if (!amount || !pix_key) {
      return new Response(JSON.stringify({ error: "Missing required fields: amount, pix_key" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Placeholder QR payload (EMVCo) — integrate with PSP for production
    const qrPayload = `0002010102112658PIX-PLACEHOLDER${String(amount).padStart(6, "0")}5204000053039865802BR5913STATUSADS LTDA6009SAO PAULO62070503***6304ABCD`;
    const instructions = {
      provider: "pix",
      amount,
      description,
      steps: [
        "Abra o app do seu banco",
        "Escolha pagar via PIX (QR Code)",
        "Escaneie o QR ou cole o código",
        "Confirme o valor e finalize",
      ],
      note: "Após pagar, a confirmação será registrada no painel.",
    };

    return new Response(JSON.stringify({ qrPayload, instructions }), {
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
