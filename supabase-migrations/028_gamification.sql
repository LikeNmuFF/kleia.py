-- ============================================
-- KLEIA - Gamification system
-- Unified XP, badges, daily missions
-- ============================================

-- ===== 1. Add total_xp to profiles =====

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_xp integer DEFAULT 0;

-- ===== 2. User badges table =====

CREATE TABLE IF NOT EXISTS user_badges (
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  badge_id text NOT NULL,
  earned_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, badge_id)
);

ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all badges"
  ON user_badges FOR SELECT
  USING (true);

CREATE POLICY "System can insert badges"
  ON user_badges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ===== 3. Daily missions table =====

CREATE TABLE IF NOT EXISTS daily_missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  mission_type text NOT NULL,
  description text NOT NULL,
  xp_reward integer NOT NULL,
  completed boolean DEFAULT false,
  completed_at timestamptz,
  UNIQUE (user_id, date, mission_type)
);

ALTER TABLE daily_missions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own missions"
  ON daily_missions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own missions"
  ON daily_missions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own missions"
  ON daily_missions FOR UPDATE
  USING (auth.uid() = user_id);

-- ===== 4. Indexes =====

CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges (user_id);
CREATE INDEX IF NOT EXISTS idx_daily_missions_user_date ON daily_missions (user_id, date);
CREATE INDEX IF NOT EXISTS idx_profiles_total_xp ON profiles (total_xp DESC);
