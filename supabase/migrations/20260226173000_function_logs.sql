CREATE TABLE IF NOT EXISTS public.function_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider text NOT NULL,
  level text NOT NULL DEFAULT 'error',
  message text,
  payload jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS function_logs_provider_idx ON public.function_logs(provider);
CREATE INDEX IF NOT EXISTS function_logs_level_idx ON public.function_logs(level);