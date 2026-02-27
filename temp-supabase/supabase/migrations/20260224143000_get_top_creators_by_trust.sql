CREATE OR REPLACE FUNCTION public.get_top_creators_by_trust(_limit integer DEFAULT 50)
RETURNS TABLE (
  id uuid,
  display_name text,
  niche text,
  price_range text,
  rating numeric,
  total_reviews integer,
  total_campaigns integer,
  is_verified boolean,
  badge_level text,
  created_at timestamp with time zone,
  trust_score numeric,
  primary_niche text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    cl.id,
    cl.display_name,
    cl.niche,
    cl.price_range,
    cl.rating,
    cl.total_reviews,
    cl.total_campaigns,
    cl.is_verified,
    cl.badge_level,
    cl.created_at,
    p.trust_score,
    p.primary_niche
  FROM public.creator_listings cl
  LEFT JOIN public.profiles p ON p.id = cl.profile_id
  ORDER BY COALESCE(p.trust_score, 0) DESC, cl.rating DESC, cl.total_reviews DESC
  LIMIT _limit;
$$;
