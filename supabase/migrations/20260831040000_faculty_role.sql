alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('user','admin','special','faculty'));
create index if not exists idx_profiles_role_faculty on public.profiles(role) where role='faculty';
