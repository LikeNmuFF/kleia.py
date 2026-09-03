create table if not exists public.ctf_season_registrations (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.ctf_seasons(id) on delete cascade,
  email text not null,
  username text not null,
  status text not null default 'pending' check (status in ('pending', 'created', 'rejected')),
  created_user_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create unique index if not exists ctf_season_registrations_season_email_idx
  on public.ctf_season_registrations (season_id, lower(email));

alter table public.ctf_season_registrations enable row level security;

drop policy if exists "Anyone can submit season registration" on public.ctf_season_registrations;
create policy "Anyone can submit season registration"
  on public.ctf_season_registrations
  for insert
  to anon, authenticated
  with check (length(trim(email)) between 5 and 320 and length(trim(username)) between 3 and 30);

drop policy if exists "Admins can manage season registrations" on public.ctf_season_registrations;
create policy "Admins can manage season registrations"
  on public.ctf_season_registrations
  for all
  to authenticated
  using (is_admin())
  with check (is_admin());

grant insert on public.ctf_season_registrations to anon, authenticated;
grant select, update on public.ctf_season_registrations to authenticated;
