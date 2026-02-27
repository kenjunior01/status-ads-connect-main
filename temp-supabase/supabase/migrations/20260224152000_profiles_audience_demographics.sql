ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS audience_age_range text,
  ADD COLUMN IF NOT EXISTS audience_gender_ratio text,
  ADD COLUMN IF NOT EXISTS audience_locations jsonb,
  ADD COLUMN IF NOT EXISTS primary_niche text,
  ADD COLUMN IF NOT EXISTS secondary_niches text[];
