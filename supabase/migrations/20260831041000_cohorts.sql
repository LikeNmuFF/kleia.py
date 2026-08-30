create table public.cohorts (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 3 and 80),
  description text,
  creator_id uuid not null references public.profiles(id) on delete cascade,
  code text unique not null default substr(md5(random()::text),1,6),
  created_at timestamptz default now()
);
create table public.cohort_members (
  cohort_id uuid references public.cohorts(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  role text not null check (role in ('faculty','student')),
  joined_at timestamptz default now(),
  primary key (cohort_id, user_id)
);
create table public.cohort_assignments (
  id uuid primary key default gen_random_uuid(),
  cohort_id uuid references public.cohorts(id) on delete cascade,
  title text not null,
  content_id text not null,
  content_type text not null check (content_type in ('learn_topic','ctf_challenge','custom')),
  created_at timestamptz default now()
);
alter table public.cohorts enable row level security;
alter table public.cohort_members enable row level security;
alter table public.cohort_assignments enable row level security;
create policy "Cohort members can read their cohorts" on public.cohorts for select to authenticated using (exists (select 1 from public.cohort_members where cohort_id=cohorts.id and user_id=auth.uid()));
create policy "Faculty can create cohorts" on public.cohorts for insert to authenticated with check ((select role from public.profiles where id=auth.uid())='faculty');
create policy "Members can read cohort_members" on public.cohort_members for select to authenticated using (exists (select 1 from public.cohort_members cm where cm.cohort_id=cohort_members.cohort_id and cm.user_id=auth.uid()));
create policy "Faculty can insert members" on public.cohort_members for insert to authenticated with check (exists (select 1 from public.cohort_members where cohort_id=cohort_members.cohort_id and user_id=auth.uid() and role='faculty'));
create policy "Members can read assignments" on public.cohort_assignments for select to authenticated using (exists (select 1 from public.cohort_members where cohort_id=cohort_assignments.cohort_id and user_id=auth.uid()));
