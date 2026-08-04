-- ============================================
-- KLEIA - Fix SECURITY DEFINER view findings
--
-- Views that aggregate across RLS-protected tables were plain
-- owner-privileged views (Postgres default: security_invoker=false),
-- which Supabase flags as "Security Definer View".
--
-- Fix: move the aggregation into SECURITY DEFINER functions with a
-- pinned search_path, then make the views SECURITY INVOKER wrappers.
-- Run this in Supabase SQL Editor.
-- ============================================

-- ===== 1. ctf_challenge_solves =====

CREATE OR REPLACE FUNCTION public.get_ctf_challenge_solves()
RETURNS TABLE (challenge_id uuid, solves integer)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT cs.challenge_id, COUNT(*)::integer AS solves
  FROM ctf_submissions cs
  WHERE cs.is_correct = true
  GROUP BY cs.challenge_id;
$$;

REVOKE ALL ON FUNCTION public.get_ctf_challenge_solves() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_ctf_challenge_solves() TO anon, authenticated;

DROP VIEW IF EXISTS ctf_challenge_solves;
CREATE VIEW ctf_challenge_solves
WITH (security_invoker = true)
AS
SELECT * FROM public.get_ctf_challenge_solves();

GRANT SELECT ON ctf_challenge_solves TO anon, authenticated;

-- ===== 2. activity_leaderboard =====

CREATE OR REPLACE FUNCTION public.get_activity_leaderboard()
RETURNS TABLE (
  user_id uuid,
  username text,
  avatar_url text,
  current_streak integer,
  longest_streak integer,
  total_hours numeric,
  post_count integer,
  activity_score integer
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id AS user_id,
    p.username,
    p.avatar_url,
    p.current_streak,
    p.longest_streak,
    0::numeric AS total_hours,
    (SELECT COUNT(*) FROM posts po WHERE po.author_id = p.id)::integer AS post_count,
    (
      (COALESCE(p.current_streak, 0) * 10)
      + ((SELECT COUNT(*) FROM posts po WHERE po.author_id = p.id) * 5)
    )::integer AS activity_score
  FROM profiles p
  WHERE p.role IN ('user', 'special')
  GROUP BY p.id, p.username, p.avatar_url, p.current_streak, p.longest_streak;
$$;

REVOKE ALL ON FUNCTION public.get_activity_leaderboard() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_activity_leaderboard() TO authenticated;

DROP VIEW IF EXISTS activity_leaderboard;
CREATE VIEW activity_leaderboard
WITH (security_invoker = true)
AS
SELECT * FROM public.get_activity_leaderboard();

GRANT SELECT ON activity_leaderboard TO authenticated;

-- ===== 3. ctf_leaderboard =====

CREATE OR REPLACE FUNCTION public.get_ctf_leaderboard()
RETURNS TABLE (
  user_id uuid,
  username text,
  avatar_url text,
  solved_challenges integer,
  total_points integer
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id AS user_id,
    p.username,
    p.avatar_url,
    (
      COALESCE(p.solved_override, 0) + COUNT(cs.id)::integer
    ) AS solved_challenges,
    (
      COALESCE(p.score_override, 0) + COALESCE(SUM(cc.points), 0)::integer
    ) AS total_points
  FROM profiles p
    LEFT JOIN ctf_submissions cs ON cs.user_id = p.id AND cs.is_correct = true
    LEFT JOIN ctf_challenges cc ON cc.id = cs.challenge_id AND cc.status = 'approved'
  WHERE p.role IN ('user', 'special')
  GROUP BY p.id, p.username, p.avatar_url, p.score_override, p.solved_override
  ORDER BY
    (
      COALESCE(p.score_override, 0) + COALESCE(SUM(cc.points), 0)::integer
    ) DESC,
    (
      COALESCE(p.solved_override, 0) + COUNT(cs.id)::integer
    ) DESC;
$$;

REVOKE ALL ON FUNCTION public.get_ctf_leaderboard() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_ctf_leaderboard() TO anon, authenticated;

DROP VIEW IF EXISTS ctf_leaderboard;
CREATE VIEW ctf_leaderboard
WITH (security_invoker = true)
AS
SELECT * FROM public.get_ctf_leaderboard();

GRANT SELECT ON ctf_leaderboard TO anon, authenticated;
