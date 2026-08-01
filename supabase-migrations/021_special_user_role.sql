-- Add 'special' role for unique user experiences
-- Used for @powp47r0l's tulip-themed animations

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('user', 'admin', 'special'));

-- Grant special role to @powp47r0l
UPDATE profiles SET role = 'special' WHERE username = 'powp47r0l';
