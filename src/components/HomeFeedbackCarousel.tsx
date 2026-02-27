import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type FeedbackRow = {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  approved: boolean;
  reward_points: number;
  reward_type: string | null;
  user_email?: string | null;
};

export const HomeFeedbackCarousel = () => {
  const [items, setItems] = useState<FeedbackRow[]>([]);
  const [index, setIndex] = useState(0);

  const fetchFeedback = async () => {
    const { data } = await supabase
      .from('user_feedback')
      .select('id, user_id, content, created_at, approved, reward_points, reward_type')
      .eq('approved', true)
      .order('created_at', { ascending: false })
      .limit(20);
    const rows = (data || []) as unknown as FeedbackRow[];
    setItems(rows);
  };

  useEffect(() => {
    fetchFeedback();
    const channel = supabase
      .channel('home-feedback')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_feedback' }, () => fetchFeedback())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (items.length === 0) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % items.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [items]);

  if (items.length === 0) {
    return null;
  }

  const current = items[index];

  return (
    <div className="relative py-8">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/5 to-success/5 blur-3xl rounded-xl" />
      <Card className="relative mx-auto max-w-3xl border-2">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-3">
            <Badge variant="outline">Comentário de Usuário</Badge>
            <div className="text-xs text-muted-foreground">
              {new Date(current.created_at).toLocaleString()}
            </div>
          </div>
          <p className="text-lg leading-relaxed">
            {current.content}
          </p>
          <div className="mt-4 flex items-center gap-2">
            {current.reward_points > 0 && (
              <Badge className="bg-warning/10 text-warning border-0">
                Recompensa {current.reward_points} {current.reward_type ? `• ${current.reward_type}` : ''}
              </Badge>
            )}
            <Badge className="bg-primary/10 text-primary border-0">
              #{index + 1}/{items.length}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
