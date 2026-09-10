-- Disposable PGlite fixture for dependencies that predate the practice migration.
-- This is NOT a deployment migration. No network or production database is used.
create role anon;
create role authenticated;
create role service_role bypassrls;
create schema auth;
create schema extensions;
create table auth.users(id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
grant usage on schema auth,extensions,public to anon,authenticated,service_role;
grant execute on function auth.uid() to anon,authenticated,service_role;
-- PGlite does not bundle pgcrypto. This SHA-256-only test shim uses PostgreSQL's
-- core SHA-256 implementation; production uses the existing pgcrypto function.
create function extensions.digest(value text, algorithm text) returns bytea language plpgsql immutable as $$
begin
 if algorithm <> 'sha256' then raise exception 'Test digest supports only sha256'; end if;
 return sha256(convert_to(value,'UTF8'));
end; $$;
create table public.profiles(id uuid primary key references auth.users(id), username text not null unique, role text not null default 'user');
grant select on public.profiles to authenticated;
create table public.ctf_challenges (
 id uuid primary key default gen_random_uuid(), title text not null, description text not null,
 category text not null check(category in ('web','crypto','forensics','osint','misc')),
 difficulty text not null check(difficulty in ('easy','medium','hard')), points integer not null check(points>0),
 flag_hash text not null, hint text, is_active boolean not null default true,
 created_by uuid not null references public.profiles(id), created_at timestamptz not null default now(),
 file_url text, link_url text, author text, status text not null default 'approved',
 learn_topic_slug text, learn_lesson_slug text, hint_xp_cost integer default 0, season_id uuid,
 ai_review_notes text, hint_points_cost integer not null default 10
);
create table public.ctf_challenge_uploads (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(id),
 challenge_id uuid unique references public.ctf_challenges(id) on delete cascade, scope_season_id uuid,
 cloudinary_asset_id text not null unique, cloudinary_public_id text not null unique,
 original_name text not null, stored_name text not null, extension text not null,
 size_bytes bigint not null check(size_bytes between 1 and 26214400), sha256 text not null,
 scan_status text not null check(scan_status in ('pending','approved','rejected')),
 scan_provider text not null default 'none', scan_result jsonb,
 created_at timestamptz not null default now(), scanned_at timestamptz
);
create table public.notifications (
 id uuid primary key default gen_random_uuid(), recipient_id uuid not null references public.profiles(id),
 actor_id uuid references public.profiles(id), type text not null,
 title text not null check(char_length(title)<=120), message text not null check(char_length(message)<=500),
 href text not null check(href like '/%'), metadata jsonb not null default '{}',
 read_at timestamptz, created_at timestamptz not null default now()
);
create table public.ctf_submissions (id uuid primary key default gen_random_uuid(), challenge_id uuid references public.ctf_challenges(id),user_id uuid references public.profiles(id),is_correct boolean);
