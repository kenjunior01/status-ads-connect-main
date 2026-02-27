import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

type Pricing = { id: string; name: string; price: number; duration_hours: number; policy?: string | null; active: boolean };

export const AdminAdPricing = () => {
  const [items, setItems] = useState<Pricing[]>([]);
  const [form, setForm] = useState<Pricing>({ id: "", name: "", price: 0, duration_hours: 24, policy: "", active: true });

  const load = async () => {
    const { data } = await supabase.from("ad_pricing").select("*").order("created_at", { ascending: false });
    setItems((data || []) as Pricing[]);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.name || !form.price || !form.duration_hours) return;
    if (form.id) {
      await supabase.from("ad_pricing").update({
        name: form.name,
        price: form.price,
        duration_hours: form.duration_hours,
        policy: form.policy,
        active: form.active,
      }).eq("id", form.id);
    } else {
      await supabase.from("ad_pricing").insert({
        name: form.name,
        price: form.price,
        duration_hours: form.duration_hours,
        policy: form.policy,
        active: form.active,
      });
    }
    setForm({ id: "", name: "", price: 0, duration_hours: 24, policy: "", active: true });
    await load();
  };

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      <Card>
        <CardHeader><CardTitle>Preços e Políticas de Anúncios</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-4 gap-3">
            <div>
              <Label>Nome</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label>Preço (USD)</Label>
              <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className="mt-1" />
            </div>
            <div>
              <Label>Duração (horas)</Label>
              <Input type="number" value={form.duration_hours} onChange={(e) => setForm({ ...form, duration_hours: Number(e.target.value) })} className="mt-1" />
            </div>
            <div className="flex items-end">
              <div className="flex items-center gap-2">
                <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
                <span>Ativo</span>
              </div>
            </div>
          </div>
          <div>
            <Label>Política</Label>
            <Textarea value={form.policy || ""} onChange={(e) => setForm({ ...form, policy: e.target.value })} className="mt-1" rows={4} />
          </div>
          <div className="flex justify-end">
            <Button onClick={save}>{form.id ? "Atualizar" : "Adicionar"}</Button>
          </div>
          <div className="space-y-2">
            {items.map(p => (
              <div key={p.id} className="p-3 border rounded flex items-center justify-between">
                <div>
                  <div className="font-medium">{p.name} · ${p.price} · {p.duration_hours}h</div>
                  <div className="text-xs text-muted-foreground">{p.policy || "-"}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs">{p.active ? "Ativo" : "Inativo"}</span>
                  <Button variant="outline" size="sm" onClick={() => setForm(p)}>Editar</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
