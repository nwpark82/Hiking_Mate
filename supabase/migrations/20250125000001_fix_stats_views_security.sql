-- ============================================
-- Fix Security Definer Views for Stats
-- ============================================
-- This migration addresses the security vulnerability where
-- feedback_stats and reports_stats views were accessible to all users
-- bypassing RLS policies

-- 1. Drop existing views
DROP VIEW IF EXISTS feedback_stats;
DROP VIEW IF EXISTS reports_stats;

-- 2. Recreate feedback_stats with SECURITY INVOKER
-- This ensures the view respects RLS policies and user permissions
-- SECURITY INVOKER means the view runs with the querying user's permissions,
-- so the RLS policies on the underlying 'feedback' table will be enforced
CREATE OR REPLACE VIEW feedback_stats
WITH (security_invoker = true) AS
SELECT
  category,
  status,
  COUNT(*) as count,
  COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as last_7_days,
  COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as last_30_days
FROM feedback
GROUP BY category, status;

-- 3. Recreate reports_stats with SECURITY INVOKER
CREATE OR REPLACE VIEW reports_stats
WITH (security_invoker = true) AS
SELECT
  target_type,
  status,
  COUNT(*) as count,
  COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as last_7_days,
  COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as last_30_days
FROM reports
GROUP BY target_type, status;

-- 4. Enable security barrier to prevent query optimization from bypassing RLS
ALTER VIEW feedback_stats SET (security_barrier = true);
ALTER VIEW reports_stats SET (security_barrier = true);

-- 5. Grant SELECT permission to authenticated users
-- Note: Even with this grant, users will only see data they're allowed to see
-- based on the RLS policies on the underlying feedback/reports tables
GRANT SELECT ON feedback_stats TO authenticated;
GRANT SELECT ON reports_stats TO authenticated;

-- 6. Verify that the underlying tables have proper admin-only policies
-- The existing RLS policies on feedback and reports tables ensure:
-- - Regular users see only their own data
-- - Admins/moderators see all data
-- With SECURITY INVOKER, these policies apply when querying the views too

-- ============================================
-- How this fixes the security issue:
-- ============================================
-- BEFORE (SECURITY DEFINER - vulnerable):
--   User queries view → View runs as admin → Sees ALL data (RLS bypassed)
--
-- AFTER (SECURITY INVOKER - secure):
--   User queries view → View runs as user → Sees only allowed data (RLS enforced)
--   Admin queries view → View runs as admin → Sees all data (as intended)

-- ============================================
-- Verification Query (for testing)
-- ============================================
-- Run these as admin to verify:
-- SELECT * FROM feedback_stats;  -- Should show all stats
-- SELECT * FROM reports_stats;   -- Should show all stats
--
-- Run these as regular user to verify:
-- SELECT * FROM feedback_stats;  -- Should show only stats for user's own feedback
-- SELECT * FROM reports_stats;   -- Should show only stats for user's own reports

DO $$
BEGIN
  RAISE NOTICE '✅ Stats views security fix completed!';
  RAISE NOTICE '📌 Changes made:';
  RAISE NOTICE '   1. Views recreated with SECURITY INVOKER (not DEFINER)';
  RAISE NOTICE '   2. Security barrier enabled to prevent RLS bypass via query optimization';
  RAISE NOTICE '   3. Views now respect RLS policies from underlying tables';
  RAISE NOTICE '   4. Regular users can only see stats for their own data';
  RAISE NOTICE '   5. Admins/moderators see all stats (as intended)';
END $$;
