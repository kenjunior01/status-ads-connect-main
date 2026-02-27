import { useEffect, useState, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

type PaymentEvent = {
  id: string;
  provider: string;
  user_id: string | null;
  campaign_id: string | null;
  subscription_id: string | null;
  status: string;
  amount: number | null;
  created_at: string;
}

export const AdminPaymentEvents = () => {
  const [items, setItems] = useState<PaymentEvent[]>([]);
  const [provider, setProvider] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");

  const load = useCallback(async () => {
    let query = supabase.from("payment_events").select("*").order("created_at", { ascending: false }).limit(200);
    if (provider !== "all") query = query.eq("provider", provider);
    if (status !== "all") query = query.eq("status", status);
    const { data } = await query;
    setItems((data || []) as PaymentEvent[]);
  }, [provider, status]);

  useEffect(() => {
    load();
  }, [load]);

  const markResolved = async (id: string) => {
    await supabase.from("payment_events").update({ status: "resolved" }).eq("id", id);
    await load();
  };

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Payment Events</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <div className="w-[180px]">
              <Select value={provider} onValueChange={setProvider}>
                <SelectTrigger><SelectValue placeholder="Provider" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="mbway">MB Way</SelectItem>
                  <SelectItem value="multicaixa">Multicaixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-[180px]">
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="confirmed">Confirmado</SelectItem>
                  <SelectItem value="resolved">Resolvido</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={load}>Atualizar</Button>
          </div>
          <div className="space-y-2">
            {items.length === 0 ? (
              <div className="text-muted-foreground">Sem eventos.</div>
            ) : items.map(ev => (
              <div key={ev.id} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <div className="font-medium">{ev.provider} · {ev.status}</div>
                  <div className="text-xs text-muted-foreground">{new Date(ev.created_at).toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-xs">Sub: {ev.subscription_id ? ev.subscription_id.slice(0, 6) : "-"}</div>
                  <div className="text-xs">Camp: {ev.campaign_id ? ev.campaign_id.slice(0, 6) : "-"}</div>
                  <Button size="sm" variant="secondary" onClick={() => markResolved(ev.id)}>Marcar resolvido</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
