create table if not exists public.practice_team_solves (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.practice_teams(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  challenge_id uuid not null references public.ctf_challenges(id) on delete cascade,
  submission_id uuid references public.ctf_submissions(id) on delete set null,
  solved_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create unique index if not exists practice_team_solves_unique_idx
  on public.practice_team_solves(team_id, user_id, challenge_id);

create index if not exists practice_team_solves_team_id_solved_at_idx
  on public.practice_team_solves(team_id, solved_at desc);

create index if not exists practice_team_solves_user_id_idx
  on public.practice_team_solves(user_id);

alter table public.practice_team_solves enable row level security;

drop policy if exists "Anyone can read public practice team solves" on public.practice_team_solves;
create policy "Anyone can read public practice team solves"
  on public.practice_team_solves
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.practice_teams team
      where team.id = practice_team_solves.team_id
        and team.is_public = true
    )
  );

drop policy if exists "Members can read own practice team solves" on public.practice_team_solves;
create policy "Members can read own practice team solves"
  on public.practice_team_solves
  for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or exists (
      select 1
      from public.practice_teams team
      where team.id = practice_team_solves.team_id
        and team.owner_id = (select auth.uid())
    )
    or exists (
      select 1
      from public.profiles profile
      where profile.id = (select auth.uid())
        and profile.role = 'admin'
    )
  );

grant select on public.practice_team_solves to anon, authenticated;
grant select, insert, update, delete on public.practice_team_solves to service_role;

notify pgrst, 'reload schema';
