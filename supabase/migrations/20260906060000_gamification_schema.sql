-- 1. Add XP and level columns to existing tables
alter table public.profiles add column if not exists xp integer not null default 0;
alter table public.profiles add column if not exists level integer not null default 1;
alter table public.profiles add constraint profiles_xp_check check (xp >= 0);
alter table public.profiles add constraint profiles_level_check check (level >= 1);
alter table public.practice_teams add column if not exists xp integer not null default 0;
alter table public.practice_teams add column if not exists level integer not null default 1;
alter table public.practice_teams add constraint practice_teams_xp_check check (xp >= 0);
alter table public.practice_teams add constraint practice_teams_level_check check (level >= 1);

-- 2. Create seasons table
create table if not exists public.seasons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index if not exists seasons_active_idx
  on public.seasons (is_active)
  where is_active = true;

-- 3. Create badges table
create table if not exists public.badges (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text not null,
  icon_url text,
  type text not null check (type in ('user', 'team')),
  threshold integer not null,
  created_at timestamptz not null default now()
);

-- 4. Create earned_badges table
create table if not exists public.earned_badges (
  user_id uuid not null references public.profiles(id) on delete cascade,
  badge_id uuid not null references public.badges(id) on delete cascade,
  season_id uuid references public.seasons(id) on delete set null,
  earned_at timestamptz not null default now(),
  primary key (user_id, badge_id, coalesce(season_id, '00000000-0000-0000-0000-000000000000'::uuid))
);

-- 5. Create indexes
create index if not exists badges_type_idx
  on public.badges (type);

create index if not exists earned_badges_user_id_idx
  on public.earned_badges (user_id);

create index if not exists earned_badges_badge_id_idx
  on public.earned_badges (badge_id);

create index if not exists earned_badges_season_id_idx
  on public.earned_badges (season_id);

-- 6. Enable RLS
alter table public.seasons enable row level security;
alter table public.badges enable row level security;
alter table public.earned_badges enable row level security;

-- 7. RLS policies for seasons
drop policy if exists "Anyone can read seasons" on public.seasons;
create policy "Anyone can read seasons"
  on public.seasons
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Admins can manage seasons" on public.seasons;
create policy "Admins can manage seasons"
  on public.seasons
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.profiles profile
      where profile.id = (select auth.uid())
        and profile.role = 'admin'
    )
  )
  with check (
    exists (
      select 1
      from public.profiles profile
      where profile.id = (select auth.uid())
        and profile.role = 'admin'
    )
  );

-- 8. RLS policies for badges
drop policy if exists "Anyone can read badges" on public.badges;
create policy "Anyone can read badges"
  on public.badges
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Admins can manage badges" on public.badges;
create policy "Admins can manage badges"
  on public.badges
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.profiles profile
      where profile.id = (select auth.uid())
        and profile.role = 'admin'
    )
  )
  with check (
    exists (
      select 1
      from public.profiles profile
      where profile.id = (select auth.uid())
        and profile.role = 'admin'
    )
  );

-- 9. RLS policies for earned_badges
drop policy if exists "Users can read own earned badges" on public.earned_badges;
create policy "Users can read own earned badges"
  on public.earned_badges
  for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or exists (
      select 1
      from public.profiles profile
      where profile.id = (select auth.uid())
        and profile.role = 'admin'
    )
  );

-- 10. Grant permissions
grant select on public.seasons to anon, authenticated;
grant select on public.badges to anon, authenticated;
grant select on public.earned_badges to authenticated;
grant select, insert, update, delete on public.seasons to service_role;
grant select, insert, update, delete on public.badges to service_role;
grant select, insert, update, delete on public.earned_badges to service_role;

-- 11. Seed initial badges
insert into public.badges (name, description, type, threshold) values
  ('First Blood', 'First challenge solved', 'user', 1),
  ('Century Club', '100 challenges solved', 'user', 100),
  ('Dedication', '30-day practice streak', 'user', 30),
  ('Unstoppable', '100-day practice streak', 'user', 100),
  ('Level 10', 'Reach level 10', 'user', 10),
  ('Level 25', 'Reach level 25', 'user', 25),
  ('Rising Star', 'Team reaches level 5', 'team', 5),
  ('Powerhouse', 'Team reaches level 10', 'team', 10),
  ('Full Squad', 'Team has 10+ members', 'team', 10),
  ('Streak Masters', 'Team achieves 30-day streak', 'team', 30),
  ('Centurions', 'Team solves 100 challenges', 'team', 100)
on conflict (name) do nothing;

-- 12. Reload schema
notify pgrst, 'reload schema';