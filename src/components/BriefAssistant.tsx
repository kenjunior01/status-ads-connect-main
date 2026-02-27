import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type Brief = { title: string; description: string; hashtags: string[]; cta: string };

const buildBrief = (category?: string, base?: string): Brief => {
  const c = (category || "").toLowerCase();
  const seed = (base || "").trim();
  const lib: Record<string, Brief> = {
    product: {
      title: "Experimente agora: qualidade que impressiona",
      description: "Apresente o produto com um benefício claro e mostre como ele resolve uma dor real do público. Use prova social ou dados quando possível.",
      hashtags: ["#Promo", "#Qualidade", "#NovoNoStatus"],
      cta: "Peça já pelo link do anúncio",
    },
    service: {
      title: "Serviço confiável e rápido no seu dia a dia",
      description: "Explique rapidamente o que o serviço faz, o tempo de entrega e o diferencial. Mostre o antes/depois em uma frase.",
      hashtags: ["#Serviço", "#Profissional", "#Confiável"],
      cta: "Fale agora pelo WhatsApp",
    },
    brand: {
      title: "Conheça a marca que é a cara do seu estilo",
      description: "Conte a história resumida da marca e seu propósito. Traga um valor (ex.: sustentável, local, artesanal).",
      hashtags: ["#Marca", "#Estilo", "#Descubra"],
      cta: "Siga e acompanhe as novidades",
    },
    event: {
      title: "Últimos lugares: não perca esse evento",
      description: "Destaque data, local e um atrativo (convidado, promoção). Gere urgência com vaga limitada.",
      hashtags: ["#Evento", "#Ingressos", "#Agenda"],
      cta: "Garanta sua vaga",
    },
    app: {
      title: "Baixe agora e desbloqueie benefícios exclusivos",
      description: "Explique o principal ganho do app em 1 frase. Se possível, destaque recurso que só ele tem.",
      hashtags: ["#App", "#Download", "#Tecnologia"],
      cta: "Baixe pelo link do anúncio",
    },
  };
  const baseBrief = c.includes("product") ? lib.product
    : c.includes("service") ? lib.service
    : c.includes("event") ? lib.event
    : c.includes("app") ? lib.app
    : lib.brand;

  if (!seed) return baseBrief;
  return {
    ...baseBrief,
    title: seed.length > 8 ? seed : baseBrief.title,
    description: `${baseBrief.description} ${seed.length > 8 ? "" : seed}`.trim(),
  };
};

export const BriefAssistant = ({ category, seed, onApply }: { category?: string; seed?: string; onApply: (b: Brief) => void }) => {
  const [open, setOpen] = useState(false);
  const [base, setBase] = useState(seed || "");
  const brief = useMemo(() => buildBrief(category, base), [category, base]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="gap-2">
          <Sparkles className="h-4 w-4" />
          Sugerir com IA
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Brief/Criativos sugeridos</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Ponto de partida (opcional)</div>
            <Input value={base} onChange={(e) => setBase(e.target.value)} placeholder="Ex.: lançamento de serum vegano" />
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Título sugerido</div>
            <Input value={brief.title} readOnly />
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Descrição sugerida</div>
            <Textarea value={brief.description} readOnly rows={3} />
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Hashtags</div>
            <div className="flex gap-2 flex-wrap">
              {brief.hashtags.map((h) => <Badge key={h} variant="secondary" className="text-xs">#{h.replace(/^#/, "")}</Badge>)}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">CTA</div>
            <Input value={brief.cta} readOnly />
          </div>
          <div className="flex justify-end">
            <Button
              onClick={() => { onApply(brief); setOpen(false); }}
              className={cn("bg-gradient-primary")}
            >
              Aplicar no Formulário
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
