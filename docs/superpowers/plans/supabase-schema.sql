-- Profiles
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  username text unique not null,
  full_name text,
  avatar_url text,
  bio text,
  status text default 'offline' check (status in ('online', 'offline', 'studies')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Posts
create table posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references profiles on delete cascade not null,
  content text not null,
  type text default 'text' check (type in ('text', 'resource', 'question')),
  tags text[],
  likes_count int default 0,
  comments_count int default 0,
  created_at timestamptz default now()
);

-- Comments
create table comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references posts on delete cascade not null,
  author_id uuid references profiles on delete cascade not null,
  content text not null,
  created_at timestamptz default now()
);

-- Conversations
create table conversations (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('direct', 'group')),
  name text,
  created_at timestamptz default now()
);

-- Conversation Members
create table conversation_members (
  conversation_id uuid references conversations on delete cascade not null,
  user_id uuid references profiles on delete cascade not null,
  joined_at timestamptz default now(),
  primary key (conversation_id, user_id)
);

-- Messages
create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations on delete cascade not null,
  sender_id uuid references profiles on delete cascade not null,
  content text not null,
  read boolean default false,
  created_at timestamptz default now()
);

-- Events
create table events (
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

-- Event Attendees
create table event_attendees (
  event_id uuid references events on delete cascade not null,
  user_id uuid references profiles on delete cascade not null,
  status text default 'going' check (status in ('going', 'maybe', 'invited')),
  created_at timestamptz default now(),
  primary key (event_id, user_id)
);

-- Study Groups
create table study_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  creator_id uuid references profiles on delete cascade not null,
  created_at timestamptz default now()
);

-- Shared Notes
create table shared_notes (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references study_groups on delete cascade,
  author_id uuid references profiles on delete cascade not null,
  title text not null,
  content text,
  tags text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Progress Tracking
create table progress_tracking (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles on delete cascade not null,
  subject text not null,
  hours_studied decimal default 0,
  date date default current_date,
  notes text,
  created_at timestamptz default now()
);

-- Playlists
create table playlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles on delete cascade not null,
  title text not null,
  url text not null,
  type text default 'link' check (type in ('youtube', 'spotify', 'link')),
  created_at timestamptz default now()
);
