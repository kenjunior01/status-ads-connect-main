
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCampaigns } from "@/hooks/useCampaigns";
import { useLocalizationContext } from "@/contexts/LocalizationContext";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ComposedChart
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  Eye, 
  MousePointer2, 
  Target,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Share2,
  MousePointerClick
} from "lucide-react";

export const AnalyticsDashboard = () => {
  const { campaigns } = useCampaigns();
  const { format } = useLocalizationContext();
  
  const totalClicks = campaigns.reduce((sum, c) => sum + (Number(c.total_clicks || 0)), 0);
  const totalReach = campaigns.reduce((sum, c) => sum + (Number(c.reach) || 0), 0);
  const avgCTR = totalReach > 0 ? (totalClicks / totalReach) * 100 : 0;
  const totalSpent = campaigns.reduce((sum, c) => sum + (Number(c.spent) || 0), 0);

  // Mock data for charts since real historical data isn't in DB yet
  const chartData = [
    { name: 'Seg', impressions: totalReach * 0.1, clicks: totalClicks * 0.08 },
    { name: 'Ter', impressions: totalReach * 0.15, clicks: totalClicks * 0.12 },
    { name: 'Qua', impressions: totalReach * 0.2, clicks: totalClicks * 0.18 },
    { name: 'Qui', impressions: totalReach * 0.18, clicks: totalClicks * 0.15 },
    { name: 'Sex', impressions: totalReach * 0.25, clicks: totalClicks * 0.22 },
    { name: 'Sáb', impressions: totalReach * 0.08, clicks: totalClicks * 0.15 },
    { name: 'Dom', impressions: totalReach * 0.04, clicks: totalClicks * 0.1 },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Alcance Total</p>
                <p className="text-2xl font-bold">{totalReach.toLocaleString('pt-BR')}</p>
              </div>
              <div className="bg-primary/10 p-2 rounded-full">
                <Eye className="h-5 w-5 text-primary" />
              </div>
            </div>
            <Badge variant="secondary" className="mt-2">
              <TrendingUp className="h-3 w-3 mr-1 text-success" />
              +12.5%
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cliques Totais</p>
                <p className="text-2xl font-bold">{totalClicks.toLocaleString('pt-BR')}</p>
              </div>
              <div className="bg-success/10 p-2 rounded-full">
                <MousePointerClick className="h-5 w-5 text-success" />
              </div>
            </div>
            <Badge variant="secondary" className="mt-2">
              CTR: {avgCTR.toFixed(2)}%
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Investimento</p>
                <p className="text-2xl font-bold">{format(totalSpent)}</p>
              </div>
              <div className="bg-warning/10 p-2 rounded-full">
                <DollarSign className="h-5 w-5 text-warning" />
              </div>
            </div>
            <Badge variant="secondary" className="mt-2">
              ROI Est: 3.4x
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Campanhas</p>
                <p className="text-2xl font-bold">{campaigns.length}</p>
              </div>
              <div className="bg-accent/10 p-2 rounded-full">
                <Target className="h-5 w-5 text-accent" />
              </div>
            </div>
            <Badge variant="secondary" className="mt-2">
              {campaigns.filter(c => c.status === 'active').length} ativas
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Main Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Performance de Cliques vs Alcance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorImpressions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  itemStyle={{ fontSize: '12px' }}
                />
                <Area
                  type="monotone"
                  dataKey="impressions"
                  name="Alcance"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorImpressions)"
                />
                <Area
                  type="monotone"
                  dataKey="clicks"
                  name="Cliques"
                  stroke="hsl(var(--success))"
                  strokeWidth={2}
                  fill="hsl(var(--success)/0.1)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Campaign List Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Performance por Campanha</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {campaigns.slice(0, 5).map((campaign, index) => {
              const ctr = campaign.reach ? ((Number(campaign.total_clicks || 0) / Number(campaign.reach)) * 100).toFixed(2) : "0.00";
              return (
                <div 
                  key={campaign.id}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-primary/10 text-primary font-bold w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center">
                      {index + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{campaign.title}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {Number(campaign.reach || 0).toLocaleString('pt-BR')}
                        </span>
                        <span className="flex items-center gap-1">
                          <MousePointerClick className="h-3 w-3" />
                          {Number(campaign.total_clicks || 0).toLocaleString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-primary">CTR: {ctr}%</p>
                    <p className="text-xs text-muted-foreground uppercase font-semibold">
                      {campaign.status}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
