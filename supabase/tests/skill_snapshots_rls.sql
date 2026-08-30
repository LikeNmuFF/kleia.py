begin;

create extension if not exists pgtap with schema extensions;

select plan(5);

insert into public.profiles (id, username, role, total_xp)
values
  ('00000000-0000-0000-0000-000000000101', 'snapshot_a', 'user', 120),
  ('00000000-0000-0000-0000-000000000202', 'snapshot_b', 'user', 80)
on conflict (id) do update
set username = excluded.username,
    role = excluded.role,
    total_xp = excluded.total_xp;

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000101';

select results_eq(
  $$ select user_id from public.skill_snapshots $$,
  $$ values ('00000000-0000-0000-0000-000000000101'::uuid) $$,
  'authenticated users can only read their own skill snapshot'
);

select is_empty(
  $$ select user_id from public.skill_snapshots where user_id = '00000000-0000-0000-0000-000000000202'::uuid $$,
  'authenticated users cannot filter into another user snapshot'
);

select has_column('public', 'skill_snapshots', 'strengths', 'skill_snapshots exposes strengths jsonb');
select has_column('public', 'skill_snapshots', 'weaknesses', 'skill_snapshots exposes weaknesses jsonb');
select has_column('public', 'skill_snapshots', 'category_breakdown', 'skill_snapshots exposes category_breakdown jsonb');

select * from finish();

rollback;
