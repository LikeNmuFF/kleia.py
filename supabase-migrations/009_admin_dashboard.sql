-- ==========================================================
-- ADMIN DASHBOARD: role column, events_log, endpoint stats
-- Run this in Supabase SQL Editor
-- ==========================================================

-- 1. Add role column to profiles (safe: IF NOT EXISTS)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user'
  CHECK (role IN ('user', 'admin'));

-- 2. Create events_log table for server-action observability
CREATE TABLE IF NOT EXISTS events_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint text NOT NULL,
  status text NOT NULL CHECK (status IN ('success', 'error')),
  duration_ms integer NOT NULL,
  error_message text,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_events_log_created_at ON events_log (created_at);
CREATE INDEX IF NOT EXISTS idx_events_log_endpoint ON events_log (endpoint);

ALTER TABLE events_log ENABLE ROW LEVEL SECURITY;

-- Authenticated users can INSERT (server actions are authenticated server-side)
CREATE POLICY "Users can insert events_log"
  ON events_log FOR INSERT TO authenticated
  WITH CHECK (true);

-- Only admins can SELECT events_log
CREATE POLICY "Admins can view events_log"
  ON events_log FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- 3. Aggregate helper for endpoint stats (avoids JS-side GROUP BY)
CREATE OR REPLACE FUNCTION get_endpoint_stats(since_hours int DEFAULT 24)
RETURNS TABLE (endpoint text, request_count bigint, avg_duration_ms numeric)
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT
    endpoint,
    COUNT(*)::bigint AS request_count,
    AVG(duration_ms)::numeric(10,2) AS avg_duration_ms
  FROM events_log
  WHERE created_at >= now() - (since_hours || ' hours')::interval
  GROUP BY endpoint
  ORDER BY request_count DESC
$$;
