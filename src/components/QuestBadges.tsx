import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, Award, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";

type UserQuest = {
  quest_id: string;
  progress: number;
  goal: number;
  completed: boolean;
};

const QUEST_LABEL: Record<string, { label: string; icon: "check" | "award" | "rocket" }> = {
  submit_proof_fast: { label: "Prova Rápida (12h)", icon: "check" },
  campaigns_weekly: { label: "Foco da Semana (2 campanhas)", icon: "award" },
  consistency_streak: { label: "Sequência de Consistência (3 dias)", icon: "rocket" },
};

const Icon = ({ type, className }: { type: "check" | "award" | "rocket"; className?: string }) => {
  switch (type) {
    case "award": return <Award className={cn("h-4 w-4", className)} />;
    case "rocket": return <Rocket className={cn("h-4 w-4", className)} />;
    default: return <CheckCircle2 className={cn("h-4 w-4", className)} />;
  }
};

export const QuestBadges = () => {
  const [items, setItems] = useState<UserQuest[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setItems([]); setLoading(false); return; }
      const { data } = await supabase
        .from("user_quests")
        .select("quest_id, progress, goal, completed")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(10);
      setItems((data || []) as UserQuest[]);
      setLoading(false);
    })();
  }, []);

  const completed = items.filter(i => i.completed);

  return (
    <Card>
      <CardHeader><CardTitle>Conquistas</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {loading ? (
          <div className="text-sm text-muted-foreground">Carregando conquistas…</div>
        ) : completed.length === 0 ? (
          <div className="text-sm text-muted-foreground">Conclua quests para desbloquear conquistas.</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {completed.map((q) => {
              const meta = QUEST_LABEL[q.quest_id] || { label: q.quest_id, icon: "check" as const };
              return (
                <Badge key={q.quest_id} className="flex items-center gap-1 bg-success/10 text-success border-success/30">
                  <Icon type={meta.icon} />
                  {meta.label}
                </Badge>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
