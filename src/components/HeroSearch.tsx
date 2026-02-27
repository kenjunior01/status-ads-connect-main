import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Sparkles, TrendingUp, Users, Zap } from "lucide-react";

interface HeroSearchProps {
  onSearch?: (query: string) => void;
  onCategorySelect?: (category: string) => void;
}

export const HeroSearch = ({ onSearch, onCategorySelect }: HeroSearchProps) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");

  const popularCategories = [
    { label: t('niches.lifestyle'), icon: Sparkles, value: "lifestyle" },
    { label: t('niches.fitness'), icon: TrendingUp, value: "fitness" },
    { label: t('niches.tech'), icon: Zap, value: "tech" },
    { label: t('niches.beauty'), icon: Users, value: "beauty" },
  ];

  const handleSearch = () => {
    onSearch?.(searchQuery);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Main Search Bar */}
      <div className="relative">
        <div className="flex items-center bg-white rounded-2xl shadow-strong overflow-hidden border-2 border-transparent focus-within:border-primary transition-colors">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t('hero.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="border-0 pl-12 pr-3 py-4 text-base sm:py-6 sm:text-lg bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/70"
            />
          </div>
          <Button 
            onClick={handleSearch}
            size="lg"
            className="m-2 px-4 sm:px-8 bg-primary hover:bg-primary-hover text-primary-foreground rounded-xl"
          >
            <Search className="h-5 w-5 mr-2" />
            {t('common.search')}
          </Button>
        </div>
      </div>

      {/* Popular Categories */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <span className="text-sm text-muted-foreground">{t('categories.trending')}:</span>
        {popularCategories.map((category) => (
          <Badge
            key={category.value}
            variant="secondary"
            className="px-4 py-2 cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors flex items-center gap-2"
            onClick={() => onCategorySelect?.(category.value)}
          >
            <category.icon className="h-3 w-3" />
            {category.label}
          </Badge>
        ))}
      </div>

      {/* Stats Pills */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <div className="flex items-center gap-2 bg-success/10 text-success px-4 py-2 rounded-full">
          <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
          <span className="text-sm font-medium">2.5k+ {t('hero.stats.creators').toLowerCase()}</span>
        </div>
        <div className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full">
          <Zap className="h-4 w-4" />
          <span className="text-sm font-medium">{t('creator.responseTime')} &lt; 1h</span>
        </div>
      </div>
    </div>
  );
};
