import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Upload, CheckCircle2, Phone, Hash, Loader2 } from "lucide-react";
import Tesseract from "tesseract.js";
import * as exifr from "exifr";
import { getAdjustedPriceRange } from "@/lib/utils";

type ScreenshotItem = {
  file: File;
  name: string;
  url?: string;
  views?: number;
  captured_at?: string;
};

const niches = [
  "Tecnologia",
  "Humor",
  "Moda",
  "Educação",
  "Esportes",
  "Negócios",
  "Entretenimento",
  "Culinária",
  "Viagem",
  "Outros",
];

export const SellerOnboarding = () => {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [screenshots, setScreenshots] = useState<ScreenshotItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [niche, setNiche] = useState<string>("");
  const [contactsCount, setContactsCount] = useState<number | "">("");
  const [submitting, setSubmitting] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const sendOtp = async () => {
    if (!phone.trim()) return;
    setSendingOtp(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone });
      if (error) {
        toast({ title: "Falha ao enviar código", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: "Código enviado", description: "Verifique o SMS recebido." });
    } finally {
      setSendingOtp(false);
    }
  };

  const verifyOtp = async () => {
    if (!otp.trim() || !phone.trim()) return;
    setVerifyingOtp(true);
    try {
      const { error } = await supabase.auth.verifyOtp({ phone, token: otp, type: "sms" as const });
      if (error) {
        toast({ title: "Código inválido", description: "Tente novamente.", variant: "destructive" });
        return;
      }
      toast({ title: "Telefone verificado", description: "Prosseguir para as capturas de tela." });
      setStep(2);
    } finally {
      setVerifyingOtp(false);
    }
  };

  const onFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const list: ScreenshotItem[] = Array.from(files).map((f) => ({
      file: f,
      name: f.name,
      captured_at: new Date(f.lastModified).toISOString(),
    }));
    const merged = [...screenshots, ...list].slice(0, 5);
    setScreenshots(merged);
  };

  const analyzeScreenshots = async () => {
    try {
      const analyzed = await Promise.all(
        screenshots.map(async (item) => {
          const file = item.file;
          let viewsDetected: number | undefined = undefined;
          let capturedAt = item.captured_at;
          let deviceModel: string | undefined = undefined;
          let editedFlag = false;

          try {
            const ocr = await Tesseract.recognize(file, "por");
            const text = ocr.data.text.toLowerCase();
            const match = text.match(/(\d{1,3}(?:[.,]\d{3})*|\d+)\s*(?:visualiza[cç]ões|views|vistas)/i);
            if (match) {
              const raw = match[1].replace(/\./g, "").replace(",", ".");
              const num = Math.round(Number(raw));
              if (!isNaN(num)) viewsDetected = num;
            } else {
              const genericNum = text.match(/(\d{1,3}(?:[.,]\d{3})*|\d+)/);
              if (genericNum) {
                const raw = genericNum[1].replace(/\./g, "").replace(",", ".");
                const num = Math.round(Number(raw));
                if (!isNaN(num)) viewsDetected = num;
              }
            }
          } catch (e) {
            console.error(e);
          }

          try {
            const meta = await exifr.parse(file, { tiff: true, exif: true });
            if (meta) {
              const dateOriginal = (meta as unknown as { DateTimeOriginal?: string | Date }).DateTimeOriginal;
              if (dateOriginal) {
                capturedAt = new Date(dateOriginal).toISOString();
              }
              const model = (meta as unknown as { Model?: string; Make?: string });
              deviceModel = model.Model || model.Make || undefined;
              const modifyDate = (meta as unknown as { ModifyDate?: string | Date }).ModifyDate ? new Date((meta as unknown as { ModifyDate?: string | Date }).ModifyDate as string | Date).getTime() : null;
              const originalDate = dateOriginal ? new Date(dateOriginal as string | Date).getTime() : null;
              if (modifyDate && originalDate && modifyDate > originalDate + 5 * 60 * 1000) {
                editedFlag = true;
              }
            }
          } catch (e) {
            console.error(e);
          }

          return {
            ...item,
            views: item.views ?? viewsDetected,
            captured_at: capturedAt,
          } as ScreenshotItem;
        })
      );
      setScreenshots(analyzed);
      toast({ title: "Análise concluída", description: "Views detectadas e metadados verificados." });
    } catch {
      toast({ title: "Falha na análise", description: "Preencha manualmente as visualizações.", variant: "destructive" });
    }
  };

  const uploadScreenshots = async () => {
    if (screenshots.length < 3) {
      toast({ title: "Envie 3 a 5 capturas", description: "Selecione ao menos 3 arquivos.", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Não autenticado", description: "Faça login para continuar.", variant: "destructive" });
        setUploading(false);
        return;
      }
      const uploaded: ScreenshotItem[] = [];
      for (const item of screenshots) {
        const ext = item.file.name.split(".").pop();
        const path = `${user.id}/onboarding/${Date.now()}-${Math.random().toString(16).slice(2)}.${ext}`;
        const { data, error } = await supabase.storage.from("onboarding").upload(path, item.file);
        if (error) {
          toast({ title: "Erro no upload", description: error.message, variant: "destructive" });
          continue;
        }
        const { data: signed } = await supabase.storage.from("onboarding").createSignedUrl(data.path, 60 * 60 * 24 * 7);
        uploaded.push({ ...item, url: signed?.signedUrl || undefined });
      }
      setScreenshots(uploaded);
      toast({ title: "Arquivos prontos", description: "Informe as visualizações de cada status." });
      setStep(3);
    } finally {
      setUploading(false);
    }
  };

  const avgViews = () => {
    const values = screenshots.map((s) => Number(s.views || 0)).filter((v) => v > 0);
    if (values.length === 0) return 0;
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  };

  const trustScore = () => {
    const views = screenshots.map((s) => Number(s.views || 0)).filter((v) => v > 0);
    if (views.length === 0) return 0;
    const avg = avgViews();
    const variance = views.reduce((a, v) => a + Math.pow(v - avg, 2), 0) / views.length;
    const consistency = Math.max(0, 100 - Math.sqrt(variance));
    const recency = screenshots.reduce((score, s) => {
      const d = s.captured_at ? new Date(s.captured_at).getTime() : Date.now();
      const days = (Date.now() - d) / (1000 * 60 * 60 * 24);
      const val = days <= 3 ? 100 : days <= 7 ? 85 : days <= 14 ? 70 : 50;
      return score + val;
    }, 0) / screenshots.length;
    const contacts = typeof contactsCount === "number" && contactsCount > 0 ? contactsCount : 0;
    const proportionality = contacts > 0 ? Math.min(100, Math.round((avg / contacts) * 100)) : 50;
    const screenshotsCountSignal = Math.min(100, screenshots.length * 20);
    const minMaxSignal = (() => {
      const min = Math.min(...views);
      const max = Math.max(...views);
      return max > 0 ? Math.min(100, Math.round((min / max) * 100)) : 50;
    })();
    const score = Math.round(
      0.35 * consistency +
      0.25 * recency +
      0.25 * proportionality +
      0.1 * screenshotsCountSignal +
      0.05 * minMaxSignal
    );
    return Math.max(0, Math.min(100, score));
  };

  const submitVerification = async () => {
    if (!niche || avgViews() <= 0) {
      toast({ title: "Complete as informações", description: "Informe nicho e visualizações.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Não autenticado", description: "Faça login para continuar.", variant: "destructive" });
        setSubmitting(false);
        return;
      }
      const payload = {
        user_id: user.id,
        screenshots: screenshots.map((s) => ({
          name: s.name,
          url: s.url,
          views: s.views || 0,
          captured_at: s.captured_at,
        })),
        avg_views: avgViews(),
        niche,
        contacts_count: typeof contactsCount === "number" ? contactsCount : null,
        trust_score: trustScore(),
        status: "pending",
      };
      const { error } = await supabase.from("seller_verifications").insert(payload);
      if (error) {
        toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
        setSubmitting(false);
        return;
      }
      await supabase
        .from("profiles")
        .update({
          primary_niche: niche,
          contacts_count: typeof contactsCount === "number" ? contactsCount : null,
          trust_score: trustScore(),
          price_range: (() => {
            const avg = avgViews();
            const t = trustScore();
            const adj = getAdjustedPriceRange(avg, { trustScore: t, nicheMultiplier: 1, interactiveExtra: 0, packageCount: 1 });
            const minStr = `R$ ${adj.min.toLocaleString('pt-BR')}`;
            const maxStr = `R$ ${adj.max.toLocaleString('pt-BR')}`;
            return `${minStr} - ${maxStr}`;
          })(),
        })
        .eq("user_id", user.id);
      toast({ title: "Verificação enviada", description: "Análise em andamento." });
      setStep(5);
      setShowConfetti(true);
      if (navigator && "vibrate" in navigator) {
        try { navigator.vibrate([20, 30, 20]); } catch (e) { console.error(e); }
      }
      setTimeout(() => setShowConfetti(false), 2000);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      {showConfetti && (
        <div className="confetti-container">
          {Array.from({ length: 28 }).map((_, i) => {
            const colors = [
              "hsl(var(--primary))",
              "hsl(var(--accent))",
              "hsl(var(--success))",
              "hsl(var(--warning))",
            ];
            const color = colors[i % colors.length];
            const left = Math.random() * 100;
            const duration = 2 + Math.random() * 1.5;
            const drift = (Math.random() - 0.5) * 80;
            {
              const style: React.CSSProperties & Record<string, string> = {
                left: `${left}%`,
                background: color,
                transform: `translate3d(0, 0, 0)`,
                ["--duration"]: `${duration}s`,
                ["--drift"]: `${drift}px`,
              };
              return <span key={i} className="confetti-piece" style={style} />;
            }
          })}
        </div>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Registro de Vendedor</CardTitle>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span className="text-sm">Valide seu telefone via SMS</span>
              </div>
              <Input placeholder="Número com DDI, ex: +55XXXXXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} />
              <div className="flex gap-2">
                <Button onClick={sendOtp} disabled={sendingOtp || !phone.trim()}>
                  {sendingOtp ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar Código"}
                </Button>
                <Input placeholder="Código recebido" value={otp} onChange={(e) => setOtp(e.target.value)} className="max-w-[200px]" />
                <Button onClick={verifyOtp} disabled={verifyingOtp || !otp.trim()}>
                  {verifyingOtp ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verificar"}
                </Button>
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                <span className="text-sm">Envie 3 a 5 capturas dos últimos status</span>
              </div>
              <Input type="file" accept="image/*" multiple onChange={(e) => onFilesSelected(e.target.files)} />
              <ScrollArea className="h-32 border rounded p-2">
                <div className="space-y-2">
                  {screenshots.map((s, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="text-sm">{s.name}</span>
                      <span className="text-xs text-muted-foreground">{s.captured_at?.slice(0, 16).replace("T", " ")}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
          <div className="flex gap-2">
            <Button onClick={uploadScreenshots} disabled={uploading || screenshots.length < 3}>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar e Prosseguir"}
            </Button>
            <Button variant="outline" onClick={analyzeScreenshots} disabled={screenshots.length < 3}>
              Detectar Views (OCR)
            </Button>
          </div>
            </div>
          )}
          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                {screenshots.map((s, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    <span className="text-sm flex-1">{s.name}</span>
                    <Input
                      type="number"
                      placeholder="Visualizações"
                      value={s.views ?? ""}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setScreenshots((prev) => prev.map((p, i) => (i === idx ? { ...p, views: v } : p)));
                      }}
                      className="max-w-[150px]"
                    />
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <span className="text-sm">Selecione seu nicho</span>
                <Select value={niche} onValueChange={setNiche}>
                  <SelectTrigger>
                    <SelectValue placeholder="Escolher nicho" />
                  </SelectTrigger>
                  <SelectContent>
                    {niches.map((n) => (
                      <SelectItem key={n} value={n}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <span className="text-sm">Informe o total de contatos</span>
                <Input
                  type="number"
                  placeholder="Ex.: 500"
                  value={contactsCount}
                  onChange={(e) => setContactsCount(e.target.value ? Number(e.target.value) : "")}
                />
              </div>
              <div className="space-y-2">
                <span className="text-sm">Média de visualizações</span>
                <Progress value={Math.min(100, avgViews())} />
                <span className="text-xs text-muted-foreground">{avgViews()} média</span>
              </div>
              <div className="space-y-2">
                <span className="text-sm">Trust Score</span>
                <Progress value={trustScore()} />
                <span className="text-xs text-muted-foreground">{trustScore()} pontos</span>
              </div>
              <Button onClick={() => setStep(4)} disabled={!niche || avgViews() <= 0}>
                Continuar
              </Button>
            </div>
          )}
          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span className="text-sm">Confirme e envie para análise</span>
              </div>
              <div className="text-sm">
                Média: {avgViews()} • Nicho: {niche} • Contatos: {typeof contactsCount === "number" ? contactsCount : 0} • Trust: {trustScore()}
              </div>
              <Button onClick={submitVerification} disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar"}
              </Button>
            </div>
          )}
          {step === 5 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <span className="text-sm">Verificação enviada</span>
              </div>
              <div className="text-sm text-muted-foreground">Você receberá prioridade conforme seu Trust Score.</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
