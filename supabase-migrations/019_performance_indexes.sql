-- Performance indexes for frequently queried columns
-- These eliminate sequential scans on tables that grow with usage.

-- Posts: feed ordering
CREATE INDEX IF NOT EXISTS idx_posts_feed ON posts (is_pinned DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_author ON posts (author_id);

-- Comments: per-post lookup
CREATE INDEX IF NOT EXISTS idx_comments_post ON comments (post_id, created_at);
CREATE INDEX IF NOT EXISTS idx_comments_author ON comments (author_id);

-- Messages: per-conversation lookup
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages (conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages (sender_id);

-- Conversation members: user's conversations + membership checks
CREATE INDEX IF NOT EXISTS idx_conv_members_user ON conversation_members (user_id, conversation_id);
CREATE INDEX IF NOT EXISTS idx_conv_members_conv ON conversation_members (conversation_id, user_id);

-- Post likes: user's liked posts + per-post like check
CREATE INDEX IF NOT EXISTS idx_post_likes_user ON post_likes (user_id, post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_post ON post_likes (post_id);

-- Event attendees: per-event + per-user RSVP checks
CREATE INDEX IF NOT EXISTS idx_event_attendees_event ON event_attendees (event_id, status);
CREATE INDEX IF NOT EXISTS idx_event_attendees_user ON event_attendees (user_id, event_id);

-- CTF submissions: per-challenge + per-user submission checks
CREATE INDEX IF NOT EXISTS idx_ctf_submissions_challenge ON ctf_submissions (challenge_id);
CREATE INDEX IF NOT EXISTS idx_ctf_submissions_user ON ctf_submissions (user_id, challenge_id);

-- Profiles: presence/status lookups
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles (status, last_seen);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles (role);

-- Progress tracking: study page queries
CREATE INDEX IF NOT EXISTS idx_progress_user_date ON progress_tracking (user_id, date DESC);

-- Shared notes: updated_at ordering
CREATE INDEX IF NOT EXISTS idx_notes_updated ON shared_notes (updated_at DESC);
