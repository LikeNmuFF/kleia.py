ALTER TABLE public.ctf_challenges
  ADD COLUMN IF NOT EXISTS hint_points_cost integer NOT NULL DEFAULT 10
  CHECK (hint_points_cost >= 0);

CREATE TABLE IF NOT EXISTS public.ctf_season_hint_unlocks (
  season_id uuid NOT NULL REFERENCES public.ctf_seasons(id) ON DELETE CASCADE,
  challenge_id uuid NOT NULL REFERENCES public.ctf_challenges(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  points_cost integer NOT NULL CHECK (points_cost >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (season_id, challenge_id, user_id)
);

ALTER TABLE public.ctf_season_hint_unlocks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own season hint unlocks" ON public.ctf_season_hint_unlocks;
CREATE POLICY "Users can view own season hint unlocks" ON public.ctf_season_hint_unlocks
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.unlock_season_hint(
  p_season_id uuid,
  p_challenge_id uuid,
  p_user_id uuid,
  p_penalty integer DEFAULT 10
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inserted boolean;
  actual_penalty integer;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF p_penalty < 0 THEN RAISE EXCEPTION 'Invalid penalty'; END IF;
  SELECT COALESCE(hint_points_cost, 10) INTO actual_penalty
  FROM ctf_challenges WHERE id = p_challenge_id AND hint IS NOT NULL;
  IF actual_penalty IS NULL THEN RAISE EXCEPTION 'No hint available'; END IF;
  p_penalty := actual_penalty;
  IF NOT EXISTS (SELECT 1 FROM ctf_season_participants WHERE season_id = p_season_id AND user_id = p_user_id) THEN
    RAISE EXCEPTION 'Not a season participant';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM ctf_season_challenges WHERE season_id = p_season_id AND challenge_id = p_challenge_id) THEN
    RAISE EXCEPTION 'Challenge is not in this season';
  END IF;
  INSERT INTO ctf_season_hint_unlocks(season_id, challenge_id, user_id, points_cost)
  VALUES (p_season_id, p_challenge_id, p_user_id, p_penalty)
  ON CONFLICT (season_id, challenge_id, user_id) DO NOTHING;
  inserted := FOUND;
  IF inserted THEN
    UPDATE ctf_season_participants
    SET total_points = GREATEST(0, COALESCE(total_points, 0) - p_penalty)
    WHERE season_id = p_season_id AND user_id = p_user_id;
  END IF;
  RETURN inserted;
END;
$$;

REVOKE ALL ON FUNCTION public.unlock_season_hint(uuid, uuid, uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.unlock_season_hint(uuid, uuid, uuid, integer) TO authenticated;
