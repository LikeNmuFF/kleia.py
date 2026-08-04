-- 033_regex_golf_teams.sql

-- Regex Golf
CREATE TABLE IF NOT EXISTS regex_golf_puzzles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  match_strings text[] NOT NULL,
  reject_strings text[] NOT NULL,
  difficulty text NOT NULL DEFAULT 'easy' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  solution_regex text NOT NULL,
  min_length int,
  xp_reward int DEFAULT 20,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS regex_golf_solves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  puzzle_id uuid NOT NULL REFERENCES regex_golf_puzzles(id) ON DELETE CASCADE,
  submitted_regex text NOT NULL,
  regex_length int NOT NULL,
  time_seconds int,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, puzzle_id)
);

-- CTF Teams
CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  avatar_url text,
  creator_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  max_members int DEFAULT 5,
  total_xp int DEFAULT 0,
  total_solves int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS team_members (
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role text DEFAULT 'member' CHECK (role IN ('leader', 'member')),
  joined_at timestamptz DEFAULT now(),
  PRIMARY KEY (team_id, user_id)
);

CREATE TABLE IF NOT EXISTS team_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  invited_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at timestamptz DEFAULT now(),
  UNIQUE (team_id, user_id)
);

ALTER TABLE regex_golf_puzzles ENABLE ROW LEVEL SECURITY;
ALTER TABLE regex_golf_solves ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active puzzles" ON regex_golf_puzzles
  FOR SELECT USING (is_active = true);
CREATE POLICY "Auth users can insert solves" ON regex_golf_solves
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own solves" ON regex_golf_solves
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view teams" ON teams FOR SELECT USING (true);
CREATE POLICY "Auth users can create teams" ON teams
  FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Anyone can view team members" ON team_members FOR SELECT USING (true);
CREATE POLICY "Auth users can join teams" ON team_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Auth users can leave teams" ON team_members
  FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view team invites" ON team_invites FOR SELECT USING (true);
CREATE POLICY "Auth users can create invites" ON team_invites
  FOR INSERT WITH CHECK (auth.uid() = invited_by);
CREATE POLICY "Invitees can update own invites" ON team_invites
  FOR UPDATE USING (auth.uid() = user_id);
