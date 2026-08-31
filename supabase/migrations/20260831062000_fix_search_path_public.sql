-- Fix 51000 that set search_path = '' for functions that use unqualified table names (is_conversation_member(uuid) broke)
-- Set to public so unqualified names resolve, and fix the one-arg version to use qualified name

alter function public.is_conversation_member(uuid) set search_path = public;
alter function public.update_updated_at_column() set search_path = public;
alter function public.is_profile_owner(uuid) set search_path = public;
alter function public.get_endpoint_stats(integer) set search_path = public;
alter function public.update_likes_count() set search_path = public;
alter function public.update_comments_count() set search_path = public;
alter function public.get_db_size() set search_path = public;
alter function public.get_largest_tables(integer) set search_path = public;
alter function public.is_admin() set search_path = public;
alter function public.update_conversation_meta() set search_path = public;
alter function public.handle_new_user() set search_path = public;
alter function public.increment_xp(uuid, integer) set search_path = public;
alter function public.admin_user_emails() set search_path = public;
alter function public.get_admin_regex_puzzles() set search_path = public;
alter function public.get_puzzle_solution_length(uuid) set search_path = public;
alter function public.check_flag(uuid, text) set search_path = public;

-- Fix the one-arg is_conversation_member to use qualified table name (was unqualified and broke with empty search_path)
create or replace function public.is_conversation_member(conv_id uuid)
returns boolean
language sql
stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.conversation_members
    where conversation_id = conv_id and user_id = auth.uid()
  );
$$;

revoke all on function public.is_conversation_member(uuid) from public;
grant execute on function public.is_conversation_member(uuid) to authenticated;

-- Ensure two-arg version stays public
alter function public.is_conversation_member(uuid, uuid) set search_path = public;
alter function public.is_conversation_creator(uuid, uuid) set search_path = public;
alter function public.create_direct_conversation(uuid) set search_path = public;

notify pgrst, 'reload schema';
