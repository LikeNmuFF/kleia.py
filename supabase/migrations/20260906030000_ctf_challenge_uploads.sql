create table if not exists public.ctf_challenge_uploads (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  challenge_id uuid unique references public.ctf_challenges(id) on delete cascade,
  scope_season_id uuid references public.ctf_seasons(id) on delete cascade,
  cloudinary_asset_id text not null unique,
  cloudinary_public_id text not null unique,
  original_name text not null,
  stored_name text not null,
  extension text not null check (extension in ('zip','png','jpg','jpeg','gif','webp','pdf','txt','md','json','csv','pcap','pcapng')),
  size_bytes bigint not null check (size_bytes between 1 and 26214400),
  sha256 text not null,
  scan_status text not null check (scan_status in ('pending','approved','rejected')),
  scan_provider text not null default 'perception_point',
  scan_result jsonb,
  created_at timestamptz not null default now(),
  scanned_at timestamptz
);

create index if not exists idx_ctf_challenge_uploads_owner_id on public.ctf_challenge_uploads(owner_id);
create index if not exists idx_ctf_challenge_uploads_challenge_id on public.ctf_challenge_uploads(challenge_id);
create index if not exists idx_ctf_challenge_uploads_scope_season_id on public.ctf_challenge_uploads(scope_season_id);
create index if not exists idx_ctf_challenge_uploads_scan_status_created_at on public.ctf_challenge_uploads(scan_status, created_at);

alter table public.ctf_challenge_uploads enable row level security;

grant select on public.ctf_challenge_uploads to authenticated;
grant select, insert, update, delete on public.ctf_challenge_uploads to service_role;

drop policy if exists "Upload owners can view own uploads" on public.ctf_challenge_uploads;
create policy "Upload owners can view own uploads"
  on public.ctf_challenge_uploads for select to authenticated
  using ((select auth.uid()) = owner_id);

drop policy if exists "Admins can view challenge uploads" on public.ctf_challenge_uploads;
create policy "Admins can view challenge uploads"
  on public.ctf_challenge_uploads for select to authenticated
  using (
    exists (
      select 1 from public.profiles profile
      where profile.id = (select auth.uid()) and profile.role = 'admin'
    )
  );
