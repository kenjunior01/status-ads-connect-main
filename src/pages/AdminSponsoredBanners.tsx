import { useEffect, useMemo, useState, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

type Banner = { id: string; title: string; image_url: string; link?: string | null; status: string; expires_at?: string | null; pricing_tier?: string | null; sponsored_banner_stats?: { impressions: number; clicks: number }[] };

export const AdminSponsoredBanners = () => {
  const [items, setItems] = useState<Banner[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("approved");
  const [search, setSearch] = useState<string>("");
  const [pricingMap, setPricingMap] = useState<Record<string, { name: string; policy: string | null }>>({});

  const load = useCallback(async () => {
    let query = supabase.from("sponsored_banners").select("*,sponsored_banner_stats(impressions,clicks)").order("created_at", { ascending: false });
    if (statusFilter !== "ALL") {
      query = query.eq("status", statusFilter);
    }
    if (search) {
      query = query.ilike("title", `%${search}%`);
    }
    const { data } = await query;
    const arr = (data || []) as Banner[];
    setItems(arr);
    const ids = Array.from(new Set(arr.map(a => a.pricing_tier).filter(Boolean) as string[]));
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
  }, [statusFilter, search]);

  useEffect(() => { load(); }, [load]);

  const approve = async (id: string) => {
    await supabase.from("sponsored_banners").update({ status: "approved" }).eq("id", id);
    await load();
  };
  const reject = async (id: string) => {
    await supabase.from("sponsored_banners").update({ status: "rejected" }).eq("id", id);
    await load();
  };

  const exportCSV = () => {
    const header = [["ID","Título","Status","Impressões","Cliques","Expira"]];
    const rows = items.map(b => [
      b.id,
      b.title,
      b.status,
      String(b.sponsored_banner_stats?.[0]?.impressions || 0),
      String(b.sponsored_banner_stats?.[0]?.clicks || 0),
      b.expires_at ? new Date(b.expires_at).toISOString() : "-"
    ]);
    const csv = [...header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `banners_${statusFilter}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalImpressions = useMemo(() => items.reduce((acc, b) => acc + (b.sponsored_banner_stats?.[0]?.impressions || 0), 0), [items]);
  const totalClicks = useMemo(() => items.reduce((acc, b) => acc + (b.sponsored_banner_stats?.[0]?.clicks || 0), 0), [items]);

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gerenciar Banners Patrocinados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-[180px]">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="approved">Aprovados</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="rejected">Rejeitados</SelectItem>
                  <SelectItem value="ALL">Todos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Input
              placeholder="Buscar título..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-[240px]"
            />
            <Button variant="outline" onClick={load}>Atualizar</Button>
            <Button variant="outline" onClick={exportCSV}>Exportar CSV</Button>
            <div className="ml-auto text-xs text-muted-foreground">
              Total: {items.length} · Impressões: {totalImpressions} · Cliques: {totalClicks}
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            {items.map(b => (
              <div key={b.id} className="border rounded p-2">
                <img src={b.image_url} alt={b.title} loading="lazy" decoding="async" className="w-full h-40 object-cover rounded" />
                <div className="mt-2 text-sm">{b.title}</div>
                <div className="text-xs text-muted-foreground">
                  {b.status} · expira {b.expires_at ? new Date(b.expires_at).toLocaleString() : "-"}
                </div>
                <div className="text-[11px] mt-1">
                  {(() => {
                    const p = b.pricing_tier ? pricingMap[b.pricing_tier] : undefined;
                    const label = p ? p.name : "Plano";
                    const isRoll = p ? ((p.name || "").toLowerCase().includes("roll") || (p.name || "").toLowerCase().includes("ticker") || (p.policy || "")?.toLowerCase().includes("roll") || (p.policy || "")?.toLowerCase().includes("ticker")) : false;
                    return <span className={isRoll ? "text-primary" : "text-muted-foreground"}>{label}{isRoll ? " • Roll" : ""}</span>;
                  })()}
                </div>
                <div className="text-xs mt-1">Impressões: {b.sponsored_banner_stats?.[0]?.impressions || 0} · Cliques: {b.sponsored_banner_stats?.[0]?.clicks || 0}</div>
                <div className="flex gap-2 mt-2">
                  <Button size="sm" variant="secondary" onClick={() => approve(b.id)}>Aprovar</Button>
                  <Button size="sm" variant="outline" onClick={() => reject(b.id)}>Rejeitar</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
