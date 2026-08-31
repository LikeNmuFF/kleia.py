-- Fix create_direct_conversation: must be SECURITY DEFINER to bypass RLS and create conversation + members
drop function if exists public.create_direct_conversation(uuid) cascade;

create function public.create_direct_conversation(other_user_id uuid)
returns jsonb
language plpgsql
security definer
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

-- ensure PostgREST reloads schema
notify pgrst, 'reload schema';
