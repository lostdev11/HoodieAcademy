-- Complete User Tracking System - Fixed Version
-- This version works with existing table structures

-- =====================================================
-- Create Helper Views (Fixed)
-- =====================================================

-- Inactive users view (simplified)
CREATE OR REPLACE VIEW public.inactive_users_7d AS
SELECT 
  p.id as user_id,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'primary_wallet') 
    THEN p.primary_wallet 
    ELSE NULL 
  END as primary_wallet,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'display_name') 
    THEN p.display_name 
    ELSE 'User ' || LEFT(p.id::text, 8)
  END as display_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'last_active_at') 
    THEN p.last_active_at 
    ELSE p.created_at 
  END as last_active_at,
  COALESCE(p.last_active_at, p.created_at) as last_event_at
FROM public.profiles p
WHERE (p.last_active_at IS NULL OR p.last_active_at < NOW() - INTERVAL '7 days')
   OR (NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'last_active_at'));

-- Live users view (simplified)
CREATE OR REPLACE VIEW public.live_users AS
SELECT 
  s.user_id,
  s.wallet_address,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'display_name') 
    THEN p.display_name 
    ELSE 'User ' || LEFT(s.user_id::text, 8)
  END as display_name,
  s.last_heartbeat_at,
  s.started_at,
  EXTRACT(EPOCH FROM (NOW() - s.last_heartbeat_at))/60 as minutes_since_last_heartbeat
FROM public.sessions s
LEFT JOIN public.profiles p ON p.id = s.user_id
WHERE s.is_active = true 
  AND s.last_heartbeat_at > NOW() - INTERVAL '5 minutes'
ORDER BY s.last_heartbeat_at DESC;

-- Top courses view
CREATE OR REPLACE VIEW public.top_courses_7d AS
SELECT 
  course_id,
  COUNT(DISTINCT user_id) as active_users,
  COUNT(*) as total_events,
  MIN(created_at) as first_activity,
  MAX(created_at) as last_activity
FROM public.event_log
WHERE course_id IS NOT NULL 
  AND created_at > NOW() - INTERVAL '7 days'
  AND kind IN ('course_start', 'lesson_start', 'lesson_complete', 'course_complete')
GROUP BY course_id
ORDER BY active_users DESC;

-- Daily activity summary
CREATE OR REPLACE VIEW public.activity_daily_view AS
SELECT 
  DATE_TRUNC('day', created_at) as day, 
  COUNT(DISTINCT user_id) as dau,
  COUNT(DISTINCT wallet_address) as unique_wallets,
  COUNT(*) as total_events
FROM public.event_log
WHERE kind IN ('page_view','lesson_start','lesson_complete','course_start','course_complete','exam_started','exam_submitted','placement_started','placement_completed','wallet_connect')
GROUP BY 1
ORDER BY 1 DESC;

-- =====================================================
-- Create Utility Functions (Fixed)
-- =====================================================

-- Function to get user stats
CREATE OR REPLACE FUNCTION public.get_user_stats(target_user_id UUID DEFAULT NULL)
RETURNS TABLE (
  total_events BIGINT,
  unique_sessions BIGINT,
  first_activity TIMESTAMPTZ,
  last_activity TIMESTAMPTZ,
  courses_started BIGINT,
  courses_completed BIGINT,
  total_page_views BIGINT
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(el.*) as total_events,
    COUNT(DISTINCT el.session_id) as unique_sessions,
    MIN(el.created_at) as first_activity,
    MAX(el.created_at) as last_activity,
    COUNT(CASE WHEN el.kind = 'course_start' THEN 1 END) as courses_started,
    COUNT(CASE WHEN el.kind = 'course_complete' THEN 1 END) as courses_completed,
    COUNT(CASE WHEN el.kind = 'page_view' THEN 1 END) as total_page_views
  FROM public.event_log el
  WHERE el.user_id = COALESCE(target_user_id, auth.uid())
  GROUP BY el.user_id;
END $$;

-- Function to end stale sessions
CREATE OR REPLACE FUNCTION public.end_stale_sessions()
RETURNS INTEGER LANGUAGE plpgsql AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE public.sessions 
  SET is_active = false, ended_at = NOW()
  WHERE is_active = true 
    AND last_heartbeat_at < NOW() - INTERVAL '1 hour';
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END $$;

-- Function to get admin dashboard stats (fixed)
CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS TABLE (
  total_users BIGINT,
  active_users_today BIGINT,
  live_users BIGINT,
  new_wallets_24h BIGINT,
  inactive_users_7d BIGINT
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM public.profiles) as total_users,
    (SELECT COUNT(DISTINCT user_id) FROM public.event_log WHERE created_at > NOW() - INTERVAL '1 day') as active_users_today,
    (SELECT COUNT(*) FROM public.live_users) as live_users,
    (SELECT COUNT(*) FROM public.wallets WHERE connected_first_at > NOW() - INTERVAL '1 day') as new_wallets_24h,
    (SELECT COUNT(*) FROM public.inactive_users_7d) as inactive_users_7d;
END $$;

-- =====================================================
-- Create Indexes for Performance
-- =====================================================

-- Profiles indexes (only if columns exist)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'primary_wallet') THEN
    CREATE INDEX IF NOT EXISTS profiles_primary_wallet_idx ON public.profiles(primary_wallet);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'last_active_at') THEN
    CREATE INDEX IF NOT EXISTS profiles_last_active_idx ON public.profiles(last_active_at);
  END IF;
END $$;

-- Wallets indexes
CREATE UNIQUE INDEX IF NOT EXISTS wallets_user_address_uniq ON public.wallets(user_id, address);
CREATE INDEX IF NOT EXISTS wallets_primary_idx ON public.wallets(is_primary);
CREATE INDEX IF NOT EXISTS wallets_address_idx ON public.wallets(address);

-- Sessions indexes
CREATE INDEX IF NOT EXISTS sessions_user_idx ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS sessions_heartbeat_idx ON public.sessions(last_heartbeat_at);
CREATE INDEX IF NOT EXISTS sessions_active_idx ON public.sessions(is_active);

-- Event log indexes
CREATE INDEX IF NOT EXISTS event_log_user_time_idx ON public.event_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS event_log_kind_time_idx ON public.event_log(kind, created_at DESC);
CREATE INDEX IF NOT EXISTS event_log_path_idx ON public.event_log(path);
CREATE INDEX IF NOT EXISTS event_log_session_idx ON public.event_log(session_id);
CREATE INDEX IF NOT EXISTS event_log_wallet_idx ON public.event_log(wallet_address);

-- Course progress indexes
CREATE INDEX IF NOT EXISTS course_progress_user_idx ON public.course_progress(user_id);
CREATE INDEX IF NOT EXISTS course_progress_course_idx ON public.course_progress(course_id);

-- Placement progress indexes
CREATE INDEX IF NOT EXISTS placement_progress_user_idx ON public.placement_progress(user_id);
CREATE INDEX IF NOT EXISTS placement_progress_status_idx ON public.placement_progress(status);

-- Admin approvals indexes
CREATE INDEX IF NOT EXISTS admin_approvals_user_idx ON public.admin_approvals(user_id);
CREATE INDEX IF NOT EXISTS admin_approvals_admin_idx ON public.admin_approvals(admin_id);

-- =====================================================
-- Grant Permissions on Views and Functions
-- =====================================================
GRANT SELECT ON public.inactive_users_7d TO authenticated;
GRANT SELECT ON public.live_users TO authenticated;
GRANT SELECT ON public.top_courses_7d TO authenticated;
GRANT SELECT ON public.activity_daily_view TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
