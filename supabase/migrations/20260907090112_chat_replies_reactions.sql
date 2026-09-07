alter table public.messages add column reply_to_id uuid;
alter table public.messages add constraint messages_id_conversation_unique unique (id, conversation_id);
alter table public.messages add constraint messages_reply_same_conversation
  foreign key (reply_to_id, conversation_id) references public.messages (id, conversation_id)
  on delete set null (reply_to_id);
create index messages_reply_to_idx on public.messages(reply_to_id) where reply_to_id is not null;

create or replace function public.prevent_message_update_except_read()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  if new.id is distinct from old.id
    or new.conversation_id is distinct from old.conversation_id
    or new.sender_id is distinct from old.sender_id
    or new.content is distinct from old.content
    or new.created_at is distinct from old.created_at
    or (new.reply_to_id is distinct from old.reply_to_id
      and not (new.reply_to_id is null and pg_trigger_depth() > 1)) then
    raise exception 'Only message read status can be updated';
  end if;
  return new;
end;
$$;
revoke all on function public.prevent_message_update_except_read() from public;

create table public.message_reactions (
  message_id uuid not null,
  conversation_id uuid not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  emoji text not null check (emoji in ('like', 'heart', 'laugh', 'wow', 'sad', 'celebrate')),
  active boolean not null default true,
  primary key (message_id, user_id, emoji),
  foreign key (message_id, conversation_id) references public.messages(id, conversation_id) on delete cascade
);
create index message_reactions_conversation_idx on public.message_reactions(conversation_id);
create index message_reactions_user_idx on public.message_reactions(user_id);
alter table public.message_reactions enable row level security;
create policy "Members can read message reactions" on public.message_reactions
  for select to authenticated
  using (public.is_conversation_member(conversation_id, (select auth.uid())));
revoke all on public.message_reactions from anon, authenticated;
grant select on public.message_reactions to authenticated;
grant all on public.message_reactions to service_role;

-- Keep removal as an UPDATE so filtered realtime events remain authorized by RLS.
alter publication supabase_realtime add table public.message_reactions;
notify pgrst, 'reload schema';
