import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Handshake } from "lucide-react";
import { useProfiles } from "@/hooks/useProfiles";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type Mentor = {
  id: string;
  display_name: string;
  trust_score?: number | null;
};

export const MentorshipCenter = () => {
  const { profiles } = useProfiles();
  const { toast } = useToast();
  const [requesting, setRequesting] = useState<string | null>(null);
  const mentors: Mentor[] = profiles
    .filter(p => (p.trust_score ?? 0) >= 80)
    .slice(0, 12)
    .map(p => ({ id: p.profile_id || p.id, display_name: p.display_name, trust_score: p.trust_score }));

  const requestMentorship = async (mentorId: string) => {
    setRequesting(mentorId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("auth");
      await supabase.from("mentorship_requests").insert({ mentor_id: mentorId, mentee_id: user.id, status: "pending" });
      toast({ title: "Solicitação enviada", description: "O mentor será notificado." });
    } catch {
      toast({ title: "Configuração necessária", description: "Crie mentorship_requests no Supabase.", variant: "destructive" });
    } finally {
      setRequesting(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Handshake className="h-5 w-5 text-primary" />
            Mentorias de Pares
          </CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-4">
          {mentors.length === 0 ? (
            <div className="text-muted-foreground">Nenhum mentor disponível no momento.</div>
          ) : mentors.map(m => (
            <Card key={m.id} className="border-muted">
              <CardContent className="p-4 space-y-2">
                <div className="font-medium">{m.display_name}</div>
                <Badge className="bg-success/10 text-success flex items-center gap-1">
                  <Star className="h-3 w-3" /> Trust {m.trust_score ?? 0}
                </Badge>
                <div className="flex justify-end">
                  <Button onClick={() => requestMentorship(m.id)} disabled={requesting === m.id}>
                    {requesting === m.id ? "Enviando..." : "Solicitar Mentoria"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
