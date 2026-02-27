import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Dispute {
  id: string;
  campaign_id: string;
  opened_by: string;
  reason: string;
  description: string | null;
  status: string | null;
  created_at: string | null;
}

export const AdminDisputes = () => {
  const { toast } = useToast();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("open");
  const [search, setSearch] = useState("");

  const fetchDisputes = useCallback(async () => {
    const { data, error } = await supabase
      .from("disputes")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Erro", description: "Falha ao carregar disputas", variant: "destructive" });
      return;
    }
    setDisputes(data || []);
  }, [toast]);

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  const resolveDispute = async (d: Dispute) => {
    try {
      const percentMatch = String(d.description || "").match(/refund:(\d+)%/i);
      const refundPercent = percentMatch ? parseInt(percentMatch[1], 10) : 0;
      const { error } = await supabase.rpc("process_dispute_resolution", {
        _dispute_id: d.id,
        _resolution: d.reason,
        _refund_percent: refundPercent || 0,
      });
      if (error) throw error;
      toast({ title: "Disputa resolvida", description: "Reembolso e penalidades aplicados." });
      fetchDisputes();
    } catch {
      toast({ title: "Erro ao resolver disputa", description: "Tente novamente.", variant: "destructive" });
    }
  };

  const filtered = disputes.filter((d) => {
    if (filterStatus && d.status !== filterStatus) return false;
    if (search && !String(d.description || "").toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="open">Abertas</SelectItem>
            <SelectItem value="under_review">Em revisão</SelectItem>
            <SelectItem value="resolved">Resolvidas</SelectItem>
          </SelectContent>
        </Select>
        <Input
          placeholder="Pesquisar descrição/motivo"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
      </div>
      <div className="space-y-2">
        {filtered.map((d) => (
          <Card key={d.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{d.reason}</Badge>
                  <Badge variant={d.status === "open" ? "destructive" : d.status === "resolved" ? "default" : "secondary"}>
                    {d.status}
                  </Badge>
                </div>
                {d.description && <div className="text-sm text-muted-foreground">{d.description}</div>}
                <div className="text-xs text-muted-foreground">
                  Criada em {new Date(d.created_at).toLocaleString("pt-BR")}
                </div>
              </div>
              <div className="flex gap-2">
                {d.status === "open" && (
                  <Button onClick={() => resolveDispute(d)}>Resolver</Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <div className="text-sm text-muted-foreground">Nenhuma disputa encontrada.</div>
        )}
      </div>
    </div>
  );
};
