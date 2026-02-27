import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function AdminBootstrap() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const url = new URL(window.location.href);
    const e = url.searchParams.get("email");
    if (e) setEmail(e);
  }, []);

  const promote = async () => {
    if (!email) return;
    setLoading(true);
    try {
      const { error } = await supabase.rpc("grant_admin_by_email", { _email: email });
      if (error) {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Sucesso", description: "Admin concedido." });
        setDone(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Bootstrap de Admin</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="Email do admin"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button onClick={promote} disabled={loading || !email}>
            {loading ? "Promovendo..." : "Promover Admin"}
          </Button>
          {done && (
            <div className="text-sm text-muted-foreground">
              Faça login novamente e acesse o dashboard admin.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
