-- Keep internal practice_* identifiers stable while presenting the feature as Labs.
create or replace function public.practice_invite(
  p_room_id uuid,
  p_user_id uuid,
  p_remind boolean default false
) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.practice_rooms;
  m public.practice_room_members;
  inserted integer;
begin
  if auth.uid() is null or not exists(
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ) then
    raise exception 'Admin required';
  end if;

  select * into r from public.practice_rooms where id = p_room_id for update;
  if not found then raise exception 'Room not found'; end if;

  if p_remind then
    select * into m
    from public.practice_room_members
    where room_id = p_room_id and user_id = p_user_id
    for update;
    if not found then raise exception 'Member not found'; end if;
    if coalesce(m.last_reminded_at, m.invited_at) > clock_timestamp() - interval '5 minutes' then
      raise exception 'Reminder cooldown';
    end if;
    update public.practice_room_members
    set last_reminded_at = clock_timestamp()
    where room_id = p_room_id and user_id = p_user_id;
  else
    insert into public.practice_room_members(room_id, user_id, invited_by)
    values(p_room_id, p_user_id, auth.uid())
    on conflict do nothing;
    get diagnostics inserted = row_count;
    if inserted = 0 then return; end if;
  end if;

  insert into public.notifications(recipient_id, actor_id, type, title, message, href, metadata)
  values(
    p_user_id,
    auth.uid(),
    case when p_remind then 'practice_reminder' else 'practice_invite' end,
    case when p_remind then 'Labs reminder' else 'Labs invitation' end,
    left(r.title, 120),
    '/practice/' || p_room_id::text,
    jsonb_build_object('room_id', p_room_id)
  );
end;
$$;

revoke all on function public.practice_invite(uuid, uuid, boolean) from public, anon;
grant execute on function public.practice_invite(uuid, uuid, boolean) to authenticated;
