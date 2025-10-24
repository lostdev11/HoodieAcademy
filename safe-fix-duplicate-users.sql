-- SAFE fix for duplicate users
-- This preserves the most recent/complete data for each wallet

-- Step 1: Create a backup table (optional but recommended)
CREATE TABLE IF NOT EXISTS users_backup AS SELECT * FROM users;

-- Step 2: Create a temporary table with the best record for each wallet
-- Priority: most recent updated_at, then most recent created_at, then highest XP
CREATE TEMP TABLE users_best AS
SELECT DISTINCT ON (wallet_address) *
FROM users
ORDER BY wallet_address, 
  updated_at DESC, 
  created_at DESC, 
  total_xp DESC;

-- Step 3: Show what will be kept (for verification)
SELECT 
  'KEEPING' as action,
  wallet_address,
  id,
  display_name,
  squad,
  total_xp,
  level,
  is_admin,
  created_at,
  updated_at
FROM users_best
WHERE wallet_address IN (
  SELECT wallet_address 
  FROM users 
  GROUP BY wallet_address 
  HAVING COUNT(*) > 1
)
ORDER BY wallet_address;

-- Step 4: Delete all records first
DELETE FROM users;

-- Step 5: Insert the best records back
INSERT INTO users 
SELECT * FROM users_best;

-- Step 6: Add unique constraint to prevent future duplicates
ALTER TABLE users ADD CONSTRAINT IF NOT EXISTS unique_wallet_address UNIQUE (wallet_address);

-- Step 7: Verify the fix
SELECT 
  COUNT(*) as total_users,
  COUNT(DISTINCT wallet_address) as unique_wallets
FROM users;

-- Step 8: Show any remaining duplicates (should be 0)
SELECT 
  wallet_address,
  COUNT(*) as count
FROM users 
GROUP BY wallet_address 
HAVING COUNT(*) > 1;
