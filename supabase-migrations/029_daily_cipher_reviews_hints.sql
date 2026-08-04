-- 029_daily_cipher_reviews_hints.sql

-- Daily Cipher Challenge
CREATE TABLE IF NOT EXISTS daily_ciphers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date UNIQUE NOT NULL DEFAULT CURRENT_DATE,
  cipher_type text NOT NULL,
  ciphertext text NOT NULL,
  plaintext_hint text NOT NULL,
  difficulty text NOT NULL DEFAULT 'easy' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  xp_reward int NOT NULL DEFAULT 25,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS daily_cipher_solves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  cipher_id uuid NOT NULL REFERENCES daily_ciphers(id) ON DELETE CASCADE,
  time_seconds int,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, cipher_id)
);

ALTER TABLE daily_ciphers ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_cipher_solves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view daily ciphers" ON daily_ciphers FOR SELECT USING (true);
CREATE POLICY "Auth users can insert cipher solves" ON daily_cipher_solves
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own cipher solves" ON daily_cipher_solves
  FOR SELECT USING (auth.uid() = user_id);

-- Challenge Reviews
CREATE TABLE IF NOT EXISTS challenge_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  challenge_id uuid NOT NULL REFERENCES ctf_challenges(id) ON DELETE CASCADE,
  difficulty_rating int NOT NULL CHECK (difficulty_rating BETWEEN 1 AND 5),
  quality_rating int NOT NULL CHECK (quality_rating BETWEEN 1 AND 5),
  review_text text,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, challenge_id)
);

ALTER TABLE challenge_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view challenge reviews" ON challenge_reviews FOR SELECT USING (true);
CREATE POLICY "Auth users can insert reviews" ON challenge_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reviews" ON challenge_reviews
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reviews" ON challenge_reviews
  FOR DELETE USING (auth.uid() = user_id);

-- XP cost column on hints
ALTER TABLE ctf_challenges ADD COLUMN IF NOT EXISTS hint_xp_cost int DEFAULT 0;

-- User hint unlocks
CREATE TABLE IF NOT EXISTS user_hint_unlocks (
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  challenge_id uuid NOT NULL REFERENCES ctf_challenges(id) ON DELETE CASCADE,
  xp_cost int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, challenge_id)
);
ALTER TABLE user_hint_unlocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own hint unlocks" ON user_hint_unlocks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Auth users can insert hint unlocks" ON user_hint_unlocks FOR INSERT WITH CHECK (auth.uid() = user_id);