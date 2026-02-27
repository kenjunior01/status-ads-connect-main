import { useEffect, useMemo, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PremiumCreatorCard } from "@/components/PremiumCreatorCard";
import { SponsoredBannerCard } from "@/components/SponsoredBannerCard";
import { supabase } from "@/integrations/supabase/client";
import { useProfiles } from "@/hooks/useProfiles";
import { Flame } from "lucide-react";

const nextSlot = () => {
  const now = new Date();
  const next = new Date(now);
  next.setMinutes(0, 0, 0);
  next.setHours(now.getMinutes() > 0 ? now.getHours() + 1 : now.getHours());
  return next;
};

export const HotDeals = () => {
  const { profiles } = useProfiles();
  const [end, setEnd] = useState<Date>(nextSlot());
  const [now, setNow] = useState<Date>(new Date());
  const [banners, setBanners] = useState<Array<{ id: string; title: string; image_url: string; link?: string | null; pricing_tier?: string | null }>>([]);
  const [tiers, setTiers] = useState<Array<{ id: string; price: number }>>([]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (now >= end) setEnd(nextSlot());
  }, [now, end]);

  useEffect(() => {
    const loadBanners = async () => {
      const { data } = await supabase
        .from("sponsored_banners")
        .select("id,title,image_url,link,expires_at,status,pricing_tier")
        .eq("status", "approved")
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(8);
      const arr = (data || []) as Array<{ id: string; title: string; image_url: string; link?: string | null; pricing_tier?: string | null }>;
      setBanners(arr.map(b => ({ id: b.id, title: b.title, image_url: b.image_url, link: b.link, pricing_tier: b.pricing_tier || null })));
      try {
        await Promise.all(arr.map(b => fetch("/functions/v1/banner-track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ banner_id: b.id, type: "impression" })
        })));
      } catch { /* noop */ }
    };
    const loadTiers = async () => {
      const { data } = await supabase.from("ad_pricing").select("id,price").eq("active", true);
      setTiers(((data || []) as Array<{ id: string; price: number }>));
    };
    loadBanners();
    loadTiers();
  }, []);

  const remaining = Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000));
  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  const hot = useMemo(() => {
    return profiles
      .filter((p) => p.rating >= 4.5 && (p.total_reviews ?? 0) >= 3)
      .slice(0, 4);
  }, [profiles]);

  const tierPrice = useCallback((id?: string | null): number => {
    if (!id) return 0;
    const t = tiers.find(x => x.id === id);
    return t?.price || 0;
  }, [tiers]);

  const sortedBanners = useMemo(() => {
    return [...banners].sort((a, b) => tierPrice(b.pricing_tier) - tierPrice(a.pricing_tier));
  }, [banners, tierPrice]);

  if (!hot.length && !sortedBanners.length) return null;

  return (
    <section className="py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-primary" />
              <CardTitle>Ofertas Relâmpago</CardTitle>
            </div>
            <div className="text-sm font-mono bg-muted px-2 py-1 rounded">
              {mm}:{ss}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {sortedBanners.map((b, idx) => (
                <SponsoredBannerCard key={b.id} id={b.id} title={b.title} image_url={b.image_url} link={b.link || undefined} featured={idx < 2 && tierPrice(b.pricing_tier) > 0} />
              ))}
              {hot.map((p) => (
                <PremiumCreatorCard key={p.id} profile={p} variant="compact" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
