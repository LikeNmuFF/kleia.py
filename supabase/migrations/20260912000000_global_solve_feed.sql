-- Public global CTF solve feed.
-- Shows who recently solved which global (season_id IS NULL) approved challenge.
-- ctf_submissions remains private under its existing RLS; this SECURITY DEFINER
-- function exposes only aggregated, public solve activity on global challenges.
create or replace function public.get_recent_global_solves(p_limit integer default 30)
returns table (
  user_id uuid,
  username text,
  avatar_url text,
  challenge_id uuid,
  title text,
  category text,
  points integer,
  solved_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select
    s.user_id,
    p.username,
    p.avatar_url,
    c.id as challenge_id,
    c.title,
    c.category,
    c.points::integer as points,
    s.submitted_at as solved_at
  from public.ctf_submissions s
  join public.ctf_challenges c
    on c.id = s.challenge_id and c.season_id is null and c.status = 'approved'
  join public.profiles p
    on p.id = s.user_id and p.username is not null and p.username <> ''
  where s.is_correct = true
  order by s.submitted_at desc
  limit greatest(1, least(p_limit, 100));
$$;

revoke all on function public.get_recent_global_solves(integer) from public;
grant execute on function public.get_recent_global_solves(integer) to anon, authenticated;