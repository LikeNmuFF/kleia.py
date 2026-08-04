-- ==========================================================
-- Security reports table for automated scan results
-- ==========================================================

CREATE TABLE IF NOT EXISTS security_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  summary_markdown text NOT NULL,
  critical_count int NOT NULL DEFAULT 0,
  high_count int NOT NULL DEFAULT 0,
  medium_count int NOT NULL DEFAULT 0,
  low_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE security_reports ENABLE ROW LEVEL SECURITY;

-- Only admins can view reports
CREATE POLICY "Admins can view security_reports"
  ON security_reports FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Service role inserts from GitHub Action — no INSERT policy needed for
-- authenticated users since it's always inserted via service role
