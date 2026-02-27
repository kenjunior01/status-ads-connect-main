import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function RoleBootstrap() {
  const { toast } = useToast();
  const [suggested, setSuggested] = useState<"creator" | "advertiser" | null>(null);
  const [loading, setLoading] = useState<"creator" | "advertiser" | null>(null);

  useEffect(() => {
    const url = new URL(window.location.href);
    const r = url.searchParams.get("role");
    if (r === "creator" || r === "advertiser") setSuggested(r);
    else {
      supabase.auth.getUser().then(({ data }) => {
        const meta = data.user?.user_metadata as { role?: string } | undefined;
        if (meta?.role === "creator" || meta?.role === "advertiser") {
          setSuggested(meta.role);
        }
      });
    }
  }, []);

  const assign = async (role: "creator" | "advertiser") => {
    setLoading(role);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Erro", description: "Faça login.", variant: "destructive" });
        return;
      }
      const { error } = await supabase.from("user_roles").upsert({ user_id: user.id, role });
      if (error) {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Sucesso", description: `Papel ${role} definido.` });
      }
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Definir Papel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-muted-foreground">
            Selecione o tipo de conta para este usuário.
          </div>
          <div className="flex gap-3">
            <Button
              variant={suggested === "creator" ? "default" : "outline"}
              onClick={() => assign("creator")}
              disabled={loading !== null}
            >
              {loading === "creator" ? "Aplicando..." : "Criador"}
            </Button>
            <Button
              variant={suggested === "advertiser" ? "default" : "outline"}
              onClick={() => assign("advertiser")}
              disabled={loading !== null}
            >
              {loading === "advertiser" ? "Aplicando..." : "Anunciante"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
