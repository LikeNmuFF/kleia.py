create or replace view public.skill_snapshots
with (security_invoker = true)
as
with base_profile as (
  select
    p.id as user_id,
    p.username,
    p.avatar_url,
    coalesce(p.total_xp, 0)::int as total_xp,
    coalesce(p.current_streak, 0)::int as current_streak,
    coalesce(p.longest_streak, 0)::int as longest_streak
  from public.profiles p
  where p.id = (select auth.uid())
    and p.role = 'user'
),
learn_totals as (
  select
    lp.user_id,
    count(*)::int as completed_count,
    coalesce(sum(lp.xp_earned), 0)::int as xp,
    max(lp.completed_at) as last_activity_at
  from public.learn_progress lp
  group by lp.user_id
),
learn_topic_summary as (
  select
    lp.user_id,
    lt.slug,
    lt.title,
    lt.sort_order,
    count(*)::int as completed_count,
    coalesce(sum(lp.xp_earned), 0)::int as xp
  from public.learn_progress lp
  join public.learn_lessons ll on ll.id = lp.lesson_id
  join public.learn_topics lt on lt.id = ll.topic_id
  group by lp.user_id, lt.id, lt.slug, lt.title, lt.sort_order
),
learn_summary as (
  select
    lt.user_id,
    lt.completed_count,
    lt.xp,
    lt.last_activity_at,
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'slug', lts.slug,
          'title', lts.title,
          'completed', lts.completed_count,
          'xp', lts.xp
        )
        order by lts.sort_order
      ) filter (where lts.slug is not null),
      '[]'::jsonb
    ) as topic_breakdown
  from learn_totals lt
  left join learn_topic_summary lts on lts.user_id = lt.user_id
  group by lt.user_id, lt.completed_count, lt.xp, lt.last_activity_at
),
ctf_correct_solves as (
  select
    cs.user_id,
    cs.challenge_id,
    max(cs.submitted_at) as submitted_at
  from public.ctf_submissions cs
  where cs.is_correct = true
  group by cs.user_id, cs.challenge_id
),
ctf_summary as (
  select
    cs.user_id,
    count(*)::int as solved_count,
    coalesce(sum(cc.points), 0)::int as points,
    max(cs.submitted_at) as last_activity_at,
    jsonb_build_object(
      'web', count(*) filter (where cc.category = 'web'),
      'crypto', count(*) filter (where cc.category = 'crypto'),
      'forensics', count(*) filter (where cc.category = 'forensics'),
      'misc', count(*) filter (where cc.category = 'misc')
    ) as category_breakdown,
    jsonb_build_object(
      'easy', count(*) filter (where cc.difficulty = 'easy'),
      'medium', count(*) filter (where cc.difficulty = 'medium'),
      'hard', count(*) filter (where cc.difficulty = 'hard')
    ) as difficulty_breakdown
  from ctf_correct_solves cs
  join public.ctf_challenges cc on cc.id = cs.challenge_id
  where cc.status = 'approved'
  group by cs.user_id
),
regex_summary as (
  select
    rgs.user_id,
    count(*)::int as solved_count,
    round(avg(rgs.regex_length), 1) as avg_regex_length,
    min(rgs.regex_length)::int as best_regex_length,
    round(avg(rgs.time_seconds), 1) as avg_time_seconds,
    max(rgs.created_at) as last_activity_at,
    jsonb_build_object(
      'easy', count(*) filter (where rgp.difficulty = 'easy'),
      'medium', count(*) filter (where rgp.difficulty = 'medium'),
      'hard', count(*) filter (where rgp.difficulty = 'hard')
    ) as difficulty_breakdown
  from public.regex_golf_solves rgs
  join public.regex_golf_puzzles rgp on rgp.id = rgs.puzzle_id
  group by rgs.user_id
),
cipher_summary as (
  select
    dcs.user_id,
    count(*)::int as solved_count,
    round(avg(dcs.time_seconds), 1) as avg_time_seconds,
    max(dcs.created_at) as last_activity_at,
    jsonb_build_object(
      'easy', count(*) filter (where dc.difficulty = 'easy'),
      'medium', count(*) filter (where dc.difficulty = 'medium'),
      'hard', count(*) filter (where dc.difficulty = 'hard')
    ) as difficulty_breakdown
  from public.daily_cipher_solves dcs
  join public.daily_ciphers dc on dc.id = dcs.cipher_id
  group by dcs.user_id
),
scored as (
  select
    bp.*,
    coalesce(ls.completed_count, 0)::int as learn_completed_count,
    coalesce(ls.xp, 0)::int as learn_xp,
    coalesce(cs.solved_count, 0)::int as ctf_solved_count,
    coalesce(cs.points, 0)::int as ctf_points,
    coalesce(rs.solved_count, 0)::int as regex_solved_count,
    coalesce(cis.solved_count, 0)::int as cipher_solved_count,
    ls.last_activity_at as learn_last_activity_at,
    cs.last_activity_at as ctf_last_activity_at,
    rs.last_activity_at as regex_last_activity_at,
    cis.last_activity_at as cipher_last_activity_at,
    coalesce(ls.topic_breakdown, '[]'::jsonb) as learn_topic_breakdown,
    coalesce(cs.category_breakdown, '{"web":0,"crypto":0,"forensics":0,"misc":0}'::jsonb) as ctf_category_breakdown,
    coalesce(cs.difficulty_breakdown, '{"easy":0,"medium":0,"hard":0}'::jsonb) as ctf_difficulty_breakdown,
    coalesce(rs.difficulty_breakdown, '{"easy":0,"medium":0,"hard":0}'::jsonb) as regex_difficulty_breakdown,
    coalesce(cis.difficulty_breakdown, '{"easy":0,"medium":0,"hard":0}'::jsonb) as cipher_difficulty_breakdown,
    rs.avg_regex_length,
    rs.best_regex_length,
    rs.avg_time_seconds as regex_avg_time_seconds,
    cis.avg_time_seconds as cipher_avg_time_seconds
  from base_profile bp
  left join learn_summary ls on ls.user_id = bp.user_id
  left join ctf_summary cs on cs.user_id = bp.user_id
  left join regex_summary rs on rs.user_id = bp.user_id
  left join cipher_summary cis on cis.user_id = bp.user_id
)
select
  user_id,
  username,
  avatar_url,
  total_xp,
  learn_completed_count,
  learn_xp,
  ctf_solved_count,
  ctf_points,
  regex_solved_count,
  avg_regex_length,
  best_regex_length,
  regex_avg_time_seconds,
  cipher_solved_count,
  cipher_avg_time_seconds,
  current_streak,
  longest_streak,
  nullif(greatest(
    coalesce(learn_last_activity_at, '-infinity'::timestamptz),
    coalesce(ctf_last_activity_at, '-infinity'::timestamptz),
    coalesce(regex_last_activity_at, '-infinity'::timestamptz),
    coalesce(cipher_last_activity_at, '-infinity'::timestamptz)
  ), '-infinity'::timestamptz) as last_activity_at,
  jsonb_build_object(
    'learn', jsonb_build_object(
      'completed', learn_completed_count,
      'xp', learn_xp,
      'topics', learn_topic_breakdown
    ),
    'ctf', jsonb_build_object(
      'solved', ctf_solved_count,
      'points', ctf_points,
      'categories', ctf_category_breakdown,
      'difficulties', ctf_difficulty_breakdown
    ),
    'regexGolf', jsonb_build_object(
      'solved', regex_solved_count,
      'avgLength', avg_regex_length,
      'bestLength', best_regex_length,
      'avgTimeSeconds', regex_avg_time_seconds,
      'difficulties', regex_difficulty_breakdown
    ),
    'dailyCipher', jsonb_build_object(
      'solved', cipher_solved_count,
      'avgTimeSeconds', cipher_avg_time_seconds,
      'currentStreak', current_streak,
      'longestStreak', longest_streak,
      'difficulties', cipher_difficulty_breakdown
    )
  ) as category_breakdown,
  (
    select coalesce(jsonb_agg(strength_item.item order by strength.score desc), '[]'::jsonb)
    from (
      values
        ('learn', 'Lesson Builder', learn_completed_count + (learn_xp / 15.0)),
        ('ctf', 'Challenge Solver', ctf_solved_count + (ctf_points / 50.0)),
        ('regexGolf', 'Pattern Thinker', regex_solved_count),
        ('dailyCipher', 'Cipher Streaker', cipher_solved_count + least(current_streak, 14) / 7.0)
    ) as strength(key, label, score)
    cross join lateral (
      select jsonb_build_object(
        'key', strength.key,
        'label', strength.label,
        'score', round(strength.score::numeric, 2)
      ) as item
    ) strength_item
    where strength.score > 0
  ) as strengths,
  (
    select coalesce(jsonb_agg(weakness_item.item order by weakness.score asc), '[]'::jsonb)
    from (
      values
        ('learn', 'Learn', learn_completed_count),
        ('ctf', 'CTF', ctf_solved_count),
        ('regexGolf', 'Regex Golf', regex_solved_count),
        ('dailyCipher', 'Daily Cipher', cipher_solved_count)
    ) as weakness(key, label, score)
    cross join lateral (
      select jsonb_build_object(
        'key', weakness.key,
        'label', weakness.label,
        'score', weakness.score
      ) as item
    ) weakness_item
    where weakness.score = 0
  ) as weaknesses
from scored;

revoke all on public.skill_snapshots from anon;
revoke all on public.skill_snapshots from authenticated;
grant select on public.skill_snapshots to authenticated;
