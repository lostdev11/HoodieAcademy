-- Remove Test Data from Hoodie Academy Database
-- This script removes all test data to work with real users only

-- =====================================================
-- 1. REMOVE TEST USERS
-- =====================================================

-- Remove test users (identified by wallet addresses starting with 'TEST_' or containing 'test')
DELETE FROM users 
WHERE wallet_address LIKE 'TEST_%' 
   OR wallet_address ILIKE '%test%'
   OR display_name ILIKE '%test%'
   OR display_name = 'Test User'
   OR display_name = 'Alice'
   OR display_name = 'Bob'
   OR display_name = 'Charlie'
   OR display_name = 'Admin User';

-- =====================================================
-- 2. REMOVE TEST XP DATA
-- =====================================================

-- Remove XP records for test users
DELETE FROM user_xp 
WHERE wallet_address LIKE 'TEST_%' 
   OR wallet_address ILIKE '%test%';

-- Remove XP events for test users
DELETE FROM xp_events 
WHERE user_id IN (
  SELECT id FROM users 
  WHERE wallet_address LIKE 'TEST_%' 
     OR wallet_address ILIKE '%test%'
     OR display_name ILIKE '%test%'
     OR display_name = 'Test User'
     OR display_name = 'Alice'
     OR display_name = 'Bob'
     OR display_name = 'Charlie'
     OR display_name = 'Admin User'
);

-- =====================================================
-- 3. REMOVE TEST USER ACTIVITY
-- =====================================================

-- Remove activity records for test users
DELETE FROM user_activity 
WHERE wallet_address LIKE 'TEST_%' 
   OR wallet_address ILIKE '%test%'
   OR metadata->>'test' = 'true'
   OR metadata->>'source' = 'database_setup'
   OR metadata->>'source' = 'test_data';

-- =====================================================
-- 4. REMOVE TEST BOUNTY SUBMISSIONS
-- =====================================================

-- Remove bounty submissions from test users
DELETE FROM bounty_submissions 
WHERE wallet_address LIKE 'TEST_%' 
   OR wallet_address ILIKE '%test%'
   OR submission_text ILIKE '%test%'
   OR submission_text ILIKE '%sample%';

-- =====================================================
-- 5. REMOVE TEST WALLET CONNECTIONS
-- =====================================================

-- Remove wallet connection records for test users
DELETE FROM wallet_connections 
WHERE wallet_address LIKE 'TEST_%' 
   OR wallet_address ILIKE '%test%';

-- =====================================================
-- 6. REMOVE TEST SESSIONS
-- =====================================================

-- Remove session records for test users
DELETE FROM user_sessions 
WHERE wallet_address LIKE 'TEST_%' 
   OR wallet_address ILIKE '%test%';

-- =====================================================
-- 7. CLEAN UP ANY REMAINING TEST DATA
-- =====================================================

-- Remove any remaining test data from other tables
DELETE FROM user_progress 
WHERE wallet_address LIKE 'TEST_%' 
   OR wallet_address ILIKE '%test%';

DELETE FROM user_achievements 
WHERE wallet_address LIKE 'TEST_%' 
   OR wallet_address ILIKE '%test%';

-- =====================================================
-- 8. VERIFICATION QUERIES
-- =====================================================

-- Check remaining users (should only show real users)
SELECT 
  wallet_address,
  display_name,
  squad,
  profile_completed,
  created_at
FROM users 
ORDER BY created_at DESC;

-- Check remaining XP data
SELECT 
  wallet_address,
  total_xp,
  level,
  created_at
FROM user_xp 
ORDER BY total_xp DESC;

-- Check remaining activity
SELECT 
  wallet_address,
  activity_type,
  created_at
FROM user_activity 
ORDER BY created_at DESC 
LIMIT 10;

-- Summary of remaining data
SELECT 
  'users' as table_name,
  COUNT(*) as record_count
FROM users
UNION ALL
SELECT 
  'user_xp' as table_name,
  COUNT(*) as record_count
FROM user_xp
UNION ALL
SELECT 
  'user_activity' as table_name,
  COUNT(*) as record_count
FROM user_activity
UNION ALL
SELECT 
  'bounty_submissions' as table_name,
  COUNT(*) as record_count
FROM bounty_submissions
UNION ALL
SELECT 
  'wallet_connections' as table_name,
  COUNT(*) as record_count
FROM wallet_connections;
