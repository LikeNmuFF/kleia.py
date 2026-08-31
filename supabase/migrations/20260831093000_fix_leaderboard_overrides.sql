CREATE OR REPLACE FUNCTION public.get_ctf_leaderboard()
RETURNS TABLE(user_id uuid, username text, avatar_url text, solved_challenges integer, total_points integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $fn$
  select
    p.id,
    p.username,
    p.avatar_url,
    case when p.solved_override is not null then p.solved_override else count(cs.id)::integer end,
    case when p.score_override is not null then p.score_override else coalesce(sum(cc.points), 0)::integer end
  from profiles p
    left join ctf_submissions cs on cs.user_id = p.id and cs.is_correct = true
    left join ctf_challenges cc on cc.id = cs.challenge_id and cc.status = 'approved'
  where p.role in ('user', 'special', 'faculty')
  group by p.id, p.username, p.avatar_url, p.score_override, p.solved_override
  order by
    case when p.score_override is not null then p.score_override else coalesce(sum(cc.points), 0)::integer end desc,
    case when p.solved_override is not null then p.solved_override else count(cs.id)::integer end desc;
$fn$;
