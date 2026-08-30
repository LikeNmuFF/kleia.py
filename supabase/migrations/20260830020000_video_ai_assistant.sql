create table if not exists public.video_ai_summaries (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  video_id text not null,
  video_url text not null,
  title text,
  transcript_hash text not null,
  summary text not null,
  model text not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint video_ai_summaries_video_id_check check (video_id ~ '^[A-Za-z0-9_-]{11}$')
);

create unique index if not exists video_ai_summaries_post_id_key
  on public.video_ai_summaries(post_id);

create index if not exists video_ai_summaries_video_id_idx
  on public.video_ai_summaries(video_id);

create table if not exists public.video_ai_messages (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null check (char_length(content) between 1 and 4000),
  model text,
  created_at timestamptz not null default now()
);

create index if not exists video_ai_messages_user_post_created_idx
  on public.video_ai_messages(user_id, post_id, created_at desc);

create table if not exists public.ai_rate_limit_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid references public.posts(id) on delete cascade,
  action text not null check (action in ('video_summary', 'video_question')),
  created_at timestamptz not null default now()
);

create index if not exists ai_rate_limit_events_user_action_created_idx
  on public.ai_rate_limit_events(user_id, action, created_at desc);

create index if not exists ai_rate_limit_events_user_post_action_created_idx
  on public.ai_rate_limit_events(user_id, post_id, action, created_at desc);

alter table public.video_ai_summaries enable row level security;
alter table public.video_ai_messages enable row level security;
alter table public.ai_rate_limit_events enable row level security;

drop policy if exists "Authenticated users can read video AI summaries" on public.video_ai_summaries;
create policy "Authenticated users can read video AI summaries"
on public.video_ai_summaries
for select
to authenticated
using (true);

drop policy if exists "Authenticated users can create video AI summaries" on public.video_ai_summaries;
create policy "Authenticated users can create video AI summaries"
on public.video_ai_summaries
for insert
to authenticated
with check ((select auth.uid()) = created_by);

drop policy if exists "Summary creators can update summaries" on public.video_ai_summaries;
create policy "Summary creators can update summaries"
on public.video_ai_summaries
for update
to authenticated
using ((select auth.uid()) = created_by)
with check ((select auth.uid()) = created_by);

drop policy if exists "Users can read their own video AI messages" on public.video_ai_messages;
create policy "Users can read their own video AI messages"
on public.video_ai_messages
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own video AI messages" on public.video_ai_messages;
create policy "Users can create their own video AI messages"
on public.video_ai_messages
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can read their own AI rate limit events" on public.ai_rate_limit_events;
create policy "Users can read their own AI rate limit events"
on public.ai_rate_limit_events
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own AI rate limit events" on public.ai_rate_limit_events;
create policy "Users can create their own AI rate limit events"
on public.ai_rate_limit_events
for insert
to authenticated
with check ((select auth.uid()) = user_id);

revoke all on public.video_ai_summaries from anon;
revoke all on public.video_ai_messages from anon;
revoke all on public.ai_rate_limit_events from anon;
revoke all on public.video_ai_summaries from authenticated;
revoke all on public.video_ai_messages from authenticated;
revoke all on public.ai_rate_limit_events from authenticated;
