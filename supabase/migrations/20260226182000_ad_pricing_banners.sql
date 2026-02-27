CREATE TABLE IF NOT EXISTS public.ad_pricing (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  price numeric NOT NULL,
  duration_hours integer NOT NULL,
  policy text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sponsored_banners (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  image_url text NOT NULL,
  link text,
  status text NOT NULL DEFAULT 'pending',
  pricing_tier uuid REFERENCES public.ad_pricing(id),
  starts_at timestamp with time zone,
  expires_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sponsored_banners_status_idx ON public.sponsored_banners(status);
CREATE INDEX IF NOT EXISTS sponsored_banners_expires_idx ON public.sponsored_banners(expires_at);

CREATE TABLE IF NOT EXISTS public.guest_ad_orders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name text,
  contact_email text,
  phone text,
  banner_title text,
  banner_image_url text,
  banner_link text,
  pricing_tier uuid REFERENCES public.ad_pricing(id),
  amount numeric,
  provider text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS guest_ad_orders_status_idx ON public.guest_ad_orders(status);
