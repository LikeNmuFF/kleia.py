-- Add score_override column to profiles for manual score adjustments
-- Used to restore lost scores without fake submissions

-- Add column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS score_override int DEFAULT NULL;

-- Update leaderboard view to use override when set
DROP VIEW IF EXISTS ctf_leaderboard;
CREATE VIEW ctf_leaderboard AS
SELECT
  p.id AS user_id,
  p.username,
  p.avatar_url,
  COUNT(cs.id)::int AS solved_challenges,
  CASE
    WHEN p.score_override IS NOT NULL THEN p.score_override
    ELSE COALESCE(SUM(cc.points), 0)::int
  END AS total_points
FROM profiles p
LEFT JOIN ctf_submissions cs ON cs.user_id = p.id AND cs.is_correct = true
LEFT JOIN ctf_challenges cc ON cc.id = cs.challenge_id AND cc.status = 'approved'
WHERE p.role = 'user'
GROUP BY p.id, p.username, p.avatar_url, p.score_override
ORDER BY total_points DESC, solved_challenges DESC;

-- Restore powp47r0l's lost score
UPDATE profiles SET score_override = 2165 WHERE id = 'b86fc5fc-9f4e-40e9-afaf-0b32a7a55b5a';
