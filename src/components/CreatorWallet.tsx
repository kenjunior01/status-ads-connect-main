import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useWallet } from "@/hooks/useWallet";
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  DollarSign,
  TrendingUp,
  Loader2,
  CreditCard
} from "lucide-react";

export const CreatorWallet = () => {
  const { wallet, transactions, loading, requestWithdrawal } = useWallet();
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleWithdraw = async () => {
    setWithdrawing(true);
    const success = await requestWithdrawal(Number(withdrawAmount), pixKey);
    setWithdrawing(false);
    if (success) {
      setWithdrawAmount("");
      setPixKey("");
      setDialogOpen(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'escrow_release': return <ArrowDownLeft className="h-4 w-4 text-green-500" />;
      case 'payout': return <ArrowUpRight className="h-4 w-4 text-red-500" />;
      case 'escrow_hold': return <Clock className="h-4 w-4 text-yellow-500" />;
      default: return <DollarSign className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case 'escrow_release': return 'Pagamento Recebido';
      case 'escrow_hold': return 'Em Garantia';
      case 'payout': return 'Saque';
      case 'refund': return 'Reembolso';
      case 'penalty': return 'Penalidade';
      default: return type;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge variant="secondary" className="bg-green-500/10 text-green-600">Concluído</Badge>;
      case 'pending': return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600">Pendente</Badge>;
      case 'failed': return <Badge variant="destructive">Falhou</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const available = Number(wallet?.available_balance || 0);
  const pending = Number(wallet?.pending_balance || 0);
  const totalEarned = Number(wallet?.total_earned || 0);

  return (
    <div className="space-y-6">
      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-green-500/20 bg-green-500/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-green-500/10">
                <Wallet className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Saldo Disponível</p>
                <p className="text-2xl font-bold text-green-600">R$ {available.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-500/20 bg-yellow-500/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-yellow-500/10">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Saldo Pendente</p>
                <p className="text-2xl font-bold text-yellow-600">R$ {pending.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Ganho</p>
                <p className="text-2xl font-bold text-primary">R$ {totalEarned.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Withdraw Button */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button size="lg" disabled={available < 50} className="w-full md:w-auto">
            <CreditCard className="h-4 w-4 mr-2" />
            Solicitar Saque
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Solicitar Saque</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Saldo disponível: <span className="font-semibold text-green-600">R$ {available.toFixed(2)}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Mínimo: R$ 50,00 • Processamento: segunda-feira • Prazo: 1-2 dias úteis via Pix
            </p>
            <div>
              <Label>Valor do Saque (R$)</Label>
              <Input
                type="number"
                min={50}
                max={available}
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="50.00"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Chave Pix</Label>
              <Input
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
                placeholder="CPF, e-mail, telefone ou chave aleatória"
                className="mt-1"
              />
            </div>
            <Button
              onClick={handleWithdraw}
              disabled={withdrawing || !withdrawAmount || Number(withdrawAmount) < 50 || !pixKey}
              className="w-full"
            >
              {withdrawing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirmar Saque
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transactions History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Histórico de Transações
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhuma transação ainda.</p>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    {getTransactionIcon(tx.type)}
                    <div>
                      <p className="font-medium text-sm">{getTransactionLabel(tx.type)}</p>
                      <p className="text-xs text-muted-foreground">
                        {tx.description || ''} • {new Date(tx.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`font-semibold ${tx.type === 'escrow_release' ? 'text-green-600' : tx.type === 'payout' ? 'text-red-500' : ''}`}>
                      {tx.type === 'payout' ? '-' : '+'}R$ {Number(tx.net_amount || tx.amount).toFixed(2)}
                    </span>
                    {getStatusBadge(tx.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
