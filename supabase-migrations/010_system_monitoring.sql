-- ==========================================================
-- SYSTEM MONITORING: DB size, table sizes, storage tracking
-- Run this in Supabase SQL Editor
-- ==========================================================

-- 1. Total database size in bytes
CREATE OR REPLACE FUNCTION get_db_size()
RETURNS bigint
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT pg_database_size(current_database())::bigint
$$;

-- 2. Top N largest tables by size
CREATE OR REPLACE FUNCTION get_largest_tables(limit_to int DEFAULT 5)
RETURNS TABLE (table_name text, size_bytes bigint)
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT
    schemaname || '.' || tablename AS table_name,
    pg_total_relation_size(schemaname || '.' || tablename)::bigint AS size_bytes
  FROM pg_tables
  WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
    AND tablename NOT LIKE 'pg_%'
  ORDER BY size_bytes DESC
  LIMIT limit_to
$$;
