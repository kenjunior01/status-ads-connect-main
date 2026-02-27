import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { initiatePaypalPayment, initiateMpesaPayment, initiateEmolaPayment, initiatePixPayment, initiateMbwayPayment, initiateMulticaixaPayment } from "@/lib/payments";
import { Megaphone, Star, Percent, Rocket, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserSubscription } from "@/hooks/useUserSubscription";
import { useLocalizationContext } from "@/contexts/LocalizationContext";

const icons = [
  { key: "megaphone", label: "Megaphone", icon: Megaphone },
  { key: "star", label: "Star", icon: Star },
  { key: "percent", label: "Percent", icon: Percent },
  { key: "rocket", label: "Rocket", icon: Rocket },
];

const plans = [
  { key: "starter", label: "Starter", price: 49, desc: "Até 2 itens / mês" },
  { key: "pro", label: "Pro", price: 129, desc: "Até 6 itens / mês" },
  { key: "enterprise", label: "Enterprise", price: 299, desc: "Até 16 itens / mês" },
];

const slots = [
  { hours: 24, label: "24h avulso", price: 19 },
  { hours: 72, label: "72h avulso", price: 49 },
];

export const AdTickerForm = () => {
  const { toast } = useToast();
  const { role } = useAuth();
  const { subscribed } = useUserSubscription();
  const { getCurrentCountry } = useLocalizationContext();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [iconKey, setIconKey] = useState(icons[0].key);
  const [link, setLink] = useState("");
  const [mode, setMode] = useState<"plan" | "slot">("plan");
  const [planKey, setPlanKey] = useState(plans[0].key);
  const [slotHours, setSlotHours] = useState<number>(slots[0].hours);
  const [provider, setProvider] = useState<"stripe" | "paypal" | "mpesa" | "emola" | "pix" | "mbway" | "multicaixa">("paypal");
  const [phone, setPhone] = useState<string>("");
  const [pixKey, setPixKey] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const currentPrice =
    mode === "plan"
      ? plans.find((p) => p.key === planKey)?.price || 49
      : slots.find((s) => s.hours === slotHours)?.price || 19;

  useEffect(() => {
    const country = getCurrentCountry();
    const code = country?.code?.toUpperCase();
    if (code === "BR") setProvider("pix");
    else if (code === "PT") setProvider("mbway");
    else if (code === "AO") setProvider("multicaixa");
    else setProvider("paypal");
  }, [getCurrentCountry]);

  const handleSubmit = async () => {
    const flag = localStorage.getItem("statusads_service_available");
    const serviceAvailable = flag === null ? true : flag !== "false";
    if (!serviceAvailable) {
      toast({ title: "Indisponível", description: "Serviço temporariamente indisponível", variant: "destructive" });
      return;
    }
    if (!subscribed && role !== "advertiser") {
      toast({ title: "Assinatura necessária", description: "Assine para promover no ticker.", variant: "destructive" });
      return;
    }
    if (!text.trim()) {
      toast({ title: "Texto obrigatório", description: "Insira o texto do ticker.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Faça login para promover no ticker.");

      const start = new Date();
      const end = new Date(start.getTime() + (mode === "slot" ? slotHours : 24) * 60 * 60 * 1000);

      const { data: item, error } = await supabase
        .from("sponsored_ticker_items")
        .insert({
          advertiser_id: user.id,
          text,
          icon: iconKey,
          link: link || null,
          status: "pending",
          plan: mode === "plan" ? planKey : null,
          slot_hours: mode === "slot" ? slotHours : null,
          start_at: start.toISOString(),
          end_at: end.toISOString(),
        })
        .select()
        .single();
      if (error) throw error;

      if (provider === "paypal") {
        const ret = await initiatePaypalPayment(currentPrice, "USD", `${window.location.origin}/`, `${window.location.origin}/`);
        if (ret.approveLink) {
          window.open(ret.approveLink, "_blank");
          toast({ title: "PayPal", description: "Aprove o pagamento na janela aberta." });
        } else {
          toast({ title: "PayPal", description: "Link de aprovação não retornado.", variant: "destructive" });
        }
      } else if (provider === "mpesa") {
        if (!phone) {
          toast({ title: "M-Pesa", description: "Informe o telefone para M-Pesa.", variant: "destructive" });
        } else {
          await initiateMpesaPayment(currentPrice, phone, "StatusAds");
          toast({ title: "M-Pesa", description: "Solicitação enviada. Verifique seu telefone." });
        }
      } else if (provider === "emola") {
        const ret = await initiateEmolaPayment(currentPrice, item?.id, phone, "StatusAdsTicker");
        const steps = ret?.instructions?.steps || [];
        toast({ title: "e-Mola", description: steps.length ? steps.join(" • ") : "Siga as instruções no app e-Mola." });
      } else if (provider === "pix") {
        if (!pixKey) {
          toast({ title: "PIX", description: "Informe a chave PIX.", variant: "destructive" });
        } else {
          const ret = await initiatePixPayment(currentPrice, pixKey, "Ticker Subscription");
          const steps = ret?.instructions?.steps || [];
          toast({ title: "PIX", description: steps.length ? steps.join(" • ") : "Copie/escaneie o QR no app do banco." });
        }
      } else if (provider === "mbway") {
        if (!phone) {
          toast({ title: "MB Way", description: "Informe o telefone para MB Way.", variant: "destructive" });
        } else {
          const ret = await initiateMbwayPayment(currentPrice, phone);
          const steps = ret?.instructions?.steps || [];
          toast({ title: "MB Way", description: steps.length ? steps.join(" • ") : "Aguarde solicitação no app." });
        }
      } else if (provider === "multicaixa") {
        const ret = await initiateMulticaixaPayment(currentPrice, phone);
        const steps = ret?.instructions?.steps || [];
        toast({ title: "Multicaixa", description: steps.length ? steps.join(" • ") : "Verifique app/TPA para instruções." });
      } else {
        toast({ title: "Stripe", description: "Cobrança recorrente/avulsa será processada no backend." });
      }

      setOpen(false);
      setText("");
      setLink("");
    } catch (e) {
      toast({ title: "Erro", description: e instanceof Error ? e.message : String(e), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-primary hover:opacity-90">Promover no Ticker</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Promover no Ticker</DialogTitle>
        </DialogHeader>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Criar anúncio rolante</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Texto</Label>
              <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Copy curto e claro" className="mt-1" maxLength={60} />
              <p className="text-xs text-muted-foreground mt-1">Máx. 60 caracteres para manter a barra compacta.</p>
            </div>
            <div>
              <Label>Ícone</Label>
              <Select value={iconKey} onValueChange={(v) => setIconKey(v)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecione o ícone" />
                </SelectTrigger>
                <SelectContent>
                  {icons.map((i) => <SelectItem key={i.key} value={i.key}>{i.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Link (opcional)</Label>
              <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://..." className="mt-1" />
            </div>
            <div>
              <Label>Tipo de contratação</Label>
              <Select value={mode} onValueChange={(v) => setMode(v as "plan" | "slot")}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Plano ou Avulso" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="plan">Subscrição mensal</SelectItem>
                  <SelectItem value="slot">Avulso por horas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {mode === "plan" ? (
              <div>
                <Label>Plano</Label>
                <Select value={planKey} onValueChange={(v) => setPlanKey(v)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione o plano" />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.map((p) => <SelectItem key={p.key} value={p.key}>{p.label} · ${p.price} · {p.desc}</SelectItem>)}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">Subscrição: recomendamos PayPal para cobrança mensal.</p>
              </div>
            ) : (
              <div>
                <Label>Horas</Label>
                <Select value={String(slotHours)} onValueChange={(v) => setSlotHours(Number(v))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione o período" />
                  </SelectTrigger>
                  <SelectContent>
                    {slots.map((s) => <SelectItem key={s.hours} value={String(s.hours)}>{s.label} · ${s.price}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1">
              <Label>Pagamento</Label>
              <Select value={provider} onValueChange={(v: string) => setProvider(v as "stripe" | "paypal" | "mpesa" | "emola" | "pix" | "mbway" | "multicaixa")}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecione o provedor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="stripe">Stripe (recorrente)</SelectItem>
                  <SelectItem value="mpesa">M-Pesa</SelectItem>
                  <SelectItem value="emola">e-Mola (manual)</SelectItem>
                  <SelectItem value="pix">PIX (Brasil)</SelectItem>
                  <SelectItem value="mbway">MB Way (Portugal)</SelectItem>
                  <SelectItem value="multicaixa">Multicaixa (Angola)</SelectItem>
                </SelectContent>
              </Select>
              {(provider === "mpesa" || provider === "emola" || provider === "mbway" || provider === "multicaixa") && (
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1" placeholder="Telefone (opcional para e-Mola)" />
              )}
              {provider === "pix" && (
                <Input value={pixKey} onChange={(e) => setPixKey(e.target.value)} className="mt-1" placeholder="Chave PIX (CPF, telefone, e-mail ou aleatória)" />
              )}
            </div>
            <div className="flex items-center justify-between pt-2 border-t">
              <p className="text-sm text-muted-foreground">Total: <span className="font-semibold">${currentPrice}</span></p>
              <Button onClick={handleSubmit} disabled={submitting} className="min-w-36">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Confirmar
              </Button>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
