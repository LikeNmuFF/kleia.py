-- Atomic XP increment to prevent read-then-write race conditions.
-- Returns the new total_xp so callers can use it without a second query.
CREATE OR REPLACE FUNCTION increment_xp(p_user_id uuid, p_amount int)
RETURNS int
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE profiles
  SET total_xp = GREATEST(0, total_xp + p_amount)
  WHERE id = p_user_id
  RETURNING total_xp;
$$;

-- Ensure the function is callable by authenticated users (RLS bypassed via SECURITY DEFINER)
GRANT EXECUTE ON FUNCTION increment_xp(uuid, int) TO authenticated;
