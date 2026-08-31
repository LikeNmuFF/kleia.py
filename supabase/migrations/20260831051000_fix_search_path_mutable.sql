-- Fix linter 0011_function_search_path_mutable: pin search_path on all mutable functions
-- Using empty search_path (Supabase recommended) or public with pg_temp isolation

alter function public.get_admin_regex_puzzles() set search_path = '';
alter function public.get_puzzle_solution_length(uuid) set search_path = '';
alter function public.check_flag(uuid, text) set search_path = '';
alter function public.update_updated_at_column() set search_path = '';
alter function public.is_profile_owner(uuid) set search_path = '';
alter function public.is_conversation_member(uuid) set search_path = '';
alter function public.create_direct_conversation(uuid) set search_path = '';
alter function public.get_endpoint_stats(integer) set search_path = '';
alter function public.update_likes_count() set search_path = '';
alter function public.update_comments_count() set search_path = '';
alter function public.get_db_size() set search_path = '';
alter function public.get_largest_tables(integer) set search_path = '';
alter function public.is_admin() set search_path = '';
alter function public.update_conversation_meta() set search_path = '';
alter function public.handle_new_user() set search_path = '';
alter function public.increment_xp(uuid, integer) set search_path = '';
alter function public.admin_user_emails() set search_path = '';
-- Also ensure leaderboard wrappers fixed in 20260831050000 stay pinned (already SET search_path = public)
alter function public.get_ctf_leaderboard() set search_path = public;
alter function public.get_activity_leaderboard() set search_path = public;
alter function public.get_ctf_challenge_solves() set search_path = public;
