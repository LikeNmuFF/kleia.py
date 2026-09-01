create table if not exists public.clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text,
  banner_url text,
  contact_email text,
  is_recruiting boolean not null default true,
  creator_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.club_registrations (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  full_name text not null check (char_length(trim(full_name)) between 2 and 120),
  student_id text check (student_id is null or char_length(trim(student_id)) <= 80),
  course text check (course is null or char_length(trim(course)) <= 120),
  year_level text check (year_level is null or char_length(trim(year_level)) <= 40),
  set_name text not null check (lower(trim(set_name)) in ('set a', 'set b', 'set c', 'set d', 'set e')),
  email text not null check (char_length(trim(email)) between 3 and 254),
  phone text check (phone is null or char_length(trim(phone)) <= 40),
  reason text check (reason is null or char_length(trim(reason)) <= 1000),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  source text not null default 'qr',
  created_at timestamptz not null default now(),
  unique (club_id, email)
);

create index if not exists clubs_recruiting_slug_idx
  on public.clubs(slug)
  where is_recruiting = true;

create index if not exists clubs_creator_idx
  on public.clubs(creator_id);

create index if not exists club_registrations_club_created_idx
  on public.club_registrations(club_id, created_at desc);

alter table public.clubs enable row level security;
alter table public.club_registrations enable row level security;

create or replace function public.is_club_staff(target_club_id uuid, target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = target_user_id
      and role = 'admin'
  )
  or exists (
    select 1
    from public.clubs
    where id = target_club_id
      and creator_id = target_user_id
  );
$$;

revoke all on function public.is_club_staff(uuid, uuid) from public;
grant execute on function public.is_club_staff(uuid, uuid) to authenticated;

drop policy if exists "anyone can read recruiting clubs" on public.clubs;
create policy "anyone can read recruiting clubs"
  on public.clubs
  for select
  to anon, authenticated
  using (is_recruiting = true or public.is_club_staff(id, (select auth.uid())));

drop policy if exists "admins can create clubs" on public.clubs;
create policy "admins can create clubs"
  on public.clubs
  for insert
  to authenticated
  with check (
    creator_id = (select auth.uid())
    and exists (
      select 1
      from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.role = 'admin'
    )
  );

drop policy if exists "club staff can update clubs" on public.clubs;
create policy "club staff can update clubs"
  on public.clubs
  for update
  to authenticated
  using (public.is_club_staff(id, (select auth.uid())))
  with check (public.is_club_staff(id, (select auth.uid())));

drop policy if exists "club staff can delete clubs" on public.clubs;
create policy "club staff can delete clubs"
  on public.clubs
  for delete
  to authenticated
  using (public.is_club_staff(id, (select auth.uid())));

drop policy if exists "club staff can read registrations" on public.club_registrations;
create policy "club staff can read registrations"
  on public.club_registrations
  for select
  to authenticated
  using (public.is_club_staff(club_id, (select auth.uid())));

drop policy if exists "club staff can update registrations" on public.club_registrations;
create policy "club staff can update registrations"
  on public.club_registrations
  for update
  to authenticated
  using (public.is_club_staff(club_id, (select auth.uid())))
  with check (public.is_club_staff(club_id, (select auth.uid())));

drop policy if exists "club staff can delete registrations" on public.club_registrations;
create policy "club staff can delete registrations"
  on public.club_registrations
  for delete
  to authenticated
  using (public.is_club_staff(club_id, (select auth.uid())));

grant select on public.clubs to anon, authenticated;
grant insert, update, delete on public.clubs to authenticated;
grant select, insert, update, delete on public.clubs to service_role;
grant select, insert, update, delete on public.club_registrations to service_role;
grant select, update, delete on public.club_registrations to authenticated;

alter publication supabase_realtime add table public.club_registrations;

insert into public.clubs (name, slug, description, is_recruiting)
values (
  'CCO',
  'cco',
  'CCS department club sign-up',
  true
)
on conflict (slug) do update
set name = excluded.name,
    description = excluded.description;

notify pgrst, 'reload schema';
