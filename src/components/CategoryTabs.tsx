import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Star, 
  Clock, 
  TrendingUp, 
  Sparkles, 
  Dumbbell, 
  Laptop, 
  Heart,
  Utensils,
  Plane,
  Gamepad2,
  GraduationCap,
  Briefcase,
  Palette
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoryTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  counts?: {
    featured?: number;
    recent?: number;
    trending?: number;
  };
}

export const CategoryTabs = ({ activeTab, onTabChange, counts }: CategoryTabsProps) => {
  const { t } = useTranslation();

  const mainTabs = [
    { id: "featured", label: t('categories.featured'), icon: Star, color: "text-warning" },
    { id: "recent", label: t('categories.recent'), icon: Clock, color: "text-success" },
    { id: "trending", label: t('categories.trending'), icon: TrendingUp, color: "text-primary" },
  ];

  const nicheTabs = [
    { id: "lifestyle", label: t('niches.lifestyle'), icon: Sparkles },
    { id: "fitness", label: t('niches.fitness'), icon: Dumbbell },
    { id: "tech", label: t('niches.tech'), icon: Laptop },
    { id: "beauty", label: t('niches.beauty'), icon: Heart },
    { id: "food", label: t('niches.food'), icon: Utensils },
    { id: "travel", label: t('niches.travel'), icon: Plane },
    { id: "gaming", label: t('niches.entertainment'), icon: Gamepad2 },
    { id: "education", label: t('niches.education'), icon: GraduationCap },
    { id: "business", label: t('niches.business'), icon: Briefcase },
    { id: "design", label: t('niches.lifestyle'), icon: Palette },
  ];

  return (
    <div className="space-y-4">
      {/* Main Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {mainTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const count = counts?.[tab.id as keyof typeof counts];
          
          return (
            <Button
              key={tab.id}
              variant={isActive ? "default" : "outline"}
              size="lg"
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex items-center gap-2 whitespace-nowrap",
                isActive && "shadow-medium"
              )}
            >
              <Icon className={cn("h-4 w-4", !isActive && tab.color)} />
              {tab.label}
              {count !== undefined && count > 0 && (
                <Badge 
                  variant={isActive ? "secondary" : "outline"} 
                  className="ml-1 text-xs"
                >
                  {count}
                </Badge>
              )}
            </Button>
          );
        })}
      </div>

      {/* Niche Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <span className="text-sm text-muted-foreground whitespace-nowrap">{t('filters.niches')}:</span>
        {nicheTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <Badge
              key={tab.id}
              variant={isActive ? "default" : "secondary"}
              className={cn(
                "cursor-pointer px-3 py-1.5 flex items-center gap-1.5 whitespace-nowrap transition-colors",
                isActive 
                  ? "bg-primary text-primary-foreground" 
                  : "hover:bg-primary/10 hover:text-primary"
              )}
              onClick={() => onTabChange(tab.id)}
            >
              <Icon className="h-3 w-3" />
              {tab.label}
            </Badge>
          );
        })}
      </div>
    </div>
  );
};
