create table public.tutor_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  skill_key text not null check (skill_key in ('learn','ctf','regexGolf','dailyCipher')),
  message text check (char_length(message) <= 300),
  status text not null default 'open' check (status in ('open','matched','closed')),
  created_at timestamptz default now()
);
create table public.peer_matches (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid references public.profiles(id) on delete set null,
  helper_id uuid references public.profiles(id) on delete set null,
  skill_key text not null,
  status text not null default 'pending' check (status in ('pending','accepted','declined')),
  created_at timestamptz default now(),
  unique(requester_id, helper_id, skill_key)
);
alter table public.tutor_requests enable row level security;
alter table public.peer_matches enable row level security;
create policy "Users can read open requests" on public.tutor_requests for select to authenticated using (true);
create policy "Users can create own requests" on public.tutor_requests for insert to authenticated with check (requester_id=auth.uid());
create policy "Users can read own matches" on public.peer_matches for select to authenticated using (requester_id=auth.uid() or helper_id=auth.uid());
create policy "Helper can create match" on public.peer_matches for insert to authenticated with check (helper_id=auth.uid());
