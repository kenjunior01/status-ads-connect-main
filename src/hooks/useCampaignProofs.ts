import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CampaignProof {
  id: string;
  campaign_id: string;
  creator_id: string;
  proof_type: 'screenshot' | 'video' | 'link';
  file_url: string;
  file_name: string | null;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  reviewer_notes: string | null;
  view_count: number | null;
  engagement_data: Record<string, unknown> | null;
}

interface UploadProofData {
  campaign_id: string;
  proof_type: 'screenshot' | 'video' | 'link';
  file?: File;
  link_url?: string;
  view_count?: number;
  engagement_data?: Record<string, unknown>;
}

export const useCampaignProofs = (campaignId?: string) => {
  const [proofs, setProofs] = useState<CampaignProof[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const fetchProofs = useCallback(async () => {
    if (!campaignId) {
      setProofs([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('campaign_proofs')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('submitted_at', { ascending: false });

      if (error) throw error;

      setProofs((data as CampaignProof[]) || []);
    } catch (err) {
      console.error('Error fetching proofs:', err);
      toast({
        title: 'Erro ao carregar comprovantes',
        description: 'Não foi possível carregar os comprovantes.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [campaignId, toast]);

  const uploadProof = async (data: UploadProofData): Promise<CampaignProof | null> => {
    try {
      setUploading(true);
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData.user) {
        throw new Error('Usuário não autenticado');
      }

      let fileUrl = data.link_url || '';
      let fileName = null;

      if (data.file && data.proof_type !== 'link') {
        const fileExt = data.file.name.split('.').pop();
        const filePath = `${userData.user.id}/${data.campaign_id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('campaign-proofs')
          .upload(filePath, data.file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('campaign-proofs')
          .getPublicUrl(filePath);

        fileUrl = urlData.publicUrl;
        fileName = data.file.name;
      }

      const { data: proof, error } = await supabase
        .from('campaign_proofs')
        .insert({
          campaign_id: data.campaign_id,
          creator_id: userData.user.id,
          proof_type: data.proof_type,
          file_url: fileUrl,
          file_name: fileName,
          view_count: data.view_count || null,
          engagement_data: data.engagement_data || null,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      // Update campaign verification status
      await supabase
        .from('campaigns')
        .update({ verification_status: 'proof_submitted' })
        .eq('id', data.campaign_id);

      setProofs(prev => [proof as CampaignProof, ...prev]);
      
      toast({
        title: 'Comprovante enviado!',
        description: 'Seu comprovante foi enviado para revisão.',
      });

      return proof as CampaignProof;
    } catch (err) {
      console.error('Error uploading proof:', err);
      toast({
        title: 'Erro ao enviar comprovante',
        description: 'Não foi possível enviar o comprovante.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const reviewProof = async (
    proofId: string, 
    status: 'approved' | 'rejected', 
    notes?: string
  ): Promise<boolean> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData.user) {
        throw new Error('Usuário não autenticado');
      }

      const { data: proof, error } = await supabase
        .from('campaign_proofs')
        .update({
          status,
          reviewed_at: new Date().toISOString(),
          reviewed_by: userData.user.id,
          reviewer_notes: notes || null,
        })
        .eq('id', proofId)
        .select()
        .single();

      if (error) throw error;

      // Update campaign verification status
      if (proof) {
        const newVerificationStatus = status === 'approved' ? 'verified' : 'rejected';
        await supabase
          .from('campaigns')
          .update({ verification_status: newVerificationStatus })
          .eq('id', proof.campaign_id);

        // If approved, mark campaign as completed
        if (status === 'approved') {
          await supabase
            .from('campaigns')
            .update({ 
              status: 'completed',
              completed_at: new Date().toISOString()
            })
            .eq('id', proof.campaign_id);
        }
      }

      setProofs(prev => 
        prev.map(p => p.id === proofId ? proof as CampaignProof : p)
      );

      toast({
        title: status === 'approved' ? 'Comprovante aprovado!' : 'Comprovante rejeitado',
        description: status === 'approved' 
          ? 'A campanha foi marcada como concluída.'
          : 'O criador será notificado para reenviar.',
      });

      return true;
    } catch (err) {
      console.error('Error reviewing proof:', err);
      toast({
        title: 'Erro ao revisar comprovante',
        description: 'Não foi possível atualizar o status.',
        variant: 'destructive',
      });
      return false;
    }
  };

  useEffect(() => {
    fetchProofs();
  }, [fetchProofs]);

  return {
    proofs,
    loading,
    uploading,
    uploadProof,
    reviewProof,
    refetch: fetchProofs,
  };
};
