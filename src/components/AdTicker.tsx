import { Badge } from "@/components/ui/badge";
import { Megaphone, Star, Percent, Rocket } from "lucide-react";

const items = [
  { icon: Megaphone, text: "Campanhas novas com bônus de ativação" },
  { icon: Star, text: "Top criadores aceitaram propostas hoje" },
  { icon: Percent, text: "Cupom MEITUAN15 válido até 23:59" },
  { icon: Rocket, text: "Entrega rápida garantida em campanhas curtas" },
];

export const AdTicker = () => {
  const truncate = (s: string) => (s.length > 60 ? s.slice(0, 57) + "..." : s);
  return (
    <div className="ad-ticker border-y border-border bg-card/60">
      <div className="ad-ticker-track">
        {[...items, ...items].map((it, idx) => {
          const Icon = it.icon;
          return (
            <span key={idx} className="ad-ticker-item inline-flex items-center gap-2 px-3 py-1">
              <Badge variant="secondary" className="px-2 py-0.5 text-xs">
                <Icon className="h-3 w-3 mr-1" />
                {truncate(it.text)}
              </Badge>
            </span>
          );
        })}
      </div>
    </div>
  );
}
