import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Eye, Clock, Verified, TrendingUp, Users, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface Profile {
  id: string;
  display_name: string;
  niche: string;
  price_range: string;
  rating: number;
  total_reviews: number;
  total_campaigns: number;
  is_verified: boolean;
  badge_level: string;
  created_at: string;
}

interface EnhancedProfileCardProps {
  profile: Profile;
  className?: string;
  onSelect?: (profile: Profile) => void;
}

const badgeConfig = {
  bronze: { color: "bg-amber-600", label: "Novo Talento", icon: Star },
  silver: { color: "bg-slate-400", label: "Em Crescimento", icon: TrendingUp },
  gold: { color: "bg-amber-400", label: "Top Performer", icon: Zap },
  platinum: { color: "bg-purple-500", label: "Elite", icon: Users }
};

const urgencyMessages = [
  "🔥 Alta procura",
  "⚡ Resposta rápida", 
  "🎯 Especialista",
  "💫 Destaque da semana"
];

export const EnhancedProfileCard = ({ profile, className, onSelect }: EnhancedProfileCardProps) => {
  const badge = badgeConfig[profile.badge_level as keyof typeof badgeConfig] || badgeConfig.bronze;
  const BadgeIcon = badge.icon;
  const isNew = new Date().getTime() - new Date(profile.created_at).getTime() < 7 * 24 * 60 * 60 * 1000;
  const isHighRated = profile.rating >= 4.5 && profile.total_reviews >= 5;
  const isExperienced = profile.total_campaigns >= 10;
  const urgencyMessage = urgencyMessages[Math.floor(Math.random() * urgencyMessages.length)];

  return (
    <Card 
      className={cn(
        "group relative overflow-hidden cursor-pointer transition-all duration-300",
        "bg-card border-border hover:border-primary/50",
        "hover:shadow-strong hover:-translate-y-1",
        isHighRated && "ring-1 ring-success/20",
        className
      )}
      onClick={() => onSelect?.(profile)}
    >
      {/* Urgency Banner */}
      {(isNew || isHighRated || isExperienced) && (
        <div className="absolute top-0 right-0 z-10">
          <div className={cn(
            "px-2 py-1 text-xs font-medium text-white rounded-bl-md",
            isHighRated ? "bg-success" : isNew ? "bg-primary" : "bg-warning"
          )}>
            {isHighRated ? "⭐ Top Rated" : isNew ? "🆕 Novo" : urgencyMessage}
          </div>
        </div>
      )}

      <CardHeader className="p-3 pb-2">
        <div className="relative">
          {/* Avatar */}
          <div className="relative w-full aspect-square bg-muted rounded-lg overflow-hidden mb-3">
            <div className="w-full h-full flex items-center justify-center bg-gradient-primary">
              <span className="text-2xl font-bold text-primary-foreground">
                {profile.display_name.charAt(0).toUpperCase()}
              </span>
            </div>
            
            {/* Verification Badge */}
            {profile.is_verified && (
              <div className="absolute top-2 left-2">
                <div className="bg-success text-success-foreground rounded-full p-1">
                  <Verified className="h-3 w-3" />
                </div>
              </div>
            )}

            {/* Badge Level */}
            <div className="absolute top-2 right-2">
              <div className={cn("text-white rounded-full p-1", badge.color)}>
                <BadgeIcon className="h-3 w-3" />
              </div>
            </div>
          </div>

          {/* Profile Info */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
              {profile.display_name}
            </h3>
            
            {/* Niche Badge */}
            {profile.niche && (
              <Badge variant="secondary" className="text-xs">
                {profile.niche}
              </Badge>
            )}

            {/* Rating */}
            {profile.total_reviews > 0 && (
              <div className="flex items-center gap-1">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={cn(
                        "h-3 w-3",
                        i < Math.floor(profile.rating) 
                          ? "text-amber-400 fill-amber-400" 
                          : "text-muted-foreground"
                      )} 
                    />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">
                  {profile.rating.toFixed(1)} ({profile.total_reviews})
                </span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-3 pt-0">
        <div className="space-y-2">
          {/* Price - Main CTA */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-bold text-foreground">
                {profile.price_range}
              </div>
              <div className="text-xs text-muted-foreground">faixa de preço</div>
            </div>
            
            {/* Quick Stats */}
            <div className="text-right">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Eye className="h-3 w-3" />
                {profile.total_campaigns || 0}
              </div>
              <div className="text-xs text-muted-foreground">
                {badge.label}
              </div>
            </div>
          </div>

          {/* Social Proof */}
          {profile.total_campaigns > 0 && (
            <div className="text-xs text-muted-foreground">
              ✅ {profile.total_campaigns} {profile.total_campaigns === 1 ? 'campanha realizada' : 'campanhas realizadas'}
            </div>
          )}

          {/* Recent Activity Indicator */}
          <div className="flex items-center gap-1 text-xs text-success">
            <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
            Online agora
          </div>
        </div>

        {/* Hover CTA */}
        <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="bg-primary text-primary-foreground text-xs font-medium text-center py-2 rounded-md">
            Clique para ver perfil completo
          </div>
        </div>
      </CardContent>

      {/* Glow effect for top performers */}
      {isHighRated && (
        <div className="absolute inset-0 -z-10 bg-gradient-primary opacity-5 group-hover:opacity-10 transition-opacity duration-300 rounded-lg" />
      )}
    </Card>
  );
};