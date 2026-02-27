import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { HeroSearch } from "@/components/HeroSearch";
import { PremiumCreatorCard } from "@/components/PremiumCreatorCard";
import { CategoryTabs } from "@/components/CategoryTabs";
import { AdvancedFiltersSidebar, MobileFiltersSheet, FilterState } from "@/components/AdvancedFiltersSidebar";
import { SocialProof } from "@/components/TrustIndicators";
import { FloatingCTA } from "@/components/EnhancedCTA";
import { ValuePropositionSection } from "@/components/ValuePropositionSection";
import { HomeStats } from "@/components/HomeStats";
import { HotDeals } from "@/components/HotDeals";
import { HomeFeedbackCarousel } from "@/components/HomeFeedbackCarousel";
import { HomeFeedbackForm } from "@/components/HomeFeedbackForm";
import { RollingAdsBar } from "@/components/RollingAdsBar";
import { Skeleton } from "@/components/ui/skeleton";
import { QuickCategories } from "@/components/QuickCategories";
import { AdTicker } from "@/components/AdTicker";
import { AdTickerForm } from "@/components/AdTickerForm";
import { CreatorProfile } from "@/pages/CreatorProfile";
import { useProfiles, type Profile as CreatorProfileType } from "@/hooks/useProfiles";
import { useFavorites } from "@/hooks/useFavorites";
import { useLocalizationContext } from "@/contexts/LocalizationContext";
import { languageForCountry } from "@/lib/locale";
import { 
  Users, 
  MessageSquare, 
  DollarSign, 
  Star, 
  Shield,
  Award,
  Zap,
  Globe,
  MapPin,
  ArrowRight,
  ChevronDown,
  Heart,
  Sparkles
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface IndexProps {
  onNavigate?: (page: string) => void;
}

const defaultFilters: FilterState = {
  priceRange: [0, 500],
  niches: [],
  minRating: 0,
  minCampaigns: 0,
  minResponseRate: 0,
  minFollowers: 0,
  minTrustScore: 0,
  maxCpvRate: null,
  maxPricePerPost: null,
  onlineOnly: false,
  verifiedOnly: false,
  badgeLevels: [],
  region: null,
  country: null,
  ageRange: [18, 65]
};

const Index = ({ onNavigate }: IndexProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { profiles, loading, getFeaturedProfiles, getNewProfiles, getDiscoverProfiles } = useProfiles();
  const { favorites, getFavoriteCount } = useFavorites();
  const { format, getCurrentCountry } = useLocalizationContext();
  const navigate = useNavigate();
  const [nearbyProfiles, setNearbyProfiles] = useState<CreatorProfileType[]>([]);
  const [isNearbyLoading, setIsNearbyLoading] = useState(false);

  useEffect(() => {
    const fetchNearby = async () => {
      const storedCoords = localStorage.getItem('statusads_coords');
      if (storedCoords) {
        setIsNearbyLoading(true);
        try {
          const { lat, lon } = JSON.parse(storedCoords);
          const { data, error } = await supabase.rpc('get_nearby_creators', {
            _lat: lat,
            _lon: lon,
            _radius_km: 100,
            _limit: 4
          });
          
          if (!error && data) {
            setNearbyProfiles(data);
          }
        } catch (err) {
          console.error("Error fetching nearby creators:", err);
        } finally {
          setIsNearbyLoading(false);
        }
      }
    };
    fetchNearby();
  }, []);
  const [showFloatingCTA, setShowFloatingCTA] = useState(false);
  const [activeCategory, setActiveCategory] = useState("featured");
  const [showAllProfiles, setShowAllProfiles] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [selectedProfile, setSelectedProfile] = useState<CreatorProfileType | null>(null);
  const ghostProfiles: CreatorProfileType[] = [
    { id: 'ghost-1', profile_id: 'g1', display_name: 'Alex Global', niche: 'Tecnologia', price_range: '$10 - $20', rating: 4.8, total_reviews: 112, total_campaigns: 36, is_verified: true, badge_level: 'gold', referral_level: null, latitude: null, longitude: null, country_code: 'US', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), trust_score: 92, primary_niche: 'Tech', user_id: null, contacts_count: 1500 },
    { id: 'ghost-2', profile_id: 'g2', display_name: 'Maya Creators', niche: 'Beleza & Moda', price_range: '$8 - $16', rating: 4.6, total_reviews: 87, total_campaigns: 28, is_verified: true, badge_level: 'silver', referral_level: null, latitude: null, longitude: null, country_code: 'GB', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), trust_score: 88, primary_niche: 'Beauty', user_id: null, contacts_count: 1200 },
    { id: 'ghost-3', profile_id: 'g3', display_name: 'Kenji Studio', niche: 'Games', price_range: '$5 - $12', rating: 4.7, total_reviews: 65, total_campaigns: 22, is_verified: true, badge_level: 'silver', referral_level: null, latitude: null, longitude: null, country_code: 'JP', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), trust_score: 85, primary_niche: 'Gaming', user_id: null, contacts_count: 900 },
    { id: 'ghost-4', profile_id: 'g4', display_name: 'Aisha Venture', niche: 'Negócios', price_range: '$12 - $24', rating: 4.9, total_reviews: 140, total_campaigns: 40, is_verified: true, badge_level: 'gold', referral_level: null, latitude: null, longitude: null, country_code: 'NG', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), trust_score: 93, primary_niche: 'Business', user_id: null, contacts_count: 1800 },
    { id: 'ghost-5', profile_id: 'g5', display_name: 'Liu Trend', niche: 'Moda', price_range: '$7 - $15', rating: 4.5, total_reviews: 52, total_campaigns: 20, is_verified: true, badge_level: 'bronze', referral_level: null, latitude: null, longitude: null, country_code: 'CN', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), trust_score: 80, primary_niche: 'Fashion', user_id: null, contacts_count: 800 },
    { id: 'ghost-6', profile_id: 'g6', display_name: 'Sofia Travel', niche: 'Viagem', price_range: '$6 - $14', rating: 4.4, total_reviews: 45, total_campaigns: 18, is_verified: true, badge_level: 'bronze', referral_level: null, latitude: null, longitude: null, country_code: 'ES', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), trust_score: 78, primary_niche: 'Travel', user_id: null, contacts_count: 700 },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setShowFloatingCTA(window.scrollY > 600);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleProfileSelect = (profile: CreatorProfileType) => {
    setSelectedProfile(profile);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    toast({
      title: "Buscando...",
      description: `Procurando criadores para: "${query}"`,
    });
  };

  const handleCategorySelect = (category: string) => {
    setActiveCategory(category.toLowerCase());
    toast({
      title: `Categoria: ${category}`,
      description: "Filtrando criadores por categoria",
    });
  };

  const clearFilters = () => {
    setFilters(defaultFilters);
  };

  // Apply filters to profiles
  const applyFilters = (profilesList: CreatorProfileType[]) => {
    return profilesList.filter(profile => {
      // Price filter
      const price = parseInt(profile.price_range?.replace(/\D/g, '') || '50');
      if (price < filters.priceRange[0] || price > filters.priceRange[1]) {
        return false;
      }

      // Rating filter
      if (filters.minRating > 0 && profile.rating < filters.minRating) {
        return false;
      }

      // Campaigns filter
      if (filters.minCampaigns > 0 && profile.total_campaigns < filters.minCampaigns) {
        return false;
      }

      // Verified filter
      if (filters.verifiedOnly && !profile.is_verified) {
        return false;
      }

      // Badge level filter
      if (filters.badgeLevels.length > 0 && !filters.badgeLevels.includes(profile.badge_level)) {
        return false;
      }

      // Region filter
      if (filters.region && profile.country_code !== filters.region) {
        return false;
      }

      // Country filter
      if (filters.country && profile.country_code !== filters.country) {
        return false;
      }

      // Language filter
      if (filters.language) {
        const lang = languageForCountry(profile.country_code);
        if (lang !== filters.language) {
          return false;
        }
      }

      // Age filter
      if (filters.ageRange) {
        const maybeAge = (profile as unknown as Record<string, unknown>)["age"];
        const age = typeof maybeAge === 'number' ? maybeAge : undefined;
        const [minAge, maxAge] = filters.ageRange;
        if (typeof age === 'number' && (age < minAge || age > maxAge)) {
          return false;
        }
      }

      // Followers/Contacts filter
      if ((filters.minFollowers || 0) > 0) {
        const followers = profile.contacts_count ?? (profile as unknown as { follower_count?: number }).follower_count ?? 0;
        if (followers < (filters.minFollowers || 0)) {
          return false;
        }
      }

      // Engagement rate (using minResponseRate)
      if (filters.minResponseRate > 0) {
        const engagement = (profile as unknown as { engagement_rate?: number }).engagement_rate ?? 0;
        if (engagement < filters.minResponseRate) {
          return false;
        }
      }

      // Trust score
      if ((filters.minTrustScore || 0) > 0) {
        const trust = profile.trust_score ?? 0;
        if (trust < (filters.minTrustScore || 0)) {
          return false;
        }
      }

      // CPV maximum
      if (typeof filters.maxCpvRate === 'number' && (profile as unknown as { cpv_rate?: number }).cpv_rate != null) {
        if ((profile as unknown as { cpv_rate?: number }).cpv_rate! > (filters.maxCpvRate as number)) {
          return false;
        }
      }

      // Price per post maximum
      if (typeof filters.maxPricePerPost === 'number' && (profile as unknown as { price_per_post?: number }).price_per_post != null) {
        if ((profile as unknown as { price_per_post?: number }).price_per_post! > (filters.maxPricePerPost as number)) {
          return false;
        }
      }
      // Niche filter
      if (filters.niches.length > 0) {
        const nicheMap: Record<string, string[]> = {
          lifestyle: ["Lifestyle", "Viagem"],
          fitness: ["Fitness & Saúde", "Fitness"],
          tech: ["Tecnologia", "Tech"],
          beauty: ["Beleza & Moda", "Beleza"],
          food: ["Culinária", "Gastronomia"],
          travel: ["Viagem", "Travel"],
          gaming: ["Games", "Gaming"],
          education: ["Educação", "Education"],
          business: ["Negócios", "Business"],
          design: ["Arte & Design", "Design"],
        };
        
        const matchesNiche = filters.niches.some(niche => {
          const niches = nicheMap[niche] || [];
          return profile.niche && niches.some(n => 
            profile.niche?.toLowerCase().includes(n.toLowerCase())
          );
        });
        
        if (!matchesNiche) return false;
      }

      return true;
    });
  };

  // Get profiles based on active category
  const getActiveProfiles = () => {
    let baseProfiles: CreatorProfileType[];
    
    switch (activeCategory) {
      case "featured":
        baseProfiles = getFeaturedProfiles();
        break;
      case "recent":
        baseProfiles = getNewProfiles();
        break;
      case "trending":
        baseProfiles = [...profiles].sort((a, b) => b.total_campaigns - a.total_campaigns).slice(0, 24);
        break;
      case "favorites":
        baseProfiles = profiles.filter(p => favorites.some(f => f.id === p.id));
        break;
      default:
        {
          // Filter by niche
          const nicheMap: Record<string, string[]> = {
            lifestyle: ["Lifestyle", "Viagem"],
            fitness: ["Fitness & Saúde", "Fitness"],
            tech: ["Tecnologia", "Tech"],
            beauty: ["Beleza & Moda", "Beleza"],
            food: ["Culinária", "Gastronomia"],
            travel: ["Viagem", "Travel"],
            gaming: ["Games", "Gaming"],
            education: ["Educação", "Education"],
            business: ["Negócios", "Business"],
            design: ["Arte & Design", "Design"],
          };
          const niches = nicheMap[activeCategory] || [];
          baseProfiles = profiles.filter(p => 
            p.niche && niches.some(n => p.niche?.toLowerCase().includes(n.toLowerCase()))
          );
        }
    }

    return applyFilters([...baseProfiles, ...ghostProfiles]);
  };

  const activeProfiles = getActiveProfiles();
  const displayProfiles = showAllProfiles ? activeProfiles : activeProfiles.slice(0, 8);
  
  const currentCountry = getCurrentCountry();
  const featured = getFeaturedProfiles().slice(0, 8);
  const recent = getNewProfiles().slice(0, 8);

  // Show Creator Profile if selected
  if (selectedProfile) {
    return (
      <CreatorProfile 
        profile={selectedProfile}
        onBack={() => setSelectedProfile(null)}
        onContact={() => {
          toast({
            title: "Iniciando conversa...",
            description: `Abrindo chat com ${selectedProfile.display_name}`,
          });
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary mx-auto"></div>
          <div className="space-y-2">
            <p className="text-lg font-medium text-foreground">Carregando criadores...</p>
            <p className="text-sm text-muted-foreground">Preparando as melhores oportunidades</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0">
      {/* Hero Section with Search */}
      <section className="relative py-10 md:py-16 px-4 bg-gradient-hero overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        
        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute left-10 top-12 text-5xl opacity-10 motion-safe:animate-bounce">😊</div>
            <div className="absolute right-16 top-24 text-4xl opacity-10 motion-safe:animate-pulse">⭐</div>
            <div className="absolute left-1/3 bottom-10 text-6xl opacity-10 motion-safe:animate-bounce">🔥</div>
            <div className="absolute right-1/4 bottom-16 text-5xl opacity-10 motion-safe:animate-pulse">💬</div>
          </div>
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-full mb-6">
            <Globe className="h-4 w-4" />
            <span className="text-sm font-medium">{t('global.platform')}</span>
          </div>
          
          {/* Headline - Global */}
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
            {t('hero.title', { defaultValue: 'Monetize seus Status do WhatsApp' })}
          </h1>
          
          <p className="text-base md:text-xl text-white/80 mb-8 md:mb-10 max-w-2xl mx-auto">
            {t('global.tagline', { defaultValue: 'Conectando marcas e criadores em todo o mundo' })}
          </p>
          
          {/* Search Component */}
          <HeroSearch onSearch={handleSearch} onCategorySelect={handleCategorySelect} />
        </div>
      </section>
      
      {/* Rolling Sponsored Ads / Offers */}
      <RollingAdsBar />

      <section id="listings" className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
        {isNearbyLoading ? (
          <div className="mb-16 animate-fade-up" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
                  <MapPin className="h-6 w-6 text-primary" />
                  Criadores próximos a você
                </h2>
                <p className="text-muted-foreground mt-1">
                  Pessoas influentes na sua região para suas campanhas locais
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="border rounded-xl p-2">
                  <Skeleton className="w-full h-40 md:h-44 rounded" />
                  <div className="mt-2 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : nearbyProfiles.length > 0 && (
          <div className="mb-16 animate-fade-up" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
                  <MapPin className="h-6 w-6 text-primary" />
                  Criadores próximos a você
                </h2>
                <p className="text-muted-foreground mt-1">
                  Pessoas influentes na sua região para suas campanhas locais
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {nearbyProfiles.map((profile) => (
                <PremiumCreatorCard 
                  key={profile.id} 
                  profile={profile} 
                  onSelect={handleProfileSelect}
                />
              ))}
            </div>
          </div>
        )}

          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                  Explore Criadores
                </h2>
                <p className="text-muted-foreground">
                  {activeProfiles.length} criadores disponíveis
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <MobileFiltersSheet
                  filters={filters}
                  onFiltersChange={setFilters}
                  onClearFilters={clearFilters}
                >
                  <span />
                </MobileFiltersSheet>
                
                <Button
                  variant={activeCategory === "favorites" ? "default" : "outline"}
                  onClick={() => setActiveCategory("favorites")}
                  className="gap-2"
                >
                  <Heart className="h-4 w-4" />
                  Favoritos ({getFavoriteCount()})
                </Button>
              </div>
            </div>

            <CategoryTabs 
              activeTab={activeCategory} 
              onTabChange={(tab) => {
                setActiveCategory(tab);
                setShowAllProfiles(false);
              }}
              counts={{
                featured: getFeaturedProfiles().length,
                recent: getNewProfiles().length,
                trending: profiles.length,
              }}
            />
          </div>

          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            <AdvancedFiltersSidebar
              filters={filters}
              onFiltersChange={setFilters}
              onClearFilters={clearFilters}
            />

            <div className="flex-1">
              {/* Preços por Tier removido por solicitação */}
              {displayProfiles.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {displayProfiles.map((profile, index) => (
                      <PremiumCreatorCard 
                        key={profile.id} 
                        profile={profile} 
                        onSelect={handleProfileSelect}
                        variant={index < 2 && activeCategory === "featured" ? "featured" : "default"}
                        showFavoriteButton
                      />
                    ))}
                  </div>

                  {activeProfiles.length > 8 && !showAllProfiles && (
                    <div className="text-center mt-10">
                      <Button 
                        variant="outline" 
                        size="lg"
                        onClick={() => setShowAllProfiles(true)}
                        className="gap-2 px-8"
                      >
                        <ChevronDown className="h-4 w-4" />
                        Ver Mais ({activeProfiles.length - 8} criadores)
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full flex items-center justify-center mx-auto mb-6">
                    {activeCategory === "favorites" ? (
                      <Heart className="h-10 w-10 text-primary" />
                    ) : (
                      <Sparkles className="h-10 w-10 text-primary" />
                    )}
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    {activeCategory === "favorites" 
                      ? t('favorites.empty')
                      : t('emptyState.noCreators')
                    }
                  </h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    {activeCategory === "favorites"
                      ? t('favorites.addSome')
                      : t('emptyState.noCreatorsDescription')
                    }
                  </p>
                  <Button onClick={() => {
                    setActiveCategory("featured");
                    clearFilters();
                  }} className="gap-2">
                    <ArrowRight className="h-4 w-4" />
                    {t('emptyState.tryAgain')}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Estatísticas Dinâmicas */}
      <section className="py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <QuickCategories />
          </div>
          <div className="flex justify-end mb-3">
            <AdTickerForm />
          </div>
          <HomeStats />
        </div>
      </section>
      <AdTicker />
      <HotDeals />

      <section className="py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <HomeFeedbackCarousel />
        </div>
      </section>
      <section className="py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <HomeFeedbackForm />
        </div>
      </section>

      {/* Em Destaque */}
      {featured.length > 0 && (
        <section className="py-8 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="type-h2">Em Destaque</h2>
              <Button
                variant="outline"
                onClick={() => {
                  setActiveCategory("featured");
                  setShowAllProfiles(false);
                  const el = document.getElementById("listings");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Ver tudo
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {loading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="rounded-xl border skeleton h-52" />
                  ))
                : featured.map((profile) => (
                    <PremiumCreatorCard
                      key={profile.id}
                      profile={profile}
                      onSelect={handleProfileSelect}
                      variant="featured"
                      showFavoriteButton
                    />
                  ))}
            </div>
          </div>
        </section>
      )}

      {/* Mais Recentes */}
      {recent.length > 0 && (
        <section className="py-8 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="type-h2">Mais Recentes</h2>
              <Button
                variant="outline"
                onClick={() => {
                  setActiveCategory("recent");
                  setShowAllProfiles(false);
                  const el = document.getElementById("listings");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Ver tudo
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="rounded-xl border skeleton h-48 md:h-56" />
                  ))
                : recent.map((profile) => (
                    <PremiumCreatorCard
                      key={profile.id}
                      profile={profile}
                      onSelect={handleProfileSelect}
                      variant="default"
                      showFavoriteButton
                    />
                  ))}
            </div>
          </div>
        </section>
      )}

      {/* Trust Stats Bar removido */}

      {/* Social Proof Section */}
      <section className="py-12 px-4 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <SocialProof />
        </div>
      </section>

      {/* Value Proposition Section - For Businesses & Individuals */}
      <ValuePropositionSection
        onNavigate={(page) => {
          if (onNavigate) {
            onNavigate(page);
            return;
          }
          if (page === "auth") {
            navigate("/auth");
          } else if (page === "advertiser-dashboard") {
            navigate("/dashboard/advertiser");
          } else if (page === "creator-dashboard") {
            navigate("/dashboard/creator");
          } else {
            navigate("/");
          }
        }}
      />

      {/* Final CTA Section */}
      <section className="py-20 px-4 bg-gradient-hero text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
            <Globe className="h-4 w-4" />
            <span className="text-sm">{t('valueProposition.trustedBy')}</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            {t('valueProposition.creator.title')}
          </h2>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            {t('valueProposition.creator.description')}
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              size="lg" 
              className="bg-white text-primary hover:bg-white/90 gap-2 px-8"
              onClick={() => {
                if (onNavigate) {
                  onNavigate("auth");
                } else {
                  navigate("/auth");
                }
              }}
            >
              {t('valueProposition.creator.cta')}
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white/30 text-white hover:bg-white/10"
              onClick={() => {
                if (onNavigate) {
                  onNavigate("advertiser-dashboard");
                } else {
                  navigate("/dashboard/advertiser");
                }
              }}
            >
              {t('valueProposition.business.cta')}
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-background py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-primary p-2.5 rounded-xl">
                  <Globe className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-bold">StatusAds</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {t('global.tagline')}
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-background">{t('footer.about')}</h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li className="hover:text-primary transition-colors cursor-pointer">{t('footer.about')}</li>
                <li className="hover:text-primary transition-colors cursor-pointer">{t('footer.terms')}</li>
                <li className="hover:text-primary transition-colors cursor-pointer">{t('footer.privacy')}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-background">{t('navigation.creators')}</h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li className="hover:text-primary transition-colors cursor-pointer">{t('auth.register')}</li>
                <li className="hover:text-primary transition-colors cursor-pointer">{t('footer.help')}</li>
                <li className="hover:text-primary transition-colors cursor-pointer">{t('footer.contact')}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-background">{t('navigation.advertisers')}</h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li className="hover:text-primary transition-colors cursor-pointer">{t('valueProposition.business.cta')}</li>
                <li className="hover:text-primary transition-colors cursor-pointer">{t('footer.help')}</li>
                <li className="hover:text-primary transition-colors cursor-pointer">{t('footer.contact')}</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-muted mt-8 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              &copy; 2024 StatusAds. {t('global.platform')}
            </p>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <span className="hover:text-primary cursor-pointer">{t('footer.terms')}</span>
              <span className="hover:text-primary cursor-pointer">{t('footer.privacy')}</span>
              <span className="hover:text-primary cursor-pointer">{t('footer.contact')}</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating CTA */}
      <FloatingCTA 
        show={showFloatingCTA} 
        variant="creator" 
        onClick={() => {
          if (onNavigate) {
            onNavigate("auth");
          } else {
            navigate("/auth");
          }
        }} 
      />
    </div>
  );
};

export default Index;
