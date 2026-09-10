-- Private practice has no scoring triggers or references to global submissions.
create table public.practice_rooms (
 id uuid primary key default gen_random_uuid(), title text not null check(char_length(btrim(title)) between 1 and 120),
 description text not null default '', created_by uuid not null references public.profiles(id), created_at timestamptz not null default now()
);
create table public.practice_room_members (
 room_id uuid not null references public.practice_rooms(id) on delete cascade,
 user_id uuid not null references public.profiles(id) on delete cascade,
 invited_by uuid not null references public.profiles(id), invited_at timestamptz not null default now(),
 last_reminded_at timestamptz, primary key(room_id,user_id)
);
alter table public.ctf_challenge_uploads add column scope_room_id uuid references public.practice_rooms(id);
alter table public.ctf_challenge_uploads add constraint practice_upload_scope check(scope_room_id is null or (scope_season_id is null and challenge_id is null));
create index practice_upload_room_idx on public.ctf_challenge_uploads(scope_room_id) where scope_room_id is not null;
create table public.practice_challenges (
 id uuid primary key default gen_random_uuid(), room_id uuid not null references public.practice_rooms(id) on delete cascade,
 title text not null check(char_length(btrim(title)) between 1 and 200), description text not null,
 category text not null check(category in ('web','crypto','forensics','osint','misc')),
 difficulty text not null check(difficulty in ('easy','medium','hard')), points integer not null check(points>0),
 hint text, explanation text, flag_hash text not null check(flag_hash ~ '^[0-9a-f]{64}$'),
 upload_id uuid unique references public.ctf_challenge_uploads(id), learn_topic_slug text, learn_lesson_slug text,
 is_active boolean not null default true, created_by uuid not null references public.profiles(id), created_at timestamptz not null default now()
);
create index practice_challenge_room_idx on public.practice_challenges(room_id);
create table public.practice_attempts (
 id uuid primary key default gen_random_uuid(), challenge_id uuid not null references public.practice_challenges(id) on delete cascade,
 user_id uuid not null references public.profiles(id) on delete cascade, is_correct boolean not null, created_at timestamptz not null default now()
);
create index practice_attempt_rate_idx on public.practice_attempts(challenge_id,user_id,created_at desc);
create table public.practice_feedback (
 challenge_id uuid not null references public.practice_challenges(id) on delete cascade,
 user_id uuid not null references public.profiles(id) on delete cascade,
 message text not null check(char_length(btrim(message)) between 1 and 2000), updated_at timestamptz not null default now(), primary key(challenge_id,user_id)
);
create table public.practice_publications (
 practice_challenge_id uuid primary key references public.practice_challenges(id) on delete cascade,
 ctf_challenge_id uuid not null unique references public.ctf_challenges(id) on delete cascade,
 upload_id uuid references public.ctf_challenge_uploads(id), published_by uuid not null references public.profiles(id), published_at timestamptz not null default now()
);
create index practice_publication_upload_idx on public.practice_publications(upload_id) where upload_id is not null;
create index practice_member_user_idx on public.practice_room_members(user_id);

-- Validate even trusted server writes and serialize competing attachment claims.
create function public.practice_validate_attachment() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.upload_id is not null then
  perform 1 from public.ctf_challenge_uploads u join public.profiles p on p.id=u.owner_id and p.role='admin'
  where u.id=new.upload_id and u.scope_room_id=new.room_id and u.scope_season_id is null and u.challenge_id is null and u.scan_status='approved' for update of u;
  if not found then raise exception 'Invalid practice attachment'; end if;
 end if;
 return new;
end; $$;
revoke all on function public.practice_validate_attachment() from public,anon,authenticated;
create trigger practice_attachment_check before insert or update of upload_id,room_id on public.practice_challenges for each row execute function public.practice_validate_attachment();

-- Fixed search paths, no supplied actor IDs, and explicit EXECUTE grants.
create function public.practice_can_access(p_room_id uuid) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.practice_rooms r where r.id=p_room_id) and
 (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin') or
 exists(select 1 from public.practice_room_members m where m.room_id=p_room_id and m.user_id=auth.uid()));
$$;
revoke all on function public.practice_can_access(uuid) from public,anon;
grant execute on function public.practice_can_access(uuid) to authenticated;

