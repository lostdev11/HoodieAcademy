-- =====================================================
-- CLEANUP: Remove Duplicate XP System
-- =====================================================
-- This script removes the duplicate user_xp table and 
-- consolidates everything into the users table.
--
-- IMPORTANT: Only run this after backing up your database!
-- =====================================================

-- Step 1: Verify current state
SELECT 'Current user_xp records:' as step, COUNT(*) as count FROM user_xp;
SELECT 'Current users with XP:' as step, COUNT(*) as count FROM users WHERE total_xp > 0;

-- Step 2: Migrate any data from user_xp to users table (just in case)
-- This will take the MAX xp from either table
UPDATE users u
SET 
  total_xp = GREATEST(
    COALESCE(u.total_xp, 0),
    COALESCE(ux.total_xp, 0)
  ),
  level = GREATEST(
    COALESCE(u.level, 1),
    COALESCE(ux.level, 1)
  ),
  updated_at = NOW()
FROM user_xp ux
WHERE u.wallet_address = ux.wallet_address;

-- Step 3: Drop the functions that reference user_xp
DROP FUNCTION IF EXISTS award_xp(TEXT, TEXT, TEXT, INTEGER, TEXT) CASCADE;
DROP FUNCTION IF EXISTS get_user_xp_summary(TEXT) CASCADE;
DROP FUNCTION IF EXISTS award_course_completion_xp() CASCADE;

-- Step 4: Drop triggers that reference these functions
DROP TRIGGER IF EXISTS trigger_award_course_xp ON course_completions;

-- Step 5: Drop the user_xp table
DROP TABLE IF EXISTS user_xp CASCADE;

-- Step 6: Drop xp_events table if it exists (optional - remove if you want to keep history)
-- DROP TABLE IF EXISTS xp_events CASCADE;

-- Step 7: Verify cleanup
SELECT 'Users with XP after cleanup:' as step, COUNT(*) as count FROM users WHERE total_xp > 0;
SELECT 'All users:' as step, COUNT(*) as count FROM users;

-- Step 8: Show current XP distribution
SELECT 
  wallet_address,
  display_name,
  total_xp,
  level,
  updated_at
FROM users
ORDER BY total_xp DESC
LIMIT 10;

-- =====================================================
-- RESULT: Single source of truth for XP
-- =====================================================
-- After running this script:
-- ✅ Only users table stores XP
-- ✅ No duplicate tables
-- ✅ XP data preserved
-- ✅ Award API works with users table
-- ✅ Display components read from users table
-- =====================================================

