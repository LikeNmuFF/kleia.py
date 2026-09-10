-- Run ONLY against a disposable database with the application schema + migration.
-- Every fixture and notification is rolled back. No real identities are used.
begin;
create function pg_temp.assert_true(ok boolean, label text) returns void language plpgsql as $$ begin if ok is distinct from true then raise exception 'Assertion failed: %',label; end if; end $$;
create function pg_temp.denied(statement text, expected_message text default null) returns boolean language plpgsql as $$ begin execute statement; return false; exception when others then return case when expected_message is null then sqlstate='42501' else sqlerrm=expected_message end; end $$;
insert into auth.users(id) values ('00000000-0000-0000-0000-000000009001'),('00000000-0000-0000-0000-000000009002'),('00000000-0000-0000-0000-000000009003');
insert into public.profiles(id,username,role) values
 ('00000000-0000-0000-0000-000000009001','practice_fixture_admin','admin'),
 ('00000000-0000-0000-0000-000000009002','practice_fixture_member','user'),
 ('00000000-0000-0000-0000-000000009003','practice_fixture_outsider','user') on conflict(id) do update set role=excluded.role;
insert into public.practice_rooms(id,title,created_by) values ('00000000-0000-0000-0000-000000009010','Fixture room','00000000-0000-0000-0000-000000009001');
insert into public.practice_challenges(id,room_id,title,description,category,difficulty,points,flag_hash,created_by) values
 ('00000000-0000-0000-0000-000000009020','00000000-0000-0000-0000-000000009010','Fixture challenge','Private','web','easy',100,encode(extensions.digest('FLAG{TEST}','sha256'),'hex'),'00000000-0000-0000-0000-000000009001');
set local role anon;
select pg_temp.assert_true(pg_temp.denied('select title from public.practice_rooms'),'anon read denied');
select pg_temp.assert_true(pg_temp.denied($q$select public.practice_submit('00000000-0000-0000-0000-000000009020','FLAG{TEST}')$q$),'anon RPC denied');
reset role;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000009003',true);
set local role authenticated;
select pg_temp.assert_true((select count(*)=0 from public.practice_rooms),'outsider room invisible');
select pg_temp.assert_true(pg_temp.denied($q$select public.practice_submit('00000000-0000-0000-0000-000000009020','FLAG{TEST}')$q$,'Challenge unavailable'),'outsider submission denied');
select pg_temp.assert_true(pg_temp.denied($q$select public.practice_invite('00000000-0000-0000-0000-000000009010','00000000-0000-0000-0000-000000009003')$q$,'Admin required'),'self invite denied');
select pg_temp.assert_true(pg_temp.denied($q$select public.practice_publish('00000000-0000-0000-0000-000000009020')$q$,'Admin required'),'outsider publish denied');
select pg_temp.assert_true(pg_temp.denied($q$select public.create_notification('00000000-0000-0000-0000-000000009002',null,'practice_invite','Fake','Fake','/practice')$q$,'Use practice_invite'),'generic invitation spoof denied');
reset role;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000009001',true);
set local role authenticated;
select public.practice_invite('00000000-0000-0000-0000-000000009010','00000000-0000-0000-0000-000000009002');
select public.practice_invite('00000000-0000-0000-0000-000000009010','00000000-0000-0000-0000-000000009002');
select pg_temp.assert_true(pg_temp.denied($q$select public.practice_invite('00000000-0000-0000-0000-000000009010','00000000-0000-0000-0000-000000009003',true)$q$,'Member not found'),'reminder cannot grant access');
select pg_temp.assert_true(pg_temp.denied($q$select public.practice_invite('00000000-0000-0000-0000-000000009010','00000000-0000-0000-0000-000000009002',true)$q$,'Reminder cooldown'),'reminder cooldown');
reset role;
select pg_temp.assert_true((select count(*)=1 from public.notifications where type='practice_invite' and recipient_id='00000000-0000-0000-0000-000000009002'),'invite atomic and idempotent');
select pg_temp.assert_true((select title='Labs invitation' from public.notifications where type='practice_invite' and recipient_id='00000000-0000-0000-0000-000000009002'),'invite uses Labs product name');
update public.practice_room_members set invited_at=now()-interval '10 minutes' where room_id='00000000-0000-0000-0000-000000009010';
set local role authenticated;
select public.practice_invite('00000000-0000-0000-0000-000000009010','00000000-0000-0000-0000-000000009002',true);
reset role;
select pg_temp.assert_true((select title='Labs reminder' from public.notifications where type='practice_reminder' and recipient_id='00000000-0000-0000-0000-000000009002'),'reminder uses Labs product name');
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000009002',true);
set local role authenticated;
select pg_temp.assert_true((select count(*)=1 from public.practice_rooms),'invited member reads room');
select pg_temp.assert_true(pg_temp.denied($q$insert into public.practice_rooms(title,created_by) values('Forbidden','00000000-0000-0000-0000-000000009002')$q$),'member room creation denied');
select pg_temp.assert_true(pg_temp.denied($q$update public.practice_challenges set title='Forbidden' where id='00000000-0000-0000-0000-000000009020'$q$),'member challenge update denied');
select pg_temp.assert_true(pg_temp.denied($q$delete from public.practice_room_members where user_id='00000000-0000-0000-0000-000000009002'$q$),'member membership delete denied');
select pg_temp.assert_true(pg_temp.denied('select flag_hash from public.practice_challenges'),'hash inaccessible');
select pg_temp.assert_true(pg_temp.denied('select * from public.practice_challenges'),'wildcard cannot leak hash');
select pg_temp.assert_true(pg_temp.denied($q$insert into public.practice_attempts(challenge_id,user_id,is_correct) values('00000000-0000-0000-0000-000000009020','00000000-0000-0000-0000-000000009002',true)$q$),'forged solve denied');
select pg_temp.assert_true(public.practice_submit('00000000-0000-0000-0000-000000009020','wrong')='{"correct":false,"alreadySolved":false}'::jsonb,'wrong flag');
select pg_temp.assert_true(public.practice_submit('00000000-0000-0000-0000-000000009020',' flag{test} ')='{"correct":true,"alreadySolved":false}'::jsonb,'normalized correct flag');
select pg_temp.assert_true(public.practice_submit('00000000-0000-0000-0000-000000009020','flag{test}')='{"correct":true,"alreadySolved":true}'::jsonb,'repeat solve');
select pg_temp.assert_true((select count(*)=2 from public.practice_attempts),'repeat solve adds no attempt');
reset role;
insert into public.practice_challenges(id,room_id,title,description,category,difficulty,points,flag_hash,created_by) values
 ('00000000-0000-0000-0000-000000009021','00000000-0000-0000-0000-000000009010','Rate fixture','Private','web','easy',100,encode(extensions.digest('FLAG{TEST}','sha256'),'hex'),'00000000-0000-0000-0000-000000009001');
