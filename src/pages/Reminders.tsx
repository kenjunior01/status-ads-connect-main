import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type Reminder = {
  id: string;
  title: string;
  description: string | null;
  trigger_at: string;
  sent: boolean;
}

export const Reminders = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<Reminder[]>([]);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("reminders")
      .select("*")
      .eq("user_id", user.id)
      .order("trigger_at", { ascending: true });
    setItems((data || []) as Reminder[]);
  };

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Faça login", description: "Entre para criar lembretes.", variant: "destructive" });
        return;
      }
      if (!title || !date || !time) {
        toast({ title: "Campos obrigatórios", description: "Título, data e hora.", variant: "destructive" });
        return;
      }
      const when = new Date(`${date}T${time}:00`).toISOString();
      const { error } = await supabase.from("reminders").insert({
        user_id: user.id,
        title,
        description: desc || null,
        trigger_at: when,
        type: "custom",
      });
      if (error) throw error;
      setTitle("");
      setDesc("");
      setDate("");
      setTime("");
      toast({ title: "Lembrete criado", description: "Será disparado no horário programado." });
      await load();
    } catch {
      toast({ title: "Erro", description: "Não foi possível criar o lembrete.", variant: "destructive" });
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Lembretes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <Label>Título</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Descrição</Label>
              <Input value={desc} onChange={(e) => setDesc(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Data</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Hora</Label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="mt-1" />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={create}>Criar Lembrete</Button>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Próximos lembretes</CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-muted-foreground">Nenhum lembrete.</div>
          ) : (
            <div className="space-y-2">
              {items.map((r) => (
                <div key={r.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-medium">{r.title}</div>
                    <div className="text-xs text-muted-foreground">{new Date(r.trigger_at).toLocaleString()}</div>
                  </div>
                  <div className="text-xs">{r.sent ? "Enviado" : "Agendado"}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
