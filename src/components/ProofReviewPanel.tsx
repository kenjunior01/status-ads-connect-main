import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useCampaignProofs } from '@/hooks/useCampaignProofs';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Image, 
  Video, 
  Link, 
  Eye,
  MessageSquare,
  Loader2,
  ZoomIn
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';

interface ProofReviewPanelProps {
  campaignId: string;
  isAdvertiser?: boolean;
}

type Dispute = {
  id: string;
  campaign_id: string;
  reason: string;
  description: string | null;
  status: string | null;
  created_at: string | null;
};

type Proof = {
  id: string;
  engagement_data: Record<string, unknown> | null;
};

export const ProofReviewPanel = ({ campaignId, isAdvertiser = false }: ProofReviewPanelProps) => {
  const { t } = useTranslation();
  const { proofs, loading, reviewProof } = useCampaignProofs(campaignId);
  const [selectedProof, setSelectedProof] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [reviewing, setReviewing] = useState(false);
  const { toast } = useToast();
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState<string>('');
  const [disputePercent, setDisputePercent] = useState<string>('');
  const [disputeDesc, setDisputeDesc] = useState<string>('');
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchDisputes = async () => {
    const { data } = await supabase
      .from('disputes')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false });
    setDisputes((data || []) as Dispute[]);
  };

  const checkAdmin = async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      const { data: has } = await supabase.rpc('has_role', { _user_id: userData.user.id, _role: 'admin' });
      setIsAdmin(Boolean(has));
    }
  };

  (async () => {
    await fetchDisputes();
    await checkAdmin();
  })();
  const presetReasons = [
    { key: 'low_quality_visual', label: 'Baixa qualidade visual' },
    { key: 'visual_pollution', label: 'Poluição visual' },
    { key: 'early_removal', label: 'Remoção antes de 24h' },
    { key: 'missing_disclosure', label: 'Sem disclosure (#Publicidade)' },
    { key: 'prohibited_content', label: 'Conteúdo proibido' },
  ];

  const handleReview = async (proofId: string, status: 'approved' | 'rejected') => {
    setReviewing(true);
    const proof = proofs.find(p => p.id === proofId) as Proof | undefined;
    const disclosure = Boolean(
      proof?.engagement_data && (proof.engagement_data as Record<string, unknown>)['disclosure_confirmed'] === true
    );
    if (status === 'approved' && !disclosure) {
      toast({ title: 'Disclosure obrigatório', description: 'Provas sem #Publicidade não podem ser aprovadas.', variant: 'destructive' });
      setReviewing(false);
      return;
    }
    await reviewProof(proofId, status, notes);
    setNotes('');
    setSelectedProof(null);
    setReviewing(false);
  };

  const getStatusBadge = (status: string) => {
    const config = {
      pending: { icon: Clock, label: t('verification.pending'), className: 'bg-warning/10 text-warning border-warning/30' },
      approved: { icon: CheckCircle, label: t('verification.approved'), className: 'bg-success/10 text-success border-success/30' },
      rejected: { icon: XCircle, label: t('verification.rejected'), className: 'bg-destructive/10 text-destructive border-destructive/30' },
    };
    const { icon: Icon, label, className } = config[status as keyof typeof config] || config.pending;
    return (
      <span className={cn("inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border", className)}>
        <Icon className="h-3 w-3" />
        {label}
      </span>
    );
  };

  const getProofTypeIcon = (type: string) => {
    switch (type) {
      case 'screenshot': return <Image className="h-5 w-5" />;
      case 'video': return <Video className="h-5 w-5" />;
      case 'link': return <Link className="h-5 w-5" />;
      default: return <Image className="h-5 w-5" />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (proofs.length === 0) {
    return (
      <Card className="text-center py-8">
        <CardContent>
          <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">{t('verification.noProofs')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold flex items-center gap-2">
        <Eye className="h-5 w-5" />
        {t('verification.title')}
      </h3>

      {proofs.map((proof) => (
        <Card key={proof.id} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Preview */}
              <div className="md:w-1/3">
                {proof.proof_type === 'screenshot' && proof.file_url && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <button className="relative w-full aspect-video rounded-lg overflow-hidden bg-muted group cursor-pointer">
                        <img 
                          src={proof.file_url} 
                          alt="Proof" 
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <ZoomIn className="h-8 w-8 text-white" />
                        </div>
                      </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl">
                      <DialogHeader>
                        <DialogTitle>{t('verification.screenshot')}</DialogTitle>
                      </DialogHeader>
                      <img 
                        src={proof.file_url} 
                        alt="Proof Full" 
                        loading="lazy"
                        decoding="async"
                        className="w-full rounded-lg"
                      />
                    </DialogContent>
                  </Dialog>
                )}
                {proof.proof_type === 'video' && proof.file_url && (
                  <video 
                    src={proof.file_url} 
                    controls 
                    className="w-full aspect-video rounded-lg bg-muted"
                  />
                )}
                {proof.proof_type === 'link' && (
                  <a 
                    href={proof.file_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center h-32 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                  >
                    <Link className="h-8 w-8 text-primary" />
                  </a>
                )}
              </div>

              {/* Details */}
              <div className="md:w-2/3 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getProofTypeIcon(proof.proof_type)}
                    <span className="font-medium">
                      {proof.file_name || t(`verification.${proof.proof_type}`)}
                    </span>
                  </div>
                  {getStatusBadge(proof.status)}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  {proof.view_count && (
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      <span>{proof.view_count.toLocaleString()} visualizações</span>
                    </div>
                  )}
                  <div className="text-muted-foreground">
                    Enviado em {new Date(proof.submitted_at).toLocaleDateString('pt-BR')}
                  </div>
                </div>

                {proof.reviewer_notes && (
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 text-sm font-medium mb-1">
                      <MessageSquare className="h-4 w-4" />
                      {t('verification.notes')}
                    </div>
                    <p className="text-sm text-muted-foreground">{proof.reviewer_notes}</p>
                  </div>
                )}

                {/* Review actions for advertiser */}
                {isAdvertiser && proof.status === 'pending' ? (
                  <div className="pt-3 border-t space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {presetReasons.map((r) => (
                        <Button
                          key={r.key}
                          variant="outline"
                          onClick={() => {
                            setSelectedProof(proof.id);
                            setNotes(r.label);
                          }}
                          className="text-xs"
                        >
                          {r.label}
                        </Button>
                      ))}
                    </div>
                    <Textarea
                      value={selectedProof === proof.id ? notes : ''}
                      onChange={(e) => {
                        setSelectedProof(proof.id);
                        setNotes(e.target.value);
                      }}
                      placeholder={t('verification.notesPlaceholder')}
                      className="min-h-[80px]"
                    />
                    <div className="flex gap-2">
                      <Dialog open={disputeOpen} onOpenChange={setDisputeOpen}>
                        <DialogTrigger asChild>
                          <Button variant="secondary">Abrir Disputa</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Solicitar Reembolso</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-3">
                            <div className="space-y-1">
                              <span className="text-sm">Motivo</span>
                              <Select value={disputeReason} onValueChange={setDisputeReason}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o motivo" />
                                </SelectTrigger>
                                <SelectContent>
                                  {presetReasons.map(r => (
                                    <SelectItem key={r.key} value={r.key}>{r.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <span className="text-sm">Percentual de reembolso desejado</span>
                              <Input type="number" placeholder="Ex.: 50" value={disputePercent} onChange={(e) => setDisputePercent(e.target.value)} />
                            </div>
                            <div className="space-y-1">
                              <span className="text-sm">Descrição</span>
                              <Textarea value={disputeDesc} onChange={(e) => setDisputeDesc(e.target.value)} placeholder="Detalhe o problema" />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                onClick={async () => {
                                  try {
                                    const { data: userData } = await supabase.auth.getUser();
                                    const user = userData.user;
                                    if (!user) throw new Error('Não autenticado');
                                    const { error } = await supabase
                                      .from('disputes')
                                      .insert({
                                        campaign_id: campaignId,
                                        opened_by: user.id,
                                        reason: disputeReason || 'other',
                                        description: (disputeDesc || '') + (disputePercent ? ` | refund:${disputePercent}%` : ''),
                                        status: 'open',
                                      });
                                    if (error) throw error;
                                    toast({ title: 'Disputa aberta', description: 'Solicitação registrada para análise.' });
                                    await fetchDisputes();
                                    setDisputeOpen(false);
                                    setDisputeReason('');
                                    setDisputePercent('');
                                    setDisputeDesc('');
                                  } catch {
                                    toast({ title: 'Erro ao abrir disputa', description: 'Tente novamente.', variant: 'destructive' });
                                  }
                                }}
                              >
                                Enviar
                              </Button>
                              <Button variant="outline" onClick={() => setDisputeOpen(false)}>Cancelar</Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="outline"
                        className="flex-1 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => handleReview(proof.id, 'rejected')}
                        disabled={reviewing}
                      >
                        {reviewing ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4 mr-2" />}
                        {t('verification.reject')}
                      </Button>
                      <Button
                        className="flex-1 bg-success hover:bg-success/90"
                        onClick={() => handleReview(proof.id, 'approved')}
                        disabled={reviewing}
                      >
                        {reviewing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                        {t('verification.approve')}
                      </Button>
                    </div>
                  </div>
                ) : null}

                {isAdmin && disputes.length > 0 && (
                  <div className="pt-3 border-t space-y-2">
                    <div className="text-sm font-medium">Disputas</div>
                    <div className="space-y-2">
                      {disputes.filter(d => d.status === 'open').map(d => (
                        <div key={d.id} className="flex items-center justify-between p-2 rounded border">
                          <div className="text-sm">
                            <div>Motivo: {d.reason}</div>
                            {d.description && <div className="text-muted-foreground">{d.description}</div>}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              onClick={async () => {
                                try {
                                  const percentMatch = String(d.description || '').match(/refund:(\d+)%/i);
                                  const refundPercent = percentMatch ? parseInt(percentMatch[1], 10) : 0;
                                  const { data, error } = await supabase.rpc('process_dispute_resolution', {
                                    _dispute_id: d.id,
                                    _resolution: d.reason,
                                    _refund_percent: refundPercent || 0,
                                  });
                                  if (error) throw error;
                                  toast({ title: 'Disputa resolvida', description: 'Reembolso e penalidades aplicados.' });
                                  await fetchDisputes();
                                } catch {
                                  toast({ title: 'Erro ao resolver disputa', description: 'Tente novamente.', variant: 'destructive' });
                                }
                              }}
                            >
                              Resolver
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
