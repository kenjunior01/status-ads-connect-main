
import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { useLocalizationContext } from '@/contexts/LocalizationContext';

export const CampaignRedirect = () => {
  const { campaignId } = useParams();
  const navigate = useNavigate();
  const { getCurrentCountry } = useLocalizationContext();
  const currentCountry = getCurrentCountry();

  useEffect(() => {
    const processClick = async () => {
      if (!campaignId) {
        navigate('/');
        return;
      }

      try {
        // 1. Fetch the campaign to get the destination URL
        const { data: campaign, error } = await supabase
          .from('campaigns')
          .select('description, title') // Assuming description or a new field 'target_url' holds the link
          .eq('id', campaignId)
          .single();

        if (error || !campaign) throw new Error('Campaign not found');

        // Extract URL from description (simple regex for this example)
        // In a real scenario, you'd have a 'target_url' field in the DB
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const targetUrl = campaign.description?.match(urlRegex)?.[0] || '/';

        // 2. Record the click via RPC
        await supabase.rpc('record_campaign_click', {
          _campaign_id: campaignId,
          _user_agent: navigator.userAgent,
          _ip_hash: 'anon', // IP hashing should ideally happen on server-side (Edge Function)
          _country_code: currentCountry?.code || null
        });

        // 3. Redirect to destination
        window.location.href = targetUrl;
      } catch (err) {
        console.error('Click tracking error:', err);
        navigate('/');
      }
    };

    processClick();
  }, [campaignId, navigate, currentCountry?.code]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
        <p className="text-muted-foreground font-medium">Redirecionando para a oferta...</p>
      </div>
    </div>
  );
};
