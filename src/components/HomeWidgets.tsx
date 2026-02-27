import { useLocalizationContext } from "@/contexts/LocalizationContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Megaphone, Wallet, Sparkles, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface HomeWidgetsProps {
  onNavigate?: (page: string) => void;
}

export const HomeWidgets = ({ onNavigate }: HomeWidgetsProps) => {
  const { format } = useLocalizationContext();
  const navigate = useNavigate();

  const go = (page: string, fallback: string) => {
    if (onNavigate) {
      onNavigate(page);
    } else {
      navigate(fallback);
    }
  };

  const today = format(150);
  const month = format(2800);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
      <Card className="border-2 hover:border-primary/40 transition-colors hover-elevate">
        <CardHeader className="pb-2">
          <Badge className="bg-primary/10 text-primary border-0">Rápido</Badge>
          <CardTitle className="type-h2">Criar Campanha Rápida</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="type-secondary">Defina objetivo e orçamento em menos de 1 minuto.</p>
          <Button
            className="w-full gap-2"
            size="lg"
            onClick={() => go("advertiser-onboarding", "/onboarding/advertiser")}
          >
            <Megaphone className="h-4 w-4" />
            Começar
            <ArrowRight className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      <Card className="border-2 hover:border-success/40 transition-colors hover-elevate">
        <CardHeader className="pb-2">
          <Badge className="bg-success/10 text-success border-0">Ganhos</Badge>
          <CardTitle className="type-h2">Resumo de Ganhos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="type-secondary">Hoje</p>
              <p className="price-highlight">{today}</p>
            </div>
            <div>
              <p className="type-secondary">Este mês</p>
              <p className="price-highlight">{month}</p>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => go("creator-dashboard", "/dashboard/creator")}
          >
            <Wallet className="h-4 w-4" />
            Ver detalhes
          </Button>
        </CardContent>
      </Card>

      <Card className="border-2 hover:border-accent/40 transition-colors hover-elevate">
        <CardHeader className="pb-2">
          <Badge className="bg-accent/10 text-accent border-0">Sugestões</Badge>
          <CardTitle className="type-h2">Explorar Rápido</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="type-secondary">Encontre criadores e campanhas recomendadas para você.</p>
          <Button
            className="w-full gap-2"
            variant="default"
            onClick={() => go("creators", "/creators")}
          >
            <Sparkles className="h-4 w-4" />
            Explorar agora
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
