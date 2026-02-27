
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Eye, Image as ImageIcon } from "lucide-react";

interface PortfolioItem {
  id: string;
  image_url: string;
  title: string | null;
  description: string | null;
  metrics: Record<string, number> | null;
  created_at: string;
}

export const CreatorPortfolio = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [newItem, setNewItem] = useState({ title: '', description: '', file: null as File | null });

  const fetchPortfolio = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('creator_portfolio')
        .select('*')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (err) {
      console.error('Error fetching portfolio:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newItem.file) return;

    setUploading(true);
    try {
      const fileExt = newItem.file.name.split('.').pop();
      const fileName = `${user.id}/${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('portfolio')
        .upload(fileName, newItem.file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('portfolio')
        .getPublicUrl(fileName);

      const { error: dbError } = await supabase
        .from('creator_portfolio')
        .insert({
          creator_id: user.id,
          image_url: publicUrl,
          title: newItem.title,
          description: newItem.description,
        });

      if (dbError) throw dbError;

      toast({ title: "Sucesso!", description: "Item adicionado ao portfólio." });
      setNewItem({ title: '', description: '', file: null });
      fetchPortfolio();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      toast({ title: "Erro no upload", description: message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string, imageUrl: string) => {
    if (!confirm('Tem certeza que deseja excluir este item?')) return;

    try {
      const { error: dbError } = await supabase
        .from('creator_portfolio')
        .delete()
        .eq('id', id);

      if (dbError) throw dbError;

      // Also try to delete from storage if possible (optional but good practice)
      const path = imageUrl.split('/portfolio/').pop();
      if (path) {
        await supabase.storage.from('portfolio').remove([path]);
      }

      setItems(items.filter(item => item.id !== id));
      toast({ title: "Excluído", description: "Item removido do portfólio." });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      toast({ title: "Erro ao excluir", description: message, variant: "destructive" });
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Adicionar ao Portfólio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título da Campanha (opcional)</Label>
                <Input 
                  id="title" 
                  value={newItem.title} 
                  onChange={e => setNewItem({...newItem, title: e.target.value})}
                  placeholder="Ex: Lançamento Marca X"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="file">Captura de Tela (Status do WhatsApp)</Label>
                <Input 
                  id="file" 
                  type="file" 
                  accept="image/*"
                  onChange={e => setNewItem({...newItem, file: e.target.files?.[0] || null})}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição/Resultados (opcional)</Label>
              <Textarea 
                id="description" 
                value={newItem.description}
                onChange={e => setNewItem({...newItem, description: e.target.value})}
                placeholder="Ex: 5000 visualizações em 24h, 150 cliques no link."
              />
            </div>
            <Button type="submit" disabled={uploading} className="w-full">
              {uploading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Enviando...</> : 'Adicionar ao Portfólio'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <Card key={item.id} className="overflow-hidden group relative">
            <div className="aspect-[9/16] relative bg-muted">
              <img 
                src={item.image_url} 
                alt={item.title || 'Portfolio item'} 
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => window.open(item.image_url, '_blank')}>
                  <Eye className="h-4 w-4 mr-2" /> Ver
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(item.id, item.image_url)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {(item.title || item.description) && (
              <CardContent className="p-4">
                {item.title && <h4 className="font-semibold text-sm mb-1">{item.title}</h4>}
                {item.description && <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>}
              </CardContent>
            )}
          </Card>
        ))}
      </div>
      
      {items.length === 0 && (
        <div className="text-center p-12 bg-muted/50 rounded-xl border-2 border-dashed">
          <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Seu portfólio está vazio. Adicione capturas de tela dos seus melhores Status!</p>
        </div>
      )}
    </div>
  );
};