insert into public.practice_attempts(challenge_id,user_id,is_correct) select '00000000-0000-0000-0000-000000009021','00000000-0000-0000-0000-000000009002',false from generate_series(1,5);
set local role authenticated;
select pg_temp.assert_true(pg_temp.denied($q$select public.practice_submit('00000000-0000-0000-0000-000000009021','wrong')$q$,'Too many attempts'),'five per minute enforced');
reset role;
update public.practice_attempts set created_at=now()-interval '2 minutes' where challenge_id='00000000-0000-0000-0000-000000009021';
insert into public.practice_attempts(challenge_id,user_id,is_correct,created_at) select '00000000-0000-0000-0000-000000009021','00000000-0000-0000-0000-000000009002',false,now()-interval '2 minutes' from generate_series(1,25);
set local role authenticated;
select pg_temp.assert_true(pg_temp.denied($q$select public.practice_submit('00000000-0000-0000-0000-000000009021','wrong')$q$,'Too many attempts'),'thirty per hour enforced');
insert into public.practice_feedback(challenge_id,user_id,message) values('00000000-0000-0000-0000-000000009020','00000000-0000-0000-0000-000000009002','Useful');
reset role;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000009001',true);
set local role authenticated;
select pg_temp.assert_true(public.practice_publish('00000000-0000-0000-0000-000000009020')=public.practice_publish('00000000-0000-0000-0000-000000009020'),'publication idempotent');
reset role;
select pg_temp.assert_true((select count(*)=1 from public.practice_publications where practice_challenge_id='00000000-0000-0000-0000-000000009020'),'single publication');
update public.practice_challenges set title='Private edit' where id='00000000-0000-0000-0000-000000009020';
select pg_temp.assert_true((select c.title='Fixture challenge' and c.season_id is null and c.status='approved' and c.is_active from public.ctf_challenges c join public.practice_publications p on p.ctf_challenge_id=c.id where p.practice_challenge_id='00000000-0000-0000-0000-000000009020'),'global is independent snapshot');
select pg_temp.assert_true((select count(*)=2 from public.practice_attempts where challenge_id='00000000-0000-0000-0000-000000009020'),'private history preserved');
delete from public.ctf_challenges where id=(select ctf_challenge_id from public.practice_publications where practice_challenge_id='00000000-0000-0000-0000-000000009020');
select pg_temp.assert_true((select count(*)=0 from public.practice_publications where practice_challenge_id='00000000-0000-0000-0000-000000009020'),'deleting global copy clears publication');
set local role authenticated;
select public.practice_publish('00000000-0000-0000-0000-000000009020');
reset role;
select pg_temp.assert_true((select count(*)=1 from public.practice_publications where practice_challenge_id='00000000-0000-0000-0000-000000009020'),'republishing after deletion succeeds');
-- Attachment fixtures: two valid files, wrong room, rejected scan, global scope.
insert into public.practice_rooms(id,title,created_by) values('00000000-0000-0000-0000-000000009011','Other room','00000000-0000-0000-0000-000000009001');
insert into public.ctf_challenge_uploads(id,owner_id,scope_room_id,cloudinary_asset_id,cloudinary_public_id,original_name,stored_name,extension,size_bytes,sha256,scan_status)
select ('00000000-0000-0000-0000-0000000090'||n::text)::uuid,'00000000-0000-0000-0000-000000009001',
 case when n=34 then null when n=32 then '00000000-0000-0000-0000-000000009011'::uuid else '00000000-0000-0000-0000-000000009010'::uuid end,
 'fixture-asset-'||n::text,'fixture-public-'||n::text,'fixture.txt','fixture.txt','txt',10,repeat('a',64),case when n=33 then 'rejected' else 'approved' end
