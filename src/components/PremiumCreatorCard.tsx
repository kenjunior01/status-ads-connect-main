import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FavoriteButton } from "@/components/FavoriteButton";
import { useFavorites } from "@/hooks/useFavorites";
import { useLocalizationContext } from "@/contexts/LocalizationContext";
import { Star, Verified, MessageCircle, Eye, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface Profile {
  id: string;
  display_name: string;
  niche: string | null;
  primary_niche?: string | null;
  price_range: string | null;
  rating: number;
  total_reviews: number;
  total_campaigns: number;
  is_verified: boolean;
  badge_level: string;
  created_at: string;
  trust_score?: number | null;
}

interface PremiumCreatorCardProps {
  profile: Profile;
  className?: string;
  onSelect?: (profile: Profile) => void;
  variant?: "default" | "featured" | "compact";
  showFavoriteButton?: boolean;
}

const badgeConfig = {
  bronze: { color: "bg-amber-600", label: "Novo", textColor: "text-amber-600" },
  silver: { color: "bg-slate-400", label: "Crescendo", textColor: "text-slate-500" },
  gold: { color: "bg-amber-400", label: "Top", textColor: "text-amber-500" },
  platinum: { color: "bg-purple-500", label: "Elite", textColor: "text-purple-600" }
};

// Generate a consistent avatar color based on name
const getAvatarGradient = (name: string) => {
  const gradients = [
    "from-blue-500 to-purple-600",
    "from-emerald-500 to-teal-600",
    "from-orange-500 to-rose-600",
    "from-violet-500 to-indigo-600",
    "from-pink-500 to-rose-600",
    "from-cyan-500 to-blue-600",
  ];
  const index = name.charCodeAt(0) % gradients.length;
  return gradients[index];
};

export const PremiumCreatorCard = ({ 
  profile, 
  className, 
  onSelect,
  variant = "default",
  showFavoriteButton = false
}: PremiumCreatorCardProps) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { format } = useLocalizationContext();
  const badge = badgeConfig[profile.badge_level as keyof typeof badgeConfig] || badgeConfig.bronze;
  const isNew = new Date().getTime() - new Date(profile.created_at).getTime() < 7 * 24 * 60 * 60 * 1000;
  const isTopRated = profile.rating >= 4.5 && profile.total_reviews >= 3;
  const isUltraRated = profile.rating >= 4.8 && profile.total_reviews >= 10;
  const isTrusted = !!profile.is_verified;
  const isExperienced = profile.total_campaigns >= 20;
  const avatarGradient = getAvatarGradient(profile.display_name);
  
  // Calculate response rate (mock - would come from real data)
  const responseRate = 85 + Math.floor(Math.random() * 15);
  
  // Parse price from price_range string or use default
  const getBasePrice = () => {
    if (!profile.price_range) return 50;
    const match = profile.price_range.match(/\d+/);
    return match ? parseInt(match[0]) : 50;
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(profile);
  };

  return (
    <Card 
      className={cn(
        "group relative overflow-hidden cursor-pointer transition-all duration-300 hover-ring",
        "bg-card border-border hover:border-primary/30",
        "hover:shadow-strong hover:-translate-y-1",
        "p-3 md:p-4",
        variant === "featured" && "ring-2 ring-primary/20 hover:shadow-glow",
        variant === "compact" && "p-2",
        className
      )}
      onClick={() => onSelect?.(profile)}
    >
      {variant === "featured" && (
        <div className="absolute top-3 left-3 z-20">
          <Badge className="bg-primary/10 text-primary border-0 text-xs px-2 py-0.5">Destaque</Badge>
        </div>
      )}
      {/* Favorite Button - Top Left */}
      {showFavoriteButton && (
        <div className="absolute top-3 left-3 z-20">
          <FavoriteButton
            isFavorite={isFavorite(profile.id)}
            onClick={handleFavoriteClick}
            size="sm"
            variant="overlay"
          />
        </div>
      )}

      {/* Status Badges - Top Right */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5">
        {isTopRated && (
          <Badge className="bg-warning text-warning-foreground text-xs px-2 py-0.5">
            <Star className="h-3 w-3 mr-1 fill-current" />
            Top
          </Badge>
        )}
        {isNew && (
          <Badge className="bg-success text-success-foreground text-xs px-2 py-0.5">
            Novo
          </Badge>
        )}
      </div>

      {/* Avatar Section */}
      <div className="p-3 md:p-4 pb-0">
        <div className="relative">
          {/* Avatar */}
          <div className={cn(
            "w-full rounded-xl overflow-hidden mb-3",
            variant === "featured" ? "aspect-video" : "aspect-square",
            "bg-gradient-to-br",
            avatarGradient
          )}>
            <div className="w-full h-full flex items-center justify-center">
              <span className={cn("font-bold text-white drop-shadow-md", variant === "featured" ? "text-4xl md:text-5xl" : "text-3xl md:text-4xl")}>
                {profile.display_name.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
          
          {/* Verified Badge */}
          {profile.is_verified && (
            <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-1.5 shadow-medium">
              <Verified className="h-4 w-4" />
            </div>
          )}

          {/* Online Indicator */}
          <div className="absolute -bottom-1 -left-1 flex items-center gap-1.5 bg-card px-2 py-1 rounded-full shadow-medium border border-border">
            <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
            <span className="text-xs text-success font-medium">Online</span>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-3 md:p-4 pt-3 space-y-3">
        {/* Name & Niche */}
        <div>
          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1 text-base md:text-lg">
            {profile.display_name}
          </h3>
          {(profile.primary_niche || profile.niche) && (
            <p className="text-xs md:text-sm text-muted-foreground line-clamp-1">{profile.primary_niche || profile.niche}</p>
          )}
        </div>
        {/* Meituan-style badges */}
        <div className="hidden md:flex flex-wrap items-center gap-1.5">
          {isUltraRated && (
            <Badge className="bg-warning/20 text-warning px-2 py-0.5 text-xs border-0">Top Rated</Badge>
          )}
          {isTrusted && (
            <Badge className="bg-primary/15 text-primary px-2 py-0.5 text-xs border-0">Confiável</Badge>
          )}
          {isExperienced && (
            <Badge className="bg-emerald-100 text-emerald-700 px-2 py-0.5 text-xs border-0">Experiente</Badge>
          )}
        </div>

        {/* Rating & Reviews */}
        {profile.total_reviews > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 text-warning fill-warning" />
              <span className="font-semibold text-foreground">{profile.rating.toFixed(1)}</span>
            </div>
            <span className="text-xs md:text-sm text-muted-foreground">
              ({profile.total_reviews} {profile.total_reviews === 1 ? "avaliação" : "avaliações"})
            </span>
          </div>
        )}

        {/* Quick Stats */}
        <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            <span>{profile.total_campaigns} campanhas</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageCircle className="h-3 w-3" />
            <span>{responseRate}% resposta</span>
          </div>
          {typeof profile.trust_score === 'number' && (
            <Badge variant="secondary" className="text-xs">
              confiança {Math.round(profile.trust_score)}
            </Badge>
          )}
        </div>

        {/* Divider */}
        <div className="hidden md:block border-t border-border" />

        {/* Price & CTA */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] md:text-xs text-muted-foreground">A partir de</p>
            <p className={cn("font-bold text-foreground", variant === "featured" ? "price-highlight" : "text-base md:text-lg")}>{format(getBasePrice())}</p>
          </div>
          
          {/* Badge Level */}
          <Badge 
            variant="outline" 
            className={cn("text-[11px] md:text-xs", badge.textColor)}
          >
            {badge.label}
          </Badge>
        </div>

        {/* Hover CTA (desktop) */}
        <div className="hidden md:block opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
          <div className="bg-primary text-primary-foreground text-sm font-medium text-center py-2.5 rounded-lg flex items-center justify-center gap-2">
            <Zap className="h-4 w-4" />
            Ver Perfil Completo
          </div>
        </div>
        {/* Persistent CTA (mobile) */}
        <div className="md:hidden">
          <div className="bg-primary text-primary-foreground text-sm font-medium text-center py-2 rounded-lg">
            Ver Perfil
          </div>
        </div>
      </div>
    </Card>
  );
};
