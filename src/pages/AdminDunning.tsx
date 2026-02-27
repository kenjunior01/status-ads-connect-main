import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export const AdminDunning = () => {
  const { toast } = useToast();
  const [running, setRunning] = useState(false);
  const run = async () => {
    try {
      setRunning(true);
      const res = await fetch("/functions/v1/subscription-dunning", { method: "GET" });
      const json = await res.json();
      toast({ title: "Dunning", description: `Past_due: ${json.setPastDue} · Cancelados: ${json.canceled}` });
    } catch (e) {
      toast({ title: "Erro", description: e instanceof Error ? e.message : String(e), variant: "destructive" });
    } finally {
      setRunning(false);
    }
  };
  return (
    <div className="max-w-3xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Dunning de Assinaturas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Executa verificação de assinaturas vencidas, marca como past_due e cancela após período de graça.
          </p>
          <Button onClick={run} disabled={running}>
            {running ? "Executando..." : "Executar agora"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
