-- ============================================================
-- Fix CTF leaderboard: exclude admins from the leaderboard
-- ============================================================

DROP VIEW IF EXISTS ctf_leaderboard;

CREATE VIEW ctf_leaderboard AS
SELECT
  p.id AS user_id,
  p.username,
  p.avatar_url,
  COUNT(cs.id)::int AS solved_challenges,
  COALESCE(SUM(cc.points), 0)::int AS total_points
FROM profiles p
LEFT JOIN ctf_submissions cs ON cs.user_id = p.id AND cs.is_correct = true
LEFT JOIN ctf_challenges cc ON cc.id = cs.challenge_id AND cc.is_active = true
WHERE p.role = 'user'
GROUP BY p.id, p.username, p.avatar_url
ORDER BY total_points DESC, solved_challenges DESC;
