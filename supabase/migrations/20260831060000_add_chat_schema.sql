create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  name text check (name is null or char_length(name) between 1 and 100),
  type text not null check (type in ('direct', 'group')),
  created_by uuid references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  last_message_at timestamptz,
  last_message_preview text
);

-- ensure columns exist on pre-existing table (000 created without created_by / last_message_*)
alter table public.conversations add column if not exists created_by uuid references public.profiles(id) on delete cascade;
alter table public.conversations add column if not exists last_message_at timestamptz;
alter table public.conversations add column if not exists last_message_preview text;

create table if not exists public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(btrim(content)) between 1 and 4000),
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists conversations_last_message_idx
  on public.conversations(last_message_at desc nulls last, created_at desc);

create index if not exists conversation_members_user_idx
  on public.conversation_members(user_id, conversation_id);

create index if not exists messages_conversation_created_idx
  on public.messages(conversation_id, created_at);

create index if not exists messages_unread_recipient_idx
  on public.messages(conversation_id, sender_id, read)
  where read = false;

alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;

create or replace function public.is_conversation_member(target_conversation_id uuid, target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.conversation_members cm
    where cm.conversation_id = target_conversation_id
      and cm.user_id = target_user_id
  );
$$;

revoke all on function public.is_conversation_member(uuid, uuid) from public;
grant execute on function public.is_conversation_member(uuid, uuid) to authenticated;

create or replace function public.is_conversation_creator(target_conversation_id uuid, target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.conversations c
    where c.id = target_conversation_id
      and c.created_by = target_user_id
  );
$$;

revoke all on function public.is_conversation_creator(uuid, uuid) from public;
grant execute on function public.is_conversation_creator(uuid, uuid) to authenticated;

drop policy if exists "Members can read their conversations" on public.conversations;
create policy "Members can read their conversations"
on public.conversations
for select
to authenticated
using (public.is_conversation_member(id, (select auth.uid())));

drop policy if exists "Users can create conversations" on public.conversations;
create policy "Users can create conversations"
on public.conversations
for insert
to authenticated
with check (created_by = (select auth.uid()));

drop policy if exists "Members can read conversation members" on public.conversation_members;
create policy "Members can read conversation members"
on public.conversation_members
for select
to authenticated
using (
  user_id = (select auth.uid())
  or public.is_conversation_member(conversation_id, (select auth.uid()))
);

drop policy if exists "Conversation creators can add initial members" on public.conversation_members;
create policy "Conversation creators can add initial members"
on public.conversation_members
for insert
to authenticated
with check (
  public.is_conversation_creator(conversation_id, (select auth.uid()))
);

drop policy if exists "Members can read messages" on public.messages;
create policy "Members can read messages"
on public.messages
for select
to authenticated
using (public.is_conversation_member(conversation_id, (select auth.uid())));

drop policy if exists "Members can send messages" on public.messages;
create policy "Members can send messages"
on public.messages
for insert
to authenticated
with check (
  sender_id = (select auth.uid())
  and public.is_conversation_member(conversation_id, (select auth.uid()))
);

drop policy if exists "Members can mark received messages read" on public.messages;
create policy "Members can mark received messages read"
on public.messages
for update
to authenticated
using (
  sender_id <> (select auth.uid())
  and public.is_conversation_member(conversation_id, (select auth.uid()))
)
with check (
  sender_id <> (select auth.uid())
  and public.is_conversation_member(conversation_id, (select auth.uid()))
);

create or replace function public.create_direct_conversation(other_user_id uuid)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  found_conversation_id uuid;
begin
  if current_user_id is null then
    return jsonb_build_object('error', 'Not logged in');
  end if;

  if other_user_id is null or other_user_id = current_user_id then
    return jsonb_build_object('error', 'Choose another member');
  end if;

  if not exists (select 1 from public.profiles where id = other_user_id) then
    return jsonb_build_object('error', 'Member not found');
  end if;

  select c.id
  into found_conversation_id
  from public.conversations c
  where c.type = 'direct'
    and exists (
      select 1
      from public.conversation_members cm
      where cm.conversation_id = c.id
        and cm.user_id = current_user_id
    )
    and exists (
      select 1
      from public.conversation_members cm
      where cm.conversation_id = c.id
        and cm.user_id = other_user_id
    )
    and (
      select count(*)
      from public.conversation_members cm
      where cm.conversation_id = c.id
    ) = 2
  limit 1;

  if found_conversation_id is not null then
    return jsonb_build_object('conversationId', found_conversation_id);
  end if;

  insert into public.conversations (type, created_by)
  values ('direct', current_user_id)
  returning id into found_conversation_id;

  insert into public.conversation_members (conversation_id, user_id)
  values
    (found_conversation_id, current_user_id),
    (found_conversation_id, other_user_id);

  return jsonb_build_object('conversationId', found_conversation_id);
end;
$$;

revoke all on function public.create_direct_conversation(uuid) from public;
grant execute on function public.create_direct_conversation(uuid) to authenticated;

create or replace function public.prevent_message_update_except_read()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.id <> old.id
    or new.conversation_id <> old.conversation_id
    or new.sender_id <> old.sender_id
    or new.content <> old.content
    or new.created_at <> old.created_at then
    raise exception 'Only message read status can be updated';
  end if;

  return new;
end;
$$;

revoke all on function public.prevent_message_update_except_read() from public;

drop trigger if exists messages_prevent_update_except_read on public.messages;
create trigger messages_prevent_update_except_read
before update on public.messages
for each row
execute function public.prevent_message_update_except_read();

create or replace function public.update_conversation_last_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversations
  set
    last_message_at = new.created_at,
    last_message_preview = left(new.content, 160)
  where id = new.conversation_id;

  return new;
end;
$$;

revoke all on function public.update_conversation_last_message() from public;

drop trigger if exists messages_update_conversation_last_message on public.messages;
create trigger messages_update_conversation_last_message
after insert on public.messages
for each row
execute function public.update_conversation_last_message();

revoke all on public.conversations from anon;
revoke all on public.conversation_members from anon;
revoke all on public.messages from anon;
grant select, insert on public.conversations to authenticated;
grant select, insert on public.conversation_members to authenticated;
grant select, insert, update on public.messages to authenticated;
