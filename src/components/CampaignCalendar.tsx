import { useEffect, useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Bell, Clock, PauseCircle } from "lucide-react";
import { useCampaigns } from "@/hooks/useCampaigns";
import { useToast } from "@/hooks/use-toast";
import { useLocalizationContext } from "@/contexts/LocalizationContext";
import { supabase } from "@/integrations/supabase/client";

type CalendarEvent = {
  id: string;
  title: string;
  date: string;
  reminderMinutes: number;
};

const SZN = [
  { key: "valentines", label: "Dia dos Namorados", month: 2, day: 14 },
  { key: "blackfriday", label: "Black Friday", month: 11, day: 29 },
  { key: "christmas", label: "Natal", month: 12, day: 25 },
];

export const CampaignCalendar = () => {
  const { campaigns } = useCampaigns();
  const { toast } = useToast();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [vacation, setVacation] = useState<boolean>(() => {
    try { return JSON.parse(localStorage.getItem("statusads_vacation") || "false"); } catch { return false; }
  });

  const upcoming = useMemo(() => {
    const list: CalendarEvent[] = [];
    for (const c of campaigns) {
      if (c.status === "active" || c.status === "pending") {
        const date = c.created_at || new Date().toISOString();
        list.push({ id: c.id, title: c.title, date, reminderMinutes: 30 });
      }
    }
    return list;
  }, [campaigns]);

  useEffect(() => {
    setEvents(upcoming);
  }, [upcoming]);

  useEffect(() => {
    localStorage.setItem("statusads_vacation", JSON.stringify(vacation));
  }, [vacation]);

  const scheduleReminder = async (e: CalendarEvent) => {
    const when = new Date(new Date(e.date).getTime() - e.reminderMinutes * 60 * 1000);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Faça login", description: "Entre para agendar lembretes.", variant: "destructive" });
        return;
      }
      const { error } = await supabase.from("reminders").insert({
        user_id: user.id,
        title: "Hora de postar",
        description: `Poste: ${e.title}`,
        trigger_at: when.toISOString(),
        type: "campaign_post",
      });
      if (error) throw error;
      toast({ title: "Lembrete agendado", description: `Aviso em ${e.reminderMinutes} min antes da postagem.` });
    } catch {
      toast({ title: "Erro ao agendar", description: "Tente novamente mais tarde.", variant: "destructive" });
    }
  };

  const seasonalAlerts = useMemo(() => {
    const now = new Date();
    const alerts = SZN.map(s => {
      const date = new Date(now.getFullYear(), s.month - 1, s.day);
      const days = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return { ...s, days };
    }).filter(a => a.days > 0 && a.days <= 30);
    return alerts;
  }, []);

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            Calendário de Campanhas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge className="bg-warning/10 text-warning">Sugestões de horários com base em histórico</Badge>
            <Badge variant="secondary">Lembretes configuráveis</Badge>
          </div>
          <div className="space-y-2">
            {events.length === 0 ? (
              <div className="text-muted-foreground">Sem eventos agendados.</div>
            ) : events.map(e => (
              <div key={e.id} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <div className="font-medium">{e.title}</div>
                  <div className="text-xs text-muted-foreground">{new Date(e.date).toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <Select value={String(e.reminderMinutes)} onValueChange={(v) => {
                    setEvents(prev => prev.map(ev => ev.id === e.id ? { ...ev, reminderMinutes: Number(v) } : ev));
                  }}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Lembrete" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 min</SelectItem>
                      <SelectItem value="30">30 min</SelectItem>
                      <SelectItem value="60">1 hora</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={() => scheduleReminder(e)}>
                    <Bell className="h-4 w-4 mr-2" />
                    Agendar
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <div className="font-semibold">Oportunidades sazonais (30 dias)</div>
            {seasonalAlerts.length === 0 ? (
              <div className="text-muted-foreground">Sem alertas sazonais próximos.</div>
            ) : (
              <div className="grid md:grid-cols-3 gap-2">
                {seasonalAlerts.map(a => (
                  <Card key={a.key}>
                    <CardContent className="p-3">
                      <div className="font-medium">{a.label}</div>
                      <div className="text-xs text-muted-foreground">Faltam {a.days} dias</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant={vacation ? "default" : "outline"} onClick={() => setVacation(!vacation)}>
              <PauseCircle className="h-4 w-4 mr-2" />
              {vacation ? "Modo Férias Ativo" : "Ativar Modo Férias"}
            </Button>
            <span className="text-xs text-muted-foreground">Fica indisponível para novas campanhas</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
