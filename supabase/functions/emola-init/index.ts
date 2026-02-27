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
    const { amount, phone, reference = "StatusAds", campaign_id } = await req.json();
    if (!amount) {
      return new Response(JSON.stringify({ error: "Missing required field: amount" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const instructions = {
      provider: "emola",
      amount,
      phone: phone || null,
      reference,
      steps: [
        "Abra o app e-Mola",
        "Escolha 'Transferência' ou 'Pagamento'",
        "Informe o número do beneficiário ou comerciante fornecido",
        "Use a referência: " + reference,
        "Confirme o valor exato e finalize",
      ],
      note: "Após pagar, insira o ID/recibo da transação na plataforma para confirmação.",
    };

    if (campaign_id) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const supabaseClient = {
        from: (table: string) => ({
          update: async (payload: Record<string, unknown>) => {
            const res = await fetch(`${supabaseUrl}/rest/v1/${table}?id=eq.${campaign_id}`, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                "apikey": supabaseKey,
                "Authorization": `Bearer ${supabaseKey}`,
                "Prefer": "return=representation",
              },
              body: JSON.stringify(payload),
            });
            return { data: res.ok ? await res.json() : null, error: res.ok ? null : await res.text() };
          },
        }),
        insertTx: async (payload: Record<string, unknown>) => {
          const res = await fetch(`${supabaseUrl}/rest/v1/transactions`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "apikey": supabaseKey,
              "Authorization": `Bearer ${supabaseKey}`,
              "Prefer": "return=representation",
            },
            body: JSON.stringify(payload),
          });
          return { data: res.ok ? await res.json() : null, error: res.ok ? null : await res.text() };
        },
      };

      const platformFee = Math.round(amount * 0.18);
      const creatorPayout = Math.max(0, amount - platformFee);

      await supabaseClient.from("campaigns").update({
        escrow_status: "payment_pending",
        escrow_amount: amount,
        platform_fee: platformFee,
        creator_payout: creatorPayout,
      });

      await supabaseClient.insertTx({
        campaign_id,
        payer_id: null,
        payee_id: null,
        amount,
        platform_fee: platformFee,
        net_amount: creatorPayout,
        type: "payment_pending",
        status: "pending",
        description: `e-Mola payment initiated - ref: ${reference}`,
      });
    }

    return new Response(JSON.stringify({ instructions }), {
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
