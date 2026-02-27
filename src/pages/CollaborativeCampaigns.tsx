import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, Users, CalendarDays, Check, Link as LinkIcon, Sparkles } from "lucide-react";
import { useProfiles } from "@/hooks/useProfiles";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type MemberSelection = {
  id: string;
  display_name: string;
  selected: boolean;
};

export const CollaborativeCampaigns = () => {
  const { profiles, loading } = useProfiles();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("brand");
  const [startAt, setStartAt] = useState<Date | undefined>(undefined);
  const [endAt, setEndAt] = useState<Date | undefined>(undefined);
  const [postingWindowMinutes, setPostingWindowMinutes] = useState<number>(60);
  const [creating, setCreating] = useState(false);
  const [chainEnabled, setChainEnabled] = useState(false);

  const members: MemberSelection[] = useMemo(() => {
    return profiles.slice(0, 30).map(p => ({
      id: p.profile_id || p.id,
      display_name: p.display_name,
      selected: false,
    }));
  }, [profiles]);

  const [selection, setSelection] = useState<MemberSelection[]>(members);

  const toggleSelect = (id: string) => {
    setSelection(prev => prev.map(m => m.id === id ? { ...m, selected: !m.selected } : m));
  };

  const selectedCount = selection.filter(m => m.selected).length;

  const handleCreate = async () => {
    if (!title.trim() || selectedCount === 0 || !startAt || !endAt) {
      toast({ title: "Preencha os campos", description: "Título, período e membros são obrigatórios.", variant: "destructive" });
      return;
    }
    setCreating(true);
    try {
      const payload = {
        title,
        content,
        category,
        start_at: startAt.toISOString(),
        end_at: endAt.toISOString(),
        window_minutes: postingWindowMinutes,
        chain_enabled: chainEnabled,
      };
      const { data: campaign, error } = await supabase
        .from("collaborative_campaigns")
        .insert(payload)
        .select()
        .maybeSingle();
      if (error) throw error;
      const membersPayload = selection.filter(s => s.selected).map(s => ({
        campaign_id: campaign?.id,
        profile_id: s.id,
      }));
      const { error: mErr } = await supabase.from("collaborative_members").insert(membersPayload);
      if (mErr) throw mErr;
      toast({ title: "Campanha criada", description: "Convidei os criadores selecionados." });
    } catch {
      toast({ title: "Banco não preparado", description: "Crie tabelas collaborative_campaigns e collaborative_members no Supabase.", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Campanhas Colaborativas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Lançamento Coordenado - Linha X" />
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="brand">Awareness de Marca</SelectItem>
                  <SelectItem value="product">Produto</SelectItem>
                  <SelectItem value="service">Serviço</SelectItem>
                  <SelectItem value="event">Evento</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Conteúdo (modelo)</Label>
            <Input value={content} onChange={(e) => setContent(e.target.value)} placeholder="Texto sugerido para o status" />
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><CalendarDays className="h-4 w-4" /> Início</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    {startAt ? format(startAt, "PPP", { locale: ptBR }) : "Selecione a data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={startAt} onSelect={setStartAt} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><CalendarDays className="h-4 w-4" /> Término</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    {endAt ? format(endAt, "PPP", { locale: ptBR }) : "Selecione a data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={endAt} onSelect={setEndAt} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Janela de Postagem (min)</Label>
              <Input type="number" min={15} max={240} value={postingWindowMinutes} onChange={(e) => setPostingWindowMinutes(Number(e.target.value || 60))} />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2"><LinkIcon className="h-4 w-4" /> Status Chain</Label>
            <div className="flex items-center gap-2">
              <Button variant={chainEnabled ? "default" : "outline"} onClick={() => setChainEnabled(!chainEnabled)}>
                {chainEnabled ? "Ativado" : "Desativado"}
              </Button>
              <span className="text-xs text-muted-foreground">Permite linkar status em sequência entre criadores</span>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Selecionar Criadores ({selectedCount})</Label>
            <div className="grid md:grid-cols-2 gap-2 max-h-[280px] overflow-y-auto border rounded p-2">
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : selection.map(m => (
                <button
                  key={m.id}
                  className={`flex items-center justify-between p-2 rounded border ${m.selected ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}
                  onClick={() => toggleSelect(m.id)}
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary">{m.display_name?.charAt(0) || "?"}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{m.display_name}</span>
                  </div>
                  {m.selected && <Check className="h-4 w-4 text-primary" />}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Coordenados: {selectedCount}</Badge>
              <Badge className="bg-success/10 text-success">Efeito cascata</Badge>
              <Badge className="bg-warning/10 text-warning">Viralidade</Badge>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
              Criar Campanha Coordenada
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
