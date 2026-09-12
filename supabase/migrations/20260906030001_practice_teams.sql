create table if not exists public.practice_teams (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text,
  avatar_url text,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  is_public boolean not null default true check (is_public = true),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.practice_team_members (
  team_id uuid not null references public.practice_teams(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('owner', 'member')),
  status text not null check (status in ('pending', 'accepted')),
  invited_by uuid references public.profiles(id) on delete set null,
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (team_id, user_id)
);

create table if not exists public.practice_team_activity (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.practice_teams(id) on delete cascade,
  activity_date date not null,
  source text not null default 'manual',
  count integer not null default 1 check (count > 0),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (team_id, activity_date, source)
);

create table if not exists public.practice_team_api_keys (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.practice_teams(id) on delete cascade,
  key_prefix text not null,
  key_hash text not null unique,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);

create index if not exists practice_teams_owner_id_idx
  on public.practice_teams(owner_id);

create index if not exists practice_teams_is_public_idx
  on public.practice_teams(is_public)
  where is_public = true;

create index if not exists practice_team_members_user_id_idx
  on public.practice_team_members(user_id);

create index if not exists practice_team_members_team_id_status_idx
  on public.practice_team_members(team_id, status);

create index if not exists practice_team_activity_team_id_activity_date_idx
  on public.practice_team_activity(team_id, activity_date desc);

create index if not exists practice_team_api_keys_team_id_idx
  on public.practice_team_api_keys(team_id);

alter table public.practice_teams enable row level security;
alter table public.practice_team_members enable row level security;
alter table public.practice_team_activity enable row level security;
alter table public.practice_team_api_keys enable row level security;

drop policy if exists "Anyone can read public practice teams" on public.practice_teams;
create policy "Anyone can read public practice teams"
  on public.practice_teams
  for select
  to anon, authenticated
  using (
    is_public = true
    or owner_id = (select auth.uid())
    or exists (
      select 1
      from public.profiles profile
      where profile.id = (select auth.uid())
        and profile.role = 'admin'
    )
  );

drop policy if exists "Authenticated users can create practice teams" on public.practice_teams;
create policy "Authenticated users can create practice teams"
  on public.practice_teams
  for insert
  to authenticated
  with check (owner_id = (select auth.uid()));

drop policy if exists "Owners and admins can update practice teams" on public.practice_teams;
create policy "Owners and admins can update practice teams"
  on public.practice_teams
  for update
  to authenticated
  using (
    owner_id = (select auth.uid())
    or exists (
      select 1
      from public.profiles profile
      where profile.id = (select auth.uid())
        and profile.role = 'admin'
    )
  )
  with check (
    is_public = true
    and (
      owner_id = (select auth.uid())
      or exists (
        select 1
        from public.profiles profile
        where profile.id = (select auth.uid())
          and profile.role = 'admin'
      )
    )
  );

drop policy if exists "Members can read own team membership" on public.practice_team_members;
create policy "Members can read own team membership"
  on public.practice_team_members
  for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or exists (
      select 1
      from public.practice_teams team
      where team.id = practice_team_members.team_id
        and team.owner_id = (select auth.uid())
    )
    or exists (
      select 1
      from public.profiles profile
      where profile.id = (select auth.uid())
        and profile.role = 'admin'
    )
  );

drop policy if exists "Owners and admins can insert team members" on public.practice_team_members;
create policy "Owners and admins can insert team members"
  on public.practice_team_members
  for insert
  to authenticated
  with check (
    (
      exists (
        select 1
        from public.practice_teams team
        where team.id = practice_team_members.team_id
          and team.owner_id = (select auth.uid())
      )
      or exists (
        select 1
        from public.profiles profile
        where profile.id = (select auth.uid())
          and profile.role = 'admin'
      )
    )
    and role in ('owner', 'member')
    and status in ('pending', 'accepted')
    and (
      (role = 'owner' and user_id = (select auth.uid()) and status = 'accepted')
      or role = 'member'
    )
  );

drop policy if exists "Owners and admins can delete team members" on public.practice_team_members;
create policy "Owners and admins can delete team members"
  on public.practice_team_members
  for delete
  to authenticated
  using (
    role <> 'owner'
    and (
      exists (
        select 1
        from public.practice_teams team
        where team.id = practice_team_members.team_id
          and team.owner_id = (select auth.uid())
      )
      or exists (
        select 1
        from public.profiles profile
        where profile.id = (select auth.uid())
          and profile.role = 'admin'
      )
    )
  );

drop policy if exists "Anyone can read public practice team activity" on public.practice_team_activity;
create policy "Anyone can read public practice team activity"
  on public.practice_team_activity
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.practice_teams team
      where team.id = practice_team_activity.team_id
        and team.is_public = true
    )
    or exists (
      select 1
      from public.practice_teams team
      where team.id = practice_team_activity.team_id
        and team.owner_id = (select auth.uid())
    )
    or exists (
      select 1
      from public.profiles profile
      where profile.id = (select auth.uid())
        and profile.role = 'admin'
    )
  );

drop policy if exists "Owners and admins can read api key metadata" on public.practice_team_api_keys;
create policy "Owners and admins can read api key metadata"
  on public.practice_team_api_keys
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.practice_teams team
      where team.id = practice_team_api_keys.team_id
        and team.owner_id = (select auth.uid())
    )
    or exists (
      select 1
      from public.profiles profile
      where profile.id = (select auth.uid())
        and profile.role = 'admin'
    )
  );

grant select on public.practice_teams to anon, authenticated;
grant insert on public.practice_teams to authenticated;
grant update (name, slug, description, avatar_url) on public.practice_teams to authenticated;
grant select on public.practice_team_members to authenticated;
grant insert, delete on public.practice_team_members to authenticated;
grant select on public.practice_team_activity to anon, authenticated;
grant select (id, team_id, key_prefix, created_by, created_at, last_used_at, revoked_at) on public.practice_team_api_keys to authenticated;
grant select, insert, update, delete on public.practice_teams to service_role;
grant select, insert, update, delete on public.practice_team_members to service_role;
grant select, insert, update, delete on public.practice_team_activity to service_role;
grant select, insert, update, delete on public.practice_team_api_keys to service_role;

notify pgrst, 'reload schema';
