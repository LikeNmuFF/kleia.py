-- 030_writeups.sql

CREATE TABLE IF NOT EXISTS writeups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  challenge_id uuid NOT NULL REFERENCES ctf_challenges(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  upvotes int DEFAULT 0,
  downvotes int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, challenge_id)
);

CREATE TABLE IF NOT EXISTS writeup_votes (
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  writeup_id uuid NOT NULL REFERENCES writeups(id) ON DELETE CASCADE,
  vote int NOT NULL CHECK (vote IN (-1, 1)),
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, writeup_id)
);

ALTER TABLE writeups ENABLE ROW LEVEL SECURITY;
ALTER TABLE writeup_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view writeups" ON writeups FOR SELECT USING (true);
CREATE POLICY "Auth users can insert own writeups" ON writeups
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own writeups" ON writeups
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own writeups" ON writeups
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view writeup votes" ON writeup_votes FOR SELECT USING (true);
CREATE POLICY "Auth users can insert votes" ON writeup_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own votes" ON writeup_votes
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own votes" ON writeup_votes
  FOR DELETE USING (auth.uid() = user_id);
