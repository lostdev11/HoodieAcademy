-- User Tracking Views and Functions (Step 2)
-- Run this AFTER running the tables-only script

-- =====================================================
-- Create Helper Views
-- =====================================================

-- Inactive users (no events in last 7 days)
CREATE OR REPLACE VIEW public.inactive_users_7d AS
SELECT 
  p.id as user_id, 
  p.primary_wallet, 
  p.display_name,
  p.last_active_at,
  COALESCE(p.last_active_at, p.created_at) as last_event_at
FROM public.profiles p
WHERE p.last_active_at IS NULL OR p.last_active_at < NOW() - INTERVAL '7 days';

-- Live users (active in last 5 minutes)
CREATE OR REPLACE VIEW public.live_users AS
SELECT 
  s.user_id,
  s.wallet_address,
  p.display_name,
  s.last_heartbeat_at,
  s.started_at,
  EXTRACT(EPOCH FROM (NOW() - s.last_heartbeat_at))/60 as minutes_since_last_heartbeat
FROM public.sessions s
LEFT JOIN public.profiles p ON p.id = s.user_id
WHERE s.is_active = true 
  AND s.last_heartbeat_at > NOW() - INTERVAL '5 minutes'
ORDER BY s.last_heartbeat_at DESC;

-- Top courses by active users (7 days)
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

-- =====================================================
-- Create Utility Functions
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

-- =====================================================
-- Grant permissions on views and functions
-- =====================================================
GRANT SELECT ON public.inactive_users_7d TO authenticated;
GRANT SELECT ON public.live_users TO authenticated;
GRANT SELECT ON public.top_courses_7d TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
