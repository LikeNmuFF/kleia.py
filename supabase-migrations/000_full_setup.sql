-- ============================================
-- KLEIA - Complete Database Setup (Safe to re-run)
-- Run this ONE file in Supabase SQL Editor
-- ============================================

-- ===== TABLES =====

CREATE TABLE IF NOT EXISTS profiles (
  id uuid primary key references auth.users on delete cascade,
  username text unique not null,
  full_name text,
  avatar_url text,
  bio text,
  status text default 'offline' check (status in ('online', 'offline', 'studies')),
  current_streak int default 0,
  longest_streak int default 0,
  last_active_date date,
  last_seen timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

CREATE TABLE IF NOT EXISTS posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references profiles on delete cascade not null,
  content text not null,
  type text default 'text' check (type in ('text', 'resource', 'question')),
  tags text[],
  likes_count int default 0,
  comments_count int default 0,
  created_at timestamptz default now()
);

CREATE TABLE IF NOT EXISTS comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references posts on delete cascade not null,
  author_id uuid references profiles on delete cascade not null,
  content text not null,
  created_at timestamptz default now()
);

CREATE TABLE IF NOT EXISTS conversations (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('direct', 'group')),
  name text,
  created_at timestamptz default now()
);

CREATE TABLE IF NOT EXISTS conversation_members (
  conversation_id uuid references conversations on delete cascade not null,
  user_id uuid references profiles on delete cascade not null,
  joined_at timestamptz default now(),
  primary key (conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations on delete cascade not null,
  sender_id uuid references profiles on delete cascade not null,
  content text not null,
  read boolean default false,
  created_at timestamptz default now()
);

CREATE TABLE IF NOT EXISTS events (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid references profiles on delete cascade not null,
  title text not null,
  description text,
  start_time timestamptz not null,
  end_time timestamptz,
  location text,
  max_attendees int,
  created_at timestamptz default now()
);

CREATE TABLE IF NOT EXISTS event_attendees (
  event_id uuid references events on delete cascade not null,
  user_id uuid references profiles on delete cascade not null,
  status text default 'going' check (status in ('going', 'maybe', 'invited')),
  created_at timestamptz default now(),
  primary key (event_id, user_id)
);

CREATE TABLE IF NOT EXISTS study_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  creator_id uuid references profiles on delete cascade not null,
  created_at timestamptz default now()
);

CREATE TABLE IF NOT EXISTS shared_notes (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references study_groups on delete cascade,
  author_id uuid references profiles on delete cascade not null,
  title text not null,
  content text,
  tags text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

CREATE TABLE IF NOT EXISTS progress_tracking (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles on delete cascade not null,
  subject text not null,
  hours_studied decimal default 0,
  date date default current_date,
  notes text,
  created_at timestamptz default now()
);

CREATE TABLE IF NOT EXISTS playlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles on delete cascade not null,
  title text not null,
  url text not null,
  type text default 'link' check (type in ('youtube', 'spotify', 'link')),
  created_at timestamptz default now()
);

-- ===== ROW LEVEL SECURITY =====

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;

-- Drop old policies to avoid conflicts
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON posts;
DROP POLICY IF EXISTS "Authenticated users can create posts" ON posts;
DROP POLICY IF EXISTS "Users can update own posts" ON posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON posts;
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON comments;
DROP POLICY IF EXISTS "Authenticated users can create comments" ON comments;
DROP POLICY IF EXISTS "Users can update own comments" ON comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON comments;
DROP POLICY IF EXISTS "Users can view own conversations" ON conversations;
DROP POLICY IF EXISTS "Authenticated users can create conversations" ON conversations;
DROP POLICY IF EXISTS "Users can view members of own conversations" ON conversation_members;
DROP POLICY IF EXISTS "Authenticated users can add members" ON conversation_members;
DROP POLICY IF EXISTS "Users can view messages in own conversations" ON messages;
DROP POLICY IF EXISTS "Authenticated users can send messages" ON messages;
DROP POLICY IF EXISTS "Events are viewable by everyone" ON events;
DROP POLICY IF EXISTS "Authenticated users can create events" ON events;
DROP POLICY IF EXISTS "Users can update own events" ON events;
DROP POLICY IF EXISTS "Users can delete own events" ON events;
DROP POLICY IF EXISTS "Attendees are viewable by everyone" ON event_attendees;
DROP POLICY IF EXISTS "Authenticated users can RSVP" ON event_attendees;
DROP POLICY IF EXISTS "Users can update own RSVP" ON event_attendees;
DROP POLICY IF EXISTS "Study groups are viewable by everyone" ON study_groups;
DROP POLICY IF EXISTS "Authenticated users can create groups" ON study_groups;
DROP POLICY IF EXISTS "Users can update own groups" ON study_groups;
DROP POLICY IF EXISTS "Notes are viewable by authenticated users" ON shared_notes;
DROP POLICY IF EXISTS "Authenticated users can create notes" ON shared_notes;
DROP POLICY IF EXISTS "Users can update own notes" ON shared_notes;
DROP POLICY IF EXISTS "Users can delete own notes" ON shared_notes;
DROP POLICY IF EXISTS "Users can view own progress" ON progress_tracking;
DROP POLICY IF EXISTS "Users can insert own progress" ON progress_tracking;
DROP POLICY IF EXISTS "Users can update own progress" ON progress_tracking;
DROP POLICY IF EXISTS "Users can delete own progress" ON progress_tracking;
DROP POLICY IF EXISTS "Playlists are viewable by authenticated users" ON playlists;
DROP POLICY IF EXISTS "Authenticated users can create playlists" ON playlists;
DROP POLICY IF EXISTS "Users can update own playlists" ON playlists;
DROP POLICY IF EXISTS "Users can delete own playlists" ON playlists;

