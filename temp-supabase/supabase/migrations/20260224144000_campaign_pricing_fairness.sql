ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS influence_category text,
  ADD COLUMN IF NOT EXISTS suggested_min numeric,
  ADD COLUMN IF NOT EXISTS suggested_max numeric,
  ADD COLUMN IF NOT EXISTS fairness_status text DEFAULT 'ok',
  ADD COLUMN IF NOT EXISTS allow_auction boolean DEFAULT false;

CREATE OR REPLACE FUNCTION public.compute_campaign_pricing()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  est_views integer := NULL;
  contacts integer := NULL;
  avg_views integer := NULL;
  min_price numeric := NULL;
  max_price numeric := NULL;
  category text := NULL;
BEGIN
  SELECT p.contacts_count INTO contacts
  FROM public.profiles p
  WHERE p.user_id = NEW.creator_id;

  IF NEW.expected_views IS NOT NULL AND NEW.expected_views > 0 THEN
    est_views := NEW.expected_views;
  ELSIF contacts IS NOT NULL AND contacts > 0 THEN
    est_views := GREATEST(50, ROUND(contacts * 0.6));
  ELSE
    est_views := 200;
  END IF;

  avg_views := est_views;

  IF avg_views < 50 THEN
    category := 'below';
    min_price := 0; max_price := 0;
  ELSIF avg_views <= 200 THEN
    category := 'Nano-Status';
    min_price := 1; max_price := 3;
  ELSIF avg_views <= 500 THEN
    category := 'Micro-Status';
    min_price := 4; max_price := 8;
  ELSIF avg_views <= 1500 THEN
    category := 'Power-Status';
    min_price := 10; max_price := 20;
  ELSE
    category := 'Elite-Status';
    min_price := NULL; max_price := NULL;
  END IF;

  NEW.influence_category := category;
  NEW.suggested_min := min_price;
  NEW.suggested_max := max_price;

  IF category = 'Elite-Status' THEN
    NEW.fairness_status := CASE WHEN NEW.allow_auction THEN 'ok' ELSE 'requires_auction' END;
  ELSE
    IF min_price IS NOT NULL AND max_price IS NOT NULL THEN
      IF NEW.price < min_price OR NEW.price > max_price THEN
        NEW.fairness_status := 'price_out_of_range';
      ELSE
        NEW.fairness_status := 'ok';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_campaign_pricing_fairness ON public.campaigns;
CREATE TRIGGER trg_campaign_pricing_fairness
BEFORE INSERT OR UPDATE ON public.campaigns
FOR EACH ROW
EXECUTE FUNCTION public.compute_campaign_pricing();
