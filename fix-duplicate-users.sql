-- =====================================================
-- FIX DUPLICATE USERS IN DATABASE
-- =====================================================
-- Run this in your Supabase SQL Editor to remove duplicate users

-- Step 1: Check for duplicates
SELECT 
  wallet_address,
  COUNT(*) as duplicate_count,
  STRING_AGG(id::text, ', ') as user_ids
FROM users
GROUP BY wallet_address
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- Step 2: View details of duplicates (uncomment to run)
-- SELECT 
--   wallet_address,
--   id,
--   display_name,
--   total_xp,
--   created_at,
--   updated_at
-- FROM users
-- WHERE wallet_address IN (
--   SELECT wallet_address 
--   FROM users 
--   GROUP BY wallet_address 
--   HAVING COUNT(*) > 1
-- )
-- ORDER BY wallet_address, updated_at DESC;

-- Step 3: Delete duplicates (keeps most recent record based on updated_at)
-- IMPORTANT: Review the duplicates first before running this!
-- This will DELETE data permanently!

DELETE FROM users
WHERE id IN (
  SELECT id
  FROM (
    SELECT 
      id,
      wallet_address,
      ROW_NUMBER() OVER (
        PARTITION BY wallet_address 
        ORDER BY updated_at DESC, created_at DESC
      ) as row_num
    FROM users
  ) t
  WHERE row_num > 1
);

-- Step 4: Add unique constraint to prevent future duplicates
ALTER TABLE users
ADD CONSTRAINT users_wallet_address_unique 
UNIQUE (wallet_address);

-- Step 5: Verify no duplicates remain
SELECT 
  wallet_address,
  COUNT(*) as count
FROM users
GROUP BY wallet_address
HAVING COUNT(*) > 1;

-- If this returns 0 rows, you're all set! ✅

-- =====================================================
-- ALTERNATIVE: Manual cleanup if you want more control
-- =====================================================

-- For each duplicate, you can manually decide which to keep:
-- 
-- Example: Keep the user with most XP
-- DELETE FROM users 
-- WHERE wallet_address = 'DUPLICATE_WALLET_HERE'
-- AND id != (
--   SELECT id FROM users 
--   WHERE wallet_address = 'DUPLICATE_WALLET_HERE'
--   ORDER BY total_xp DESC 
--   LIMIT 1
-- );

-- =====================================================
-- ROLLBACK (if something goes wrong)
-- =====================================================
-- If you need to rollback, make sure you have a backup!
-- Supabase keeps automatic backups, but you can also export before running this.

-- To restore from a backup:
-- 1. Go to Supabase Dashboard
-- 2. Click "Database"
-- 3. Click "Backups"
-- 4. Select a backup before you ran this script
-- 5. Click "Restore"

