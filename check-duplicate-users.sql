-- Check for duplicate users (SAFE - READ ONLY)
-- Run this first to see what duplicates exist

-- 1. Count total users vs unique wallets
SELECT 
  COUNT(*) as total_users,
  COUNT(DISTINCT wallet_address) as unique_wallets,
  COUNT(*) - COUNT(DISTINCT wallet_address) as duplicate_count
FROM users;

-- 2. Show all duplicates with details
SELECT 
  wallet_address,
  COUNT(*) as duplicate_count,
  MIN(created_at) as first_created,
  MAX(created_at) as last_created,
  MIN(updated_at) as first_updated,
  MAX(updated_at) as last_updated,
  STRING_AGG(id::text, ', ') as duplicate_ids,
  STRING_AGG(display_name, ' | ') as display_names
FROM users 
GROUP BY wallet_address 
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- 3. Show which record would be kept (most recent updated_at)
SELECT 
  'KEEP' as action,
  wallet_address,
  id,
  display_name,
  squad,
  total_xp,
  level,
  is_admin,
  created_at,
  updated_at
FROM (
  SELECT *,
    ROW_NUMBER() OVER (PARTITION BY wallet_address ORDER BY updated_at DESC, created_at DESC) as rn
  FROM users
) ranked
WHERE rn = 1 AND wallet_address IN (
  SELECT wallet_address 
  FROM users 
  GROUP BY wallet_address 
  HAVING COUNT(*) > 1
)
ORDER BY wallet_address;

-- 4. Show which records would be deleted
SELECT 
  'DELETE' as action,
  wallet_address,
  id,
  display_name,
  squad,
  total_xp,
  level,
  is_admin,
  created_at,
  updated_at
FROM (
  SELECT *,
    ROW_NUMBER() OVER (PARTITION BY wallet_address ORDER BY updated_at DESC, created_at DESC) as rn
  FROM users
) ranked
WHERE rn > 1 AND wallet_address IN (
  SELECT wallet_address 
  FROM users 
  GROUP BY wallet_address 
  HAVING COUNT(*) > 1
)
ORDER BY wallet_address, updated_at DESC;
