import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProgressCTA } from "@/components/EnhancedCTA";
import { TrustIndicators } from "@/components/TrustIndicators";
import { MetricsCard } from "@/components/MetricsCard";
import { CampaignCard } from "@/components/CampaignCard";
import { ProfileEditForm } from "@/components/ProfileEditForm";
import { EarningsChart } from "@/components/EarningsChart";
import { NotificationButton } from "@/components/NotificationsPanel";
import { ProofUploadForm } from "@/components/ProofUploadForm";
import { VerificationBadge } from "@/components/VerificationBadge";
import { CreatorWallet } from "@/components/CreatorWallet";
import { CreatorPortfolio } from "@/components/CreatorPortfolio";
import { CampaignChat } from "@/components/CampaignChat";
import { useProfile } from "@/hooks/useProfile";
import { useCampaigns, type VerificationStatus } from "@/hooks/useCampaigns";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
// Preços por Tier removido
import { MiniBarChart, MiniLineChart } from "@/components/MiniCharts";
import { QuestBadges } from "@/components/QuestBadges";
import { QuestsWidget } from "@/components/QuestsWidget";
import { 
  DollarSign, 
  TrendingUp, 
  Star, 
  Eye,
  Settings,
  Award,
  Target,
  Loader2,
  Upload,
  Wallet,
  MessageSquare
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ReferralItem {
  id: string;
  display_name: string | null;
  target_role: string | null;
  created_at: string | null;
}

export const CreatorDashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedCampaignForProof, setSelectedCampaignForProof] = useState<string | null>(null);
  const [selectedCampaignForChat, setSelectedCampaignForChat] = useState<string | null>(null);
  const { profile, loading: profileLoading } = useProfile();
  const { campaigns, loading: campaignsLoading, acceptCampaign, declineCampaign } = useCampaigns();
  const { user } = useAuth();
  const [referralsCount, setReferralsCount] = useState<number | null>(null);
  const [referrals, setReferrals] = useState<ReferralItem[]>([]);

  const activeCampaigns = campaigns.filter(c => c.status === 'active' || c.status === 'pending');
  const completedCampaigns = campaigns.filter(c => c.status === 'completed');
  
  const totalEarnings = completedCampaigns.reduce((sum, c) => sum + Number(c.price), 0);
  const monthlyEarnings = completedCampaigns
    .filter(c => {
      const completedDate = c.completed_at ? new Date(c.completed_at) : null;
      if (!completedDate) return false;
      const now = new Date();
      return completedDate.getMonth() === now.getMonth() && completedDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, c) => sum + Number(c.price), 0);

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
  }, [user]);

  if (profileLoading || campaignsLoading) {
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
        <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">Painel do Criador</h1>
            <p className="text-muted-foreground mt-1">Olá, {profile?.display_name || 'Criador'}! Gerencie suas campanhas e monitore seus ganhos</p>
          </div>
          <div className="flex gap-2">
            <NotificationButton />
            {user && (
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  const url = `${window.location.origin}/auth?ref=${user.id}&role=advertiser`;
                  const text = `Estou monetizando meus Status no StatusAds. Crie sua conta de anunciante e faça campanhas comigo: ${url}`;
                  try {
                    await navigator.clipboard.writeText(text);
                  } catch {
                    window.prompt("Copie o texto abaixo para compartilhar:", text);
                  }
                }}
              >
                Convidar Anunciante
              </Button>
            )}
            <Button variant="outline" size="sm"><Settings className="h-4 w-4 mr-2" />Configurações</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <MetricsCard title="Total Ganho" value={`R$ ${totalEarnings.toFixed(2)}`} icon={DollarSign} variant="success" trend={{ value: 12.5, isPositive: true }} />
          <MetricsCard title="Este Mês" value={`R$ ${monthlyEarnings.toFixed(2)}`} icon={TrendingUp} variant="primary" trend={{ value: 8.3, isPositive: true }} />
          <MetricsCard title="Campanhas Ativas" value={activeCampaigns.length} icon={Target} variant="warning" subtitle="Em andamento" />
          <MetricsCard title="Avaliação Média" value={profile?.rating || 0} icon={Star} variant="default" subtitle={`${profile?.total_reviews || 0} avaliações`} />
          <MetricsCard title="Indicações" value={referralsCount ?? 0} icon={Eye} variant="default" subtitle={referralLevel} />
          <MetricsCard title="Próximas Campanhas" value={activeCampaigns.length} icon={Target} variant="default" subtitle="Agendadas" />
          <MetricsCard title="Média de Visualizações" value={Math.max(100, (completedCampaigns.length || 1) * 120)} icon={Eye} variant="default" subtitle="estimada" />
          <MetricsCard title="Trust Score" value={Math.round((profile?.engagement_rate || 0.85) * 100)} icon={Award} variant="default" subtitle="confiança" />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-5 md:grid-cols-7 overflow-x-auto">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="campaigns">Campanhas</TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="portfolio">Portfólio</TabsTrigger>
            <TabsTrigger value="wallet" className="flex items-center gap-1">
              <Wallet className="h-4 w-4" />
              Carteira
            </TabsTrigger>
            <TabsTrigger value="earnings">Ganhos</TabsTrigger>
            <TabsTrigger value="profile">Perfil</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Award className="h-5 w-5" />Performance</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center"><span className="text-sm">Taxa de Resposta</span><span className="font-semibold text-success">96%</span></div>
                  <div className="flex justify-between items-center"><span className="text-sm">Campanhas Concluídas</span><span className="font-semibold">{completedCampaigns.length}</span></div>
                  <div className="flex justify-between items-center"><span className="text-sm">Visualizações do Perfil</span><span className="font-semibold">{profile?.total_campaigns || 0}</span></div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Próximos Passos</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <ProgressCTA currentStep={profile?.bio ? 3 : 2} totalSteps={5} nextAction="Completar Perfil" onClick={() => setActiveTab("profile")} />
                  {completedCampaigns.length > 0 && (
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {completedCampaigns.slice(0, 5).map((campaign) => (
                        <div key={campaign.id} className="flex items-center justify-between gap-2 border border-muted rounded-md px-3 py-2">
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{campaign.title}</p>
                            <p className="text-xs text-muted-foreground">R$ {Number(campaign.price).toFixed(2)}</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              const url = `${window.location.origin}/go/${campaign.id}`;
                              const summary = `Campanha concluída via StatusAds\n\nTítulo: ${campaign.title}\nLink da oferta: ${url}\n\nGerenciado pela plataforma StatusAds.`;
                              try {
                                await navigator.clipboard.writeText(summary);
                              } catch {
                                window.prompt("Copie o texto abaixo para compartilhar:", summary);
                              }
                            }}
                          >
                            Copiar Link de Divulgação
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
              <QuestBadges />
            </div>
            {/* Planejamento de Preços removido */}
            <Card>
              <CardHeader><CardTitle className="text-lg">Mini gráficos</CardTitle></CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-3">
                {(() => {
                  const week = ["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"];
                  const views = week.map((n,i)=>({ name:n, v:(profile?.total_campaigns||5)*10 + i*7 }));
                  const gains = week.map((n,i)=>({ name:n, g:(completedCampaigns.length||2)*50 + i*12 }));
                  return (
                    <>
                      <MiniBarChart data={views} dataKey="v" />
                      <MiniLineChart data={gains} dataKey="g" />
                    </>
                  );
                })()}
              </CardContent>
            </Card>
            {referrals.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Indicações recentes</CardTitle>
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
            <TrustIndicators />
          </TabsContent>

          <TabsContent value="campaigns" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">{t('dashboard.campaigns')}</h2>
              <Button><Eye className="h-4 w-4 mr-2" />Ver Disponíveis</Button>
            </div>
            
            {selectedCampaignForProof && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Enviar Comprovante
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ProofUploadForm 
                    campaignId={selectedCampaignForProof} 
                    onSuccess={() => setSelectedCampaignForProof(null)}
                  />
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setSelectedCampaignForProof(null)}
                  >
                    Cancelar
                  </Button>
                </CardContent>
              </Card>
            )}
            
            {campaigns.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">Você ainda não tem campanhas. Aguarde propostas de anunciantes!</p>
              </Card>
            ) : (
              <div className="grid gap-4">
                {campaigns.map((campaign) => (
                  <Card key={campaign.id} className="p-4">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold truncate">{campaign.title}</h3>
                          <VerificationBadge status={(campaign.verification_status as VerificationStatus) || 'not_started'} />
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
                        {campaign.status === 'pending' && (
                          <>
                            <Button 
                              size="sm"
                              className="bg-success hover:bg-success/90"
                              onClick={() => acceptCampaign(campaign.id)}
                            >
                              Aceitar
                            </Button>
                            <Button 
                              size="sm"
                              variant="outline"
                              className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                              onClick={() => declineCampaign(campaign.id, 'Criador recusou a proposta')}
                            >
                              Recusar
                            </Button>
                          </>
                        )}
                        {campaign.status === 'active' && campaign.verification_status !== 'verified' && (
                          <Button 
                            size="sm"
                            onClick={() => setSelectedCampaignForProof(campaign.id)}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Enviar Prova
                          </Button>
                        )}
                        <Button 
                          size="sm"
                          className="bg-gradient-primary"
                          onClick={() => navigate(`/campaigns/${campaign.id}`)}
                        >
                          Ver Detalhes
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="chat" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Suas Conversas</h2>
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
                    Você ainda não possui campanhas para iniciar um chat.
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

          <TabsContent value="portfolio" className="space-y-6">
            <CreatorPortfolio />
          </TabsContent>

          <TabsContent value="wallet"><CreatorWallet /></TabsContent>

          <TabsContent value="earnings"><EarningsChart /></TabsContent>

          <TabsContent value="profile"><ProfileEditForm /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
