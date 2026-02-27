import { useEffect, useMemo, useState, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";

type BannerRow = {
  id: string;
  title: string;
  image_url: string;
  status: string;
  created_at: string;
  expires_at?: string | null;
  sponsored_banner_stats?: { impressions: number; clicks: number; updated_at: string }[];
}

export const AdminBannerAnalytics = () => {
  const [rows, setRows] = useState<BannerRow[]>([]);
  const [status, setStatus] = useState<string>("approved");
  const [sortKey, setSortKey] = useState<string>("impressions");
  const [period, setPeriod] = useState<string>("7d");

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("sponsored_banners")
      .select("id,title,image_url,status,created_at,expires_at,sponsored_banner_stats(impressions,clicks,updated_at)")
      .eq("status", status)
      .order("created_at", { ascending: false })
      .limit(200);
    setRows((data || []) as BannerRow[]);
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  const items = useMemo(() => {
    const withStats = rows.map(r => {
      const stats = (r.sponsored_banner_stats || [])[0];
      return { ...r, impressions: stats?.impressions || 0, clicks: stats?.clicks || 0 };
    });
    return withStats.sort((a, b) => {
      if (sortKey === "impressions") return (b.impressions || 0) - (a.impressions || 0);
      if (sortKey === "clicks") return (b.clicks || 0) - (a.clicks || 0);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [rows, sortKey]);

  const topChartData = useMemo(() => {
    const top = [...items].slice(0, 10);
    return top.map(it => ({
      name: (it.title || "").slice(0, 18),
      Impressões: it.impressions || 0,
      Cliques: it.clicks || 0,
    }));
  }, [items]);

  const [series, setSeries] = useState<Array<{ date: string; impressions: number; clicks: number }>>([]);

  const loadSeries = useCallback(async () => {
    const ids = items.map(i => i.id);
    if (!ids.length) {
      setSeries([]);
      return;
    }
    const since = (() => {
      const now = new Date();
      if (period === "30d") return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    })().toISOString();
    const { data } = await supabase
      .from("sponsored_banner_events")
      .select("banner_id,type,created_at")
      .in("banner_id", ids)
      .gte("created_at", since);
    const arr = (data || []) as Array<{ banner_id: string; type: string; created_at: string }>;
    const buckets = new Map<string, { impressions: number; clicks: number }>();
    for (const e of arr) {
      const d = e.created_at.slice(0, 10);
      const b = buckets.get(d) || { impressions: 0, clicks: 0 };
      if (e.type === "impression") b.impressions += 1;
      if (e.type === "click") b.clicks += 1;
      buckets.set(d, b);
    }
    const days = Array.from(buckets.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([date, v]) => ({ date, impressions: v.impressions, clicks: v.clicks }));
    setSeries(days);
  }, [items, period]);

  useEffect(() => {
    loadSeries();
  }, [loadSeries]);

  const exportSeriesCSV = () => {
    const header = [["Data","Impressões","Cliques"]];
    const rows = series.map(s => [s.date, String(s.impressions), String(s.clicks)]);
    const csv = [...header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `banner_analytics_series_${period}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    const header = [["ID","Título","Status","Impressões","Cliques","Criado","Expira"]];
    const rows = items.map(it => [
      it.id,
      it.title,
      it.status,
      String(it.impressions || 0),
      String(it.clicks || 0),
      new Date(it.created_at).toISOString(),
      it.expires_at ? new Date(it.expires_at).toISOString() : "-"
    ]);
    const csv = [...header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `banner_analytics_${status}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Banner Analytics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="w-[200px]">
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="approved">Aprovados</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="rejected">Rejeitados</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-[200px]">
              <Select value={sortKey} onValueChange={setSortKey}>
                <SelectTrigger><SelectValue placeholder="Ordenar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="impressions">Impressões</SelectItem>
                  <SelectItem value="clicks">Cliques</SelectItem>
                  <SelectItem value="created">Criado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={load}>Atualizar</Button>
            <Button variant="outline" onClick={exportCSV}>Exportar CSV</Button>
          </div>
          
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Top 10 por impressões/cliques</div>
            <ChartContainer
              config={{
                Impressões: { label: "Impressões", color: "hsl(var(--primary))" },
                Cliques: { label: "Cliques", color: "hsl(var(--success))" },
              }}
              className="w-full"
            >
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={topChartData}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="Impressões" fill="var(--color-Impressões)" />
                  <Bar dataKey="Cliques" fill="var(--color-Cliques)" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-[200px]">
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger><SelectValue placeholder="Período" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">7 dias</SelectItem>
                    <SelectItem value="30d">30 dias</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" onClick={exportSeriesCSV}>Exportar série CSV</Button>
            </div>
            <ChartContainer
              config={{
                impressions: { label: "Impressões", color: "hsl(var(--primary))" },
                clicks: { label: "Cliques", color: "hsl(var(--success))" },
              }}
              className="w-full"
            >
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={series}>
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="impressions" fill="var(--color-impressions)" />
                  <Bar dataKey="clicks" fill="var(--color-clicks)" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>

          <div className="grid md:grid-cols-3 gap-3">
            {items.map(it => (
              <div key={it.id} className="border rounded p-2">
                <img src={it.image_url} alt={it.title} loading="lazy" decoding="async" className="w-full h-40 object-cover rounded" />
                <div className="mt-2 text-sm line-clamp-2">{it.title}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Impressões: <span className="font-semibold">{it.impressions}</span> · Cliques: <span className="font-semibold">{it.clicks}</span>
                </div>
                <div className="text-[11px] text-muted-foreground">Criado: {new Date(it.created_at).toLocaleString()}</div>
                <div className="text-[11px] text-muted-foreground">Expira: {it.expires_at ? new Date(it.expires_at).toLocaleString() : "-"}</div>
              </div>
            ))}
            {items.length === 0 && (
              <div className="text-muted-foreground">Sem banners para o filtro atual.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
