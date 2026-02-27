import { Card, CardContent } from "@/components/ui/card";
import { MetricsCard } from "@/components/MetricsCard";
import { useProfiles } from "@/hooks/useProfiles";
import { useCampaigns, type Campaign } from "@/hooks/useCampaigns";
import { useLocalizationContext } from "@/contexts/LocalizationContext";
import { Users, Building2, Target, Wallet, Shield, Star } from "lucide-react";

export const HomeStats = () => {
  const { profiles } = useProfiles();
  const { campaigns } = useCampaigns();
  const { format } = useLocalizationContext();

  const totalCreators = profiles.length;
  const totalAdvertisers = new Set(
    campaigns.map((c: Campaign) => c.advertiser_id).filter((id): id is string => Boolean(id))
  ).size;
  const completedCampaigns = campaigns.filter((c) => c.status === "completed");
  const totalPaid = completedCampaigns.reduce(
    (sum, c) => sum + (Number(c.price) || 0),
    0
  );
  const countries = new Set(
    profiles.map((p) => p.country_code).filter((c) => !!c)
  ).size;

  const ratingAvg = (() => {
    const rated = profiles.filter((p) => p.total_reviews > 0);
    if (!rated.length) return "—";
    const avg =
      rated.reduce((sum, p) => sum + (p.rating || 0), 0) / rated.length;
    return `${avg.toFixed(1)}★`;
  })();

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <MetricsCard
        title="Países"
        value={countries || "180+"}
        icon={Users}
        variant="primary"
      />
      <MetricsCard
        title="Criadores Ativos"
        value={totalCreators}
        icon={Users}
        variant="success"
      />
      <MetricsCard
        title="Anunciantes"
        value={totalAdvertisers || 0}
        icon={Building2}
        variant="default"
      />
      <MetricsCard
        title="Campanhas Concluídas"
        value={completedCampaigns.length}
        icon={Target}
        variant="warning"
      />
      <MetricsCard
        title="Pagos aos Criadores"
        value={format(totalPaid)}
        icon={Wallet}
        variant="default"
      />
      <MetricsCard title="Pagamento Seguro" value="100%" icon={Shield} />
      <MetricsCard title="Avaliação" value={ratingAvg} icon={Star} />
      <Card className="hidden md:block">
        <CardContent className="p-4"></CardContent>
      </Card>
    </div>
  );
}
