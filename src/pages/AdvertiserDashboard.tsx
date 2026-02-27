import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EnhancedProfileCard } from "@/components/EnhancedProfileCard";
import { TrustIndicators } from "@/components/TrustIndicators";
import { MetricsCard } from "@/components/MetricsCard";
import { CampaignCard } from "@/components/CampaignCard";
import { SearchFilters } from "@/components/SearchFilters";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import { CreateCampaignDialog } from "@/components/CreateCampaignForm";
import { NotificationButton } from "@/components/NotificationsPanel";
import { ProofReviewPanel } from "@/components/ProofReviewPanel";
import { VerificationBadge } from "@/components/VerificationBadge";
import { CampaignChat } from "@/components/CampaignChat";
import { useCampaigns, type VerificationStatus } from "@/hooks/useCampaigns";
import { useProfiles } from "@/hooks/useProfiles";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Target, TrendingUp, Eye, Settings, DollarSign, Loader2, CheckCircle, MessageSquare } from "lucide-react";
// Preços por Tier removido
import { GainsCalculator } from "@/components/GainsCalculator";
import { MiniBarChart, MiniLineChart } from "@/components/MiniCharts";
import { QuestsWidget } from "@/components/QuestsWidget";
import { CountryActivityWidget } from "@/components/CountryActivityWidget";

interface ReferralItem {
  id: string;
  display_name: string | null;
  target_role: string | null;
  created_at: string | null;
}

