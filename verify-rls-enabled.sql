-- =========================================
-- VERIFY RLS IS ENABLED
-- =========================================
-- Quick check to confirm RLS is working

-- Check RLS status
SELECT 
  tablename,
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity THEN '✅ ENABLED'
    ELSE '❌ DISABLED'
  END as status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('bounties', 'bounty_submissions')
ORDER BY tablename;

-- This should show:
-- bounties          | t | ✅ ENABLED
-- bounty_submissions | t | ✅ ENABLED

