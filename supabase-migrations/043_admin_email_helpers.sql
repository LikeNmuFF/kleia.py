-- 043_admin_email_helpers.sql
-- Admin-only access to all user emails for bulk emailing.
-- Emails live in auth.users, which is hidden from normal RLS queries; this
-- SECURITY DEFINER function lets an admin read them, and non-admins get zero
-- rows because is_admin() is evaluated per call.

CREATE OR REPLACE FUNCTION public.admin_user_emails()
RETURNS TABLE (email text, username text)
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT au.email::text, p.username
  FROM auth.users au
  LEFT JOIN public.profiles p ON p.id = au.id
  WHERE is_admin()
  ORDER BY au.email;
$$;

REVOKE ALL ON FUNCTION public.admin_user_emails() FROM public;
GRANT EXECUTE ON FUNCTION public.admin_user_emails() TO authenticated;
