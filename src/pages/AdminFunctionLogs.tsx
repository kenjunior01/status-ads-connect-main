import { useEffect, useState, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

type LogEvent = {
  id: string;
  provider: string;
  level: string;
  message: string | null;
  created_at: string;
}

export const AdminFunctionLogs = () => {
  const [items, setItems] = useState<LogEvent[]>([]);
  const [provider, setProvider] = useState<string>("all");
  const [level, setLevel] = useState<string>("error");

  const load = useCallback(async () => {
    let query = supabase.from("function_logs").select("*").order("created_at", { ascending: false }).limit(200);
    if (provider !== "all") query = query.eq("provider", provider);
    if (level !== "all") query = query.eq("level", level);
    const { data } = await query;
    setItems((data || []) as LogEvent[]);
  }, [provider, level]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Function Logs</CardTitle>
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
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger><SelectValue placeholder="Level" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="error">Erro</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="all">Todos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={load}>Atualizar</Button>
          </div>
          <div className="space-y-2">
            {items.length === 0 ? (
              <div className="text-muted-foreground">Sem logs.</div>
            ) : items.map(ev => (
              <div key={ev.id} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <div className="font-medium">{ev.provider} · {ev.level}</div>
                  <div className="text-xs text-muted-foreground">{new Date(ev.created_at).toLocaleString()}</div>
                </div>
                <div className="text-xs max-w-md truncate">{ev.message}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
