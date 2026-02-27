import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { initiatePaypalPayment, initiatePixPayment, initiateMbwayPayment, initiateMulticaixaPayment } from "@/lib/payments";
import { Loader2, CreditCard } from "lucide-react";

const plans = [
  { key: "basic", label: "Basic", price: 19 },
  { key: "pro", label: "Pro", price: 39 },
  { key: "creator", label: "Creator", price: 79 },
];

export const UserSubscriptionDialog = () => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [planKey, setPlanKey] = useState(plans[0].key);
  const [provider, setProvider] = useState<"pix" | "paypal" | "mbway" | "multicaixa" | "stripe">("pix");
  const [phone, setPhone] = useState<string>("");
  const [pixKey, setPixKey] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const price = plans.find(p => p.key === planKey)?.price || 19;

  const handleSubscribe = async () => {
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Faça login para assinar.");

      const start = new Date();
      const end = new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);
      const { error: insertError } = await supabase.from("user_subscriptions").insert({
        user_id: user.id,
        plan: planKey,
        status: "active",
        current_period_start: start.toISOString(),
        current_period_end: end.toISOString(),
        provider,
      });
      if (insertError) throw insertError;
      const reminderAt = new Date(end.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
      await supabase.from("reminders").insert({
        user_id: user.id,
        title: "Renovação de assinatura em 3 dias",
        description: "Garanta a permanência das publicações.",
        trigger_at: reminderAt,
        type: "subscription_renewal",
      });

      if (provider === "paypal") {
        const ret = await initiatePaypalPayment(price, "USD", `${window.location.origin}/`, `${window.location.origin}/`);
        if (ret.approveLink) {
          window.open(ret.approveLink, "_blank");
          toast({ title: "PayPal", description: "Aprove o pagamento na janela aberta." });
        }
      } else if (provider === "pix") {
        if (!pixKey) throw new Error("Informe a chave PIX.");
        const ret = await initiatePixPayment(price, pixKey, "User Subscription");
        const steps = ret?.instructions?.steps || [];
        toast({ title: "PIX", description: steps.length ? steps.join(" • ") : "Copie/escaneie o QR no app do banco." });
      } else if (provider === "mbway") {
        if (!phone) throw new Error("Informe o telefone para MB Way.");
        const ret = await initiateMbwayPayment(price, phone);
        const steps = ret?.instructions?.steps || [];
        toast({ title: "MB Way", description: steps.length ? steps.join(" • ") : "Aguarde solicitação no app." });
      } else if (provider === "multicaixa") {
        const ret = await initiateMulticaixaPayment(price, phone);
        const steps = ret?.instructions?.steps || [];
        toast({ title: "Multicaixa", description: steps.length ? steps.join(" • ") : "Verifique app/TPA para instruções." });
      } else {
        toast({ title: "Stripe", description: "Cobrança recorrente será processada no backend." });
      }
      setOpen(false);
    } catch (e) {
      toast({ title: "Erro", description: e instanceof Error ? e.message : String(e), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <CreditCard className="h-4 w-4" />
          Assinar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assinatura Mensal</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Plano</Label>
            <Select value={planKey} onValueChange={setPlanKey}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Selecione o plano" />
              </SelectTrigger>
              <SelectContent>
                {plans.map(p => <SelectItem key={p.key} value={p.key}>{p.label} · ${p.price}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Pagamento</Label>
            <Select value={provider} onValueChange={(v: string) => setProvider(v as "pix" | "paypal" | "mbway" | "multicaixa" | "stripe")}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Selecione o provedor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pix">PIX (Brasil)</SelectItem>
                <SelectItem value="paypal">PayPal</SelectItem>
                <SelectItem value="mbway">MB Way (Portugal)</SelectItem>
                <SelectItem value="multicaixa">Multicaixa (Angola)</SelectItem>
                <SelectItem value="stripe">Stripe (recorrente)</SelectItem>
              </SelectContent>
            </Select>
            {provider === "pix" && (
              <Input value={pixKey} onChange={(e) => setPixKey(e.target.value)} className="mt-1" placeholder="Chave PIX" />
            )}
            {(provider === "mbway" || provider === "multicaixa") && (
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1" placeholder="Telefone" />
            )}
          </div>
          <div className="flex items-center justify-between pt-2 border-t">
            <p className="text-sm text-muted-foreground">Total: <span className="font-semibold">${price}</span></p>
            <Button onClick={handleSubscribe} disabled={submitting} className="min-w-36">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirmar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
