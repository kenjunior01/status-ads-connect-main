
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLocalizationContext } from '@/contexts/LocalizationContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Trophy, 
  Star, 
  Target, 
  TrendingUp, 
  MapPin, 
  Award,
  Crown,
  Medal,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RankedCreator {
  id: string;
  display_name: string;
  avatar_url: string | null;
  niche: string | null;
  rating: number;
  total_campaigns: number;
  referral_level: string;
  country_code: string;
  score: number;
}

export const RankingPage = () => {
  const [creators, setCreators] = useState<RankedCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const { getCurrentCountry } = useLocalizationContext();
  const currentCountry = getCurrentCountry();

  useEffect(() => {
    const fetchRankings = async () => {
      setLoading(true);
      try {
        // Simplified ranking logic: rating * 10 + total_campaigns + (referral_level weight)
        const { data, error } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_url, niche, rating, total_campaigns, referral_level, country_code')
          .order('rating', { ascending: false })
          .limit(20);

        if (error) throw error;

        const ranked = (data || []).map(p => ({
          ...p,
          score: (p.rating || 0) * 20 + (p.total_campaigns || 0) * 5 + 
                 (p.referral_level === 'Ouro' ? 50 : p.referral_level === 'Prata' ? 30 : p.referral_level === 'Bronze' ? 15 : 0)
        })).sort((a, b) => b.score - a.score);

        setCreators(ranked as RankedCreator[]);
      } catch (err) {
        console.error('Error fetching rankings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRankings();
  }, []);

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return <Crown className="h-6 w-6 text-yellow-500" />;
      case 1: return <Medal className="h-6 w-6 text-slate-400" />;
      case 2: return <Medal className="h-6 w-6 text-amber-700" />;
      default: return <span className="font-bold text-muted-foreground w-6 text-center">{index + 1}</span>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-12">
        <div className="inline-flex p-3 bg-primary/10 rounded-2xl mb-4">
          <Trophy className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">Ranking Global</h1>
        <p className="text-muted-foreground">
          Os criadores com melhor performance e engajamento {currentCountry ? `em ${currentCountry.name}` : 'na plataforma'}.
        </p>
      </div>

      <div className="space-y-4">
        {loading ? (
          [...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-20" />
            </Card>
          ))
        ) : creators.length === 0 ? (
          <Card className="p-12 text-center border-dashed">
            <p className="text-muted-foreground">Nenhum criador ranqueado ainda.</p>
          </Card>
        ) : (
          creators.map((creator, index) => (
            <Card 
              key={creator.id} 
              className={cn(
                "transition-all hover:shadow-md border-l-4",
                index === 0 ? "border-l-yellow-500 bg-yellow-500/5 shadow-yellow-500/10" :
                index === 1 ? "border-l-slate-400" :
                index === 2 ? "border-l-amber-700" : "border-l-transparent"
              )}
            >
              <CardContent className="p-4 flex items-center gap-4">
                <div className="flex-shrink-0">
                  {getRankIcon(index)}
                </div>
                
                <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                  <AvatarImage src={creator.avatar_url || ''} loading="lazy" />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {creator.display_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-bold truncate">{creator.display_name}</h3>
                    {index === 0 && <Badge className="bg-yellow-500 text-[10px] h-4">LÍDER</Badge>}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                      {creator.rating?.toFixed(1) || '0.0'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      {creator.total_campaigns} campanhas
                    </span>
                    {creator.country_code && (
                      <span className="flex items-center gap-1 uppercase">
                        <MapPin className="h-3 w-3" />
                        {creator.country_code}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right hidden sm:block">
                  <div className="flex items-center gap-1 justify-end text-primary font-bold">
                    <Zap className="h-4 w-4" />
                    {creator.score} pts
                  </div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                    {creator.referral_level || 'Iniciante'}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div className="mt-12 bg-muted/50 p-6 rounded-2xl border text-center">
        <Award className="h-8 w-8 text-primary mx-auto mb-3" />
        <h3 className="font-bold mb-1">Como subir no ranking?</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          O score é calculado com base na sua avaliação média, número de campanhas concluídas e seu nível de indicações (Bronze, Prata, Ouro).
        </p>
      </div>
    </div>
  );
};
