-- Enum app_role is assumed to exist (admin | creator | advertiser | user)
-- Create user_roles table (if missing)
CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS user_roles_role_idx ON public.user_roles(role);

-- get_user_role: returns the role for a given user, defaults to 'user'
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS public.app_role
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.user_roles WHERE user_id = _user_id),
    'user'::public.app_role
  );
$$;

GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO anon, authenticated, service_role;

-- has_role: convenience boolean check
CREATE OR REPLACE FUNCTION public.has_role(_role public.app_role, _user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  );
$$;

GRANT EXECUTE ON FUNCTION public.has_role(public.app_role, uuid) TO anon, authenticated, service_role;

-- grant_admin_by_email: elevate a user to admin by email
-- Allowed when:
--   - Caller already has admin role, OR
--   - There are no admins yet (bootstrap)
CREATE OR REPLACE FUNCTION public.grant_admin_by_email(_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid;
  _caller uuid := auth.uid();
  _has_admin boolean := false;
  _admin_count int := 0;
BEGIN
  SELECT id INTO _uid FROM auth.users WHERE email = _email;
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', _email;
  END IF;

  SELECT COUNT(*) INTO _admin_count FROM public.user_roles WHERE role = 'admin';
  SELECT public.has_role('admin', _caller) INTO _has_admin;

  IF NOT _has_admin AND _admin_count > 0 THEN
    RAISE EXCEPTION 'Not authorized to grant admin';
  END IF;

  INSERT INTO public.user_roles(user_id, role)
  VALUES (_uid, 'admin')
  ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role, created_at = now();

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.grant_admin_by_email(text) TO authenticated, service_role;