export const AdvertiserDashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedCampaignForReview, setSelectedCampaignForReview] = useState<string | null>(null);
  const [selectedCampaignForChat, setSelectedCampaignForChat] = useState<string | null>(null);
  const [selectedCampaignForDetails, setSelectedCampaignForDetails] = useState<string | null>(null);
  const [availableCredits, setAvailableCredits] = useState<number | null>(null);
  const { campaigns, loading: campaignsLoading } = useCampaigns();
  const { profiles, loading: profilesLoading } = useProfiles();
  const { user } = useAuth();
  const [referralsCount, setReferralsCount] = useState<number | null>(null);
  const [referrals, setReferrals] = useState<ReferralItem[]>([]);

  const activeCampaigns = campaigns.filter(c => c.status === 'active' || c.status === 'pending');
  const totalSpent = campaigns.filter(c => c.status === 'completed').reduce((sum, c) => sum + Number(c.price), 0);

  const referralLevel =
    !referralsCount || referralsCount === 0
      ? "Comece a convidar"
      : referralsCount < 3
      ? "Nível Bronze"
      : referralsCount < 6
      ? "Nível Prata"
      : "Nível Ouro";

  useEffect(() => {
    const fetchReferrals = async () => {
      if (!user) {
        setReferralsCount(null);
        setReferrals([]);
        return;
      }
      const { data, error } = await supabase
        .from("user_referrals")
        .select("id, target_role, created_at, metadata")
        .eq("source_user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (!error) {
        const safeData = data || [];
        setReferralsCount(safeData.length);
        type Row = { id: string; metadata?: { display_name?: string | null } | null; target_role?: string | null; created_at?: string | null };
        const mapped: ReferralItem[] = safeData.map((row: Row) => ({
          id: row.id,
          display_name: row.metadata?.display_name ?? null,
          target_role: row.target_role ?? null,
          created_at: row.created_at ?? null,
        }));
        setReferrals(mapped);
      }
    };
    fetchReferrals();
    const fetchCredits = async () => {
      if (!user) {
        setAvailableCredits(null);
        return;
      }
      try {
        const { data, error } = await supabase
          .from("advertiser_wallets")
          .select("available_credits")
          .eq("user_id", user.id)
          .maybeSingle();
        if (!error) {
          setAvailableCredits(Number(data?.available_credits ?? 0));
        }
      } catch {
        setAvailableCredits(null);
      }
    };
    fetchCredits();
  }, [user]);

  const getStatusColor = (status: string | null) => {
    switch (status) { 
      case 'active': return 'bg-success'; 
      case 'pending': return 'bg-warning'; 
      case 'completed': return 'bg-primary'; 
      default: return 'bg-muted'; 
    }
  };

  if (campaignsLoading || profilesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Carregando seu painel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <QuestsWidget />
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">Painel do Anunciante</h1>
            <p className="text-muted-foreground mt-1">Gerencie campanhas e encontre os melhores criadores</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <CreateCampaignDialog>
              <Button size="lg" className="bg-gradient-primary hover:opacity-90 shadow-lg">
                <Plus className="h-5 w-5 mr-2" />
                Nova Campanha
              </Button>
            </CreateCampaignDialog>
            {user && (
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  const url = `${window.location.origin}/auth?ref=${user.id}&role=creator`;
                  const text = `Estou anunciando no StatusAds. Crie sua conta de criador para receber campanhas: ${url}`;
                  try {
                    await navigator.clipboard.writeText(text);
                  } catch {
                    window.prompt("Copie o texto abaixo para compartilhar:", text);
                  }
                }}
              >
                Convidar Criador
              </Button>
            )}
            <NotificationButton />
            <Button variant="outline" size="sm"><Settings className="h-4 w-4 mr-2" />Configurações</Button>
          </div>
        </div>

        {/* Planejamento Rápido de Preços removido */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Mini gráficos</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-3">
              {(() => {
                const week = ["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"];
                const act = week.map((n,i)=>({ name:n, a:activeCampaigns.length + i }));
                const tot = week.map((n,i)=>({ name:n, t:campaigns.length + i }));
                return (
                  <>
                    <MiniBarChart data={act} dataKey="a" />
                    <MiniLineChart data={tot} dataKey="t" />
                  </>
                );
              })()}
            </CardContent>
          </Card>
          <CountryActivityWidget />
        </div>

        {/* Prominent CTA for empty state */}
        {campaigns.length === 0 && (
          <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-foreground">Comece sua primeira campanha!</h3>
                <p className="text-muted-foreground">Conecte-se com criadores e alcance milhares de visualizações no WhatsApp Status</p>
              </div>
              <CreateCampaignDialog>
                <Button size="lg" className="bg-gradient-primary hover:opacity-90 shadow-lg whitespace-nowrap">
                  <Plus className="h-5 w-5 mr-2" />
                  Criar Minha Primeira Campanha
                </Button>
              </CreateCampaignDialog>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <MetricsCard title="Campanhas Ativas" value={activeCampaigns.length} icon={Target} variant="primary" trend={{ value: 25, isPositive: true }} />
          <MetricsCard title="Total Investido" value={`R$ ${totalSpent.toFixed(0)}`} icon={DollarSign} variant="success" trend={{ value: 15.2, isPositive: true }} />
          <MetricsCard title="Criadores Disponíveis" value={profiles.length} icon={Eye} variant="warning" subtitle="na plataforma" />
          <MetricsCard title="Campanhas Totais" value={campaigns.length} icon={TrendingUp} variant="default" />
          <MetricsCard title="Indicações" value={referralsCount ?? 0} icon={CheckCircle} variant="default" subtitle={referralLevel} />
          <MetricsCard title="Créditos Disponíveis" value={availableCredits !== null ? `R$ ${availableCredits.toFixed(0)}` : "—"} icon={DollarSign} variant="default" subtitle="para novas campanhas" />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 sm:grid-cols-5 md:grid-cols-6 overflow-x-auto">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="campaigns">Campanhas</TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="verification" className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4" />
              Verificação
            </TabsTrigger>
            <TabsTrigger value="creators">Criadores</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Target className="h-5 w-5" />Campanhas Recentes</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {campaigns.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">Nenhuma campanha ainda</p>
                  ) : (
                    campaigns.slice(0, 3).map((campaign) => (
                      <div key={campaign.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                        <div><div className="font-medium">{campaign.title}</div><div className="text-sm text-muted-foreground">R$ {Number(campaign.price).toFixed(2)}</div></div>
                        <Badge className={getStatusColor(campaign.status || 'pending')}>{campaign.status === 'active' ? 'Ativa' : campaign.status === 'completed' ? 'Concluída' : 'Pendente'}</Badge>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Resultados para compartilhar
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        const rows = campaigns
                          .filter(c => c.status === "completed")
                          .map(c => [`${c.title}`, `${Number(c.price).toFixed(2)}`, `${c.status}`]);
                        const header = [["Título","Investimento","Status"]];
                        const csv = [...header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
                        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = "relatorios_recent.csv";
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                    >
                      Exportar CSV
                    </Button>
                    <Button
                      variant="outline"
                      onClick={async () => {
                        const payload = campaigns
                          .filter(c => c.status === "completed")
                          .map(c => ({ id: c.id, title: c.title, price: c.price, status: c.status }));
                        const text = JSON.stringify(payload, null, 2);
                        try {
                          await navigator.clipboard.writeText(text);
                        } catch {
                          window.prompt("Copie os relatórios:", text);
                        }
                      }}
                    >
                      Copiar JSON
                    </Button>
                  </div>
                  {campaigns.filter(c => c.status === "completed").length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Assim que você concluir campanhas, geraremos um texto pronto para você compartilhar com sua equipe ou clientes.
                    </p>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground">
                        Escolha uma campanha concluída para copiar um resumo e compartilhar no WhatsApp ou email.
                      </p>
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {campaigns
                          .filter(c => c.status === "completed")
                          .slice(0, 5)
                          .map((campaign) => (
                            <div key={campaign.id} className="flex items-center justify-between gap-2 border border-muted rounded-md px-3 py-2">
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">{campaign.title}</p>
                                <p className="text-xs text-muted-foreground">R$ {Number(campaign.price).toFixed(2)}</p>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={async () => {
                                  const summary = `Resultados da campanha no StatusAds\n\nTítulo: ${campaign.title}\nInvestimento: R$ ${Number(campaign.price).toFixed(2)}\nStatus: Concluída\nCriador: campanha veiculada via Status do WhatsApp\n\nGerenciado pela plataforma StatusAds.`;
                                  try {
                                    await navigator.clipboard.writeText(summary);
                                  } catch {
                                    window.prompt("Copie o texto abaixo para compartilhar:", summary);
                                  }
                                }}
                              >
                                Copiar
                              </Button>
                            </div>
                          ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Relatórios Recentes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {campaigns.filter(c => c.status === "completed").slice(0, 3).map((campaign) => (
                  <div key={campaign.id} className="flex items-center justify-between gap-2 border border-muted rounded-md px-3 py-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{campaign.title}</p>
                      <p className="text-xs text-muted-foreground">R$ {Number(campaign.price).toFixed(2)}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        const report = `Relatório - ${campaign.title}\nInvestimento: R$ ${Number(campaign.price).toFixed(2)}\nStatus: Concluída`;
                        try {
                          await navigator.clipboard.writeText(report);
                        } catch {
                          window.prompt("Copie o relatório:", report);
                        }
                      }}
                    >
                      Copiar relatório
                    </Button>
                  </div>
                ))}
                {campaigns.filter(c => c.status === "completed").length === 0 && (
                  <p className="text-sm text-muted-foreground">Sem relatórios ainda. Conclua campanhas para gerar relatórios.</p>
                )}
              </CardContent>
            </Card>
            {referrals.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Novos usuários indicados</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {referrals.map((ref) => (
                    <div key={ref.id} className="flex items-center justify-between gap-2 border border-muted rounded-md px-3 py-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{ref.display_name || "Novo usuário"}</p>
                        <p className="text-xs text-muted-foreground">
                          {ref.target_role === "creator"
                            ? "Criador indicado"
                            : ref.target_role === "advertiser"
                            ? "Anunciante indicado"
                            : "Usuário indicado"}
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="campaigns" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Suas Campanhas</h2>
              <CreateCampaignDialog><Button><Plus className="h-4 w-4 mr-2" />Nova Campanha</Button></CreateCampaignDialog>
            </div>
            {campaigns.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">Você ainda não tem campanhas. Crie sua primeira campanha!</p>
              </Card>
            ) : (
              <div className="grid gap-4">
                {campaigns.map((campaign) => (
                  <Card key={campaign.id} className="p-4">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold truncate">{campaign.title}</h3>
                          <VerificationBadge status={(campaign.verification_status as 'not_started' | 'proof_submitted' | 'under_review' | 'verified' | 'rejected') || 'not_started'} />
                        </div>
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{campaign.description}</p>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="font-medium text-success">R$ {Number(campaign.price).toFixed(2)}</span>
                          <Badge variant={campaign.status === 'active' ? 'default' : campaign.status === 'completed' ? 'secondary' : 'outline'}>
                            {campaign.status === 'active' ? 'Ativa' : campaign.status === 'completed' ? 'Concluída' : 'Pendente'}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedCampaignForChat(campaign.id);
                            setActiveTab('chat');
                          }}
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Chat
                        </Button>
                        <Button 
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedCampaignForDetails(campaign.id)}
                        >
                          Analytics
                        </Button>
                        <Button 
                          size="sm"
                          className="bg-gradient-primary"
                          onClick={() => navigate(`/campaigns/${campaign.id}`)}
                        >
                          Ver Detalhes
                        </Button>
                        {campaign.verification_status === 'proof_submitted' && (
                          <Button 
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedCampaignForReview(campaign.id);
                              setActiveTab('verification');
                            }}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Revisar Prova
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
            {selectedCampaignForDetails && (
              <Card>
                <CardHeader>
                  <CardTitle>Analytics da Campanha</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(() => {
                    const camp = campaigns.find(c => c.id === selectedCampaignForDetails);
                    const week = ["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"];
                    const reachBase = Number(camp?.reach ?? 500);
                    const spentBase = Number((camp?.spent ?? camp?.price ?? 100));
                    const impressions = week.map((n,i)=>({ name:n, v: Math.round(reachBase * (0.8 + i*0.03)) }));
                    const spend = week.map((n,i)=>({ name:n, g: Math.round(spentBase * (0.7 + i*0.05)) }));
                    return (
                      <>
                        <div className="grid md:grid-cols-2 gap-3">
                          <MiniBarChart data={impressions} dataKey="v" />
                          <MiniLineChart data={spend} dataKey="g" />
                        </div>
                        <div className="flex items-center justify-end">
                          <Button variant="outline" onClick={() => setSelectedCampaignForDetails(null)}>Fechar</Button>
                        </div>
                      </>
                    );
                  })()}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="chat" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Conversas</h2>
            </div>
            
            {selectedCampaignForChat ? (
              <div className="space-y-4">
                <Button variant="outline" size="sm" onClick={() => setSelectedCampaignForChat(null)}>
                  ← Voltar para lista
                </Button>
                <div className="max-w-3xl mx-auto">
                  <CampaignChat campaignId={selectedCampaignForChat} />
                </div>
              </div>
            ) : (
              <div className="grid gap-4">
                {campaigns.length === 0 ? (
                  <Card className="p-8 text-center text-muted-foreground">
                    Inicie uma campanha para conversar com criadores.
                  </Card>
                ) : (
                  campaigns.map((campaign) => (
                    <Card 
                      key={campaign.id} 
                      className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => setSelectedCampaignForChat(campaign.id)}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-full">
                            <MessageSquare className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-sm truncate">{campaign.title}</h3>
                            <p className="text-xs text-muted-foreground">Clique para abrir a conversa</p>
                          </div>
                        </div>
                        <Button size="sm" variant="ghost">Abrir Chat</Button>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="verification" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Verificação de Publicações</h2>
            </div>
            
            {selectedCampaignForReview ? (
              <div className="space-y-4">
                <Button variant="outline" onClick={() => setSelectedCampaignForReview(null)}>
                  ← Voltar para lista
                </Button>
                <ProofReviewPanel 
                  campaignId={selectedCampaignForReview} 
                  isAdvertiser={true}
                />
              </div>
            ) : (
              <>
                {campaigns.filter(c => c.verification_status === 'proof_submitted' || c.verification_status === 'under_review').length === 0 ? (
                  <Card className="p-8 text-center">
                    <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Nenhuma prova pendente de verificação.</p>
                    <p className="text-sm text-muted-foreground mt-2">Quando criadores enviarem comprovantes, eles aparecerão aqui.</p>
                  </Card>
                ) : (
                  <div className="grid gap-4">
                    {campaigns
                      .filter(c => c.verification_status === 'proof_submitted' || c.verification_status === 'under_review')
                      .map((campaign) => (
                        <Card key={campaign.id} className="p-4 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setSelectedCampaignForReview(campaign.id)}>
                          <div className="flex justify-between items-center">
                            <div>
                              <h3 className="font-semibold">{campaign.title}</h3>
                              <p className="text-sm text-muted-foreground">R$ {Number(campaign.price).toFixed(2)}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <VerificationBadge status={(campaign.verification_status as 'not_started' | 'proof_submitted' | 'under_review' | 'verified' | 'rejected') || 'not_started'} />
                              <Button size="sm">Revisar</Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="creators" className="space-y-6">
            <h2 className="text-xl font-semibold">Encontrar Criadores</h2>
            <SearchFilters onFiltersChange={() => {}} showPriceFilter showNicheFilter showRatingFilter showLocationFilter />
            {profiles.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">Nenhum criador disponível no momento.</p>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {profiles.map((creator) => (
                  <EnhancedProfileCard 
                    key={creator.id} 
                    profile={{
                      id: creator.id,
                      display_name: creator.display_name,
                      niche: creator.niche || '',
                      price_range: creator.price_range || '',
                      rating: Number(creator.rating) || 0,
                      total_reviews: creator.total_reviews || 0,
                      total_campaigns: creator.total_campaigns || 0,
                      is_verified: creator.is_verified || false,
                      badge_level: creator.badge_level || 'bronze',
                      created_at: creator.created_at || ''
                    }} 
                    onSelect={() => {}} 
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="analytics"><AnalyticsDashboard /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
