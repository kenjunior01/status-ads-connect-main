import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Zap, Star, Trophy, Crown } from "lucide-react";
import { useLocalizationContext } from "@/contexts/LocalizationContext";
import { getSuggestedPriceRange, getAdjustedPriceRange } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Tier = {
  key: "nano" | "micro" | "mid" | "power" | "elite";
  label: string;
  range: string;
  minViews: number;
  maxViews: number | null;
  icon: React.ComponentType<{ className?: string }>;
};

const TIERS: Tier[] = [
  { key: "nano", label: "Nano-Status", range: "50–200", minViews: 50, maxViews: 200, icon: Sparkles },
  { key: "micro", label: "Micro-Status", range: "201–500", minViews: 201, maxViews: 500, icon: Zap },
  { key: "mid", label: "Mid-Status", range: "501–1500", minViews: 501, maxViews: 1500, icon: Star },
  { key: "power", label: "Power-Status", range: "1501–3000", minViews: 1501, maxViews: 3000, icon: Trophy },
  { key: "elite", label: "Elite-Status", range: "3000+", minViews: 3001, maxViews: null, icon: Crown },
];

export const TierCards = ({ onSelect }: { onSelect?: (tier: Tier) => void }) => {
  const { format } = useLocalizationContext();
  const [viewsSamples, setViewsSamples] = useState<number[]>([]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await supabase
          .from("seller_verifications")
          .select("avg_views, trust_score")
          .order("submitted_at", { ascending: false })
          .limit(300);
        type SV = { avg_views: number | null; trust_score?: number | null };
        const arr = ((data || []) as SV[])
          .map((d) => Number(d.avg_views || 0))
          .filter((v) => v > 0);
        setViewsSamples(arr);
      } catch (e) {
        console.error(e);
      }
    };
    fetch();
  }, []);

  const buckets = useMemo(() => {
    const byBucket: Record<string, number[]> = {
      nano: [], micro: [], mid: [], power: [], elite: []
    };
    for (const v of viewsSamples) {
      if (v <= 200) byBucket.nano.push(v);
      else if (v <= 500) byBucket.micro.push(v);
      else if (v <= 1500) byBucket.mid.push(v);
      else if (v <= 3000) byBucket.power.push(v);
      else byBucket.elite.push(v);
    }
    return byBucket;
  }, [viewsSamples]);

  const priceForTier = (t: Tier) => {
    const values = buckets[t.key];
    const sample = values && values.length ? values[Math.floor(values.length / 2)] : (t.maxViews ?? t.minViews + 500);
    const adj = getAdjustedPriceRange(sample, { trustScore: 80, nicheMultiplier: 1, packageCount: 1, interactiveExtra: 0 });
    return { min: adj.min, max: adj.max };
  };
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {TIERS.map((t) => {
        const price = priceForTier(t);
        const Icon = t.icon;
        return (
          <button
            key={t.key}
            className="group rounded-lg border p-3 text-left transition-transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary bg-card/60 backdrop-blur"
            onClick={() => onSelect?.(t)}
          >
            <Card className="border-0 shadow-none">
              <CardContent className="p-0 space-y-2">
                <div className="flex items-center gap-2">
                  <Icon className="h-5 w-5 text-primary" />
                  <div className="font-semibold">{t.label}</div>
                </div>
                <div className="text-xs text-muted-foreground">{t.range} visualizações</div>
                <div className="text-sm">
                  <span className="font-medium text-primary">{format(price.min)}</span>
                  <span className="mx-1">–</span>
                  <span className="font-medium text-primary">{format(price.max)}</span>
                </div>
                <Badge variant="secondary">Selecionar</Badge>
              </CardContent>
            </Card>
          </button>
        );
      })}
    </div>
  );
}
