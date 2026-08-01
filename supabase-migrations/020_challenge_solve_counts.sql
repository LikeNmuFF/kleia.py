-- Per-challenge solve counts for the CTF challenges list and detail pages.
-- ctf_submissions RLS restricts reads to a user's own rows, so a plain count
-- query would miss other players' solves. This owner-privileged view sees all
-- correct submissions and is GRANTed so everyone (including guests) can read it.

DROP VIEW IF EXISTS ctf_challenge_solves;
CREATE VIEW ctf_challenge_solves AS
SELECT
  cs.challenge_id,
  COUNT(*)::int AS solves
FROM ctf_submissions cs
WHERE cs.is_correct = true
GROUP BY cs.challenge_id;

GRANT SELECT ON ctf_challenge_solves TO anon, authenticated;
