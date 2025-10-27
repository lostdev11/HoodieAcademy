-- Query to check daily claim bonuses
-- Run this in Supabase SQL Editor to see who has claimed their daily bonus

-- 1. Get all daily claims today
SELECT 
  d.wallet_address,
  u.display_name,
  d.xp_awarded,
  d.created_at as claimed_at,
  EXTRACT(HOUR FROM d.created_at) as hour_of_day
FROM daily_logins d
LEFT JOIN users u ON d.wallet_address = u.wallet_address
WHERE DATE(d.created_at) = CURRENT_DATE
ORDER BY d.created_at DESC;

-- 2. Count total claims today
SELECT 
  COUNT(*) as total_claims_today,
  COUNT(DISTINCT wallet_address) as unique_users_claimed,
  SUM(xp_awarded) as total_xp_awarded_today
FROM daily_logins
WHERE DATE(created_at) = CURRENT_DATE;

-- 3. Get users who claimed and their updated XP
SELECT 
  d.wallet_address,
  u.display_name,
  d.xp_awarded,
  u.total_xp as current_total_xp,
  u.level as current_level,
  d.created_at as claimed_at
FROM daily_logins d
JOIN users u ON d.wallet_address = u.wallet_address
WHERE DATE(d.created_at) = CURRENT_DATE
ORDER BY d.created_at DESC;

-- 4. Get users who haven't claimed today yet (have claimed before)
SELECT 
  u.wallet_address,
  u.display_name,
  u.total_xp,
  u.level,
  MAX(d.created_at) as last_claim_date
FROM users u
LEFT JOIN daily_logins d ON u.wallet_address = d.wallet_address
WHERE NOT EXISTS (
  SELECT 1 FROM daily_logins d2 
  WHERE d2.wallet_address = u.wallet_address 
  AND DATE(d2.created_at) = CURRENT_DATE
)
GROUP BY u.wallet_address, u.display_name, u.total_xp, u.level
ORDER BY last_claim_date DESC NULLS LAST;

-- 5. Verify XP was properly updated after daily claim
-- This checks if users have XP after claiming today
SELECT 
  d.wallet_address,
  u.display_name,
  d.xp_awarded,
  u.total_xp as user_total_xp,
  d.created_at as claimed_at,
  CASE 
    WHEN u.total_xp >= d.xp_awarded THEN '✅ XP Updated'
    ELSE '❌ XP NOT Updated'
  END as status_check
FROM daily_logins d
JOIN users u ON d.wallet_address = u.wallet_address
WHERE DATE(d.created_at) = CURRENT_DATE
ORDER BY d.created_at DESC;

-- 6. Check for duplicate claims today (should not happen)
SELECT 
  wallet_address,
  COUNT(*) as claim_count,
  COUNT(DISTINCT DATE(created_at)) as days_claimed
FROM daily_logins
WHERE DATE(created_at) = CURRENT_DATE
GROUP BY wallet_address
HAVING COUNT(*) > 1;

