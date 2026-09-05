-- Expose only the public solve activity needed by season participants/spectators.
-- The underlying ctf_submissions table remains private under its existing RLS.
create or replace function public.get_recent_season_solves(p_season_id uuid)
returns table (
  user_id uuid,
  codename text,
  challenge_id uuid,
  title text,
  points integer,
  created_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select
    s.user_id,
    p.codename,
    s.challenge_id,
    c.title,
    (c.points + coalesce(sc.bonus_points, 0))::integer as points,
    s.submitted_at
  from public.ctf_submissions s
  join public.ctf_season_challenges sc
    on sc.season_id = p_season_id and sc.challenge_id = s.challenge_id
  join public.ctf_challenges c on c.id = s.challenge_id
  join public.ctf_season_participants p
    on p.season_id = p_season_id and p.user_id = s.user_id
  where s.is_correct = true
    and auth.uid() is not null
    and (
      public.is_admin()
      or exists (
        select 1 from public.ctf_season_participants viewer
        where viewer.season_id = p_season_id and viewer.user_id = auth.uid()
      )
      or exists (
        select 1 from public.ctf_season_spectators viewer
        where viewer.season_id = p_season_id and viewer.user_id = auth.uid()
      )
    )
  order by s.submitted_at desc
  limit 20;
$$;

revoke all on function public.get_recent_season_solves(uuid) from public;
grant execute on function public.get_recent_season_solves(uuid) to authenticated;
