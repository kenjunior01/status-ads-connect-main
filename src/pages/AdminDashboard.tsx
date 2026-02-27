import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Users, Shield, TrendingUp, DollarSign, Eye, UserCheck, UserX, Settings } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AdminDisputes } from "@/components/AdminDisputes";
import { Input } from "@/components/ui/input";

export const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCreators: 0,
    totalAdvertisers: 0,
    totalCampaigns: 0,
    totalRevenue: 0,
  });
  type RoleRow = {
    user_id: string;
    role: string;
    created_at: string | null;
    profiles?: { display_name: string | null; is_verified: boolean | null; rating: number | null } | null;
  };
  const [users, setUsers] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select(`
          user_id,
          role,
          created_at,
          profiles:user_id (display_name, is_verified, rating)
        `);
      const { data: campaignsData } = await supabase
        .from('campaigns')
        .select('*');
      if (rolesData) {
        const creators = rolesData.filter(r => r.role === 'creator').length;
        const advertisers = rolesData.filter(r => r.role === 'advertiser').length;
        setStats({
          totalUsers: rolesData.length,
          totalCreators: creators,
          totalAdvertisers: advertisers,
          totalCampaigns: campaignsData?.length || 0,
          totalRevenue: campaignsData?.reduce((sum, c) => sum + (c.price || 0), 0) || 0,
        });
        const mapped: RoleRow[] = (rolesData as unknown as Array<{ user_id: string; role: string; created_at: string | null; profiles?: { display_name: string | null; is_verified: boolean | null; rating: number | null }[] | null }>).map((r) => {
          const p = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles?.[0];
          return {
            user_id: r.user_id,
            role: r.role,
            created_at: r.created_at ?? null,
            profiles: p ? {
              display_name: p.display_name ?? null,
              is_verified: Boolean(p.is_verified ?? false),
              rating: Number(p.rating ?? 0)
            } : null
          };
        });
        setUsers(mapped);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar dados do dashboard",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const EmailPromoter = () => {
    const [email, setEmail] = useState<string>("admin@bellvion.site");
    const isValid = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), [email]);
    const [submitting, setSubmitting] = useState(false);
    const onPromote = async () => {
      if (!isValid || submitting) return;
      setSubmitting(true);
      const { error } = await supabase.rpc('grant_admin_by_email', { _email: email });
      if (error) {
        toast({ title: "Erro", description: error.message || "Falha ao promover admin.", variant: "destructive" });
      } else {
        toast({ title: "Sucesso", description: "Admin concedido." });
      }
      setSubmitting(false);
    };
    return (
      <div className="p-4 border rounded-lg flex items-center gap-2">
        <Input value={email} onChange={(e) => setEmail(e.target.value)} className="max-w-sm" />
        <Button disabled={!isValid || submitting} onClick={onPromote}>
          {submitting ? "Promovendo..." : "Promover Admin"}
        </Button>
      </div>
    );
  };

type FeedbackItem = {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  approved: boolean;
  reward_points: number;
  reward_type: string | null;
};

