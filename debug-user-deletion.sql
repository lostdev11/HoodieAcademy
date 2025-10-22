-- Debug User Deletion Issues
-- Run these queries to troubleshoot "User not found" errors

-- =====================================================
-- 1. CHECK IF USER EXISTS
-- =====================================================

-- Replace 'TARGET_WALLET_ADDRESS' with the actual wallet you're trying to delete
SELECT 
  wallet_address,
  display_name,
  username,
  squad,
  is_admin,
  total_xp,
  created_at,
  updated_at
FROM users 
WHERE wallet_address = 'TARGET_WALLET_ADDRESS';

-- =====================================================
-- 2. CHECK ADMIN STATUS
-- =====================================================

-- Replace 'ADMIN_WALLET_ADDRESS' with your admin wallet
SELECT 
  wallet_address,
  display_name,
  is_admin,
  created_at
FROM users 
WHERE wallet_address = 'ADMIN_WALLET_ADDRESS';

-- =====================================================
-- 3. LIST ALL USERS (to verify data exists)
-- =====================================================

SELECT 
  wallet_address,
  display_name,
  squad,
  is_admin,
  total_xp,
  created_at
FROM users 
ORDER BY created_at DESC
LIMIT 10;

-- =====================================================
-- 4. CHECK FOR DUPLICATE WALLET ADDRESSES
-- =====================================================

SELECT 
  wallet_address,
  COUNT(*) as count
FROM users 
GROUP BY wallet_address
HAVING COUNT(*) > 1;

-- =====================================================
-- 5. CHECK USER ACTIVITY TABLE
-- =====================================================

-- Check if user has activity records
SELECT 
  wallet_address,
  activity_type,
  created_at
FROM user_activity 
WHERE wallet_address = 'TARGET_WALLET_ADDRESS'
ORDER BY created_at DESC
LIMIT 5;

-- =====================================================
-- 6. TEST USER DELETION (DRY RUN)
-- =====================================================

-- This will show what would be deleted (don't actually delete yet)
SELECT 
  'users' as table_name,
  wallet_address,
  display_name,
  username,
  squad,
  total_xp
FROM users 
WHERE wallet_address = 'TARGET_WALLET_ADDRESS'

UNION ALL

SELECT 
  'user_activity' as table_name,
  wallet_address,
  activity_type as display_name,
  NULL as username,
  NULL as squad,
  NULL as total_xp
FROM user_activity 
WHERE wallet_address = 'TARGET_WALLET_ADDRESS';

-- =====================================================
-- 7. MANUAL USER DELETION (if needed)
-- =====================================================

-- Only run this if the API is failing and you need to manually delete
-- Replace 'TARGET_WALLET_ADDRESS' with the actual wallet

-- Step 1: Delete user activity
-- DELETE FROM user_activity WHERE wallet_address = 'TARGET_WALLET_ADDRESS';

-- Step 2: Delete user
-- DELETE FROM users WHERE wallet_address = 'TARGET_WALLET_ADDRESS';

-- =====================================================
-- 8. CREATE TEST USER (for testing deletion)
-- =====================================================

-- Create a test user to practice deletion
-- INSERT INTO users (
--   wallet_address,
--   display_name,
--   username,
--   squad,
--   total_xp,
--   is_admin,
--   created_at,
--   updated_at
-- ) VALUES (
--   'test-delete-wallet-123',
--   'Test Delete User',
--   'testdelete',
--   'Creators',
--   1000,
--   false,
--   NOW(),
--   NOW()
-- );

-- =====================================================
-- 9. CHECK FOREIGN KEY CONSTRAINTS
-- =====================================================

-- Check if there are foreign key constraints that might prevent deletion
SELECT 
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('users', 'user_activity');

-- =====================================================
-- 10. CHECK ROW LEVEL SECURITY
-- =====================================================

-- Check if RLS is enabled and might be blocking the deletion
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename IN ('users', 'user_activity');

-- =====================================================
-- EXAMPLE USAGE
-- =====================================================

-- Example: Check a specific user
-- SELECT * FROM users WHERE wallet_address = 'qg7pNNZq7qDQuc6Xkd1x4NvS2VM3aHtCqHEzucZxRGA';

-- Example: Check admin status
-- SELECT wallet_address, is_admin FROM users WHERE wallet_address = 'qg7pNNZq7qDQuc6Xkd1x4NvS2VM3aHtCqHEzucZxRGA';

-- Example: List recent users
-- SELECT wallet_address, display_name, created_at FROM users ORDER BY created_at DESC LIMIT 5;
