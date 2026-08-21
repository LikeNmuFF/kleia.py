-- 044_email_logs.sql
-- Track all emails sent from the admin Email tab.

CREATE TABLE IF NOT EXISTS public.email_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  subject text NOT NULL,
  recipient text NOT NULL,
  status text NOT NULL CHECK (status IN ('sent', 'failed')),
  error text,
  sent_by uuid REFERENCES auth.users(id) DEFAULT auth.uid(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read email logs
CREATE POLICY "Admins can read email logs"
  ON public.email_logs FOR SELECT
  USING (is_admin());

-- Only admins can insert email logs
CREATE POLICY "Admins can insert email logs"
  ON public.email_logs FOR INSERT
  WITH CHECK (is_admin());

CREATE INDEX idx_email_logs_created_at ON public.email_logs (created_at DESC);
