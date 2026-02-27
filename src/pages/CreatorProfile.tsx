import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { FavoriteButton } from "@/components/FavoriteButton";
import { useFavorites } from "@/hooks/useFavorites";
import { useLocalizationContext } from "@/contexts/LocalizationContext";
import { 
  Star, 
  Verified, 
  MessageCircle, 
  Eye, 
  TrendingUp, 
  Clock,
  Calendar,
  MapPin,
  Users,
  Award,
  Check,
  ArrowLeft,
  Share2,
  Flag,
  Zap,
  Package,
  ImageIcon,
  BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";
// Preços por Tier removido
import { MiniBarChart, MiniLineChart } from "@/components/MiniCharts";

interface CreatorProfileProps {
  profile: {
    id: string;
    display_name: string;
    niche: string | null;
    price_range: string | null;
    rating: number;
    total_reviews: number;
    total_campaigns: number;
    is_verified: boolean;
    badge_level: string;
    referral_level: string | null;
    created_at: string;
  };
  onBack?: () => void;
  onContact?: () => void;
}

const referralLevelConfig = {
  "Iniciante": { color: "bg-muted", label: "Novato", textColor: "text-muted-foreground" },
  "Bronze": { color: "bg-amber-600/10 text-amber-600 border-amber-600/20", label: "Influenciador Bronze", textColor: "text-amber-600" },
  "Prata": { color: "bg-slate-400/10 text-slate-500 border-slate-400/20", label: "Influenciador Prata", textColor: "text-slate-500" },
  "Ouro": { color: "bg-amber-400/10 text-amber-500 border-amber-400/20", label: "Influenciador Ouro", textColor: "text-amber-500" }
};

const badgeConfig = {
  bronze: { color: "bg-amber-600", label: "Novo Talento", textColor: "text-amber-600" },
  silver: { color: "bg-slate-400", label: "Em Crescimento", textColor: "text-slate-500" },
  gold: { color: "bg-amber-400", label: "Top Performer", textColor: "text-amber-500" },
  platinum: { color: "bg-purple-500", label: "Elite", textColor: "text-purple-600" }
};

const servicePackages = [
  {
    id: "basic",
    name: "Básico",
    price: 50,
    description: "Ideal para testar sua primeira campanha",
    features: [
      "1 Story no WhatsApp Status",
      "24 horas de exposição",
      "Relatório básico de visualizações"
    ],
    popular: false
  },
  {
    id: "standard",
    name: "Padrão",
    price: 120,
    description: "Melhor custo-benefício para sua marca",
    features: [
      "3 Stories no WhatsApp Status",
      "48 horas de exposição",
      "Relatório completo de métricas",
      "Link direto para seu produto",
      "Repost em caso de baixo alcance"
    ],
    popular: true
  },
  {
    id: "premium",
    name: "Premium",
    price: 250,
    description: "Máxima exposição e engajamento",
    features: [
      "5 Stories no WhatsApp Status",
      "72 horas de exposição",
      "Relatório completo + analytics",
      "Link + CTA personalizado",
      "Garantia de visualizações mínimas",
      "Suporte prioritário"
    ],
    popular: false
  }
];

const mockReviews = [
  {
    id: "1",
    advertiser: "João Silva",
    rating: 5,
    comment: "Excelente profissional! Entregou antes do prazo e com qualidade superior ao esperado.",
    date: "2024-01-15",
    campaign: "Lançamento de Produto"
  },
  {
    id: "2",
    advertiser: "Maria Santos",
    rating: 4,
    comment: "Muito bom engajamento com o público. Recomendo para campanhas de lifestyle.",
    date: "2024-01-10",
    campaign: "Promoção de Verão"
  },
  {
    id: "3",
    advertiser: "Pedro Costa",
    rating: 5,
    comment: "Criador comprometido e com ótima taxa de resposta. Já fechamos 3 campanhas juntos!",
    date: "2024-01-05",
    campaign: "Black Friday"
  }
];

const mockAudienceStats = {
  gender: { male: 35, female: 62, other: 3 },
  ageGroups: [
    { range: "18-24", percentage: 25 },
    { range: "25-34", percentage: 45 },
    { range: "35-44", percentage: 20 },
    { range: "45+", percentage: 10 }
  ],
  topLocations: [
    { city: "São Paulo", percentage: 35 },
    { city: "Rio de Janeiro", percentage: 20 },
    { city: "Belo Horizonte", percentage: 12 },
    { city: "Curitiba", percentage: 8 },
    { city: "Outros", percentage: 25 }
  ]
};

const mockPortfolio = [
  { id: "1", type: "image", url: "/placeholder.svg", campaign: "Nike Brasil" },
  { id: "2", type: "image", url: "/placeholder.svg", campaign: "Nubank" },
  { id: "3", type: "image", url: "/placeholder.svg", campaign: "iFood" },
  { id: "4", type: "image", url: "/placeholder.svg", campaign: "Magazine Luiza" },
  { id: "5", type: "image", url: "/placeholder.svg", campaign: "Natura" },
  { id: "6", type: "image", url: "/placeholder.svg", campaign: "Ambev" }
];

export const CreatorProfile = ({ profile, onBack, onContact }: CreatorProfileProps) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { format, getCurrentCountry } = useLocalizationContext();
  const [selectedPackage, setSelectedPackage] = useState("standard");
  
  const badge = badgeConfig[profile.badge_level as keyof typeof badgeConfig] || badgeConfig.bronze;
  const responseRate = 85 + Math.floor(Math.random() * 15);
  const avgResponseTime = "< 2 horas";
  const memberSince = new Date(profile.created_at).toLocaleDateString('pt-BR', { 
    month: 'long', 
    year: 'numeric' 
  });
  
  const country = getCurrentCountry();

  // Generate consistent gradient based on name
  const gradients = [
    "from-blue-500 to-purple-600",
    "from-emerald-500 to-teal-600",
    "from-orange-500 to-rose-600",
    "from-violet-500 to-indigo-600",
    "from-pink-500 to-rose-600",
    "from-cyan-500 to-blue-600",
  ];
  const avatarGradient = gradients[profile.display_name.charCodeAt(0) % gradients.length];

  return (
    <div className="min-h-screen bg-background">
      {/* Header Actions */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button variant="ghost" onClick={onBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Share2 className="h-4 w-4" />
            </Button>
            <FavoriteButton
              isFavorite={isFavorite(profile.id)}
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(profile);
              }}
              variant="default"
            />
            <Button variant="ghost" size="icon">
              <Flag className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Header */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-6">
                  {/* Avatar */}
                  <div className="relative">
                    <div className={cn(
                      "w-32 h-32 rounded-2xl overflow-hidden bg-gradient-to-br",
                      avatarGradient
                    )}>
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-5xl font-bold text-white">
                          {profile.display_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    {profile.is_verified && (
                      <div className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground rounded-full p-2 shadow-medium">
                        <Verified className="h-5 w-5" />
                      </div>
                    )}
                    <div className="absolute -bottom-2 -left-2 flex items-center gap-1 bg-card px-2 py-1 rounded-full shadow-medium border border-border">
                      <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                      <span className="text-xs text-success font-medium">Online</span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 space-y-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h1 className="text-2xl font-bold text-foreground">
                          {profile.display_name}
                        </h1>
                        <Badge className={cn("text-xs", badge.textColor)} variant="outline">
                      {badge.label}
                    </Badge>
                    {profile.referral_level && (
                      <Badge 
                        className={cn(
                          "text-[10px] uppercase tracking-tighter", 
                          referralLevelConfig[profile.referral_level as keyof typeof referralLevelConfig]?.color
                        )} 
                        variant="outline"
                      >
                        {referralLevelConfig[profile.referral_level as keyof typeof referralLevelConfig]?.label}
                      </Badge>
                    )}
                  </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        {profile.niche && <span>{profile.niche}</span>}
                        {country && (
                          <>
                            <Separator orientation="vertical" className="h-3" />
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              <span>{country.name}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Stats Row */}
                    <div className="flex flex-wrap gap-4">
                      {profile.total_reviews > 0 && (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-warning fill-warning" />
                          <span className="font-semibold">{profile.rating.toFixed(1)}</span>
                          <span className="text-muted-foreground text-sm">
                            ({profile.total_reviews} avaliações)
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Eye className="h-4 w-4" />
                        <span>{profile.total_campaigns} campanhas</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MessageCircle className="h-4 w-4" />
                        <span>{responseRate}% resposta</span>
                      </div>
                    </div>

                    {/* Quick Info */}
                    <div className="flex flex-wrap gap-3 text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>Responde em {avgResponseTime}</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Membro desde {memberSince}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs Content */}
            <Tabs defaultValue="packages" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="packages" className="gap-1">
                  <Package className="h-4 w-4" />
                  <span className="hidden sm:inline">Pacotes</span>
                </TabsTrigger>
                <TabsTrigger value="portfolio" className="gap-1">
                  <ImageIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Portfólio</span>
                </TabsTrigger>
                <TabsTrigger value="audience" className="gap-1">
                  <BarChart3 className="h-4 w-4" />
                  <span className="hidden sm:inline">Audiência</span>
                </TabsTrigger>
                <TabsTrigger value="reviews" className="gap-1">
                  <Star className="h-4 w-4" />
                  <span className="hidden sm:inline">Avaliações</span>
                </TabsTrigger>
              </TabsList>

              {/* Packages Tab */}
              <TabsContent value="packages" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {servicePackages.map((pkg) => (
                    <Card 
                      key={pkg.id}
                      className={cn(
                        "relative cursor-pointer transition-all duration-300",
                        selectedPackage === pkg.id 
                          ? "ring-2 ring-primary shadow-strong" 
                          : "hover:shadow-medium",
                        pkg.popular && "border-primary"
                      )}
                      onClick={() => setSelectedPackage(pkg.id)}
                    >
                      {pkg.popular && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <Badge className="bg-primary text-primary-foreground">
                            Mais Popular
                          </Badge>
                        </div>
                      )}
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">{pkg.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{pkg.description}</p>
                      </CardHeader>
                      <CardContent>
                        <div className="mb-4">
                          <span className="text-3xl font-bold text-foreground">
                            {format(pkg.price)}
                          </span>
                        </div>
                        <ul className="space-y-2">
                          {pkg.features.map((feature, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <Check className="h-4 w-4 text-success shrink-0 mt-0.5" />
                              <span className="text-muted-foreground">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Portfolio Tab */}
              <TabsContent value="portfolio" className="mt-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {mockPortfolio.map((item) => (
                    <div 
                      key={item.id}
                      className="group relative aspect-[9/16] rounded-xl overflow-hidden bg-muted cursor-pointer"
                    >
                      <img 
                        src={item.url} 
                        alt={item.campaign}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="absolute bottom-3 left-3 right-3">
                          <p className="text-white text-sm font-medium">{item.campaign}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* Audience Tab */}
              <TabsContent value="audience" className="mt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Gender */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Gênero da Audiência</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Feminino</span>
                          <span className="font-medium">{mockAudienceStats.gender.female}%</span>
                        </div>
                        <Progress value={mockAudienceStats.gender.female} className="h-2" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Masculino</span>
                          <span className="font-medium">{mockAudienceStats.gender.male}%</span>
                        </div>
                        <Progress value={mockAudienceStats.gender.male} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Age Groups */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Faixa Etária</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {mockAudienceStats.ageGroups.map((group) => (
                        <div key={group.range} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>{group.range}</span>
                            <span className="font-medium">{group.percentage}%</span>
                          </div>
                          <Progress value={group.percentage} className="h-2" />
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Locations */}
                  <Card className="md:col-span-2">
                    <CardHeader>
                      <CardTitle className="text-base">Principais Localizações</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {mockAudienceStats.topLocations.map((loc) => (
                          <div key={loc.city} className="text-center p-3 bg-muted rounded-lg">
                            <MapPin className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                            <p className="font-medium text-sm">{loc.city}</p>
                            <p className="text-xs text-muted-foreground">{loc.percentage}%</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Histórico de Visualizações e Ganhos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const week = ["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"];
                      const views = week.map((n,i)=>({ name:n, v:(profile?.total_campaigns||5)*20 + i*15 }));
                      const gains = week.map((n,i)=>({ name:n, g:(profile?.rating||4.5)*50 + i*12 }));
                      return (
                        <div className="grid md:grid-cols-2 gap-3">
                          <MiniBarChart data={views} dataKey="v" />
                          <MiniLineChart data={gains} dataKey="g" />
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Reviews Tab */}
              <TabsContent value="reviews" className="mt-6 space-y-4">
                {mockReviews.map((review) => (
                  <Card key={review.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-medium text-foreground">{review.advertiser}</p>
                          <p className="text-xs text-muted-foreground">{review.campaign}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i}
                              className={cn(
                                "h-4 w-4",
                                i < review.rating 
                                  ? "text-warning fill-warning" 
                                  : "text-muted"
                              )}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{review.comment}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(review.date).toLocaleDateString('pt-BR')}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar - Sticky CTA */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              {/* Price Card */}
              <Card className="border-primary/20">
                <CardContent className="p-6 space-y-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">A partir de</p>
                    <p className="text-4xl font-bold text-foreground">
                      {profile.price_range ? format(parseInt(profile.price_range.replace(/\D/g, '') || '50')) : format(50)}
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <Button 
                      className="w-full gap-2" 
                      size="lg"
                      onClick={onContact}
                    >
                      <MessageCircle className="h-4 w-4" />
                      Enviar Proposta
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full gap-2"
                      onClick={() => toggleFavorite(profile)}
                    >
                      <FavoriteButton
                        isFavorite={isFavorite(profile.id)}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(profile);
                        }}
                        size="sm"
                        className="h-4 w-4 min-h-0 min-w-0"
                      />
                      {isFavorite(profile.id) ? "Remover dos Favoritos" : "Adicionar aos Favoritos"}
                    </Button>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Zap className="h-4 w-4 text-warning" />
                      <span className="text-muted-foreground">Resposta rápida garantida</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Award className="h-4 w-4 text-primary" />
                      <span className="text-muted-foreground">Pagamento seguro</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Trust Badges */}
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-medium mb-3 text-sm">Por que contratar?</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-success" />
                      <span>{profile.total_campaigns}+ campanhas concluídas</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-success" />
                      <span>{responseRate}% taxa de resposta</span>
                    </div>
                    {profile.is_verified && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Check className="h-4 w-4 text-success" />
                        <span>Identidade verificada</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-success" />
                      <span>Entrega dentro do prazo</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tiers de Audiência removido */}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
