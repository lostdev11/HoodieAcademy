-- =========================================
-- FIX XP & GOVERNANCE INTEGRATION
-- =========================================
-- This script:
-- 1. Fixes the voting power function to use correct XP column
-- 2. Consolidates XP columns (total_xp is the source of truth)
-- 3. Creates robust XP tracking and auto-assignment
-- 4. Ensures XP displays consistently everywhere
-- =========================================

-- =========================================
-- 1. ENSURE USERS TABLE HAS CORRECT XP COLUMNS
-- =========================================

-- Add total_xp if missing (this is our main XP column)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS total_xp INTEGER DEFAULT 0;

-- Add level column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_users_total_xp ON users(total_xp);
CREATE INDEX IF NOT EXISTS idx_users_level ON users(level);

-- Update any null values
UPDATE users 
SET 
  total_xp = COALESCE(total_xp, 0),
  level = COALESCE(level, 1)
WHERE total_xp IS NULL OR level IS NULL;

-- =========================================
-- 2. FIX GOVERNANCE VOTING POWER FUNCTION
-- =========================================

-- Drop and recreate with correct column name
DROP FUNCTION IF EXISTS get_user_voting_power(TEXT);

CREATE OR REPLACE FUNCTION get_user_voting_power(
  p_wallet_address TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_hood_balance BIGINT := 0;
  v_xp_amount INTEGER := 0;
  v_voting_power BIGINT;
BEGIN
  -- Get HOOD balance
  SELECT COALESCE(hood_balance, 0) INTO v_hood_balance
  FROM hood_user_balances
  WHERE wallet_address = p_wallet_address;
  
  -- Get XP from users table (using correct column name: total_xp)
  SELECT COALESCE(total_xp, 0) INTO v_xp_amount
  FROM users
  WHERE wallet_address = p_wallet_address;
  
  -- Calculate voting power: (HOOD × 0.5) + (XP × 0.001 × 0.5)
  v_voting_power := calculate_voting_power(v_hood_balance, v_xp_amount);
  
  RETURN jsonb_build_object(
    'wallet_address', p_wallet_address,
    'hood_balance', v_hood_balance,
    'xp_amount', v_xp_amount,
    'voting_power', v_voting_power,
    'hood_contribution', FLOOR(v_hood_balance * 0.5),
    'xp_contribution', FLOOR((v_xp_amount * 0.001) * 0.5)
  );
END;
$$;

-- =========================================
-- 3. CREATE XP AUTO-ASSIGNMENT FUNCTION
-- =========================================

CREATE OR REPLACE FUNCTION award_xp(
  p_wallet_address TEXT,
  p_xp_amount INTEGER,
  p_activity_type TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_new_total_xp INTEGER;
  v_new_level INTEGER;
  v_old_total_xp INTEGER;
  v_old_level INTEGER;
BEGIN
  -- Get current XP
  SELECT COALESCE(total_xp, 0), COALESCE(level, 1)
  INTO v_old_total_xp, v_old_level
  FROM users
  WHERE wallet_address = p_wallet_address;
  
  -- If user doesn't exist, create them
  IF NOT FOUND THEN
    INSERT INTO users (wallet_address, total_xp, level)
    VALUES (p_wallet_address, p_xp_amount, FLOOR(p_xp_amount / 1000.0) + 1);
    
    v_new_total_xp := p_xp_amount;
    v_new_level := FLOOR(p_xp_amount / 1000.0) + 1;
  ELSE
    -- Update existing user
    v_new_total_xp := v_old_total_xp + p_xp_amount;
    v_new_level := FLOOR(v_new_total_xp / 1000.0) + 1;
    
    UPDATE users
    SET 
      total_xp = v_new_total_xp,
      level = v_new_level,
      updated_at = NOW()
    WHERE wallet_address = p_wallet_address;
  END IF;
  
  -- Log activity
  INSERT INTO user_activity (wallet_address, activity_type, metadata)
  VALUES (p_wallet_address, p_activity_type, p_metadata || jsonb_build_object('xp_awarded', p_xp_amount));
  
  RETURN jsonb_build_object(
    'success', true,
    'wallet_address', p_wallet_address,
    'xp_awarded', p_xp_amount,
    'old_total_xp', v_old_total_xp,
    'new_total_xp', v_new_total_xp,
    'old_level', v_old_level,
    'new_level', v_new_level,
    'leveled_up', v_new_level > v_old_level
  );
END;
$$;

-- =========================================
-- 4. CREATE FUNCTION TO GET USER XP
-- =========================================

CREATE OR REPLACE FUNCTION get_user_xp(
  p_wallet_address TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_user RECORD;
BEGIN
  SELECT 
    total_xp,
    level,
    wallet_address,
    display_name
  INTO v_user
  FROM users
  WHERE wallet_address = p_wallet_address;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'wallet_address', p_wallet_address,
      'total_xp', 0,
      'level', 1,
      'display_name', NULL,
      'exists', false
    );
  END IF;
  
  RETURN jsonb_build_object(
    'wallet_address', p_wallet_address,
    'total_xp', COALESCE(v_user.total_xp, 0),
    'level', COALESCE(v_user.level, 1),
    'display_name', v_user.display_name,
    'xp_to_next_level', 1000 - (COALESCE(v_user.total_xp, 0) % 1000),
    'progress_in_level', (COALESCE(v_user.total_xp, 0) % 1000) / 10.0,
    'exists', true
  );
END;
$$;

-- =========================================
-- 5. CREATE XP LEADERBOARD FUNCTION
-- =========================================

CREATE OR REPLACE FUNCTION get_xp_leaderboard(
  p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
  rank INTEGER,
  wallet_address TEXT,
  display_name TEXT,
  total_xp INTEGER,
  level INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ROW_NUMBER() OVER (ORDER BY COALESCE(u.total_xp, 0) DESC)::INTEGER AS rank,
    u.wallet_address,
    u.display_name,
    COALESCE(u.total_xp, 0) AS total_xp,
    COALESCE(u.level, 1) AS level
  FROM users u
  WHERE COALESCE(u.total_xp, 0) > 0
  ORDER BY total_xp DESC
  LIMIT p_limit;
END;
$$;

-- =========================================
-- 6. CREATE FUNCTION TO SYNC XP FROM ACTIVITIES
-- =========================================

CREATE OR REPLACE FUNCTION sync_user_xp_from_activities(
  p_wallet_address TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_total_xp INTEGER := 0;
  v_new_level INTEGER;
BEGIN
  -- Calculate total XP from all sources
  -- Note: This is for verification/sync, not primary tracking
  
  -- Get course completion XP
  SELECT COALESCE(SUM(xp_earned), 0) INTO v_total_xp
  FROM course_completions
  WHERE wallet_address = p_wallet_address;
  
  -- Update user's total_xp if different
  v_new_level := FLOOR(v_total_xp / 1000.0) + 1;
  
  UPDATE users
  SET 
    total_xp = v_total_xp,
    level = v_new_level,
    updated_at = NOW()
  WHERE wallet_address = p_wallet_address;
  
  RETURN jsonb_build_object(
    'success', true,
    'wallet_address', p_wallet_address,
    'synced_xp', v_total_xp,
    'level', v_new_level
  );
END;
$$;

-- =========================================
-- 7. VERIFICATION QUERIES
-- =========================================

-- Check users table has total_xp
SELECT 
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name IN ('total_xp', 'level', 'xp_total')
ORDER BY column_name;

-- Check functions exist
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'get_user_voting_power',
    'award_xp',
    'get_user_xp',
    'get_xp_leaderboard',
    'sync_user_xp_from_activities'
  );

-- Test voting power with XP
SELECT get_user_voting_power('qg7pNNZq7qDQuc6Xkd1x4NvS2VM3aHtCqHEzucZxRGA');

-- =========================================
-- ✅ COMPLETE!
-- =========================================
-- XP system is now:
-- ✅ Using total_xp as single source of truth
-- ✅ Governance voting power calculation fixed
-- ✅ Auto-assignment function created
-- ✅ XP sync function available
-- ✅ Leaderboard function ready
-- =========================================

