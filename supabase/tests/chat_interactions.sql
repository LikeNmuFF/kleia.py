begin;
do $$
declare
 owner_id uuid;
 outsider_id uuid;
 conversation_a uuid := gen_random_uuid();
 conversation_b uuid := gen_random_uuid();
 parent_id uuid := gen_random_uuid();
 reply_id uuid := gen_random_uuid();
 visible_count integer;
begin
 select id into owner_id from public.profiles order by id limit 1;
 select id into outsider_id from public.profiles where id <> owner_id order by id limit 1;
 if owner_id is null or outsider_id is null then raise exception 'Two profiles are required for this rollback-only check'; end if;
 insert into public.conversations(id,type,created_by) values(conversation_a,'group',owner_id),(conversation_b,'group',owner_id);
 insert into public.conversation_members(conversation_id,user_id) values(conversation_a,owner_id),(conversation_b,owner_id);
 insert into public.messages(id,conversation_id,sender_id,content) values(parent_id,conversation_a,owner_id,'Rollback verification');
 insert into public.messages(id,conversation_id,sender_id,content,reply_to_id) values(reply_id,conversation_a,owner_id,'Reply verification',parent_id);
 begin
  insert into public.messages(conversation_id,sender_id,content,reply_to_id) values(conversation_b,owner_id,'Cross conversation',parent_id);
  raise exception 'Cross-conversation reply was accepted';
 exception when foreign_key_violation then null;
 end;
 insert into public.message_reactions(message_id,conversation_id,user_id,emoji) values(parent_id,conversation_a,owner_id,'heart');
 begin
  insert into public.message_reactions(message_id,conversation_id,user_id,emoji) values(parent_id,conversation_a,owner_id,'invalid');
  raise exception 'Invalid reaction was accepted';
 exception when check_violation then null;
 end;
 perform set_config('request.jwt.claim.sub',owner_id::text,true);
 set local role authenticated;
 select count(*) into visible_count from public.message_reactions where message_id=parent_id;
 if visible_count <> 1 then raise exception 'Member cannot read reactions'; end if;
 begin
  update public.message_reactions set active=false where message_id=parent_id;
  raise exception 'Direct reaction write was accepted';
 exception when insufficient_privilege then null;
 end;
 perform set_config('request.jwt.claim.sub',outsider_id::text,true);
 select count(*) into visible_count from public.message_reactions where message_id=parent_id;
 if visible_count <> 0 then raise exception 'Outsider can read reactions'; end if;
 reset role;
 delete from public.messages where id=parent_id;
 if exists(select 1 from public.messages where id=reply_id and reply_to_id is not null) then raise exception 'Deleted reply target not cleared'; end if;
 if exists(select 1 from public.message_reactions where message_id=parent_id) then raise exception 'Orphan reactions remain'; end if;
end;
$$;
rollback;
