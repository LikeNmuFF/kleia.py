-- Add link_preview JSONB column to posts table
-- Stores OpenGraph metadata (title, description, image, siteName) for shared links

ALTER TABLE posts ADD COLUMN IF NOT EXISTS link_preview jsonb DEFAULT NULL;

-- Update RLS to allow reading link_preview (already covered by existing post SELECT policy)
-- No new policies needed since link_preview is part of the posts table
