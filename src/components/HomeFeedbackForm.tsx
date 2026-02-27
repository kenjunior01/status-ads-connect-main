import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

export const HomeFeedbackForm = () => {
  const { toast } = useToast();
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [lastSubmittedAt, setLastSubmittedAt] = useState<number | null>(null);

  const scoreFeedback = (text: string) => {
    const len = text.trim().length;
    const words = new Set(text.toLowerCase().split(/\s+/).filter(Boolean));
    const banned = ["http://", "https://", "xxx", "spam"];
    const hasBanned = banned.some(b => text.toLowerCase().includes(b));
    const score = (len > 50 ? 30 : 0) + (words.size > 10 ? 20 : 0) + (len > 120 ? 30 : 0) + (hasBanned ? -50 : 0);
    return Math.max(score, 0);
  };

  const canSubmit = () => {
    if (lastSubmittedAt && Date.now() - lastSubmittedAt < 5 * 60 * 1000) return false;
    return true;
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast({ title: "Digite seu comentário", variant: "destructive" });
      return;
    }
    if (!canSubmit()) {
      toast({ title: "Aguarde alguns minutos", description: "Evite enviar muitos comentários seguidos.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Faça login", description: "Entre para enviar comentários.", variant: "destructive" });
        return;
      }
      const score = scoreFeedback(content);
      const approved = score >= 50;
      const { error } = await supabase
        .from('user_feedback')
        .insert({ user_id: user.id, content, approved, reward_points: 0 });
      if (error) {
        toast({ title: "Falha ao enviar", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Comentário enviado", description: approved ? "Aprovado automaticamente" : "Aguardando aprovação" });
        setContent("");
        setLastSubmittedAt(Date.now());
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Deixe seu comentário</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Sugestões e comentários" />
        <div className="flex justify-end">
          <Button onClick={handleSubmit} disabled={submitting}>
            Enviar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
