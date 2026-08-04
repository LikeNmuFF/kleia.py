-- Activity leaderboard: general study-activity ranking
-- Combined activity score = current_streak*10 + total_hours + post_count*5
-- Runs with owner privileges (plain CREATE VIEW) so the aggregate can see all
-- users' study hours even though progress_tracking RLS is private per-user.

DROP VIEW IF EXISTS activity_leaderboard;
CREATE VIEW activity_leaderboard AS
SELECT
  p.id AS user_id,
  p.username,
  p.avatar_url,
  p.current_streak,
  p.longest_streak,
  COALESCE(SUM(pt.hours_studied), 0)::numeric AS total_hours,
  (SELECT COUNT(*) FROM posts po WHERE po.author_id = p.id)::int AS post_count,
  (
    COALESCE(p.current_streak, 0) * 10
    + COALESCE(SUM(pt.hours_studied), 0)
    + (SELECT COUNT(*) FROM posts po WHERE po.author_id = p.id) * 5
  )::int AS activity_score
FROM profiles p
LEFT JOIN progress_tracking pt ON pt.user_id = p.id
WHERE p.role = 'user'
GROUP BY p.id, p.username, p.avatar_url, p.current_streak, p.longest_streak;

GRANT SELECT ON activity_leaderboard TO authenticated;
