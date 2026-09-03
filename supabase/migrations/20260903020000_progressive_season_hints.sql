CREATE OR REPLACE FUNCTION public.unlock_progressive_season_hint(
  p_season_id uuid,
  p_challenge_id uuid,
  p_user_id uuid
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  prior_unlocks integer;
  actual_penalty integer;
  participant_points integer;
  season_status text;
  season_start timestamptz;
  season_end timestamptz;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Serialize unlocks for this participant and season so two simultaneous
  -- requests cannot receive the same progressive price.
  PERFORM pg_advisory_xact_lock(hashtextextended(p_user_id::text || ':' || p_season_id::text, 0));

  SELECT status, start_date, end_date
  INTO season_status, season_start, season_end
  FROM ctf_seasons
  WHERE id = p_season_id AND is_active = true;

  IF NOT FOUND
    OR season_status IN ('paused', 'ended')
    OR NOT (season_status = 'live' OR now() >= season_start)
    OR now() >= season_end THEN
    RAISE EXCEPTION 'Season is not live';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM ctf_season_challenges
    WHERE season_id = p_season_id AND challenge_id = p_challenge_id
  ) THEN
    RAISE EXCEPTION 'Challenge is not in this season';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM ctf_challenges
    WHERE id = p_challenge_id AND status = 'approved' AND hint IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'No hint available';
  END IF;

  IF EXISTS (
    SELECT 1 FROM ctf_season_hint_unlocks
    WHERE season_id = p_season_id AND challenge_id = p_challenge_id AND user_id = p_user_id
  ) THEN
    RETURN 0;
  END IF;

  SELECT COUNT(*)::integer INTO prior_unlocks
  FROM ctf_season_hint_unlocks
  WHERE season_id = p_season_id AND user_id = p_user_id;

  actual_penalty := (prior_unlocks + 1) * 25;

  SELECT total_points INTO participant_points
  FROM ctf_season_participants
  WHERE season_id = p_season_id AND user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Not a season participant'; END IF;
  IF COALESCE(participant_points, 0) < actual_penalty THEN
    RAISE EXCEPTION 'Insufficient season points';
  END IF;

  INSERT INTO ctf_season_hint_unlocks(season_id, challenge_id, user_id, points_cost)
  VALUES (p_season_id, p_challenge_id, p_user_id, actual_penalty);

  UPDATE ctf_season_participants
  SET total_points = COALESCE(total_points, 0) - actual_penalty
  WHERE season_id = p_season_id AND user_id = p_user_id;

  RETURN actual_penalty;
END;
$$;

REVOKE ALL ON FUNCTION public.unlock_progressive_season_hint(uuid, uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.unlock_progressive_season_hint(uuid, uuid, uuid) TO authenticated;
