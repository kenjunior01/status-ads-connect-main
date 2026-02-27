ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS requires_disclosure boolean DEFAULT true;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS suspended_until timestamp with time zone;

CREATE OR REPLACE FUNCTION public.process_dispute_resolution(_dispute_id uuid, _resolution text, _refund_percent integer DEFAULT 0)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  d record;
  c record;
  refund_amount numeric := 0;
BEGIN
  SELECT * INTO d FROM public.disputes WHERE id = _dispute_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Dispute not found';
  END IF;

  SELECT * INTO c FROM public.campaigns WHERE id = d.campaign_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Campaign not found';
  END IF;

  UPDATE public.disputes
  SET status = 'resolved', resolution = _resolution, resolved_at = now(), resolved_by = auth.uid()
  WHERE id = _dispute_id;

  IF _refund_percent > 0 AND c.creator_payout IS NOT NULL THEN
    refund_amount := ROUND((c.creator_payout::numeric * _refund_percent::numeric) / 100);
    UPDATE public.creator_wallets
    SET available_balance = GREATEST(0, available_balance - refund_amount),
        updated_at = now()
    WHERE user_id = c.creator_id;
    INSERT INTO public.transactions (campaign_id, payer_id, payee_id, amount, type, status, description, completed_at)
    VALUES (c.id, c.creator_id, c.advertiser_id, refund_amount, 'refund', 'completed', 'Refund due to dispute resolution', now());
  END IF;

  IF _resolution ILIKE '%early_removal%' THEN
    UPDATE public.profiles
    SET trust_score = GREATEST(0, COALESCE(trust_score, 0) - 10)
    WHERE user_id = c.creator_id;
  END IF;

  RETURN true;
END;
$$;
