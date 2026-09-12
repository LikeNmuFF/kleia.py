-- Add the HackForGov learning categories to private practice challenges.
-- Existing rows are preserved; this only broadens the accepted category values.
ALTER TABLE public.practice_challenges
  DROP CONSTRAINT IF EXISTS practice_challenges_category_check;

ALTER TABLE public.practice_challenges
  ADD CONSTRAINT practice_challenges_category_check
  CHECK (category IN ('web','crypto','forensics','osint','misc','network','programming','reverse','exploitation','incident'));
