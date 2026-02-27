import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PLATFORM_FEE_PERCENT = 18;

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ESCROW] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    const { campaign_id, creator_id, amount, cpv_rate, expected_views } = await req.json();
    
    if (!campaign_id || !creator_id || !amount) {
      throw new Error("Missing required fields: campaign_id, creator_id, amount");
    }

    const platformFee = Math.round(amount * PLATFORM_FEE_PERCENT) / 100;
    const creatorPayout = amount - platformFee;
    const amountInCents = Math.round(amount * 100);

    logStep("Payment details", { amount, platformFee, creatorPayout, cpv_rate, expected_views });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Find or create Stripe customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const customer = await stripe.customers.create({ email: user.email });
      customerId = customer.id;
    }
    logStep("Stripe customer", { customerId });

    // Create payment intent with escrow metadata
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "brl",
      customer: customerId,
      metadata: {
        campaign_id,
        creator_id,
        advertiser_id: user.id,
        platform_fee: platformFee.toString(),
        creator_payout: creatorPayout.toString(),
        cpv_rate: cpv_rate?.toString() || "0",
        expected_views: expected_views?.toString() || "0",
        type: "escrow",
      },
      automatic_payment_methods: { enabled: true },
    });
    logStep("Payment intent created", { paymentIntentId: paymentIntent.id });

    // Update campaign with escrow info
    const { error: campaignError } = await supabaseClient
      .from("campaigns")
      .update({
        escrow_status: "payment_pending",
        escrow_amount: amount,
        platform_fee: platformFee,
        creator_payout: creatorPayout,
        cpv_rate: cpv_rate || 0,
        expected_views: expected_views || 0,
        stripe_payment_intent_id: paymentIntent.id,
        publish_deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      })
      .eq("id", campaign_id);

    if (campaignError) {
      logStep("Campaign update error", { error: campaignError });
    }

    // Create transaction record
    await supabaseClient.from("transactions").insert({
      campaign_id,
      payer_id: user.id,
      payee_id: creator_id,
      amount,
      platform_fee: platformFee,
      net_amount: creatorPayout,
      type: "escrow_hold",
      status: "pending",
      stripe_payment_intent_id: paymentIntent.id,
      description: `Escrow para campanha`,
    });

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        platformFee,
        creatorPayout,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
