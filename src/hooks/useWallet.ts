import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Wallet {
  id: string;
  user_id: string;
  available_balance: number;
  pending_balance: number;
  total_earned: number;
  created_at: string;
  updated_at: string;
}

export type TransactionType = 'escrow_hold' | 'escrow_release' | 'payout' | 'refund' | 'other';
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled';

export interface Transaction {
  id: string;
  campaign_id: string | null;
  payer_id: string;
  payee_id: string;
  amount: number;
  platform_fee: number;
  net_amount: number;
  type: TransactionType;
  status: TransactionStatus;
  description: string | null;
  created_at: string;
  completed_at: string | null;
}

export const useWallet = () => {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchWallet = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('creator_wallets')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setWallet(data as Wallet | null);
    } catch (err) {
      console.error('Error fetching wallet:', err);
    }
  };

  const fetchTransactions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .or(`payer_id.eq.${user.id},payee_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setTransactions((data || []) as Transaction[]);
    } catch (err) {
      console.error('Error fetching transactions:', err);
    }
  };

  const requestWithdrawal = async (amount: number, pixKey: string) => {
    try {
      if (!wallet || amount > Number(wallet.available_balance)) {
        toast({ title: "Saldo insuficiente", variant: "destructive" });
        return false;
      }
      if (amount < 50) {
        toast({ title: "Valor mínimo para saque é R$ 50", variant: "destructive" });
        return false;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      const { error } = await supabase.from('withdrawals').insert({
        user_id: user.id,
        amount,
        pix_key: pixKey,
      });

      if (error) throw error;

      // Update wallet pending balance
      await supabase
        .from('creator_wallets')
        .update({
          available_balance: Number(wallet.available_balance) - amount,
          pending_balance: Number(wallet.pending_balance) + amount,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      toast({ title: "Saque solicitado!", description: `R$ ${amount.toFixed(2)} será processado na próxima segunda-feira.` });
      await fetchWallet();
      return true;
    } catch (err) {
      console.error('Error requesting withdrawal:', err);
      toast({ title: "Erro ao solicitar saque", variant: "destructive" });
      return false;
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchWallet(), fetchTransactions()]).finally(() => setLoading(false));
  }, []);

  return { wallet, transactions, loading, requestWithdrawal, refetch: () => Promise.all([fetchWallet(), fetchTransactions()]) };
};
