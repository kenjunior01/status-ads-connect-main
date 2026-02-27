import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Megaphone, Flame, Users, Trophy } from "lucide-react";

const items = [
  { key: "discover", label: "Descobrir", icon: Users },
  { key: "promos", label: "Promoções", icon: Megaphone },
  { key: "relampago", label: "Relâmpago", icon: Flame },
  { key: "desafios", label: "Desafios", icon: Trophy },
];

export const QuickCategories = () => {
  return (
    <div className="grid grid-cols-4 gap-3 md:gap-4">
      {items.map((it) => {
        const Icon = it.icon;
        return (
          <Card key={it.key} className="bg-card/70 backdrop-blur hover:shadow-strong transition-all hover-ring">
            <CardContent className="p-3 md:p-4 flex flex-col items-center gap-2">
              <div className="p-2 rounded-full bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <Badge variant="secondary" className="text-xs px-2 py-0.5">{it.label}</Badge>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
