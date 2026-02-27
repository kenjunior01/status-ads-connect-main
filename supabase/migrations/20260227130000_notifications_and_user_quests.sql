-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  is_read boolean NOT NULL DEFAULT false,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications(user_id);

-- User quests table
CREATE TABLE IF NOT EXISTS public.user_quests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  quest_id text NOT NULL,
  progress integer NOT NULL DEFAULT 0,
  goal integer NOT NULL DEFAULT 1,
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, quest_id)
);
CREATE INDEX IF NOT EXISTS user_quests_user_idx ON public.user_quests(user_id);

-- Basic RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_quests ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'notifications' AND policyname = 'notifications_select_own'
  ) THEN
    CREATE POLICY notifications_select_own
      ON public.notifications FOR SELECT
      USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'notifications' AND policyname = 'notifications_insert_own'
  ) THEN
    CREATE POLICY notifications_insert_own
      ON public.notifications FOR INSERT
      WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'notifications' AND policyname = 'notifications_update_own'
  ) THEN
    CREATE POLICY notifications_update_own
      ON public.notifications FOR UPDATE
      USING (user_id = auth.uid());
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_quests' AND policyname = 'user_quests_select_own'
  ) THEN
    CREATE POLICY user_quests_select_own
      ON public.user_quests FOR SELECT
      USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_quests' AND policyname = 'user_quests_insert_own'
  ) THEN
    CREATE POLICY user_quests_insert_own
      ON public.user_quests FOR INSERT
      WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_quests' AND policyname = 'user_quests_update_own'
  ) THEN
    CREATE POLICY user_quests_update_own
      ON public.user_quests FOR UPDATE
      USING (user_id = auth.uid());
  END IF;
END$$;

-- Helper function to upsert quest progress and notify on completion
CREATE OR REPLACE FUNCTION public.upsert_user_quest(_quest_id text, _inc int, _goal int)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _prev record;
  _now timestamptz := now();
  _new_completed boolean := false;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO _prev FROM public.user_quests WHERE user_id = _uid AND quest_id = _quest_id;

  IF NOT FOUND THEN
    INSERT INTO public.user_quests(user_id, quest_id, progress, goal, completed, created_at, updated_at)
    VALUES (_uid, _quest_id, GREATEST(0, LEAST(_inc, _goal)), _goal, (_inc >= _goal), _now, _now);
    _new_completed := (_inc >= _goal);
  ELSE
    UPDATE public.user_quests
    SET
      progress = LEAST(_prev.progress + GREATEST(_inc, 0), _prev.goal),
      completed = (LEAST(_prev.progress + GREATEST(_inc, 0), _prev.goal) >= _prev.goal) OR _prev.completed,
      updated_at = _now
    WHERE id = _prev.id
    RETURNING completed INTO _new_completed;
  END IF;

  IF _new_completed AND (_prev IS NULL OR _prev.completed IS DISTINCT FROM TRUE) THEN
    INSERT INTO public.notifications(user_id, title, message, type, is_read, metadata)
    VALUES (_uid, 'Quest concluída', format('Você concluiu a quest "%s"!', _quest_id), 'success', false, jsonb_build_object('quest_id', _quest_id));
  END IF;

  RETURN true;
END;
$$;
