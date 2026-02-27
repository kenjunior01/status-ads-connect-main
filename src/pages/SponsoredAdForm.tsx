import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { initiatePaypalPayment, initiatePixPayment, initiateMbwayPayment, initiateMulticaixaPayment, initiateEmolaPayment, initiateMpesaPayment } from "@/lib/payments";

type Pricing = { id: string; name: string; price: number; duration_hours: number; policy?: string | null; active: boolean };

export const SponsoredAdForm = () => {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const placement = (searchParams.get("placement") || "").toLowerCase();
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageValid, setImageValid] = useState<boolean>(false);
  const [imageInfo, setImageInfo] = useState<{ width: number; height: number } | null>(null);
  const [link, setLink] = useState("");
  const [pricing, setPricing] = useState<Pricing[]>([]);
  const [pricingId, setPricingId] = useState<string>("");
  const [provider, setProvider] = useState<"paypal" | "pix" | "mbway" | "multicaixa" | "emola" | "mpesa">("paypal");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("ad_pricing").select("*").eq("active", true).order("price", { ascending: true });
      const arr = (data || []) as Pricing[];
      const isRoll = (p: Pricing) => (p.name || "").toLowerCase().includes("roll") || (p.name || "").toLowerCase().includes("ticker") || (p.policy || "")?.toLowerCase().includes("roll") || (p.policy || "")?.toLowerCase().includes("ticker");
      const rollPlans = placement === "roll" ? arr.filter(isRoll) : arr;
      setPricing(rollPlans.length ? rollPlans : arr);
      const initial = rollPlans.length ? rollPlans[0] : arr[0];
      if (initial) setPricingId(initial.id);
    };
    load();
  }, [placement]);

  useEffect(() => {
    if (!imageUrl) {
      setImageValid(false);
      setImageInfo(null);
      return;
    }
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      setImageInfo({ width: w, height: h });
      const ratio = w / h;
      const ok = ratio >= 1.3 && ratio <= 2.2 && w >= 640 && h >= 360;
      setImageValid(ok);
      if (!ok) {
        toast({ title: "Imagem fora do padrão", description: "Use proporção próxima de 16:9 e mínimo 640x360.", variant: "destructive" });
      }
    };
    img.onerror = () => {
      setImageValid(false);
      setImageInfo(null);
      toast({ title: "Imagem inválida", description: "Não foi possível carregar a imagem.", variant: "destructive" });
    };
    img.src = imageUrl;
  }, [imageUrl, toast]);

  const selected = pricing.find(p => p.id === pricingId);
  const amount = selected?.price || 0;

  const submit = async () => {
    if (!title || !imageUrl || !pricingId) {
      toast({ title: "Campos obrigatórios", description: "Informe título, imagem e preço.", variant: "destructive" });
      return;
    }
    if (!imageValid) {
      toast({ title: "Imagem inválida", description: "Ajuste a proporção e dimensão antes de enviar.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.from("guest_ad_orders").insert({
        company_name: companyName || null,
        contact_email: email || null,
        phone: phone || null,
        banner_title: title,
        banner_image_url: imageUrl,
        banner_link: link || null,
        pricing_tier: pricingId,
        amount,
        provider,
        status: "pending",
      }).select().single();
      if (error) throw error;
      const starts = new Date();
      const expires = new Date(starts.getTime() + (selected?.duration_hours || 24) * 60 * 60 * 1000);
      await supabase.from("sponsored_banners").insert({
        title,
        image_url: imageUrl,
        link: link || null,
        status: "pending",
        pricing_tier: pricingId,
        starts_at: starts.toISOString(),
        expires_at: expires.toISOString(),
      });
      if (provider === "paypal") {
        const ret = await initiatePaypalPayment(amount, "USD", `${window.location.origin}/`, `${window.location.origin}/`);
        if (ret.approveLink) {
          window.open(ret.approveLink, "_blank");
          toast({ title: "PayPal", description: "Aprove o pagamento na janela aberta." });
        }
      } else if (provider === "pix") {
        const ret = await initiatePixPayment(amount, phone || "CHAVE_PIX", "Sponsored Banner");
        const steps = ret?.instructions?.steps || [];
        toast({ title: "PIX", description: steps.length ? steps.join(" • ") : "Copie/escaneie o QR no app do banco." });
      } else if (provider === "mbway") {
        const ret = await initiateMbwayPayment(amount, phone);
        const steps = ret?.instructions?.steps || [];
        toast({ title: "MB Way", description: steps.length ? steps.join(" • ") : "Aguarde solicitação no app." });
      } else if (provider === "multicaixa") {
        const ret = await initiateMulticaixaPayment(amount, phone);
        const steps = ret?.instructions?.steps || [];
        toast({ title: "Multicaixa", description: steps.length ? steps.join(" • ") : "Verifique app/TPA para instruções." });
      } else if (provider === "emola") {
        const ret = await initiateEmolaPayment(amount, data?.id, phone, "StatusAdsBanner");
        const steps = ret?.instructions?.steps || [];
        toast({ title: "e-Mola", description: steps.length ? steps.join(" • ") : "Siga as instruções no app e-Mola." });
      } else if (provider === "mpesa") {
        await initiateMpesaPayment(amount, phone, "StatusAdsBanner");
        toast({ title: "M-Pesa", description: "Solicitação enviada. Verifique seu telefone." });
      }
      toast({ title: "Pedido criado", description: "Seu anúncio será analisado e aprovado pelo admin." });
      setCompanyName(""); setEmail(""); setPhone(""); setTitle(""); setImageUrl(""); setLink("");
    } catch (e) {
      toast({ title: "Erro", description: e instanceof Error ? e.message : String(e), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-3 md:p-4">
      <Card>
        <CardHeader>
          <CardTitle>Anunciar sem cadastro</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {placement === "roll" ? (
            <div className="p-3 border rounded bg-muted/40 text-sm">
              Seu banner será exibido no carrossel lateral de anúncios após aprovação.
            </div>
          ) : null}
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <Label>Empresa/Organizador</Label>
              <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="mt-1" placeholder="Nome da empresa ou pessoa" />
            </div>
            <div>
              <Label>E-mail de contato</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" placeholder="email@exemplo.com" />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <Label>Telefone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1" placeholder="Para MB Way / M-Pesa / e-Mola" />
            </div>
            <div>
              <Label>Link do anúncio</Label>
              <Input value={link} onChange={(e) => setLink(e.target.value)} className="mt-1" placeholder="https://..." />
            </div>
          </div>
          <div>
            <Label>Título</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" placeholder="Breve descrição" />
          </div>
          <div>
            <Label>URL da Imagem (banner)</Label>
            <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="mt-1" placeholder="https://imagem.jpg/png" />
            <p className="text-xs text-muted-foreground mt-1">A imagem será ajustada ao tamanho dos cards de promoções.</p>
            {imageInfo && (
              <div className="mt-2 text-xs">
                Dimensão: {imageInfo.width}x{imageInfo.height} · {imageValid ? "Ok" : "Ajuste necessário"}
              </div>
            )}
            {imageUrl && (
              <div className="mt-2">
                <img src={imageUrl} alt="Prévia" loading="lazy" decoding="async" className="w-full h-36 md:h-44 object-cover rounded border" />
              </div>
            )}
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <Label>Plano</Label>
              <Select value={pricingId} onValueChange={setPricingId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecione o plano" />
                </SelectTrigger>
                <SelectContent>
                  {pricing.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name} · ${p.price} · {p.duration_hours}h</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selected?.policy ? <p className="text-xs text-muted-foreground mt-1">{selected.policy}</p> : null}
              {placement === "roll" && pricing.length === 0 && (
                <p className="text-xs text-warning mt-1">Nenhum plano “Roll/Ticker” disponível. Fale com o administrador em Ads Pricing.</p>
              )}
            </div>
            <div>
              <Label>Pagamento</Label>
              <Select value={provider} onValueChange={(v: string) => setProvider(v as typeof provider)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecione o provedor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="pix">PIX (Brasil)</SelectItem>
                  <SelectItem value="mbway">MB Way (Portugal)</SelectItem>
                  <SelectItem value="multicaixa">Multicaixa (Angola)</SelectItem>
                  <SelectItem value="emola">e-Mola (Moçambique)</SelectItem>
                  <SelectItem value="mpesa">M-Pesa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={submit} disabled={submitting} className="w-full md:w-auto">{submitting ? "Enviando..." : "Confirmar e Pagar"}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