from generate_series(30,34) n;
insert into public.practice_challenges(id,room_id,title,description,category,difficulty,points,flag_hash,created_by) values
 ('00000000-0000-0000-0000-000000009022','00000000-0000-0000-0000-000000009010','Attachment fixture','Private','web','easy',100,encode(extensions.digest('FLAG{TEST}','sha256'),'hex'),'00000000-0000-0000-0000-000000009001');
select pg_temp.assert_true(pg_temp.denied($q$update public.practice_challenges set upload_id='00000000-0000-0000-0000-000000009032' where id='00000000-0000-0000-0000-000000009022'$q$,'Invalid practice attachment'),'wrong room attachment rejected');
select pg_temp.assert_true(pg_temp.denied($q$update public.practice_challenges set upload_id='00000000-0000-0000-0000-000000009033' where id='00000000-0000-0000-0000-000000009022'$q$,'Invalid practice attachment'),'rejected scan attachment rejected');
select pg_temp.assert_true(pg_temp.denied($q$update public.practice_challenges set upload_id='00000000-0000-0000-0000-000000009034' where id='00000000-0000-0000-0000-000000009022'$q$,'Invalid practice attachment'),'global scope attachment rejected');
update public.practice_challenges set upload_id='00000000-0000-0000-0000-000000009030' where id='00000000-0000-0000-0000-000000009022';
set local role authenticated;
select public.practice_publish('00000000-0000-0000-0000-000000009022');
reset role;
update public.practice_challenges set upload_id='00000000-0000-0000-0000-000000009031' where id='00000000-0000-0000-0000-000000009022';
select pg_temp.assert_true((select upload_id='00000000-0000-0000-0000-000000009030' from public.practice_publications where practice_challenge_id='00000000-0000-0000-0000-000000009022'),'published upload snapshot retained');
select pg_temp.assert_true((select c.file_url='/api/practice/files/00000000-0000-0000-0000-000000009030' from public.ctf_challenges c join public.practice_publications p on p.ctf_challenge_id=c.id where p.practice_challenge_id='00000000-0000-0000-0000-000000009022'),'global source URL unchanged by private replacement');
select pg_temp.assert_true((select challenge_id is null and cloudinary_asset_id='fixture-asset-30' from public.ctf_challenge_uploads where id='00000000-0000-0000-0000-000000009030'),'original asset row reused without mutation');
select pg_temp.assert_true((select count(*)=0 from public.ctf_submissions),'private practice never creates global submissions');
delete from public.practice_room_members where user_id='00000000-0000-0000-0000-000000009002';
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000009002',true);
set local role authenticated;
select pg_temp.assert_true((select count(*)=0 from public.practice_rooms),'revoked room invisible');
select pg_temp.assert_true((select count(*)=0 from public.practice_attempts),'revoked attempt history invisible');
select pg_temp.assert_true(pg_temp.denied($q$select public.practice_submit('00000000-0000-0000-0000-000000009020','FLAG{TEST}')$q$,'Challenge unavailable'),'revoked solve denied');
select pg_temp.assert_true(pg_temp.denied($q$insert into public.practice_feedback(challenge_id,user_id,message) values('00000000-0000-0000-0000-000000009020','00000000-0000-0000-0000-000000009002','Revoked')$q$),'revoked feedback denied');
reset role;
rollback;
