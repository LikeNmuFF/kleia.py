-- Sanitize OAuth-generated usernames to match signup rule /^[a-zA-Z0-9_-]+$/
-- Google sign-ups inherit the full name as the username (e.g. "Suzet M.J."),
-- which breaks /profile URLs when navigated client-side.

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  new_username text;
  oauth_avatar text;
BEGIN
  -- Build username from OAuth metadata with fallbacks
  -- Google provides: full_name, avatar_url
  -- GitHub provides: name, login, avatar_url
  new_username := COALESCE(
    new.raw_user_meta_data->>'preferred_username',
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'login',
    split_part(new.email, '@', 1)
  );

  -- Sanitize to match signup rule /^[a-zA-Z0-9_-]+$/
  new_username := regexp_replace(new_username, '[^a-zA-Z0-9_-]', '', 'g');
  IF new_username = '' THEN
    new_username := regexp_replace(split_part(new.email, '@', 1), '[^a-zA-Z0-9_-]', '', 'g');
  END IF;

  -- Handle username collision: append random 4-digit suffix
  IF EXISTS (SELECT 1 FROM public.profiles WHERE username = new_username) THEN
    new_username := new_username || floor(random() * 9000 + 1000)::text;
  END IF;

  oauth_avatar := COALESCE(
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'picture'
  );

  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (
    new.id,
    new_username,
    COALESCE(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      new_username
    ),
    -- Keep provider avatar when present, otherwise assign a random illustration
    COALESCE(
      oauth_avatar,
      '/illustrations/' || (1 + floor(random() * 13))::text || '.png'
    )
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
