import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { DollarSign, Gavel, CheckCircle2, Loader2 } from "lucide-react";
import { useLocalization } from "@/hooks/useLocalization";

interface Campaign {
  id: string;
  title: string;
  description: string | null;
  price: number | null;
  influence_category: string | null;
  suggested_min: number | null;
  suggested_max: number | null;
  fairness_status: string | null;
  allow_auction: boolean | null;
}

export const Auctions = () => {
  const { toast } = useToast();
  const { format, currency, convert } = useLocalization();
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string>("");
  const [bidAmount, setBidAmount] = useState<number | "">("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchAuctions = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('campaigns')
          .select('id, title, description, price, influence_category, suggested_min, suggested_max, fairness_status, allow_auction')
          .or('fairness_status.eq.requires_auction,allow_auction.eq.true');
        if (error) throw error;
        setCampaigns(data || []);
      } catch (err) {
        console.error(err);
        toast({ title: "Erro", description: "Falha ao carregar leilões." , variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchAuctions();
  }, [toast]);

  const enableAuction = async (id: string) => {
    try {
      const { error } = await supabase
        .from('campaigns')
        .update({ allow_auction: true })
        .eq('id', id);
      if (error) throw error;
      toast({ title: "Leilão habilitado", description: "Campanha pronta para receber lances." });
      setCampaigns(prev => prev.map(c => c.id === id ? { ...c, allow_auction: true } : c));
    } catch (err) {
      toast({ title: "Erro", description: "Não foi possível habilitar leilão.", variant: "destructive" });
    }
  };

  const submitBid = async () => {
    if (!selectedCampaign || typeof bidAmount !== "number" || bidAmount <= 0) {
      toast({ title: "Lance inválido", description: "Selecione campanha e informe valor.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Faça login", description: "Você precisa estar autenticado para enviar lances.", variant: "destructive" });
        return;
      }
      const { error } = await supabase
        .from('auction_bids')
        .insert({ campaign_id: selectedCampaign, bidder_id: user.id, amount: bidAmount, currency });
      if (error) throw error;
      toast({ title: "Lance enviado", description: "Você entrou no leilão com sucesso." });
      setBidAmount("");
    } catch (err) {
      toast({ title: "Erro", description: "Falha ao enviar lance.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center gap-3">
          <Gavel className="h-6 w-6 text-primary" />
          <h1 className="type-h2">Leilões</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Criar Lance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                <SelectTrigger className="w-72">
                  <SelectValue placeholder="Selecionar campanha" />
                </SelectTrigger>
                <SelectContent>
                  {campaigns.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                placeholder="Valor do lance"
                value={bidAmount === "" ? "" : bidAmount}
                onChange={(e) => setBidAmount(e.target.value ? Number(e.target.value) : "")}
              />
              <Button onClick={submitBid} disabled={submitting} className="gap-2">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <DollarSign className="h-4 w-4" />}
                Enviar Lance
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">
              Seu lance será registrado e considerado pelo anunciante. Campanhas com categoria Elite exigem leilão.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Campanhas elegíveis</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            {campaigns.map(c => (
              <div key={c.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{c.title}</div>
                  {c.allow_auction ? (
                    <Badge className="bg-primary/10 text-primary border-0">Leilão habilitado</Badge>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => enableAuction(c.id)}>
                      Habilitar Leilão
                    </Button>
                  )}
                </div>
                <div className="text-sm text-muted-foreground mt-2">
                  Categoria: {c.influence_category || "N/A"}
                </div>
                <div className="flex items-center gap-2 text-sm mt-2">
                  <span className="text-muted-foreground">Faixa sugerida</span>
                  <span className="font-semibold">
                    {c.suggested_min && c.suggested_max ? `${format(convert(Number(c.suggested_min), "USD", currency))} - ${format(convert(Number(c.suggested_max), "USD", currency))}` : "Leilão recomendado"}
                  </span>
                </div>
                {c.fairness_status === 'requires_auction' && (
                  <div className="mt-2 flex items-center gap-2 text-xs">
                    <CheckCircle2 className="h-3 w-3 text-warning" />
                    <span className="text-warning">Requer leilão</span>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
