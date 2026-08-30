-- Tighten execute grants on SECURITY DEFINER functions.
-- handle_new_user is a trigger function and should not be callable directly.
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM service_role;

-- has_role and get_team_members are used by authenticated users/policies,
-- but anonymous users should not be able to invoke them.
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;

REVOKE ALL ON FUNCTION public.get_team_members() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_team_members() FROM anon;

-- Re-assert intended grants.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;

GRANT EXECUTE ON FUNCTION public.get_team_members() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_team_members() TO service_role;