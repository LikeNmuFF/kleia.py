-- Task 2: Add Streak Columns to Profiles
-- Run this in Supabase SQL Editor

-- Add streak columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_streak int DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS longest_streak int DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_active_date date;
