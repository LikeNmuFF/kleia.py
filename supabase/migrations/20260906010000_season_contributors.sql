alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('user', 'admin', 'special', 'faculty', 'contributor'));

create index if not exists idx_profiles_role_contributor
  on public.profiles(role) where role = 'contributor';

create table if not exists public.ctf_season_contributors (
  season_id uuid not null references public.ctf_seasons(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  added_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (season_id, user_id)
);

alter table public.ctf_season_contributors enable row level security;
grant select, insert, delete on public.ctf_season_contributors to authenticated;

drop policy if exists "Admins can manage season contributors" on public.ctf_season_contributors;
create policy "Admins can manage season contributors"
  on public.ctf_season_contributors for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Contributors can view own season invitations" on public.ctf_season_contributors;
create policy "Contributors can view own season invitations"
  on public.ctf_season_contributors for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Contributors can view own season challenges" on public.ctf_challenges;
create policy "Contributors can view own season challenges"
  on public.ctf_challenges for select to authenticated
  using (
    created_by = (select auth.uid())
    and exists (
      select 1 from public.ctf_season_contributors assignment
      where assignment.season_id = ctf_challenges.season_id
        and assignment.user_id = (select auth.uid())
    )
  );

drop policy if exists "Contributors can create assigned season challenges" on public.ctf_challenges;
create policy "Contributors can create assigned season challenges"
  on public.ctf_challenges for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and status in ('draft', 'approved')
    and exists (
      select 1 from public.profiles profile
      where profile.id = (select auth.uid()) and profile.role = 'contributor'
    )
    and exists (
      select 1 from public.ctf_season_contributors assignment
      where assignment.season_id = ctf_challenges.season_id
        and assignment.user_id = (select auth.uid())
    )
  );

drop policy if exists "Contributors can update own season challenges" on public.ctf_challenges;
create policy "Contributors can update own season challenges"
  on public.ctf_challenges for update to authenticated
  using (
    created_by = (select auth.uid())
    and exists (
      select 1 from public.ctf_season_contributors assignment
      where assignment.season_id = ctf_challenges.season_id
        and assignment.user_id = (select auth.uid())
    )
  )
  with check (
    created_by = (select auth.uid())
    and status in ('draft', 'approved')
    and exists (
      select 1 from public.ctf_season_contributors assignment
      where assignment.season_id = ctf_challenges.season_id
        and assignment.user_id = (select auth.uid())
    )
  );

drop policy if exists "Contributors can link own assigned challenges" on public.ctf_season_challenges;
create policy "Contributors can link own assigned challenges"
  on public.ctf_season_challenges for insert to authenticated
  with check (
    exists (
      select 1 from public.ctf_season_contributors assignment
      where assignment.season_id = ctf_season_challenges.season_id
        and assignment.user_id = (select auth.uid())
    )
    and exists (
      select 1 from public.ctf_challenges challenge
      where challenge.id = ctf_season_challenges.challenge_id
        and challenge.created_by = (select auth.uid())
        and challenge.season_id = ctf_season_challenges.season_id
    )
  );

alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check check (
  type in ('post_like','post_comment','peer_request','peer_match','badge_earned','daily_mission','spectator_invite','contributor_invite')
);
