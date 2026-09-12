-- Keep write-capable integrity functions private to trusted server code.
-- No rows or user data are deleted or modified by this migration.
REVOKE ALL ON FUNCTION public.check_flag(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_flag(uuid, text) TO service_role;

REVOKE ALL ON FUNCTION public.increment_season_score(uuid, uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_season_score(uuid, uuid, integer) TO service_role;

REVOKE ALL ON FUNCTION public.increment_xp(uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_xp(uuid, integer) TO service_role;
