create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  type text not null check (type in ('post_like','post_comment','peer_request','peer_match','badge_earned','daily_mission','spectator_invite')),
  title text not null check (char_length(title) <= 120),
  message text not null check (char_length(message) <= 500),
  href text not null check (href like '/%'),
  metadata jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_recipient_created_idx on public.notifications(recipient_id, created_at desc);
create index if not exists notifications_unread_idx on public.notifications(recipient_id) where read_at is null;
alter table public.notifications enable row level security;

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications') then
    alter publication supabase_realtime add table public.notifications;
  end if;
end;
$$;

drop policy if exists "Users can read own notifications" on public.notifications;
create policy "Users can read own notifications" on public.notifications for select to authenticated using (recipient_id = auth.uid());
drop policy if exists "Users can update own notifications" on public.notifications;
create policy "Users can update own notifications" on public.notifications for update to authenticated using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());

create or replace function public.create_notification(
  p_recipient_id uuid,
  p_actor_id uuid,
  p_type text,
  p_title text,
  p_message text,
  p_href text,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  notification_id uuid;
  dedupe_key text := nullif(p_metadata->>'dedupe_key', '');
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if p_actor_id is not null and p_actor_id <> auth.uid() then raise exception 'Invalid notification actor'; end if;
  if dedupe_key is not null and exists (
    select 1 from public.notifications n
    where n.recipient_id = p_recipient_id and n.type = p_type and n.metadata->>'dedupe_key' = dedupe_key
  ) then return null; end if;
  insert into public.notifications(recipient_id, actor_id, type, title, message, href, metadata)
  values (p_recipient_id, p_actor_id, p_type, p_title, p_message, p_href, coalesce(p_metadata, '{}'::jsonb))
  returning id into notification_id;
  return notification_id;
end;
$$;

revoke all on function public.create_notification(uuid, uuid, text, text, text, text, jsonb) from public;
grant execute on function public.create_notification(uuid, uuid, text, text, text, text, jsonb) to authenticated;
