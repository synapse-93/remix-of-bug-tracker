-- Security hardening migration
-- Tightens RLS policies and adds a security definer function for team member lookup.

-- ───────────────────────────────────────────────────────────────
-- Helper: security definer role check
-- ───────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- ───────────────────────────────────────────────────────────────
-- user_roles: remove overly broad policy, keep admin-only management
-- ───────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Authenticated can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage roles"
  ON public.user_roles
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

-- ───────────────────────────────────────────────────────────────
-- company_settings: only the owner can see their own settings
-- ───────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Owner can view company settings" ON public.company_settings;
DROP POLICY IF EXISTS "Owner can insert company settings" ON public.company_settings;
DROP POLICY IF EXISTS "Owner can update company settings" ON public.company_settings;

ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can view company settings"
  ON public.company_settings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Owner can insert company settings"
  ON public.company_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner can update company settings"
  ON public.company_settings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_settings TO authenticated;
GRANT ALL ON public.company_settings TO service_role;

-- ───────────────────────────────────────────────────────────────
-- invitations: only the inviter or admins can view pending invites
-- ───────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Inviter or admin can view invitations" ON public.invitations;
DROP POLICY IF EXISTS "Authenticated can create invitations" ON public.invitations;
DROP POLICY IF EXISTS "Inviter or admin can delete invitations" ON public.invitations;

ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Inviter or admin can view invitations"
  ON public.invitations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = invited_by OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can create invitations"
  ON public.invitations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = invited_by);

CREATE POLICY "Inviter or admin can delete invitations"
  ON public.invitations
  FOR DELETE
  TO authenticated
  USING (auth.uid() = invited_by OR public.has_role(auth.uid(), 'admin'));

GRANT SELECT, INSERT, DELETE ON public.invitations TO authenticated;
GRANT ALL ON public.invitations TO service_role;

-- ───────────────────────────────────────────────────────────────
-- Security definer function: team member list
-- Used by the Settings > Team tab so non-admins can see teammates
-- without direct SELECT on profiles + user_roles.
-- ───────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_team_members()
RETURNS TABLE (
  user_id uuid,
  full_name text,
  job_title text,
  avatar_url text,
  role text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  RETURN QUERY
  SELECT
    p.user_id,
    p.full_name,
    p.job_title,
    p.avatar_url,
    COALESCE(ur.role::text, 'user') AS role
  FROM public.profiles p
  LEFT JOIN public.user_roles ur ON ur.user_id = p.user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_team_members() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_team_members() TO service_role;