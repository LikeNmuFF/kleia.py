-- Remove 'pwn' category from CTF challenges
-- All pwn challenges and their submissions were deleted via Management API
-- CHECK constraint updated to exclude 'pwn'

ALTER TABLE ctf_challenges DROP CONSTRAINT IF EXISTS ctf_challenges_category_check;
ALTER TABLE ctf_challenges ADD CONSTRAINT ctf_challenges_category_check
  CHECK (category IN ('web', 'crypto', 'forensics', 'misc'));
