-- Add last_seen column for real-time presence tracking
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_seen timestamptz default now();

-- Enable realtime for profiles table (for presence updates)
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
