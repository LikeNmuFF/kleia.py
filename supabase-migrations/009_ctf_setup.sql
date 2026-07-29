-- ==========================================================
-- CTF Challenge System: tables, RLS, helper functions, views
-- ==========================================================

-- 0. Add role column to profiles (if not already added)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user'
  CHECK (role IN ('user', 'admin'));

-- 1. CTF Challenges table
CREATE TABLE IF NOT EXISTS ctf_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL CHECK (category IN ('web', 'crypto', 'pwn', 'forensics', 'misc')),
  difficulty text NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  points int NOT NULL CHECK (points > 0),
  flag_hash text NOT NULL,
  hint text,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ctf_challenges ENABLE ROW LEVEL SECURITY;

-- 2. CTF Submissions table
CREATE TABLE IF NOT EXISTS ctf_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  challenge_id uuid NOT NULL REFERENCES ctf_challenges(id) ON DELETE CASCADE,
  submitted_flag text NOT NULL,
  is_correct boolean NOT NULL DEFAULT false,
  submitted_at timestamptz NOT NULL DEFAULT now()
);

-- Prevent double-scoring: one correct submission per user per challenge
DROP INDEX IF EXISTS ctf_submissions_one_correct_idx;
CREATE UNIQUE INDEX ctf_submissions_one_correct_idx
  ON ctf_submissions (user_id, challenge_id) WHERE is_correct = true;

ALTER TABLE ctf_submissions ENABLE ROW LEVEL SECURITY;

-- 3. Admin check helper (SECURITY DEFINER to bypass RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- 4. Leaderboard view (single aggregated query)
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
LEFT JOIN ctf_challenges cc ON cc.id = cs.challenge_id AND cc.status = 'approved'
WHERE p.role = 'user'
GROUP BY p.id, p.username, p.avatar_url
ORDER BY total_points DESC, solved_challenges DESC;

-- 5. RLS Policies: ctf_challenges
DROP POLICY IF EXISTS "Anyone can view active challenges" ON ctf_challenges;
DROP POLICY IF EXISTS "Admins can insert challenges" ON ctf_challenges;
DROP POLICY IF EXISTS "Admins can update challenges" ON ctf_challenges;
DROP POLICY IF EXISTS "Admins can delete challenges" ON ctf_challenges;

CREATE POLICY "Anyone can view active challenges"
  ON ctf_challenges FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can insert challenges"
  ON ctf_challenges FOR INSERT TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update challenges"
  ON ctf_challenges FOR UPDATE TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can delete challenges"
  ON ctf_challenges FOR DELETE TO authenticated
  USING (is_admin());

-- 6. RLS Policies: ctf_submissions
DROP POLICY IF EXISTS "Users can view own submissions" ON ctf_submissions;
DROP POLICY IF EXISTS "Users can insert own submissions" ON ctf_submissions;
DROP POLICY IF EXISTS "Admins can view all submissions" ON ctf_submissions;

CREATE POLICY "Users can view own submissions"
  ON ctf_submissions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own submissions"
  ON ctf_submissions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all submissions"
  ON ctf_submissions FOR SELECT TO authenticated
  USING (is_admin());