const FeedbackManager = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [catalog, setCatalog] = useState<Array<{ id: string; name: string; type: string; points: number; active: boolean }>>([]);

  const fetchFeedback = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('user_feedback')
      .select('id, user_id, content, created_at, approved, reward_points, reward_type')
      .order('created_at', { ascending: false })
      .limit(50);
    setItems((data || []) as FeedbackItem[]);
    const { data: cat } = await supabase
      .from('reward_catalog')
      .select('id, name, type, points, active')
      .order('created_at', { ascending: false });
    setCatalog((cat || []) as Array<{ id: string; name: string; type: string; points: number; active: boolean }>);
    setLoading(false);
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

  const toggleApprove = async (id: string, approved: boolean) => {
    const { error } = await supabase
      .from('user_feedback')
      .update({ approved })
      .eq('id', id);
    if (error) {
      toast({ title: "Erro", description: "Falha ao atualizar.", variant: "destructive" });
    } else {
      fetchFeedback();
    }
  };

  const updateReward = async (id: string, reward_points: number, reward_type: string | null) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('user_feedback')
      .update({ reward_points, reward_type })
      .eq('id', id);
    if (error) {
      toast({ title: "Erro", description: "Falha ao atualizar recompensa.", variant: "destructive" });
    } else {
      if (user) {
        await supabase
          .from('reward_audit')
          .insert({ admin_id: user.id, feedback_id: id, action: 'set_reward', new_reward_points: reward_points, new_reward_type: reward_type });
      }
      fetchFeedback();
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-10 w-10 border-4 border-primary/20 border-t-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="p-4 border rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="font-medium">Catálogo de Recompensas</div>
          <Button variant="outline" size="sm" onClick={async () => {
            const { error } = await supabase.from('reward_catalog').insert({ name: 'Pontos', type: 'points', points: 10 });
            if (!error) fetchFeedback();
          }}>Adicionar</Button>
        </div>
        <div className="grid md:grid-cols-3 gap-3">
          {catalog.map((c) => (
            <div key={c.id} className="p-3 border rounded-lg flex items-center justify-between">
              <div>
                <div className="font-medium">{c.name}</div>
                <div className="text-xs text-muted-foreground">{c.type} • {c.points}</div>
              </div>
              <Button variant="outline" size="sm" onClick={async () => {
            const { data } = await supabase
                  .from('user_feedback')
                  .select('id')
                  .eq('approved', true)
                  .limit(1);
                const target = (data || [])[0];
                if (target) {
                  await updateReward(target.id, c.points, c.type);
                }
              }}>Aplicar Exemplo</Button>
            </div>
          ))}
        </div>
      </div>
      {items.map((f) => (
        <div key={f.id} className="p-4 border rounded-lg flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="text-xs text-muted-foreground mb-1">{new Date(f.created_at).toLocaleString()}</div>
            <div className="font-medium">{f.content}</div>
            <div className="mt-3 flex items-center gap-2">
              <Badge variant={f.approved ? "default" : "outline"}>
                {f.approved ? "Aprovado" : "Pendente"}
              </Badge>
              {f.reward_points > 0 && (
                <Badge className="bg-warning/10 text-warning border-0">
                  Recompensa {f.reward_points} {f.reward_type ? `• ${f.reward_type}` : ""}
                </Badge>
              )}
            </div>
          </div>
          <div className="w-64 space-y-2">
            <Button variant={f.approved ? "outline" : "default"} onClick={() => toggleApprove(f.id, !f.approved)}>
              {f.approved ? "Desaprovar" : "Aprovar"}
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Input type="number" placeholder="Pontos" defaultValue={f.reward_points} onBlur={(e) => updateReward(f.id, Number(e.target.value || 0), f.reward_type)} />
              <Input type="text" placeholder="Tipo" defaultValue={f.reward_type || ""} onBlur={(e) => updateReward(f.id, f.reward_points, e.target.value || null)} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Painel de Administração</h1>
          </div>
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Bem-vindo ao painel administrativo. Você tem controle total sobre a plataforma.
            </AlertDescription>
          </Alert>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-5 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Usuários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">usuários registrados</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Criadores</CardTitle>
              <UserCheck className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{stats.totalCreators}</div>
              <p className="text-xs text-muted-foreground">criadores ativos</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Anunciantes</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.totalAdvertisers}</div>
              <p className="text-xs text-muted-foreground">anunciantes ativos</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Campanhas</CardTitle>
              <Eye className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">{stats.totalCampaigns}</div>
              <p className="text-xs text-muted-foreground">campanhas criadas</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita</CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">
                R$ {stats.totalRevenue.toLocaleString('pt-BR')}
              </div>
              <p className="text-xs text-muted-foreground">receita total</p>
            </CardContent>
          </Card>
        </div>

        {/* Admin Tabs */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="creators">Criadores</TabsTrigger>
            <TabsTrigger value="campaigns">Campanhas</TabsTrigger>
            <TabsTrigger value="auctions">Leilões</TabsTrigger>
            <TabsTrigger value="presence">Presença</TabsTrigger>
            <TabsTrigger value="subscriptions">Subscrições</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
            <TabsTrigger value="disputes">Disputas</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
          </TabsList>

          {/* Users Management */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Gerenciar Usuários</CardTitle>
                <CardDescription>
                  Visualize e gerencie todos os usuários da plataforma
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user, index) => (
                    <div key={user.user_id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center text-white font-semibold">
                          {(user.profiles?.display_name || `User ${index + 1}`).charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium">
                            {user.profiles?.display_name || `User ${index + 1}`}
                          </p>
                          <div className="flex items-center gap-2">
                            <Badge variant={
                              user.role === 'admin' ? 'destructive' :
                              user.role === 'creator' ? 'default' :
                              user.role === 'advertiser' ? 'secondary' : 'outline'
                            }>
                              {user.role}
                            </Badge>
                            {user.profiles?.is_verified && (
                              <Badge variant="outline" className="text-success">
                                Verificado
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {user.profiles?.rating && (
                          <div className="text-sm text-muted-foreground">
                            ⭐ {user.profiles.rating}
                          </div>
                        )}
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Other tabs placeholders */}
          <TabsContent value="creators">
            <Card>
              <CardHeader>
                <CardTitle>Gerenciar Criadores</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Funcionalidade de gerenciamento de criadores será implementada aqui.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="campaigns">
            <Card>
              <CardHeader>
                <CardTitle>Gerenciar Campanhas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Funcionalidade de gerenciamento de campanhas será implementada aqui.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="auctions">
            <Card>
              <CardHeader>
                <CardTitle>Gerenciar Leilões</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">Habilite leilões em campanhas e acompanhe lances.</p>
                <Button variant="outline" onClick={() => window.open('/auctions', '_self')}>
                  Abrir página de Leilões
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="presence">
            <Card>
              <CardHeader>
                <CardTitle>Presença na Plataforma</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">Monitore online/offline e atividade recente.</p>
                <div className="grid md:grid-cols-2 gap-4">
                  {users.map((user, index) => (
                    <div key={user.user_id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{user.profiles?.display_name || `User ${index + 1}`}</div>
                        <Badge variant="outline">{user.role}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-2">Status: ativo</div>
                      <div className="flex items-center gap-2 mt-2">
                        <Button size="sm" variant="outline">Forçar logout</Button>
                        <Button size="sm" variant="outline">Suspender</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscriptions">
            <Card>
              <CardHeader>
                <CardTitle>Subscrições</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">Gerencie planos, faturamento e status de pagamento.</p>
                <div className="grid md:grid-cols-2 gap-4">
                  {users.map((user, index) => (
                    <div key={user.user_id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{user.profiles?.display_name || `User ${index + 1}`}</div>
                        <Badge variant="outline">Plano: Basic</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-2">Próxima cobrança: em 30 dias</div>
                      <div className="flex items-center gap-2 mt-2">
                        <Button size="sm" variant="outline">Atualizar Plano</Button>
                        <Button size="sm" variant="outline">Cancelar</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="feedback">
            <Card>
              <CardHeader>
                <CardTitle>Feedback de Usuários</CardTitle>
                <CardDescription>Aprovar, destacar e atribuir recompensas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-muted-foreground">Gestão de feedback será ativada após ajustes de schema.</div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="disputes">
            <Card>
              <CardHeader>
                <CardTitle>Disputas</CardTitle>
                <CardDescription>Resolva disputas e aplique reembolsos quando necessário</CardDescription>
              </CardHeader>
              <CardContent>
                <AdminDisputes />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Configurações do Sistema</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">Configurações globais da plataforma.</p>
                <EmailPromoter />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
