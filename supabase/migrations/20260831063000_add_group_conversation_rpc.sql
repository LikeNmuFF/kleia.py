create or replace function public.create_group_conversation(member_ids uuid[], group_name text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  trimmed_name text := btrim(group_name);
  unique_member_ids uuid[];
  found_conversation_id uuid;
begin
  if current_user_id is null then
    return jsonb_build_object('error', 'Not logged in');
  end if;

  if trimmed_name is null or char_length(trimmed_name) = 0 then
    return jsonb_build_object('error', 'Group name is required');
  end if;

  if char_length(trimmed_name) > 100 then
    return jsonb_build_object('error', 'Group name must be 100 characters or fewer');
  end if;

  select coalesce(array_agg(distinct member_id), array[]::uuid[])
  into unique_member_ids
  from unnest(member_ids) as member_id
  where member_id is not null
    and member_id <> current_user_id;

  if coalesce(array_length(unique_member_ids, 1), 0) < 1 then
    return jsonb_build_object('error', 'Select at least one other member');
  end if;

  if array_length(unique_member_ids, 1) > 50 then
    return jsonb_build_object('error', 'Group chat limited to 50 members');
  end if;

  if exists (
    select 1
    from unnest(unique_member_ids) as member_id
    left join public.profiles p on p.id = member_id
    where p.id is null
  ) then
    return jsonb_build_object('error', 'One or more members were not found');
  end if;

  insert into public.conversations (name, type, created_by)
  values (trimmed_name, 'group', current_user_id)
  returning id into found_conversation_id;

  insert into public.conversation_members (conversation_id, user_id)
  select found_conversation_id, member_id
  from unnest(array_prepend(current_user_id, unique_member_ids)) as member_id;

  return jsonb_build_object('conversationId', found_conversation_id);
end;
$$;

revoke all on function public.create_group_conversation(uuid[], text) from public;
grant execute on function public.create_group_conversation(uuid[], text) to authenticated;

notify pgrst, 'reload schema';
