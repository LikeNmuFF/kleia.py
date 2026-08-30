-- Fix Supabase linter 0010_security_definer_view: ctf_leaderboard was SECURITY DEFINER via legacy supabase-migrations/ which is now gitignored and never deployed.
-- Apply the 024_security_views.sql pattern to the live project: wrapper functions are SECURITY DEFINER with pinned search_path, views are SECURITY INVOKER.

-- ===== 1. ctf_challenge_solves =====
create or replace function public.get_ctf_challenge_solves()
returns table (challenge_id uuid, solves integer)
language sql stable security definer
set search_path = public
as $$
  select cs.challenge_id, count(*)::integer as solves
  from ctf_submissions cs
  where cs.is_correct = true
  group by cs.challenge_id;
$$;
revoke all on function public.get_ctf_challenge_solves() from public;
grant execute on function public.get_ctf_challenge_solves() to anon, authenticated;
drop view if exists public.ctf_challenge_solves;
create view public.ctf_challenge_solves
with (security_invoker = true)
as select * from public.get_ctf_challenge_solves();
grant select on public.ctf_challenge_solves to anon, authenticated;

-- ===== 2. activity_leaderboard =====
create or replace function public.get_activity_leaderboard()
returns table (
  user_id uuid,
  username text,
  avatar_url text,
  current_streak integer,
  longest_streak integer,
  total_hours numeric,
  post_count integer,
  activity_score integer
)
language sql stable security definer
set search_path = public
as $$
  select
    p.id as user_id,
    p.username,
    p.avatar_url,
    p.current_streak,
    p.longest_streak,
    0::numeric as total_hours,
    (select count(*) from posts po where po.author_id = p.id)::integer as post_count,
    (
      (coalesce(p.current_streak, 0) * 10)
      + ((select count(*) from posts po where po.author_id = p.id) * 5)
    )::integer as activity_score
  from profiles p
  where p.role in ('user', 'special', 'faculty')
  group by p.id, p.username, p.avatar_url, p.current_streak, p.longest_streak;
$$;
revoke all on function public.get_activity_leaderboard() from public;
grant execute on function public.get_activity_leaderboard() to authenticated;
drop view if exists public.activity_leaderboard;
create view public.activity_leaderboard
with (security_invoker = true)
as select * from public.get_activity_leaderboard();
grant select on public.activity_leaderboard to authenticated;

-- ===== 3. ctf_leaderboard (the flagged view) =====
create or replace function public.get_ctf_leaderboard()
returns table (
  user_id uuid,
  username text,
  avatar_url text,
  solved_challenges integer,
  total_points integer
)
language sql stable security definer
set search_path = public
as $$
  select
    p.id as user_id,
    p.username,
    p.avatar_url,
    (coalesce(p.solved_override, 0) + count(cs.id)::integer) as solved_challenges,
    (coalesce(p.score_override, 0) + coalesce(sum(cc.points), 0)::integer) as total_points
  from profiles p
    left join ctf_submissions cs on cs.user_id = p.id and cs.is_correct = true
    left join ctf_challenges cc on cc.id = cs.challenge_id and cc.status = 'approved'
  where p.role in ('user', 'special', 'faculty')
  group by p.id, p.username, p.avatar_url, p.score_override, p.solved_override
  order by
    (coalesce(p.score_override, 0) + coalesce(sum(cc.points), 0)::integer) desc,
    (coalesce(p.solved_override, 0) + count(cs.id)::integer) desc;
$$;
revoke all on function public.get_ctf_leaderboard() from public;
grant execute on function public.get_ctf_leaderboard() to anon, authenticated;
drop view if exists public.ctf_leaderboard;
create view public.ctf_leaderboard
with (security_invoker = true)
as select * from public.get_ctf_leaderboard();
grant select on public.ctf_leaderboard to anon, authenticated;
