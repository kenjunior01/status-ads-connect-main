CREATE OR REPLACE FUNCTION public.enforce_proof_disclosure()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.engagement_data IS NULL 
     OR (NEW.engagement_data->>'disclosure_confirmed')::boolean IS DISTINCT FROM TRUE THEN
    NEW.status := 'rejected';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_campaign_proofs_disclosure ON public.campaign_proofs;
CREATE TRIGGER trg_campaign_proofs_disclosure
BEFORE INSERT OR UPDATE ON public.campaign_proofs
FOR EACH ROW
EXECUTE FUNCTION public.enforce_proof_disclosure();
