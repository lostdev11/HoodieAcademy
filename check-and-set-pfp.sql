-- Check and Set Profile Picture (PFP)
-- Run this in Supabase SQL Editor

-- =====================================================
-- 1. CHECK YOUR CURRENT PFP
-- =====================================================

-- Replace with your actual wallet address
SELECT 
  wallet_address,
  display_name,
  squad,
  profile_picture,
  updated_at
FROM users 
WHERE wallet_address = 'qg7pNNZq7qDQuc6Xkd1x4NvS2VM3aHtCqHEzucZxRGA';

-- =====================================================
-- 2. SET A TEST PFP (if you don't have one)
-- =====================================================

-- Option A: Use a generic avatar
UPDATE users 
SET 
  profile_picture = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
  updated_at = NOW()
WHERE wallet_address = 'qg7pNNZq7qDQuc6Xkd1x4NvS2VM3aHtCqHEzucZxRGA';

-- Option B: Use your own image URL
-- UPDATE users 
-- SET 
--   profile_picture = 'YOUR_IMAGE_URL_HERE',
--   updated_at = NOW()
-- WHERE wallet_address = 'qg7pNNZq7qDQuc6Xkd1x4NvS2VM3aHtCqHEzucZxRGA';

-- =====================================================
-- 3. MAKE YOURSELF AN ACADEMY MEMBER (to see PFP)
-- =====================================================

-- PFP only shows for Academy Members (squad = NULL)
-- If you're in a squad, you'll see the squad badge instead

UPDATE users 
SET 
  squad = NULL,
  updated_at = NOW()
WHERE wallet_address = 'qg7pNNZq7qDQuc6Xkd1x4NvS2VM3aHtCqHEzucZxRGA';

-- =====================================================
-- 4. VERIFY YOUR CHANGES
-- =====================================================

SELECT 
  wallet_address,
  display_name,
  squad,
  profile_picture,
  CASE 
    WHEN squad IS NULL THEN '✅ Academy Member (PFP will show)'
    ELSE '❌ Squad Member (Squad badge will show)'
  END as pfp_visibility,
  CASE 
    WHEN profile_picture IS NOT NULL THEN '✅ PFP is set'
    ELSE '❌ No PFP set'
  END as pfp_status
FROM users 
WHERE wallet_address = 'qg7pNNZq7qDQuc6Xkd1x4NvS2VM3aHtCqHEzucZxRGA';

-- =====================================================
-- 5. CHECK ALL USERS WITH PFPS
-- =====================================================

SELECT 
  wallet_address,
  display_name,
  squad,
  profile_picture
FROM users 
WHERE profile_picture IS NOT NULL
ORDER BY updated_at DESC
LIMIT 10;

-- =====================================================
-- 6. QUICK FIX - DO EVERYTHING AT ONCE
-- =====================================================

-- This will:
-- 1. Set your PFP
-- 2. Make you an Academy Member
-- 3. Update timestamp

UPDATE users 
SET 
  profile_picture = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
  squad = NULL,
  updated_at = NOW()
WHERE wallet_address = 'qg7pNNZq7qDQuc6Xkd1x4NvS2VM3aHtCqHEzucZxRGA';

-- =====================================================
-- 7. REMOVE PFP (if you want to go back to badge)
-- =====================================================

-- Uncomment to remove your PFP
-- UPDATE users 
-- SET 
--   profile_picture = NULL,
--   updated_at = NOW()
-- WHERE wallet_address = 'qg7pNNZq7qDQuc6Xkd1x4NvS2VM3aHtCqHEzucZxRGA';

-- =====================================================
-- NOTES
-- =====================================================

/*
1. Replace 'qg7pNNZq7qDQuc6Xkd1x4NvS2VM3aHtCqHEzucZxRGA' with your actual wallet address
2. PFP only shows for Academy Members (squad = NULL)
3. If you're in a squad, you'll see your squad badge instead
4. After updating, refresh your browser (Ctrl+F5 or Cmd+Shift+R)
5. Check the top-right corner of the homepage to see your PFP
*/
