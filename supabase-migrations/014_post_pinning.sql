-- ============================================================
-- Add post pinning for admins
-- ============================================================

ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_pinned boolean NOT NULL DEFAULT false;
