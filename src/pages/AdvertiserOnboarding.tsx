import { useState, useMemo } from "react";
import { useLocalization } from "@/hooks/useLocalization";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Shield, Globe, CreditCard, CheckCircle2, ArrowRight, Loader2 } from "lucide-react";

export const AdvertiserOnboarding = () => {
  const { toast } = useToast();
  const { currency, setCurrency, countries, currencies, convert, format, getCurrentCountry } = useLocalization();
  const [step, setStep] = useState(1);
  const [companyName, setCompanyName] = useState("");
  const [domain, setDomain] = useState("");
  const [waLink, setWaLink] = useState("");
  const [countryCode, setCountryCode] = useState<string>(getCurrentCountry()?.code || "US");
  const [monthlyBudget, setMonthlyBudget] = useState<number | "">("");
  const [submitting, setSubmitting] = useState(false);

  const domainValid = useMemo(() => {
    if (!domain.trim()) return false;
    const urlPattern = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;
    return urlPattern.test(domain.trim());
  }, [domain]);

  const waValid = useMemo(() => {
    if (!waLink.trim()) return false;
    return /^https?:\/\/wa\.me\/\d+$/i.test(waLink.trim()) || /^\+\d{8,16}$/.test(waLink.trim());
  }, [waLink]);

  const budgetUSD = useMemo(() => {
    if (typeof monthlyBudget !== "number" || !monthlyBudget) return 0;
    return Math.round(convert(monthlyBudget, currency, "USD"));
  }, [monthlyBudget, currency, convert]);

  const suggestedTier = useMemo(() => {
    if (budgetUSD >= 10000) return "Enterprise";
    if (budgetUSD >= 3000) return "Growth";
    if (budgetUSD >= 1000) return "Starter";
    return "Basic";
  }, [budgetUSD]);

  const handleNext = () => {
    if (step === 1) {
      if (!companyName.trim() || !domainValid) {
        toast({ title: "Complete os dados", description: "Informe empresa e domínio válido.", variant: "destructive" });
        return;
      }
      setStep(2);
      return;
    }
    if (step === 2) {
      if (!waValid) {
        toast({ title: "WhatsApp inválido", description: "Informe link wa.me ou número com DDI.", variant: "destructive" });
        return;
      }
      setStep(3);
      return;
    }
    if (step === 3) {
      if (typeof monthlyBudget !== "number" || monthlyBudget <= 0) {
        toast({ title: "Orçamento inválido", description: "Defina um orçamento mensal.", variant: "destructive" });
        return;
      }
      setStep(4);
      return;
    }
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      toast({ title: "Onboarding enviado", description: "Configuração de anunciante iniciada." });
      if (navigator && "vibrate" in navigator) {
        navigator.vibrate([10, 15, 10]);
      }
      setStep(5);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Badge className="bg-primary/10 text-primary border-0">Global</Badge>
            <Badge className="bg-success/10 text-success border-0">Pagamentos Seguros</Badge>
            <Badge className="bg-accent/10 text-accent border-0">Multi‑Moeda</Badge>
          </div>
          <CardTitle className="type-h2">Onboarding de Anunciante</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-2">
            <Progress value={step * 20} />
            <span className="text-xs text-muted-foreground">Etapa {step} de 5</span>
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <span className="text-sm">Empresa e Domínio</span>
              </div>
              <Input placeholder="Nome da empresa" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
              <Input placeholder="Domínio (ex.: exemplo.com)" value={domain} onChange={(e) => setDomain(e.target.value)} className={domainValid ? "field-success" : ""} />
              <div className="text-xs text-muted-foreground">Validamos seu domínio para credibilidade e melhores campanhas.</div>
              <Button onClick={handleNext} className="gap-2">
                Continuar
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span className="text-sm">WhatsApp Business</span>
              </div>
              <Input placeholder="Link wa.me ou número com DDI" value={waLink} onChange={(e) => setWaLink(e.target.value)} className={waValid ? "field-success" : ""} />
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">País</span>
                <Select value={countryCode} onValueChange={setCountryCode}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="País" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map(c => (
                      <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleNext} className="gap-2">
                Continuar
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                <span className="text-sm">Orçamento e Moeda</span>
              </div>
              <div className="flex items-center gap-2">
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Moeda" />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map(c => (
                      <SelectItem key={c.code} value={c.code}>{c.code} {c.symbol}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  placeholder="Orçamento mensal"
                  value={monthlyBudget === "" ? "" : monthlyBudget}
                  onChange={(e) => setMonthlyBudget(e.target.value ? Number(e.target.value) : "")}
                />
              </div>
              <div className="text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Equivalente USD</span>
                  <span className="font-semibold">{format(convert(typeof monthlyBudget === "number" ? monthlyBudget : 0, currency, currency))} • ~${budgetUSD}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Plano sugerido</span>
                  <Badge variant="outline">{suggestedTier}</Badge>
                </div>
              </div>
              <Button onClick={handleNext} className="gap-2">
                Continuar
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span className="text-sm">Confirmação</span>
              </div>
              <div className="text-sm text-muted-foreground">
                Empresa: {companyName} • Domínio: {domain} • País: {countryCode} • Moeda: {currency} • Orçamento: {typeof monthlyBudget === "number" ? format(monthlyBudget) : format(0)}
              </div>
              <Button onClick={submit} disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Concluir Onboarding"}
              </Button>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <span className="text-sm">Configuração concluída</span>
              </div>
              <div className="text-sm text-muted-foreground">Você pode começar a criar campanhas agora.</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
