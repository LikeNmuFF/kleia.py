ALTER TABLE public.ctf_challenges DROP CONSTRAINT ctf_challenges_category_check;
ALTER TABLE public.ctf_challenges ADD CONSTRAINT ctf_challenges_category_check
  CHECK (category IN ('web', 'crypto', 'forensics', 'osint', 'misc'));