-- Create SECURITY DEFINER function to check conversation membership (avoids RLS recursion)
CREATE OR REPLACE FUNCTION is_conversation_member(conv_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM conversation_members
    WHERE conversation_id = conv_id AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Create policies
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Posts are viewable by everyone" ON posts FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create posts" ON posts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update own posts" ON posts FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Users can delete own posts" ON posts FOR DELETE USING (auth.uid() = author_id);

CREATE POLICY "Comments are viewable by everyone" ON comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create comments" ON comments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update own comments" ON comments FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Users can delete own comments" ON comments FOR DELETE USING (auth.uid() = author_id);

CREATE POLICY "Users can view own conversations" ON conversations FOR SELECT USING (is_conversation_member(id));
CREATE POLICY "Authenticated users can create conversations" ON conversations FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can view members of own conversations" ON conversation_members FOR SELECT USING (is_conversation_member(conversation_members.conversation_id));
CREATE POLICY "Authenticated users can add members" ON conversation_members FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can view messages in own conversations" ON messages FOR SELECT USING (is_conversation_member(messages.conversation_id));
CREATE POLICY "Authenticated users can send messages" ON messages FOR INSERT TO authenticated WITH CHECK (is_conversation_member(messages.conversation_id));

CREATE POLICY "Events are viewable by everyone" ON events FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create events" ON events FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update own events" ON events FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "Users can delete own events" ON events FOR DELETE USING (auth.uid() = creator_id);

CREATE POLICY "Attendees are viewable by everyone" ON event_attendees FOR SELECT USING (true);
CREATE POLICY "Authenticated users can RSVP" ON event_attendees FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update own RSVP" ON event_attendees FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Study groups are viewable by everyone" ON study_groups FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create groups" ON study_groups FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update own groups" ON study_groups FOR UPDATE USING (auth.uid() = creator_id);

CREATE POLICY "Notes are viewable by authenticated users" ON shared_notes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create notes" ON shared_notes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update own notes" ON shared_notes FOR UPDATE USING (auth.uid() = author_id);
DROP POLICY IF EXISTS "Users can delete own notes" ON shared_notes;
CREATE POLICY "Users can delete own notes" ON shared_notes FOR DELETE USING (auth.uid() = author_id);

CREATE POLICY "Users can view own progress" ON progress_tracking FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own progress" ON progress_tracking FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON progress_tracking FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own progress" ON progress_tracking FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Playlists are viewable by authenticated users" ON playlists FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create playlists" ON playlists FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update own playlists" ON playlists FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own playlists" ON playlists FOR DELETE USING (auth.uid() = user_id);

-- ===== TRIGGERS =====

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  new_username text;
BEGIN
  new_username := COALESCE(
    new.raw_user_meta_data->>'preferred_username',
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'login',
    split_part(new.email, '@', 1)
  );

  IF EXISTS (SELECT 1 FROM public.profiles WHERE username = new_username) THEN
    new_username := new_username || floor(random() * 9000 + 1000)::text;
  END IF;

  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (
    new.id,
    new_username,
    COALESCE(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      new_username
    ),
    COALESCE(
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'picture'
    )
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_shared_notes_updated_at ON shared_notes;
CREATE TRIGGER update_shared_notes_updated_at BEFORE UPDATE ON shared_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE messages, profiles;

-- ===== BACKFILL EXISTING USERS =====

INSERT INTO profiles (id, username, full_name, avatar_url)
SELECT
  au.id,
  COALESCE(
    au.raw_user_meta_data->>'preferred_username',
    au.raw_user_meta_data->>'username',
    au.raw_user_meta_data->>'name',
    au.raw_user_meta_data->>'login',
    split_part(au.email, '@', 1)
  ) || CASE
    WHEN EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.username = COALESCE(
        au.raw_user_meta_data->>'preferred_username',
        au.raw_user_meta_data->>'username',
        au.raw_user_meta_data->>'name',
        au.raw_user_meta_data->>'login',
        split_part(au.email, '@', 1)
      )
    ) THEN floor(random() * 9000 + 1000)::text
    ELSE ''
  END,
  COALESCE(
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    split_part(au.email, '@', 1)
  ),
  COALESCE(
    au.raw_user_meta_data->>'avatar_url',
    au.raw_user_meta_data->>'picture'
  )
FROM auth.users au
LEFT JOIN profiles p ON p.id = au.id
WHERE p.id IS NULL;
