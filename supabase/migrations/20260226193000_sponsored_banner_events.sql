CREATE TABLE IF NOT EXISTS public.sponsored_banner_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  banner_id uuid NOT NULL REFERENCES public.sponsored_banners(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('impression', 'click')),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sponsored_banner_events_banner_idx ON public.sponsored_banner_events(banner_id);
CREATE INDEX IF NOT EXISTS sponsored_banner_events_created_idx ON public.sponsored_banner_events(created_at);
