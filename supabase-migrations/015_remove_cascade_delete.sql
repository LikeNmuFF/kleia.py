-- Fix: Remove ON DELETE CASCADE from ctf_submissions.challenge_id
-- This prevents future seed scripts from wiping player submissions
-- when challenges are deleted.

-- Drop the existing foreign key constraint (name depends on when it was created)
DO $$
DECLARE
  conname text;
BEGIN
  SELECT conname INTO conname
  FROM pg_constraint
  WHERE conrelid = 'ctf_submissions'::regclass
    AND confrelid = 'ctf_challenges'::regclass
    AND contype = 'f';

  IF conname IS NOT NULL THEN
    EXECUTE 'ALTER TABLE ctf_submissions DROP CONSTRAINT ' || conname;
    RAISE NOTICE 'Dropped constraint: %', conname;
  END IF;
END $$;

-- Re-add without CASCADE (RESTRICT = prevent deleting challenges that have submissions)
ALTER TABLE ctf_submissions
  ADD CONSTRAINT ctf_submissions_challenge_id_fkey
  FOREIGN KEY (challenge_id) REFERENCES ctf_challenges(id)
  ON DELETE RESTRICT;

-- Also remove CASCADE from user_id -> profiles (keep submissions if profile deleted)
DO $$
DECLARE
  conname text;
BEGIN
  SELECT conname INTO conname
  FROM pg_constraint
  WHERE conrelid = 'ctf_submissions'::regclass
    AND confrelid = 'profiles'::regclass
    AND contype = 'f';

  IF conname IS NOT NULL THEN
    EXECUTE 'ALTER TABLE ctf_submissions DROP CONSTRAINT ' || conname;
    RAISE NOTICE 'Dropped constraint: %', conname;
  END IF;
END $$;

ALTER TABLE ctf_submissions
  ADD CONSTRAINT ctf_submissions_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id)
  ON DELETE RESTRICT;
