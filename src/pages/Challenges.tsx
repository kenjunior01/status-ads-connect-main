import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Trophy, Target, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useCampaignProofs } from "@/hooks/useCampaignProofs";

type Challenge = {
  id: string;
  title: string;
  description: string | null;
  status: "open" | "closed";
  starts_at: string;
  ends_at: string;
  prize_points: number;
};

export const Challenges = () => {
  const { toast } = useToast();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [filter, setFilter] = useState<"open" | "closed" | "all">("open");

  useEffect(() => {
    const fetchChallenges = async () => {
      setLoading(true);
      try {
        const { data } = await supabase
          .from("status_challenges")
          .select("*")
          .order("starts_at", { ascending: false });
        setChallenges((data || []) as Challenge[]);
      } catch {
        toast({ title: "Tabela ausente", description: "Crie status_challenges no Supabase.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchChallenges();
  }, [toast]);

  const filtered = challenges.filter(c => filter === "all" ? true : c.status === filter);

  const submitToChallenge = async (challengeId: string) => {
    setSubmitting(challengeId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("auth");
      const proofPayload = { challenge_id: challengeId, user_id: user.id };
      await supabase.from("challenge_entries").insert(proofPayload);
      toast({ title: "Participação enviada", description: "Sua prova será avaliada pelo engajamento." });
    } catch {
      toast({ title: "Envio não disponível", description: "Crie challenge_entries no Supabase.", variant: "destructive" });
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Desafios de Status
        </h1>
        <Select value={filter} onValueChange={(v) => setFilter(v as "open" | "closed" | "all")}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="open">Abertos</SelectItem>
            <SelectItem value="closed">Encerrados</SelectItem>
            <SelectItem value="all">Todos</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {loading ? (
        <div className="flex items-center justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-muted-foreground">Nenhum desafio disponível.</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map(c => (
            <Card key={c.id} className="border-muted">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{c.title}</span>
                  <Badge variant={c.status === "open" ? "default" : "outline"}>{c.status}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {c.description && <p className="text-sm text-muted-foreground">{c.description}</p>}
                <div className="flex items-center gap-2 text-sm">
                  <Target className="h-4 w-4" /> Período: {new Date(c.starts_at).toLocaleString()} – {new Date(c.ends_at).toLocaleString()}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Sparkles className="h-4 w-4 text-primary" /> Prêmio: {c.prize_points} pontos
                </div>
                <div className="flex justify-end">
                  <Button onClick={() => submitToChallenge(c.id)} disabled={c.status !== "open" || submitting === c.id}>
                    {submitting === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Participar"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
