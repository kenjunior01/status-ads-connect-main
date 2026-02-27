import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, CheckCircle2, Target, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

type Quest = {
  id: string;
  title: string;
  description: string;
  goal: number;
  unit: "actions" | "hours";
  icon: "trophy" | "target" | "clock";
};

const QUESTS: Quest[] = [
  {
    id: "submit_proof_fast",
    title: "Prova Rápida",
    description: "Enviar prova até 12h após publicação",
    goal: 1,
    unit: "hours",
    icon: "clock",
  },
  {
    id: "campaigns_weekly",
    title: "Foco da Semana",
    description: "Criar 2 campanhas nesta semana",
    goal: 2,
    unit: "actions",
    icon: "target",
  },
  {
    id: "consistency_streak",
    title: "Sequência de Consistência",
    description: "Atividade em 3 dias seguidos",
    goal: 3,
    unit: "actions",
    icon: "trophy",
  },
];

const getIcon = (icon: Quest["icon"], className?: string) => {
  switch (icon) {
    case "trophy": return <Trophy className={cn("h-4 w-4", className)} />;
    case "target": return <Target className={cn("h-4 w-4", className)} />;
    default: return <Clock className={cn("h-4 w-4", className)} />;
  }
};

export const QuestsWidget = () => {
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
      if (!user) {
        try {
          const raw = localStorage.getItem("statusads_quests");
          const data = raw ? JSON.parse(raw) : {};
          setProgress(data.progress || {});
          setCompleted(data.completed || {});
        } catch {
          setProgress({});
          setCompleted({});
        }
        return;
      }
      setLoading(true);
      const { data } = await supabase
        .from("user_quests")
        .select("quest_id, progress, goal, completed")
        .eq("user_id", user.id);
      const nextP: Record<string, number> = {};
      const nextC: Record<string, boolean> = {};
      for (const row of data || []) {
        nextP[row.quest_id] = row.progress ?? 0;
        nextC[row.quest_id] = Boolean(row.completed);
      }
      setProgress(nextP);
      setCompleted(nextC);
      setLoading(false);
    })();
  }, []);

  const save = (nextProgress: Record<string, number>, nextCompleted: Record<string, boolean>) => {
    setProgress(nextProgress);
    setCompleted(nextCompleted);
    if (!userId) {
      localStorage.setItem("statusads_quests", JSON.stringify({ progress: nextProgress, completed: nextCompleted, updated_at: new Date().toISOString() }));
    }
  };

  const computed = useMemo(() => {
    return QUESTS.map(q => {
      const value = Math.min(q.goal, progress[q.id] || 0);
      const pct = Math.round((value / q.goal) * 100);
      const isDone = !!completed[q.id] || value >= q.goal;
      return { ...q, value, pct, isDone };
    });
  }, [progress, completed]);

  const bump = (id: string, amount = 1) => {
    const goal = QUESTS.find(q => q.id === id)?.goal || 1;
    if (userId) {
      supabase.rpc("upsert_user_quest", { _quest_id: id, _inc: amount, _goal: goal }).then(async () => {
        const { data } = await supabase
          .from("user_quests")
          .select("quest_id, progress, goal, completed")
          .eq("user_id", userId)
          .eq("quest_id", id)
          .maybeSingle();
        const next = { ...progress, [id]: Math.min(data?.progress ?? 0, goal) };
        const comp = { ...completed, [id]: Boolean(data?.completed) || (next[id] || 0) >= goal };
        save(next, comp);
      });
    } else {
      const next = { ...progress, [id]: Math.min((progress[id] || 0) + amount, goal) };
      const comp = { ...completed, [id]: (next[id] || 0) >= goal };
      save(next, comp);
    }
  };

  const resetWeek = () => {
    if (userId) {
      // Zera localmente e deixa o servidor sincronizar na próxima interação
      setProgress({});
      setCompleted({});
    } else {
      save({}, {});
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Quests da Semana</span>
          <Badge variant="outline" className="text-xs">Beta</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? <div className="text-sm text-muted-foreground">Carregando...</div> : null}
        {computed.map(q => (
          <div key={q.id} className="p-3 border rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getIcon(q.icon, "text-primary")}
                <div>
                  <div className="font-medium">{q.title}</div>
                  <div className="text-xs text-muted-foreground">{q.description}</div>
                </div>
              </div>
              {q.isDone ? (
                <Badge className="bg-success/10 text-success border-success/30 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Concluída
                </Badge>
              ) : null}
            </div>
            <div className="mt-2">
              <Progress value={q.pct} />
              <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                <span>Progresso</span>
                <span>{q.value}/{q.goal}</span>
              </div>
            </div>
            {!q.isDone && (
              <div className="flex gap-2 mt-2">
                <Button size="sm" variant="outline" onClick={() => bump(q.id, 1)}>Marcar progresso</Button>
                <Button size="sm" onClick={() => bump(q.id, q.goal)}>Concluir</Button>
              </div>
            )}
          </div>
        ))}
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={resetWeek}>Zerar semana</Button>
        </div>
      </CardContent>
    </Card>
  );
}
