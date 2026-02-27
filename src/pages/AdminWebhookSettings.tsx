import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const providers = [
  { key: "paypal", label: "PayPal" },
  { key: "pix", label: "PIX" },
  { key: "mbway", label: "MB Way" },
  { key: "multicaixa", label: "Multicaixa" },
];

export const AdminWebhookSettings = () => {
  const { toast } = useToast();
  const [jsonBody, setJsonBody] = useState<string>('{"event_id":"evt_test_1","status":"confirmed"}');
  const [secret, setSecret] = useState<string>("");
  const [provider, setProvider] = useState<string>("paypal");

  const computeHexHmac = async (secretText: string, payload: string) => {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey("raw", enc.encode(secretText), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const mac = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
    return [...new Uint8Array(mac)].map(b => b.toString(16).padStart(2, "0")).join("");
  };

  const testWebhook = async () => {
    try {
      let url = "";
      if (provider === "paypal") url = "/functions/v1/paypal-webhook";
      if (provider === "pix") url = "/functions/v1/pix-webhook";
      if (provider === "mbway") url = "/functions/v1/mbway-webhook";
      if (provider === "multicaixa") url = "/functions/v1/multicaixa-webhook";
      const body = jsonBody;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (provider !== "paypal") {
        if (!secret) {
          toast({ title: "Segredo obrigatório", description: "Informe o segredo para HMAC.", variant: "destructive" });
          return;
        }
        const hex = await computeHexHmac(secret, body);
        headers["x-webhook-signature"] = hex;
      }
      const res = await fetch(url, { method: "POST", headers, body });
      const out = await res.text();
      toast({ title: `Teste ${provider}`, description: `Status ${res.status}: ${out.slice(0, 120)}` });
    } catch (e) {
      toast({ title: "Erro no teste", description: e instanceof Error ? e.message : String(e), variant: "destructive" });
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Webhooks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <Label>Provedor</Label>
              <select className="mt-1 w-full border rounded h-9 px-2" value={provider} onChange={(e) => setProvider(e.target.value)}>
                {providers.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
              </select>
            </div>
            {provider !== "paypal" && (
              <div>
                <Label>Segredo HMAC</Label>
                <Input value={secret} onChange={(e) => setSecret(e.target.value)} className="mt-1" placeholder="PIX/MB Way/Multicaixa secret" />
              </div>
            )}
          </div>
          <div>
            <Label>Corpo JSON</Label>
            <textarea className="mt-1 w-full border rounded p-2 h-40 font-mono text-sm" value={jsonBody} onChange={(e) => setJsonBody(e.target.value)} />
          </div>
          <div className="flex justify-end">
            <Button onClick={testWebhook}>Testar Webhook</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
