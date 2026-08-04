-- Add 'special' role for unique user experiences
-- Used for @powp47r0l's tulip-themed animations

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('user', 'admin', 'special'));

-- Grant special role to @powp47r0l
UPDATE profiles SET role = 'special' WHERE username = 'powp47r0l';

-- Fix leaderboards to include 'special' role (was filtering WHERE role = 'user' only)
CREATE OR REPLACE VIEW activity_leaderboard AS
  SELECT
    p.id AS user_id,
    p.username,
    p.avatar_url,
    p.current_streak,
    p.longest_streak,
    COALESCE(SUM(pt.hours_studied), 0) AS total_hours,
    (SELECT COUNT(*) FROM posts po WHERE po.author_id = p.id)::integer AS post_count,
    ((COALESCE(p.current_streak, 0) * 10) + COALESCE(SUM(pt.hours_studied), 0) + ((SELECT COUNT(*) FROM posts po WHERE po.author_id = p.id) * 5))::integer AS activity_score
  FROM profiles p
    LEFT JOIN progress_tracking pt ON pt.user_id = p.id
  WHERE p.role IN ('user', 'special')
  GROUP BY p.id, p.username, p.avatar_url, p.current_streak, p.longest_streak;

CREATE OR REPLACE VIEW ctf_leaderboard AS
  SELECT
    p.id AS user_id,
    p.username,
    p.avatar_url,
    CASE WHEN p.solved_override IS NOT NULL THEN p.solved_override
         ELSE COUNT(cs.id)::integer END AS solved_challenges,
    CASE WHEN p.score_override IS NOT NULL THEN p.score_override
         ELSE COALESCE(SUM(cc.points), 0)::integer END AS total_points
  FROM profiles p
    LEFT JOIN ctf_submissions cs ON cs.user_id = p.id AND cs.is_correct = true
    LEFT JOIN ctf_challenges cc ON cc.id = cs.challenge_id AND cc.status = 'approved'
  WHERE p.role IN ('user', 'special')
  GROUP BY p.id, p.username, p.avatar_url, p.score_override, p.solved_override
  ORDER BY (CASE WHEN p.score_override IS NOT NULL THEN p.score_override
                 ELSE COALESCE(SUM(cc.points), 0)::integer END) DESC,
           (CASE WHEN p.solved_override IS NOT NULL THEN p.solved_override
                 ELSE COUNT(cs.id)::integer END) DESC;
