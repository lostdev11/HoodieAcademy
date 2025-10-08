-- ====================================
-- Verify No Duplicate Users Script
-- ====================================
-- This script checks the users table for duplicates
-- and ensures wallet_address is properly set as unique

-- 1. Check if users table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'users'
) AS users_table_exists;

-- 2. Check for wallet_address unique constraint
SELECT
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'users'
  AND tc.table_schema = 'public'
  AND (tc.constraint_type = 'UNIQUE' OR tc.constraint_type = 'PRIMARY KEY')
  AND kcu.column_name = 'wallet_address';

-- 3. Count total users
SELECT COUNT(*) AS total_users FROM users;

-- 4. Check for duplicate wallet addresses (should return 0)
SELECT 
  wallet_address,
  COUNT(*) as count
FROM users
GROUP BY wallet_address
HAVING COUNT(*) > 1;

-- 5. Show all users
SELECT 
  wallet_address,
  display_name,
  squad,
  is_admin,
  created_at,
  last_active
FROM users
ORDER BY created_at DESC;

-- ====================================
-- If no unique constraint exists, add it:
-- ====================================
-- IMPORTANT: Only run this if the verification above shows
-- no unique constraint on wallet_address

-- First, remove any actual duplicates if they exist
-- (Keep the oldest record for each wallet)
DELETE FROM users a USING (
  SELECT MIN(created_at) as min_created_at, wallet_address
  FROM users 
  GROUP BY wallet_address
) b
WHERE a.wallet_address = b.wallet_address 
AND a.created_at > b.min_created_at;

-- Then add the unique constraint
-- ALTER TABLE users ADD CONSTRAINT users_wallet_address_unique UNIQUE (wallet_address);

-- ====================================
-- Verify the constraint is in place
-- ====================================
-- Run this to confirm:
-- SELECT conname, contype 
-- FROM pg_constraint 
-- WHERE conrelid = 'users'::regclass 
-- AND contype = 'u';

