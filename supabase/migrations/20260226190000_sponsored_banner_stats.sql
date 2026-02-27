CREATE TABLE IF NOT EXISTS public.sponsored_banner_stats (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  banner_id uuid NOT NULL REFERENCES public.sponsored_banners(id) ON DELETE CASCADE,
  impressions integer NOT NULL DEFAULT 0,
  clicks integer NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS sponsored_banner_stats_banner_idx ON public.sponsored_banner_stats(banner_id);
