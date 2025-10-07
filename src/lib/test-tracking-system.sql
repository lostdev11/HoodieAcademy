-- Test the tracking system with sample data
-- Run this to verify everything is working

-- =====================================================
-- Test 1: Create a test profile
-- =====================================================
INSERT INTO public.profiles (
  id, 
  display_name, 
  primary_wallet, 
  last_active_at
) VALUES (
  gen_random_uuid(),
  'Test User',
  'test-wallet-' || extract(epoch from now())::text,
  NOW()
) RETURNING id as test_profile_id;

-- =====================================================
-- Test 2: Create a test wallet
-- =====================================================
WITH test_profile AS (
  SELECT id FROM public.profiles WHERE display_name = 'Test User' LIMIT 1
)
INSERT INTO public.wallets (
  user_id,
  address,
  is_primary,
  connected_first_at,
  connected_last_at
)
SELECT 
  tp.id,
  'test-wallet-' || extract(epoch from now())::text,
  true,
  NOW(),
  NOW()
FROM test_profile tp
RETURNING id as test_wallet_id;

-- =====================================================
-- Test 3: Create a test session
-- =====================================================
WITH test_profile AS (
  SELECT id FROM public.profiles WHERE display_name = 'Test User' LIMIT 1
)
INSERT INTO public.sessions (
  user_id,
  wallet_address,
  is_active,
  started_at,
  last_heartbeat_at
)
SELECT 
  tp.id,
  p.primary_wallet,
  true,
  NOW(),
  NOW()
FROM test_profile tp
JOIN public.profiles p ON p.id = tp.id
RETURNING id as test_session_id;

-- =====================================================
-- Test 4: Create test events
-- =====================================================
WITH test_data AS (
  SELECT 
    p.id as user_id,
    s.id as session_id,
    p.primary_wallet as wallet_address
  FROM public.profiles p
  JOIN public.sessions s ON s.user_id = p.id
  WHERE p.display_name = 'Test User'
  LIMIT 1
)
INSERT INTO public.event_log (
  user_id,
  session_id,
  wallet_address,
  kind,
  path,
  payload
)
SELECT 
  user_id,
  session_id,
  wallet_address,
  'wallet_connect'::public.event_kind,
  '/test-page',
  '{"test": true}'::jsonb
FROM test_data
RETURNING id as test_event_id;

-- =====================================================
-- Test 5: Verify views work
-- =====================================================
SELECT 'Live Users View' as test_name, COUNT(*) as count FROM public.live_users
UNION ALL
SELECT 'Inactive Users View' as test_name, COUNT(*) as count FROM public.inactive_users_7d
UNION ALL
SELECT 'Activity Daily View' as test_name, COUNT(*) as count FROM public.activity_daily_view
UNION ALL
SELECT 'Top Courses View' as test_name, COUNT(*) as count FROM public.top_courses_7d;

-- =====================================================
-- Test 6: Test utility functions
-- =====================================================
WITH test_profile AS (
  SELECT id FROM public.profiles WHERE display_name = 'Test User' LIMIT 1
)
SELECT 
  'get_user_stats' as function_name,
  total_events,
  unique_sessions,
  courses_started,
  courses_completed,
  total_page_views
FROM public.get_user_stats((SELECT id FROM test_profile));

-- =====================================================
-- Test 7: Test admin stats function
-- =====================================================
SELECT 
  'get_admin_stats' as function_name,
  total_users,
  active_users_today,
  live_users,
  new_wallets_24h,
  inactive_users_7d
FROM public.get_admin_stats();

-- =====================================================
-- Clean up test data (optional)
-- =====================================================
-- Uncomment the following lines to clean up test data:
-- DELETE FROM public.event_log WHERE payload->>'test' = 'true';
-- DELETE FROM public.sessions WHERE user_agent IS NULL;
-- DELETE FROM public.wallets WHERE address LIKE 'test-wallet-%';
-- DELETE FROM public.profiles WHERE display_name = 'Test User';
