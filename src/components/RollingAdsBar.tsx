import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Banner = { id: string; title: string; image_url: string; link?: string | null; status: string; expires_at?: string | null; pricing_tier?: string | null };

export const RollingAdsBar = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [pricingMap, setPricingMap] = useState<Record<string, { name: string; policy: string | null }> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const nowIso = new Date().toISOString();
      const { data } = await supabase
        .from("sponsored_banners")
        .select("id,title,image_url,link,status,expires_at,pricing_tier")
        .eq("status", "approved")
        .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
        .order("created_at", { ascending: false })
        .limit(30);
      const arr = (data || []) as Banner[];
      setBanners(arr);
      const ids = Array.from(new Set(arr.map(b => b.pricing_tier).filter(Boolean) as string[]));
      if (ids.length) {
        const { data: tiers } = await supabase.from("ad_pricing").select("id,name,policy").in("id", ids);
        const map: Record<string, { name: string; policy: string | null }> = {};
        for (const t of (tiers || []) as Array<{ id: string; name: string; policy: string | null }>) {
          map[t.id] = { name: t.name, policy: t.policy };
        }
        setPricingMap(map);
      } else {
        setPricingMap({});
      }
      setLoading(false);
    };
    load();
  }, []);

  const items = useMemo(() => {
    const fallback = [
      { id: "f1", title: "Anuncie aqui para alcançar 10K+ visualizações/dia", image_url: "/placeholder.svg", link: null, status: "approved" },
      { id: "f2", title: "Bônus para primeiras campanhas ativas hoje", image_url: "/placeholder.svg", link: null, status: "approved" },
      { id: "f3", title: "Criadores verificados disponíveis agora", image_url: "/placeholder.svg", link: null, status: "approved" },
    ] as Banner[];
    const arr = banners.length ? banners : fallback;
    if (pricingMap) {
      const roll = arr.filter(b => {
        const pid = b.pricing_tier || "";
        const tier = pricingMap[pid];
        if (!tier) return false;
        const n = (tier.name || "").toLowerCase();
        const p = (tier.policy || "").toLowerCase();
        return n.includes("roll") || n.includes("ticker") || p.includes("roll") || p.includes("ticker");
      });
      if (roll.length) return roll.slice(0, 20);
    }
    return arr.slice(0, 20);
  }, [banners, pricingMap]);

  const rows = useMemo(() => {
    const r: Banner[][] = [[], []];
    items.forEach((it, idx) => r[idx % 2].push(it));
    return r.map((x) => [...x, ...x]);
  }, [items]);

  return (
    <div className="border-y border-border bg-card">
      <div className="max-w-7xl mx-auto px-0 md:px-4 py-3 space-y-3">
        {rows.map((row, ri) => (
          <div key={ri} className="rollx-viewport overflow-hidden">
            <div className={cn("rollx-track", ri % 2 === 0 ? "rollx-fast" : "rollx-slow", ri % 2 === 1 ? "rollx-reverse" : "")}>
              {row.map((b, i) => {
                const content = (
                  <Card key={`${b.id}-${i}`} className="mr-3 hover:shadow-medium transition-shadow">
                    <CardContent className="px-3 py-2 flex items-center gap-2">
                      <img
                        src={b.image_url}
                        alt={b.title}
                        loading="lazy"
                        decoding="async"
                        className="w-14 h-10 rounded object-cover border"
                      />
                      <div className="min-w-0">
                        <div className="text-xs md:text-sm font-medium truncate max-w-[180px] md:max-w-[260px]">{b.title}</div>
                        <Badge className="mt-0.5 px-1.5 py-0 text-[10px] bg-primary/10 text-primary border-0">Patrocinado</Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
                return b.link ? (
                  <a key={`${b.id}-a-${i}`} href={b.link} target="_blank" rel="noopener noreferrer">
                    {content}
                  </a>
                ) : (
                  content
                );
              })}
              <a href="/ads/sponsor?placement=roll" className="mr-3">
                <Card className="hover:shadow-medium transition-shadow">
                  <CardContent className="px-3 py-2 flex items-center gap-2">
                    <div className="w-14 h-10 rounded border bg-muted flex items-center justify-center text-xs font-semibold">+</div>
                    <div className="min-w-0">
                      <div className="text-xs md:text-sm font-medium truncate max-w-[180px] md:max-w-[260px]">Anuncie aqui</div>
                      <Badge className="mt-0.5 px-1.5 py-0 text-[10px] bg-success/10 text-success border-0">Pagar agora</Badge>
                    </div>
                  </CardContent>
                </Card>
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
