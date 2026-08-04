-- 031_achievement_leaderboard.sql
CREATE OR REPLACE VIEW achievement_leaderboard AS
SELECT
  p.id AS user_id,
  p.username,
  p.avatar_url,
  p.total_xp,
  (SELECT COUNT(*) FROM user_badges ub WHERE ub.user_id = p.id)::int AS badge_count,
  (SELECT COUNT(*) FROM ctf_submissions cs WHERE cs.user_id = p.id AND cs.is_correct = true)::int AS ctf_solved,
  (SELECT COUNT(*) FROM writeups w WHERE w.user_id = p.id)::int AS writeup_count,
  (SELECT COUNT(*) FROM challenge_reviews cr WHERE cr.user_id = p.id)::int AS review_count,
  (
    COALESCE(p.total_xp, 0)
    + (SELECT COUNT(*) FROM user_badges ub WHERE ub.user_id = p.id) * 50
  ) AS achievement_score
FROM profiles p
WHERE p.role = 'user'
ORDER BY achievement_score DESC;