alter table public.practice_rooms enable row level security;
alter table public.practice_room_members enable row level security;
alter table public.practice_challenges enable row level security;
alter table public.practice_attempts enable row level security;
alter table public.practice_feedback enable row level security;
alter table public.practice_publications enable row level security;
revoke all on public.practice_rooms,public.practice_room_members,public.practice_challenges,public.practice_attempts,public.practice_feedback,public.practice_publications from public,anon,authenticated;
grant all on public.practice_rooms,public.practice_room_members,public.practice_challenges,public.practice_attempts,public.practice_feedback,public.practice_publications to service_role;
grant select on public.practice_rooms,public.practice_room_members,public.practice_attempts,public.practice_feedback,public.practice_publications to authenticated;
grant select(id,room_id,title,description,category,difficulty,points,hint,explanation,upload_id,learn_topic_slug,learn_lesson_slug,is_active,created_by,created_at) on public.practice_challenges to authenticated;
grant insert,update on public.practice_feedback to authenticated;
create policy practice_rooms_read on public.practice_rooms for select to authenticated using(public.practice_can_access(id));
create policy practice_members_read on public.practice_room_members for select to authenticated using(public.practice_can_access(room_id) and (user_id=auth.uid() or exists(select 1 from public.profiles where id=auth.uid() and role='admin')));
create policy practice_challenges_read on public.practice_challenges for select to authenticated using(public.practice_can_access(room_id));
create policy practice_attempts_read on public.practice_attempts for select to authenticated using(exists(select 1 from public.practice_challenges c where c.id=challenge_id and public.practice_can_access(c.room_id)) and (user_id=auth.uid() or exists(select 1 from public.profiles where id=auth.uid() and role='admin')));
create policy practice_feedback_read on public.practice_feedback for select to authenticated using(exists(select 1 from public.practice_challenges c where c.id=challenge_id and public.practice_can_access(c.room_id)) and (user_id=auth.uid() or exists(select 1 from public.profiles where id=auth.uid() and role='admin')));
create policy practice_feedback_insert on public.practice_feedback for insert to authenticated with check(user_id=auth.uid() and exists(select 1 from public.practice_challenges c where c.id=challenge_id and public.practice_can_access(c.room_id)));
create policy practice_feedback_update on public.practice_feedback for update to authenticated using(user_id=auth.uid() and exists(select 1 from public.practice_challenges c where c.id=challenge_id and public.practice_can_access(c.room_id))) with check(user_id=auth.uid() and exists(select 1 from public.practice_challenges c where c.id=challenge_id and public.practice_can_access(c.room_id)));
create policy practice_publications_read on public.practice_publications for select to authenticated using(exists(select 1 from public.practice_challenges c where c.id=practice_challenge_id and public.practice_can_access(c.room_id)));

alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check check(type in ('post_like','post_comment','peer_request','peer_match','badge_earned','daily_mission','spectator_invite','contributor_invite','practice_invite','practice_reminder'));
create or replace function public.create_notification(p_recipient_id uuid,p_actor_id uuid,p_type text,p_title text,p_message text,p_href text,p_metadata jsonb default '{}'::jsonb)
returns uuid language plpgsql security definer set search_path='' as $$
declare notification_id uuid; dedupe_key text := nullif(p_metadata->>'dedupe_key','');
begin
 if auth.uid() is null then raise exception 'Not authenticated'; end if;
 if p_type in ('practice_invite','practice_reminder') then raise exception 'Use practice_invite'; end if;
 if p_actor_id is not null and p_actor_id<>auth.uid() then raise exception 'Invalid notification actor'; end if;
 if dedupe_key is not null and exists(select 1 from public.notifications n where n.recipient_id=p_recipient_id and n.type=p_type and n.metadata->>'dedupe_key'=dedupe_key) then return null; end if;
 insert into public.notifications(recipient_id,actor_id,type,title,message,href,metadata) values(p_recipient_id,p_actor_id,p_type,p_title,p_message,p_href,coalesce(p_metadata,'{}'::jsonb)) returning id into notification_id;
 return notification_id;
end; $$;
revoke all on function public.create_notification(uuid,uuid,text,text,text,text,jsonb) from public,anon;
grant execute on function public.create_notification(uuid,uuid,text,text,text,text,jsonb) to authenticated;

