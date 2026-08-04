-- ============================================================
-- Add file_url and link_url to ctf_challenges
-- ============================================================

ALTER TABLE ctf_challenges ADD COLUMN IF NOT EXISTS file_url text;
ALTER TABLE ctf_challenges ADD COLUMN IF NOT EXISTS link_url text;
