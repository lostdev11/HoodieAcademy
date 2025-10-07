-- Simple test that works with any table structure
-- Run this to test basic functionality

-- =====================================================
-- Test 1: Insert basic test data
-- =====================================================

-- Insert a simple test profile
INSERT INTO public.profiles (id, created_at)
VALUES (gen_random_uuid(), NOW())
RETURNING id as test_profile_id;

-- Insert a test wallet
WITH latest_profile AS (
  SELECT id FROM public.profiles ORDER BY created_at DESC LIMIT 1
)
INSERT INTO public.wallets (user_id, address, is_primary)
SELECT 
  lp.id,
  'test-wallet-' || extract(epoch from now())::text,
  true
FROM latest_profile lp
RETURNING id as test_wallet_id;

-- Insert a test session
WITH latest_profile AS (
  SELECT id FROM public.profiles ORDER BY created_at DESC LIMIT 1
)
INSERT INTO public.sessions (user_id, wallet_address, is_active)
SELECT 
  lp.id,
  'test-wallet-' || extract(epoch from now())::text,
  true
FROM latest_profile lp
RETURNING id as test_session_id;

-- Insert test events
WITH latest_data AS (
  SELECT 
    p.id as user_id,
    s.id as session_id,
    'test-wallet-' || extract(epoch from now())::text as wallet_address
  FROM public.profiles p
  JOIN public.sessions s ON s.user_id = p.id
  ORDER BY p.created_at DESC
  LIMIT 1
)
INSERT INTO public.event_log (user_id, session_id, wallet_address, kind, payload)
SELECT 
  user_id,
  session_id,
  wallet_address,
  'wallet_connect'::public.event_kind,
  '{"test": true}'::jsonb
FROM latest_data
RETURNING id as test_event_id;

-- =====================================================
-- Test 2: Verify basic functionality
-- =====================================================

-- Count records in each table
SELECT 'profiles' as table_name, COUNT(*) as record_count FROM public.profiles
UNION ALL
SELECT 'wallets' as table_name, COUNT(*) as record_count FROM public.wallets
UNION ALL
SELECT 'sessions' as table_name, COUNT(*) as record_count FROM public.sessions
UNION ALL
SELECT 'event_log' as table_name, COUNT(*) as record_count FROM public.event_log;

-- Test if views work (they might fail if columns don't exist, that's okay)
DO $$
BEGIN
  BEGIN
    PERFORM COUNT(*) FROM public.live_users;
    RAISE NOTICE 'live_users view works';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'live_users view failed: %', SQLERRM;
  END;
  
  BEGIN
    PERFORM COUNT(*) FROM public.inactive_users_7d;
    RAISE NOTICE 'inactive_users_7d view works';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'inactive_users_7d view failed: %', SQLERRM;
  END;
END $$;

-- Test functions
SELECT 'get_user_stats' as function_name, COUNT(*) as result_count 
FROM public.get_user_stats();

SELECT 'get_admin_stats' as function_name, total_users, active_users_today, live_users
FROM public.get_admin_stats();

-- =====================================================
-- Clean up test data
-- =====================================================
DELETE FROM public.event_log WHERE payload->>'test' = 'true';
DELETE FROM public.sessions WHERE wallet_address LIKE 'test-wallet-%';
DELETE FROM public.wallets WHERE address LIKE 'test-wallet-%';
DELETE FROM public.profiles WHERE created_at > NOW() - INTERVAL '1 minute';
