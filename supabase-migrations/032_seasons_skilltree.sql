-- 032_seasons_skilltree.sql

-- Monthly CTF Seasons
CREATE TABLE IF NOT EXISTS ctf_seasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  theme text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ctf_season_challenges (
  season_id uuid NOT NULL REFERENCES ctf_seasons(id) ON DELETE CASCADE,
  challenge_id uuid NOT NULL REFERENCES ctf_challenges(id) ON DELETE CASCADE,
  bonus_points int DEFAULT 0,
  PRIMARY KEY (season_id, challenge_id)
);

CREATE TABLE IF NOT EXISTS ctf_season_participants (
  season_id uuid NOT NULL REFERENCES ctf_seasons(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  total_points int DEFAULT 0,
  challenges_solved int DEFAULT 0,
  joined_at timestamptz DEFAULT now(),
  PRIMARY KEY (season_id, user_id)
);

-- Skill Tree
CREATE TABLE IF NOT EXISTS skill_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text NOT NULL,
  difficulty text NOT NULL,
  icon text DEFAULT '🔓',
  x_pos int DEFAULT 0,
  y_pos int DEFAULT 0,
  parent_id uuid REFERENCES skill_nodes(id),
  required_solves int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_skill_progress (
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  node_id uuid NOT NULL REFERENCES skill_nodes(id) ON DELETE CASCADE,
  unlocked boolean DEFAULT false,
  unlocked_at timestamptz,
  PRIMARY KEY (user_id, node_id)
);

ALTER TABLE ctf_seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE ctf_season_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE ctf_season_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_skill_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view seasons" ON ctf_seasons FOR SELECT USING (true);
CREATE POLICY "Anyone can view season challenges" ON ctf_season_challenges FOR SELECT USING (true);
CREATE POLICY "Anyone can view season participants" ON ctf_season_participants FOR SELECT USING (true);
CREATE POLICY "Auth users can join seasons" ON ctf_season_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Anyone can view skill nodes" ON skill_nodes FOR SELECT USING (true);
CREATE POLICY "Auth users can view own skill progress" ON user_skill_progress
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Auth users can insert own skill progress" ON user_skill_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);
