-- ============================================
-- KLEIA - Drop Study feature tables
-- Removes playlists, shared_notes, progress_tracking, study_groups
-- and the activity_leaderboard function/view (recreated without progress_tracking).
-- ============================================

-- Drop views and functions that depend on these tables
DROP VIEW IF EXISTS activity_leaderboard CASCADE;
DROP FUNCTION IF EXISTS public.get_activity_leaderboard() CASCADE;

-- Drop tables (CASCADE removes dependent RLS policies, indexes, triggers)
DROP TABLE IF EXISTS playlists CASCADE;
DROP TABLE IF EXISTS shared_notes CASCADE;
DROP TABLE IF EXISTS progress_tracking CASCADE;
DROP TABLE IF EXISTS study_groups CASCADE;

-- Recreate activity_leaderboard without progress_tracking
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

CREATE VIEW activity_leaderboard
WITH (security_invoker = true)
AS
SELECT * FROM public.get_activity_leaderboard();

GRANT SELECT ON activity_leaderboard TO authenticated;
