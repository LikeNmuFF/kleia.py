-- Task 1: Fix OAuth Profile Trigger
-- Run this in Supabase SQL Editor

-- Drop existing trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Updated trigger that handles OAuth metadata from Google/GitHub
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  new_username text;
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

  -- Handle username collision: append random 4-digit suffix
  IF EXISTS (SELECT 1 FROM public.profiles WHERE username = new_username) THEN
    new_username := new_username || floor(random() * 9000 + 1000)::text;
  END IF;

  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (
    new.id,
    new_username,
    COALESCE(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      new_username
    ),
    COALESCE(
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'picture'
    )
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill: create profiles for existing auth.users without profiles
INSERT INTO profiles (id, username, full_name, avatar_url)
SELECT
  au.id,
  COALESCE(
    au.raw_user_meta_data->>'preferred_username',
    au.raw_user_meta_data->>'username',
    au.raw_user_meta_data->>'name',
    au.raw_user_meta_data->>'login',
    split_part(au.email, '@', 1)
  ) || CASE
    WHEN EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.username = COALESCE(
        au.raw_user_meta_data->>'preferred_username',
        au.raw_user_meta_data->>'username',
        au.raw_user_meta_data->>'name',
        au.raw_user_meta_data->>'login',
        split_part(au.email, '@', 1)
      )
    ) THEN floor(random() * 9000 + 1000)::text
    ELSE ''
  END,
  COALESCE(
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    split_part(au.email, '@', 1)
  ),
  COALESCE(
    au.raw_user_meta_data->>'avatar_url',
    au.raw_user_meta_data->>'picture'
  )
FROM auth.users au
LEFT JOIN profiles p ON p.id = au.id
WHERE p.id IS NULL;
