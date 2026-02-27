import { supabase } from "@/integrations/supabase/client";

export type PaymentProvider = "stripe" | "paypal" | "mpesa" | "emola";

export async function initiatePixPayment(amount: number, pixKey: string, description?: string) {
  const { data, error } = await supabase.functions.invoke("pix-init", {
    body: { amount, pix_key: pixKey, description: description || "Ticker Subscription" }
  });
  if (error) throw new Error(error.message || "PIX init error");
  return data as { qrPayload?: string; instructions?: { steps: string[] } };
}

export async function initiatePaypalPayment(amount: number, currency: string, returnUrl: string, cancelUrl: string) {
  const { data, error } = await supabase.functions.invoke("paypal-create-payment", {
    body: { amount, currency, return_url: returnUrl, cancel_url: cancelUrl, description: "StatusAds Campaign" }
  });
  if (error) throw new Error(error.message || "PayPal init error");
  return data as { id: string; approveLink?: string };
}

export async function initiateMpesaPayment(amount: number, phone: string, accountRef?: string) {
  const { data, error } = await supabase.functions.invoke("mpesa-init", {
    body: { amount, phone, accountRef: accountRef || "StatusAds", description: "Campaign Payment" }
  });
  if (error) throw new Error(error.message || "M-Pesa init error");
  return data;
}

export async function initiateEmolaPayment(amount: number, campaignId?: string, phone?: string, reference?: string) {
  const { data, error } = await supabase.functions.invoke("emola-init", {
    body: { amount, campaign_id: campaignId, phone, reference: reference || "StatusAds" }
  });
  if (error) throw new Error(error.message || "e-Mola init error");
  return data as { instructions: { steps: string[]; note: string; reference: string } };
}

export async function initiateMbwayPayment(amount: number, phone: string) {
  const { data, error } = await supabase.functions.invoke("mbway-init", {
    body: { amount, phone, description: "Ticker Subscription" }
  });
  if (error) throw new Error(error.message || "MB Way init error");
  return data as { instructions?: { steps: string[] } };
}

export async function initiateMulticaixaPayment(amount: number, phone?: string) {
  const { data, error } = await supabase.functions.invoke("multicaixa-init", {
    body: { amount, phone, description: "Ticker Subscription" }
  });
  if (error) throw new Error(error.message || "Multicaixa init error");
  return data as { instructions?: { steps: string[] } };
}
