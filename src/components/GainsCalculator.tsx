import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { useLocalizationContext } from "@/contexts/LocalizationContext";
import { getAdjustedPriceRange, computePlatformFee } from "@/lib/utils";

export const GainsCalculator = () => {
  const { format } = useLocalizationContext();
  const [views, setViews] = useState<number>(500);
  const [nicheMultiplier, setNicheMultiplier] = useState<number>(1);
  const [interactiveExtra, setInteractiveExtra] = useState<number>(0);
  const [packageCount, setPackageCount] = useState<number>(1);
  const [trust, setTrust] = useState<number>(75);
  const adj = getAdjustedPriceRange(views, { nicheMultiplier, trustScore: trust, interactiveExtra, packageCount });
  const fee = computePlatformFee(adj.recommended);
  const net = Math.max(0, adj.recommended - fee);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Calculadora de Custos/Ganhos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">Visualizações médias</div>
          <Slider value={[views]} min={50} max={5000} step={50} onValueChange={(v) => setViews(v[0])} />
          <div className="text-xs">{views}</div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <button className={`p-2 border rounded ${nicheMultiplier === 1 ? "border-primary" : ""}`} onClick={() => setNicheMultiplier(1)}>Genérico</button>
          <button className={`p-2 border rounded ${nicheMultiplier === 1.15 ? "border-primary" : ""}`} onClick={() => setNicheMultiplier(1.15)}>Tecnologia</button>
          <button className={`p-2 border rounded ${nicheMultiplier === 1.15 ? "border-primary" : ""}`} onClick={() => setNicheMultiplier(1.15)}>Finanças</button>
          <button className={`p-2 border rounded ${nicheMultiplier === 1.1 ? "border-primary" : ""}`} onClick={() => setNicheMultiplier(1.1)}>Moda</button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <button className={`p-2 border rounded ${interactiveExtra === 0 ? "border-primary" : ""}`} onClick={() => setInteractiveExtra(0)}>Sem extra</button>
          <button className={`p-2 border rounded ${interactiveExtra === 5 ? "border-primary" : ""}`} onClick={() => setInteractiveExtra(5)}>Vídeo curto</button>
          <button className={`p-2 border rounded ${interactiveExtra === 10 ? "border-primary" : ""}`} onClick={() => setInteractiveExtra(10)}>Interativo</button>
          <button className={`p-2 border rounded ${interactiveExtra === 20 ? "border-primary" : ""}`} onClick={() => setInteractiveExtra(20)}>Personalizado</button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button className={`p-2 border rounded ${packageCount === 1 ? "border-primary" : ""}`} onClick={() => setPackageCount(1)}>1</button>
          <button className={`p-2 border rounded ${packageCount === 3 ? "border-primary" : ""}`} onClick={() => setPackageCount(3)}>3</button>
          <button className={`p-2 border rounded ${packageCount === 5 ? "border-primary" : ""}`} onClick={() => setPackageCount(5)}>5</button>
        </div>
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">Trust Score</div>
          <Slider value={[trust]} min={0} max={100} step={1} onValueChange={(v) => setTrust(v[0])} />
          <div className="text-xs">{trust}</div>
        </div>
        <div className="grid md:grid-cols-3 gap-2">
          <Card>
            <CardContent className="p-3">
              <div className="text-xs text-muted-foreground">Preço mínimo</div>
              <div className="font-semibold text-primary">{format(adj.min)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="text-xs text-muted-foreground">Recomendado</div>
              <div className="font-semibold text-primary">{format(adj.recommended)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="text-xs text-muted-foreground">Máximo</div>
              <div className="font-semibold text-primary">{format(adj.max)}</div>
            </CardContent>
          </Card>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">Comissão {format(fee)}</Badge>
          <Badge className="bg-success/10 text-success">Líquido {format(net)}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
