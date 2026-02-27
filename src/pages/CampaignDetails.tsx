import { useMemo, useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MiniBarChart, MiniLineChart } from "@/components/MiniCharts";
import { useCampaigns, type Campaign } from "@/hooks/useCampaigns";
import { VerificationBadge } from "@/components/VerificationBadge";
import { Sparkles, Target, CalendarDays, DollarSign, MousePointerClick, Eye } from "lucide-react";
import { useLocalizationContext } from "@/contexts/LocalizationContext";
import { Button as ShadButton } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";

export const CampaignDetails = () => {
  const { id } = useParams();
  const { campaigns } = useCampaigns();
  const { format } = useLocalizationContext();
  const campaign: Campaign | undefined = useMemo(() => campaigns.find(c => c.id === id), [campaigns, id]);
  const [eventFilter, setEventFilter] = useState<string>("todos");
  useEffect(() => {
    if (campaign?.title) {
      document.title = `StatusAds • ${campaign.title}`;
    }
  }, [campaign?.title]);

  if (!campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="text-muted-foreground">Campanha não encontrada</div>
        </div>
      </div>
    );
  }

  const week = ["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"];
  const impressions = week.map((n,i)=>({ name:n, v: Math.round((campaign.reach ?? 500) * (0.7 + i*0.05)) }));
  const spend = week.map((n,i)=>({ name:n, g: Math.round((campaign.spent ?? campaign.price) * (0.6 + i*0.06)) }));
  const reach = Number(campaign.reach ?? 0);
  const clicks = Number(campaign.total_clicks ?? 0);
  const ctr = reach > 0 ? ((clicks / reach) * 100).toFixed(2) : "0.00";
  const cpv = reach > 0 ? (campaign.price / reach) : null;
  const events = [
    { label: "Criada", when: campaign.created_at ? new Date(campaign.created_at).toLocaleString("pt-BR") : "-", type: "sistema" },
    { label: "Prazo de Prova", when: campaign.proof_deadline ? new Date(campaign.proof_deadline).toLocaleString("pt-BR") : "-", type: "verificação" },
    { label: "Concluída", when: campaign.completed_at ? new Date(campaign.completed_at).toLocaleString("pt-BR") : "-", type: "sistema" },
  ];
  const filteredEvents = events.filter(ev => eventFilter === "todos" ? true : ev.type === eventFilter);

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            {campaign.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={campaign.status === "active" ? "default" : campaign.status === "completed" ? "secondary" : "outline"}>
              {campaign.status === "active" ? "Ativa" : campaign.status === "completed" ? "Concluída" : campaign.status === "pending" ? "Pendente" : "Cancelada"}
            </Badge>
            <VerificationBadge status={campaign.verification_status} />
            <Badge className="bg-success/10 text-success flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              {format(campaign.price)}
            </Badge>
            {campaign.reach ? (
              <Badge className="bg-primary/10 text-primary flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {Number(campaign.reach).toLocaleString("pt-BR")} views
              </Badge>
            ) : null}
            {campaign.total_clicks ? (
              <Badge className="bg-warning/10 text-warning flex items-center gap-1">
                <MousePointerClick className="h-3 w-3" />
                {Number(campaign.total_clicks).toLocaleString("pt-BR")} cliques
              </Badge>
            ) : null}
          </div>
          <div className="text-muted-foreground">{campaign.description}</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground">CTR</div>
                <div className="text-xl font-semibold text-primary">{ctr}%</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground">CPV</div>
                <div className="text-xl font-semibold text-success">{cpv !== null ? format(cpv) : "-"}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground">Views</div>
                <div className="text-xl font-semibold">{reach.toLocaleString("pt-BR")}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground">Cliques</div>
                <div className="text-xl font-semibold">{clicks.toLocaleString("pt-BR")}</div>
              </CardContent>
            </Card>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <MiniBarChart data={impressions} dataKey="v" />
            <MiniLineChart data={spend} dataKey="g" />
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            <div className="md:col-span-3 flex items-center justify-between">
              <div className="text-sm font-medium">Linha do Tempo</div>
              <div className="flex items-center gap-2">
                <Select value={eventFilter} onValueChange={setEventFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filtrar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="sistema">Sistema</SelectItem>
                    <SelectItem value="verificação">Verificação</SelectItem>
                  </SelectContent>
                </Select>
                <ShadButton
                  variant="outline"
                  onClick={() => {
                    const rows = filteredEvents.map(ev => [ev.label, ev.when, ev.type]);
                    const header = [["Evento","Quando","Tipo"]];
                    const csv = [...header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
                    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `eventos_${campaign.id}.csv`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  Exportar eventos
                </ShadButton>
                <ShadButton
                  variant="outline"
                  onClick={async () => {
                    const text = JSON.stringify(filteredEvents, null, 2);
                    try {
                      await navigator.clipboard.writeText(text);
                    } catch {
                      window.prompt("Copie eventos JSON:", text);
                    }
                  }}
                >
                  Copiar JSON
                </ShadButton>
              </div>
            </div>
            {filteredEvents.map((ev, idx) => (
              <Card key={idx}>
                <CardContent className="p-4">
                  <div className="text-xs text-muted-foreground">{ev.label}</div>
                  <div className="text-sm font-medium">{ev.when}</div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs text-muted-foreground">Exportar/Compartilhar</div>
            <div className="flex items-center gap-2">
              <ShadButton
                variant="outline"
                onClick={() => {
                  const rows = [
                    ["Título", campaign.title],
                    ["Status", String(campaign.status ?? "")],
                    ["Preço", String(campaign.price)],
                    ["Views", String(reach)],
                    ["Cliques", String(clicks)],
                    ["CTR", `${ctr}%`],
                    ["CPV", cpv !== null ? String(cpv) : "-"],
                  ];
                  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
                  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `relatorio_${campaign.id}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                Exportar CSV
              </ShadButton>
              <ShadButton
                variant="outline"
                onClick={async () => {
                  const payload = {
                    id: campaign.id,
                    title: campaign.title,
                    status: campaign.status,
                    price: campaign.price,
                    reach,
                    clicks,
                    ctr,
                    cpv,
                    events,
                  };
                  const text = JSON.stringify(payload, null, 2);
                  try {
                    await navigator.clipboard.writeText(text);
                  } catch {
                    window.prompt("Copie o resumo JSON:", text);
                  }
                }}
              >
                Copiar JSON
              </ShadButton>
              <ShadButton
                className="bg-gradient-primary"
                onClick={async () => {
                  const summary = `Resumo de Campanha\n\nTítulo: ${campaign.title}\nStatus: ${campaign.status}\nPreço: ${format(campaign.price)}\nViews: ${reach.toLocaleString("pt-BR")}\nCliques: ${clicks.toLocaleString("pt-BR")}\nCTR: ${ctr}%\nCPV: ${cpv !== null ? format(cpv) : "-"}`;
                  try {
                    await navigator.clipboard.writeText(summary);
                  } catch {
                    window.prompt("Copie para compartilhar:", summary);
                  }
                }}
              >
                Compartilhar Resumo
              </ShadButton>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline">
              <CalendarDays className="h-4 w-4 mr-2" />
              Agendar Repost
            </Button>
            <Button className="bg-gradient-primary">
              <Sparkles className="h-4 w-4 mr-2" />
              Otimizar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
