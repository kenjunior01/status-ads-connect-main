-- Helper to upsert quest for a specific user (bypasses auth.uid for server events)
CREATE OR REPLACE FUNCTION public.complete_quest_for_user(_user_id uuid, _quest_id text, _inc int, _goal int)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _prev record;
  _now timestamptz := now();
  _new_completed boolean := false;
BEGIN
  IF _user_id IS NULL THEN
    RETURN false;
  END IF;

  SELECT * INTO _prev FROM public.user_quests WHERE user_id = _user_id AND quest_id = _quest_id;

  IF NOT FOUND THEN
    INSERT INTO public.user_quests(user_id, quest_id, progress, goal, completed, created_at, updated_at)
    VALUES (_user_id, _quest_id, GREATEST(0, LEAST(_inc, _goal)), _goal, (_inc >= _goal), _now, _now);
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
    VALUES (_user_id, 'Quest concluída', format('Você concluiu a quest "%s"!', _quest_id), 'success', false, jsonb_build_object('quest_id', _quest_id));
  END IF;

  RETURN true;
END;
$$;

-- Trigger: when a proof is approved within 12 hours from campaign creation, increment quest 'submit_proof_fast'
CREATE OR REPLACE FUNCTION public.quest_on_fast_proof()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _campaign record;
  _deadline timestamptz;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    SELECT created_at INTO _campaign FROM public.campaigns WHERE id = NEW.campaign_id;
    IF FOUND THEN
      _deadline := _campaign.created_at + interval '12 hours';
      IF NEW.submitted_at IS NOT NULL AND NEW.submitted_at <= _deadline THEN
        PERFORM public.complete_quest_for_user(NEW.creator_id, 'submit_proof_fast', 1, 1);
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_quest_on_fast_proof ON public.campaign_proofs;
CREATE TRIGGER trg_quest_on_fast_proof
AFTER UPDATE ON public.campaign_proofs
FOR EACH ROW
EXECUTE FUNCTION public.quest_on_fast_proof();
