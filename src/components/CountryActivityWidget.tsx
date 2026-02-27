import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useProfiles } from "@/hooks/useProfiles";

export const CountryActivityWidget = () => {
  const { profiles, loading } = useProfiles();

  const data = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of profiles) {
      const key = (p.country_code || "??").toUpperCase();
      counts[key] = (counts[key] || 0) + 1;
    }
    const items = Object.entries(counts).map(([code, count]) => ({ code, count }));
    items.sort((a, b) => b.count - a.count);
    return items.slice(0, 10);
  }, [profiles]);

  const max = data.reduce((m, it) => Math.max(m, it.count), 0) || 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Atividade por País</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {loading ? (
          <div className="text-sm text-muted-foreground">Carregando...</div>
        ) : data.length === 0 ? (
          <div className="text-sm text-muted-foreground">Sem dados no momento.</div>
        ) : (
          <div className="space-y-2">
            {data.map((row) => {
              const pct = Math.round((row.count / max) * 100);
              return (
                <div key={row.code} className="flex items-center gap-2">
                  <div className="w-12 text-xs text-muted-foreground">{row.code}</div>
                  <div className={cn("flex-1 h-2 rounded-full bg-muted")}>
                    <div className="h-2 rounded-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="w-10 text-right text-xs">{row.count}</div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
