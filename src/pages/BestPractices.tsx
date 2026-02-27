import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Camera, Type, MousePointerClick } from "lucide-react";

const articles = [
  { id: "a1", title: "Como tirar um bom screenshot", icon: Camera, summary: "Dicas de iluminação, enquadramento e nitidez." },
  { id: "a2", title: "Call-to-Action eficaz", icon: Type, summary: "Frases que convertem e posicionamento no status." },
  { id: "a3", title: "Maximize engajamento", icon: MousePointerClick, summary: "Horários ideais e gatilhos de interação." },
];

export const BestPractices = () => {
  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Biblioteca de Melhores Práticas
          </CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-4">
          {articles.map(a => {
            const Icon = a.icon;
            return (
              <Card key={a.id} className="border-muted">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-primary" />
                    <div className="font-medium">{a.title}</div>
                  </div>
                  <div className="text-sm text-muted-foreground">{a.summary}</div>
                  <Badge variant="secondary">Tutorial</Badge>
                </CardContent>
              </Card>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
