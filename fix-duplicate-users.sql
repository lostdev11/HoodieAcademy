-- Fix duplicate users in the database
-- Run this in your Supabase SQL Editor

-- 1. First, let's see how many duplicates we have
SELECT 
  wallet_address,
  COUNT(*) as duplicate_count,
  MIN(created_at) as first_created,
  MAX(created_at) as last_created,
  STRING_AGG(id::text, ', ') as duplicate_ids
FROM users 
GROUP BY wallet_address 
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- 2. Create a temporary table with the latest record for each wallet
CREATE TEMP TABLE users_deduplicated AS
SELECT DISTINCT ON (wallet_address) *
FROM users
ORDER BY wallet_address, updated_at DESC, created_at DESC;

-- 3. Show what will be kept vs removed
SELECT 
  'KEEP' as action,
  wallet_address,
  id,
  display_name,
  created_at,
  updated_at
FROM users_deduplicated
UNION ALL
SELECT 
  'REMOVE' as action,
  u.wallet_address,
  u.id,
  u.display_name,
  u.created_at,
  u.updated_at
FROM users u
WHERE u.id NOT IN (SELECT id FROM users_deduplicated)
ORDER BY wallet_address, action;

-- 4. Delete duplicates (keep only the most recent record for each wallet)
DELETE FROM users 
WHERE id NOT IN (
  SELECT DISTINCT ON (wallet_address) id
  FROM users
  ORDER BY wallet_address, updated_at DESC, created_at DESC
);

-- 5. Verify the fix
SELECT 
  wallet_address,
  COUNT(*) as count
FROM users 
GROUP BY wallet_address 
HAVING COUNT(*) > 1;

-- 6. Show final user count
SELECT COUNT(*) as total_users FROM users;

-- 7. Add unique constraint to prevent future duplicates
ALTER TABLE users ADD CONSTRAINT unique_wallet_address UNIQUE (wallet_address);