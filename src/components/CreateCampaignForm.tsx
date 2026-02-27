import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useCampaigns } from "@/hooks/useCampaigns";
import { useProfiles } from "@/hooks/useProfiles";
import { format as formatDate } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Target, 
  ChevronRight,
  ChevronLeft,
  Check,
  Sparkles,
  Loader2,
  User
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInfluenceCategory, getSuggestedPriceRange, getAdjustedPriceRange, computePlatformFee } from "@/lib/utils";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocalizationContext } from "@/contexts/LocalizationContext";
import { initiatePaypalPayment, initiateMpesaPayment, initiateEmolaPayment, initiatePixPayment, initiateMbwayPayment, initiateMulticaixaPayment } from "@/lib/payments";
import { BriefAssistant } from "@/components/BriefAssistant";
import { supabase } from "@/integrations/supabase/client";
// Preços por Tier removido

interface CreateCampaignFormProps {
  onSubmit?: () => void;
  onCancel?: () => void;
}

const categories = [
  { value: "product", label: "Divulgação de Produto" },
  { value: "service", label: "Divulgação de Serviço" },
  { value: "brand", label: "Awareness de Marca" },
  { value: "event", label: "Evento/Promoção" },
  { value: "app", label: "Download de App" },
];

export const CreateCampaignForm = ({ onSubmit, onCancel }: CreateCampaignFormProps) => {
  const { createCampaign, creating } = useCampaigns();
  const { profiles, loading: loadingProfiles } = useProfiles();
  const { toast } = useToast();
  const { format: formatCurrency, getCurrentCountry } = useLocalizationContext();
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    budget: 200,
    deadline: undefined as Date | undefined,
    selectedCreatorId: "",
  });
  const [suggestion, setSuggestion] = useState<{ avgViews: number; min: number; max: number; category: string } | null>(null);
  const [selectedProfileUserId, setSelectedProfileUserId] = useState<string | null>(null);
  const [selectedProfileTrustScore, setSelectedProfileTrustScore] = useState<number | null>(null);
  const [paymentProvider, setPaymentProvider] = useState<"stripe" | "paypal" | "mpesa" | "emola" | "pix" | "mbway" | "multicaixa">("stripe");
  const [mpesaPhone, setMpesaPhone] = useState<string>("");
  const [emolaPhone, setEmolaPhone] = useState<string>("");
  const [emolaReference, setEmolaReference] = useState<string>("StatusAds");
  const [pixKey, setPixKey] = useState<string>("");
  const [nicheMultiplier, setNicheMultiplier] = useState<number>(1);
  const [interactiveExtra, setInteractiveExtra] = useState<number>(0);
  const [packageCount, setPackageCount] = useState<number>(1);
  const [couponCode, setCouponCode] = useState<string>("");
  const [allowAuction, setAllowAuction] = useState<boolean>(false);

  const totalSteps = 3;

  useEffect(() => {
    const code = getCurrentCountry()?.code?.toUpperCase();
    if (code === "BR") setPaymentProvider("pix");
    else if (code === "PT") setPaymentProvider("mbway");
    else if (code === "AO") setPaymentProvider("multicaixa");
  }, [getCurrentCountry]);

  const handleSubmit = async () => {
    if (!formData.selectedCreatorId) return;
    
    try {
      if (suggestion) {
        const min = Math.max(1, suggestion.min);
        const max = Math.max(min + 1, suggestion.max);
        if (formData.budget < min || formData.budget > max) {
          setFormData({ ...formData, budget: Math.min(Math.max(formData.budget, min), max) });
        }
      }
      const basePrice = formData.budget;
      const discounts: Record<string, number> = {
        "MEITUAN10": 0.10,
        "MEITUAN15": 0.15,
        "MEITUAN20": 0.20
      };
      const discount = discounts[couponCode.toUpperCase()] ?? 0;
      const discountedPrice = Math.round(basePrice * (1 - discount));
      const created = await createCampaign({
        title: formData.title,
        description: formData.description,
        price: discountedPrice,
        creator_id: formData.selectedCreatorId,
      });
      if (allowAuction && created?.id) {
        await supabase.from('campaigns').update({ allow_auction: true }).eq('id', created.id);
      }
      if (paymentProvider === "paypal") {
        const budgetUSD = formData.budget;
        const ret = await initiatePaypalPayment(budgetUSD, "USD", `${window.location.origin}/dashboard/advertiser`, `${window.location.origin}/dashboard/advertiser`);
        if (ret.approveLink) {
          window.open(ret.approveLink, "_blank");
          toast({ title: "Pagamento PayPal", description: "Aprove o pagamento na janela aberta." });
        } else {
          toast({ title: "PayPal", description: "Link de aprovação não retornado.", variant: "destructive" });
        }
      } else if (paymentProvider === "mpesa") {
        if (!mpesaPhone) {
          toast({ title: "M-Pesa", description: "Informe o telefone para M-Pesa.", variant: "destructive" });
        } else {
          await initiateMpesaPayment(formData.budget, mpesaPhone, "StatusAds");
          toast({ title: "M-Pesa", description: "Solicitação enviada. Verifique seu telefone." });
        }
      } else if (paymentProvider === "emola") {
        const ret = await initiateEmolaPayment(formData.budget, created?.id, emolaPhone, emolaReference);
        const steps = ret?.instructions?.steps || [];
        toast({ title: "e-Mola", description: steps.length ? steps.join(" • ") : "Siga as instruções no app e-Mola." });
      } else if (paymentProvider === "pix") {
        if (!pixKey) {
          toast({ title: "PIX", description: "Informe a chave PIX.", variant: "destructive" });
        } else {
          const ret = await initiatePixPayment(formData.budget, pixKey, "Campaign Payment");
          const steps = ret?.instructions?.steps || [];
          toast({ title: "PIX", description: steps.length ? steps.join(" • ") : "Copie/escaneie o QR no app do banco." });
        }
      } else if (paymentProvider === "mbway") {
        if (!mpesaPhone) {
          toast({ title: "MB Way", description: "Informe o telefone.", variant: "destructive" });
        } else {
          const ret = await initiateMbwayPayment(formData.budget, mpesaPhone);
          const steps = ret?.instructions?.steps || [];
          toast({ title: "MB Way", description: steps.length ? steps.join(" • ") : "Aguarde solicitação no app." });
        }
      } else if (paymentProvider === "multicaixa") {
        const ret = await initiateMulticaixaPayment(formData.budget, emolaPhone);
        const steps = ret?.instructions?.steps || [];
        toast({ title: "Multicaixa", description: steps.length ? steps.join(" • ") : "Verifique app/TPA para instruções." });
      }
      onSubmit?.();
    } catch (error) {
      // Error handled in hook
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.title && formData.category;
      case 2:
        return formData.budget > 0;
      case 3:
        return formData.selectedCreatorId;
      default:
        return false;
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <div key={index} className="flex items-center">
          <div
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center font-medium transition-colors",
              step > index + 1
                ? "bg-primary text-primary-foreground"
                : step === index + 1
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}
          >
            {step > index + 1 ? <Check className="h-5 w-5" /> : index + 1}
          </div>
          {index < totalSteps - 1 && (
            <div
              className={cn(
                "w-16 h-1 mx-2",
                step > index + 1 ? "bg-primary" : "bg-muted"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between">
          <Label htmlFor="title">Título da Campanha *</Label>
          <BriefAssistant
            category={formData.category}
            seed={formData.description}
            onApply={(b) => setFormData({ ...formData, title: b.title, description: b.description })}
          />
        </div>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Ex: Lançamento Novo Produto de Skincare"
          className="mt-2"
        />
      </div>

      <div>
        <Label htmlFor="category">Categoria *</Label>
        <Select
          value={formData.category}
          onValueChange={(value) => setFormData({ ...formData, category: value })}
        >
          <SelectTrigger className="mt-2">
            <SelectValue placeholder="Selecione a categoria" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Descreva os objetivos e detalhes da campanha..."
          className="mt-2"
          rows={4}
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <Label>Orçamento: R$ {formData.budget}</Label>
        <div className="mt-4 px-2">
          <Slider
            value={[formData.budget]}
            onValueChange={(value) => {
              const next = value[0];
              if (suggestion) {
                const min = Math.max(1, suggestion.min);
                const max = Math.max(min + 1, suggestion.max);
                const clamped = Math.min(Math.max(next, min), max);
                setFormData({ ...formData, budget: clamped });
              } else {
                setFormData({ ...formData, budget: next });
              }
            }}
            min={suggestion ? Math.max(1, suggestion.min) : 50}
            max={suggestion ? Math.max(suggestion.min + 1, suggestion.max) : 5000}
            step={50}
          />
        </div>
        <div className="flex justify-between text-sm text-muted-foreground mt-2">
          <span>{suggestion ? `R$ ${suggestion.min}` : "R$ 50"}</span>
          <span>{suggestion ? `R$ ${suggestion.max}` : "R$ 5.000"}</span>
        </div>
      </div>
      <div>
        <Label htmlFor="coupon">Cupom (opcional)</Label>
        <Input
          id="coupon"
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value.trim())}
          placeholder="Ex: MEITUAN10"
          className="mt-2"
        />
        <p className="text-xs text-muted-foreground mt-1">Aplicamos o desconto no pagamento final, respeitando o intervalo justo.</p>
      </div>

      <div>
        <Label>Data Limite (opcional)</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal mt-2",
                !formData.deadline && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formData.deadline
                ? formatDate(formData.deadline, "PPP", { locale: ptBR })
                : "Selecione uma data"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={formData.deadline}
              onSelect={(date) => setFormData({ ...formData, deadline: date })}
              disabled={(date) => date < new Date()}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <Label>Selecione um Criador *</Label>
        <p className="text-sm text-muted-foreground mb-4">
          Escolha o criador que receberá sua proposta
        </p>
        
        {loadingProfiles ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : profiles.length === 0 ? (
          <div className="text-center p-8 text-muted-foreground">
            Nenhum criador disponível no momento
          </div>
        ) : (
          <div className="grid gap-3 max-h-[300px] overflow-y-auto">
            {profiles.slice(0, 10).map((profile) => (
              <div
                key={profile.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                  formData.selectedCreatorId === profile.profile_id
                    ? "border-primary bg-primary/5"
                    : "hover:bg-muted/50"
                )}
                onClick={() => {
                  setFormData({ ...formData, selectedCreatorId: profile.profile_id || profile.id });
                  setSelectedProfileUserId(profile.user_id || null);
                  const contacts = profile.contacts_count ?? 0;
                  const roughAvg = contacts > 0 ? Math.round(contacts * 0.6) : Math.round((profile.trust_score ?? 50) * 10);
                  const cat = getInfluenceCategory(roughAvg);
                  const range = getSuggestedPriceRange(roughAvg);
                  setSuggestion({ avgViews: roughAvg, min: range.min, max: range.max, category: cat.label });
                  setSelectedProfileTrustScore(profile.trust_score ?? null);
                }}
              >
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <User className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">{profile.display_name}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {profile.niche && <Badge variant="secondary">{profile.niche}</Badge>}
                    {profile.price_range && <span>{profile.price_range}</span>}
                  </div>
                </div>
                {formData.selectedCreatorId === profile.profile_id && (
                  <Check className="h-5 w-5 text-primary" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="space-y-2">
        <Label>Permitir Leilão/Grupo (estilo Meituan)</Label>
        <div className="flex items-center gap-2">
          <Input
            type="checkbox"
            checked={allowAuction}
            onChange={(e) => setAllowAuction(e.currentTarget.checked)}
          />
          <span className="text-sm text-muted-foreground">Para perfis Elite, ativa leilão quando necessário.</span>
        </div>
      </div>

      {/* Seleção de Tier removida */}


      {suggestion && (
        <Card className="bg-muted/30">
          <CardHeader>
            <CardTitle className="text-lg">Preço Sugerido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Categoria:</span>
              <span className="font-medium">{suggestion.category}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Views (24h) estimados:</span>
              <span className="font-medium">{suggestion.avgViews}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Preço por campanha:</span>
              <span className="font-medium text-primary">
                {formatCurrency(suggestion.min)} – {formatCurrency(suggestion.max)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Taxa da Plataforma (18% sobre valor):</span>
              <span className="font-medium">
                {formatCurrency(computePlatformFee(Math.round((suggestion.min + suggestion.max) / 2)))}
              </span>
            </div>
            <div className="grid md:grid-cols-3 gap-2 pt-2">
              <div className="space-y-1">
                <Label>Nicho</Label>
                <Select value={String(nicheMultiplier)} onValueChange={(v) => setNicheMultiplier(Number(v))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar nicho" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Genérico</SelectItem>
                    <SelectItem value="1.15">Tecnologia</SelectItem>
                    <SelectItem value="1.15">Finanças</SelectItem>
                    <SelectItem value="1.1">Moda</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Extra Interativo</Label>
                <Input type="number" min={0} value={interactiveExtra} onChange={(e) => setInteractiveExtra(Number(e.target.value || 0))} />
              </div>
              <div className="space-y-1">
                <Label>Pacotes</Label>
                <Select value={String(packageCount)} onValueChange={(v) => setPackageCount(Number(v))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Quantidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="5">5</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Preço ajustado:</span>
              <span className="font-medium text-primary">
                {(() => {
                  const adj = getAdjustedPriceRange(suggestion.avgViews, { nicheMultiplier, trustScore: selectedProfileTrustScore ?? 0, interactiveExtra, packageCount })
                  return `${formatCurrency(adj.min)} – ${formatCurrency(adj.max)}`
                })()}
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  const adj = getAdjustedPriceRange(suggestion.avgViews, { nicheMultiplier, trustScore: selectedProfileTrustScore ?? 0, interactiveExtra, packageCount })
                  setFormData({ ...formData, budget: adj.min })
                }}
              >
                Usar mínimo
              </Button>
              <Button
                className="bg-gradient-primary"
                onClick={() => {
                  const adj = getAdjustedPriceRange(suggestion.avgViews, { nicheMultiplier, trustScore: selectedProfileTrustScore ?? 0, interactiveExtra, packageCount })
                  setFormData({ ...formData, budget: Math.round((adj.min + adj.max) / 2) })
                }}
              >
                Usar recomendado
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  const adj = getAdjustedPriceRange(suggestion.avgViews, { nicheMultiplier, trustScore: selectedProfileTrustScore ?? 0, interactiveExtra, packageCount })
                  setFormData({ ...formData, budget: adj.max })
                }}
              >
                Usar máximo
              </Button>
            </div>
            <div className="space-y-2 pt-3 border-t">
              <Label>Método de Pagamento</Label>
              <Select value={paymentProvider} onValueChange={(v) => setPaymentProvider(v as "stripe" | "paypal" | "mpesa" | "emola" | "pix" | "mbway" | "multicaixa")}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecione o provedor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stripe">Stripe (Escrow)</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="mpesa">M-Pesa</SelectItem>
                  <SelectItem value="emola">e-Mola (Manual)</SelectItem>
                  <SelectItem value="pix">PIX (Brasil)</SelectItem>
                  <SelectItem value="mbway">MB Way (Portugal)</SelectItem>
                  <SelectItem value="multicaixa">Multicaixa (Angola)</SelectItem>
                </SelectContent>
              </Select>
              {paymentProvider === "mpesa" && (
                <div className="space-y-1">
                  <Label>Telefone M-Pesa</Label>
                  <Input placeholder="+2547XXXXXXXX" value={mpesaPhone} onChange={(e) => setMpesaPhone(e.target.value)} />
                </div>
              )}
              {paymentProvider === "emola" && (
                <div className="space-y-2">
                  <div className="space-y-1">
                    <Label>Telefone e-Mola (opcional)</Label>
                    <Input placeholder="+2588XXXXXXXX" value={emolaPhone} onChange={(e) => setEmolaPhone(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label>Referência</Label>
                    <Input value={emolaReference} onChange={(e) => setEmolaReference(e.target.value)} />
                    <p className="text-xs text-muted-foreground">Usada no pagamento para identificar sua campanha.</p>
                  </div>
                </div>
              )}
              {(paymentProvider === "mbway" || paymentProvider === "multicaixa") && (
                <div className="space-y-1">
                  <Label>Telefone</Label>
                  <Input placeholder="Telefone" value={mpesaPhone} onChange={(e) => setMpesaPhone(e.target.value)} />
                </div>
              )}
              {paymentProvider === "pix" && (
                <div className="space-y-1">
                  <Label>Chave PIX</Label>
                  <Input placeholder="CPF, telefone, e-mail ou chave aleatória" value={pixKey} onChange={(e) => setPixKey(e.target.value)} />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Resumo da Campanha
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Título:</span>
            <span className="font-medium">{formData.title || "-"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Categoria:</span>
            <span className="font-medium">
              {categories.find(c => c.value === formData.category)?.label || "-"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Orçamento:</span>
            <span className="font-medium text-primary">{formatCurrency(formData.budget)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Comissão da Plataforma (18%):</span>
            <span className="font-medium">{formatCurrency(computePlatformFee(formData.budget))}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Valor Líquido para o Vendedor:</span>
            <span className="font-medium">{formatCurrency(Math.max(0, formData.budget - computePlatformFee(formData.budget)))}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Prazo:</span>
            <span className="font-medium">
              {formData.deadline ? formatDate(formData.deadline, "dd/MM/yyyy") : "Sem prazo"}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-6 w-6 text-primary" />
            Criar Nova Campanha
          </CardTitle>
          <CardDescription>
            {step === 1 && "Defina as informações básicas da sua campanha"}
            {step === 2 && "Configure o orçamento e prazo"}
            {step === 3 && "Selecione o criador e revise"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderStepIndicator()}

          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}

          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={() => step > 1 ? setStep(step - 1) : onCancel?.()}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              {step === 1 ? "Cancelar" : "Voltar"}
            </Button>

            {step < totalSteps ? (
              <Button onClick={() => setStep(step + 1)} disabled={!canProceed()}>
                Próximo
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={creating || !canProceed()}>
                {creating ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Criando...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Criar Campanha
                  </div>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Dialog wrapper for easy use
export const CreateCampaignDialog = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">Criar Campanha</DialogTitle>
        </DialogHeader>
        <CreateCampaignForm onCancel={() => setOpen(false)} onSubmit={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
};