create function public.practice_invite(p_room_id uuid,p_user_id uuid,p_remind boolean default false) returns void language plpgsql security definer set search_path='' as $$
declare r public.practice_rooms; m public.practice_room_members; inserted integer;
begin
 if auth.uid() is null or not exists(select 1 from public.profiles where id=auth.uid() and role='admin') then raise exception 'Admin required'; end if;
 select * into r from public.practice_rooms where id=p_room_id for update;
 if not found then raise exception 'Room not found'; end if;
 if p_remind then
  select * into m from public.practice_room_members where room_id=p_room_id and user_id=p_user_id for update;
  if not found then raise exception 'Member not found'; end if;
  if coalesce(m.last_reminded_at,m.invited_at)>clock_timestamp()-interval '5 minutes' then raise exception 'Reminder cooldown'; end if;
  update public.practice_room_members set last_reminded_at=clock_timestamp() where room_id=p_room_id and user_id=p_user_id;
 else
  insert into public.practice_room_members(room_id,user_id,invited_by) values(p_room_id,p_user_id,auth.uid()) on conflict do nothing;
  get diagnostics inserted=row_count;
  if inserted=0 then return; end if;
 end if;
 insert into public.notifications(recipient_id,actor_id,type,title,message,href,metadata)
 values(p_user_id,auth.uid(),case when p_remind then 'practice_reminder' else 'practice_invite' end,
 case when p_remind then 'Private practice reminder' else 'Private practice invitation' end,
 left(r.title,120),'/practice/'||p_room_id::text,jsonb_build_object('room_id',p_room_id));
end; $$;

create function public.practice_submit(p_challenge_id uuid,p_flag text) returns jsonb language plpgsql security definer set search_path='' as $$
declare c public.practice_challenges; ok boolean; actor uuid:=auth.uid();
begin
 if actor is null then raise exception 'Not authenticated'; end if;
 if p_flag is null or char_length(p_flag) not between 1 and 500 then raise exception 'Flag must contain 1 to 500 characters'; end if;
 select * into c from public.practice_challenges where id=p_challenge_id for share;
 if not found then raise exception 'Challenge unavailable'; end if;
 -- The row lock orders submission against DELETE revocation; admin submissions
 -- additionally use an advisory lock because admins need not have memberships.
 perform 1 from public.practice_room_members where room_id=c.room_id and user_id=actor for update;
 if not public.practice_can_access(c.room_id) or not c.is_active then raise exception 'Challenge unavailable'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(actor::text||p_challenge_id::text,0));
 if exists(select 1 from public.practice_attempts where challenge_id=c.id and user_id=actor and is_correct) then return jsonb_build_object('correct',true,'alreadySolved',true); end if;
 if (select count(*) from public.practice_attempts where challenge_id=c.id and user_id=actor and created_at>clock_timestamp()-interval '1 hour')>=30 or
 (select count(*) from public.practice_attempts where challenge_id=c.id and user_id=actor and created_at>clock_timestamp()-interval '1 minute')>=5 then raise exception 'Too many attempts'; end if;
 ok:=c.flag_hash=encode(extensions.digest(upper(btrim(p_flag)),'sha256'),'hex');
 insert into public.practice_attempts(challenge_id,user_id,is_correct) values(c.id,actor,ok);
 return jsonb_build_object('correct',ok,'alreadySolved',false);
end; $$;

create function public.practice_publish(p_challenge_id uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare c public.practice_challenges; published uuid;
begin
 if auth.uid() is null or not exists(select 1 from public.profiles where id=auth.uid() and role='admin') then raise exception 'Admin required'; end if;
 select * into c from public.practice_challenges where id=p_challenge_id for update;
 if not found then raise exception 'Challenge not found'; end if;
 select ctf_challenge_id into published from public.practice_publications where practice_challenge_id=c.id;
 if found then return published; end if;
 if c.upload_id is not null then
  perform 1 from public.ctf_challenge_uploads u join public.profiles p on p.id=u.owner_id and p.role='admin'
  where u.id=c.upload_id and u.scope_room_id=c.room_id and u.scope_season_id is null and u.challenge_id is null and u.scan_status='approved' for update of u;
  if not found then raise exception 'Invalid practice attachment'; end if;
 end if;
 insert into public.ctf_challenges(title,description,category,difficulty,points,flag_hash,hint,is_active,created_by,status,season_id,file_url,learn_topic_slug,learn_lesson_slug)
 values(c.title,c.description,c.category,c.difficulty,c.points,c.flag_hash,c.hint,true,auth.uid(),'approved',null,
 case when c.upload_id is null then null else '/api/practice/files/'||c.upload_id::text end,c.learn_topic_slug,c.learn_lesson_slug) returning id into published;
 insert into public.practice_publications(practice_challenge_id,ctf_challenge_id,upload_id,published_by) values(c.id,published,c.upload_id,auth.uid());
 return published;
end; $$;
revoke all on function public.practice_invite(uuid,uuid,boolean),public.practice_submit(uuid,text),public.practice_publish(uuid) from public,anon;
grant execute on function public.practice_invite(uuid,uuid,boolean),public.practice_submit(uuid,text),public.practice_publish(uuid) to authenticated;
