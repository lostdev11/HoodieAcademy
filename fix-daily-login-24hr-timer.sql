-- =====================================================
-- Fix Daily Login Bonus 24-Hour Timer System
-- This script converts from calendar day system to true 24-hour cooldown
-- =====================================================

-- =====================================================
-- 1. CREATE NEW 24-HOUR COOLDOWN FUNCTIONS
-- =====================================================

-- Function to check if user can claim daily bonus (24-hour cooldown)
CREATE OR REPLACE FUNCTION can_claim_daily_bonus(p_wallet_address TEXT)
RETURNS TABLE (
  can_claim BOOLEAN,
  last_claim_time TIMESTAMPTZ,
  next_available TIMESTAMPTZ,
  hours_remaining INTEGER,
  minutes_remaining INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  last_claim TIMESTAMPTZ;
  next_available_time TIMESTAMPTZ;
  time_remaining INTERVAL;
  can_claim_now BOOLEAN;
BEGIN
  -- Get the most recent daily login claim
  SELECT dl.created_at INTO last_claim
  FROM daily_logins dl
  WHERE dl.wallet_address = p_wallet_address
  ORDER BY dl.created_at DESC
  LIMIT 1;
  
  -- If no previous claim, user can claim now
  IF last_claim IS NULL THEN
    RETURN QUERY SELECT 
      true as can_claim,
      NULL::TIMESTAMPTZ as last_claim_time,
      NOW() as next_available,
      0 as hours_remaining,
      0 as minutes_remaining;
    RETURN;
  END IF;
  
  -- Calculate next available time (24 hours from last claim)
  next_available_time := last_claim + INTERVAL '24 hours';
  
  -- Check if 24 hours have passed
  can_claim_now := NOW() >= next_available_time;
  
  -- Calculate time remaining
  IF can_claim_now THEN
    time_remaining := INTERVAL '0 seconds';
  ELSE
    time_remaining := next_available_time - NOW();
  END IF;
  
  RETURN QUERY SELECT 
    can_claim_now as can_claim,
    last_claim as last_claim_time,
    next_available_time as next_available,
    EXTRACT(HOUR FROM time_remaining)::INTEGER as hours_remaining,
    EXTRACT(MINUTE FROM time_remaining)::INTEGER as minutes_remaining;
END;
$$;

-- Function to get daily bonus status (24-hour cooldown)
CREATE OR REPLACE FUNCTION get_daily_bonus_status(p_wallet_address TEXT)
RETURNS TABLE (
  wallet_address TEXT,
  already_claimed BOOLEAN,
  last_claimed TIMESTAMPTZ,
  next_available TIMESTAMPTZ,
  can_claim_now BOOLEAN,
  hours_remaining INTEGER,
  minutes_remaining INTEGER,
  seconds_remaining INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  last_claim TIMESTAMPTZ;
  next_available_time TIMESTAMPTZ;
  time_remaining INTERVAL;
  can_claim_now BOOLEAN;
BEGIN
  -- Get the most recent daily login claim
  SELECT dl.created_at INTO last_claim
  FROM daily_logins dl
  WHERE dl.wallet_address = p_wallet_address
  ORDER BY dl.created_at DESC
  LIMIT 1;
  
  -- If no previous claim, user can claim now
  IF last_claim IS NULL THEN
    RETURN QUERY SELECT 
      p_wallet_address as wallet_address,
      false as already_claimed,
      NULL::TIMESTAMPTZ as last_claimed,
      NOW() as next_available,
      true as can_claim_now,
      0 as hours_remaining,
      0 as minutes_remaining,
      0 as seconds_remaining;
    RETURN;
  END IF;
  
  -- Calculate next available time (24 hours from last claim)
  next_available_time := last_claim + INTERVAL '24 hours';
  
  -- Check if 24 hours have passed
  can_claim_now := NOW() >= next_available_time;
  
  -- Calculate time remaining
  IF can_claim_now THEN
    time_remaining := INTERVAL '0 seconds';
  ELSE
    time_remaining := next_available_time - NOW();
  END IF;
  
  RETURN QUERY SELECT 
    p_wallet_address as wallet_address,
    NOT can_claim_now as already_claimed,
    last_claim as last_claimed,
    next_available_time as next_available,
    can_claim_now as can_claim_now,
    EXTRACT(HOUR FROM time_remaining)::INTEGER as hours_remaining,
    EXTRACT(MINUTE FROM time_remaining)::INTEGER as minutes_remaining,
    EXTRACT(SECOND FROM time_remaining)::INTEGER as seconds_remaining;
END;
$$;

-- =====================================================
-- 2. GRANT PERMISSIONS
-- =====================================================

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION can_claim_daily_bonus(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_daily_bonus_status(TEXT) TO authenticated;

-- =====================================================
-- 3. TEST THE NEW FUNCTIONS
-- =====================================================

-- Test function for a sample wallet (will return can_claim=true if no previous claims)
SELECT 'Testing can_claim_daily_bonus function' as test_name;
SELECT * FROM can_claim_daily_bonus('test-wallet-123');

SELECT 'Testing get_daily_bonus_status function' as test_name;
SELECT * FROM get_daily_bonus_status('test-wallet-123');

-- =====================================================
-- 4. VERIFY EXISTING DATA
-- =====================================================

-- Check existing daily login claims
SELECT 
  'Existing daily login claims' as info,
  COUNT(*) as total_claims,
  MIN(created_at) as earliest_claim,
  MAX(created_at) as latest_claim
FROM daily_logins;

-- Show recent claims with 24-hour calculation
SELECT 
  wallet_address,
  created_at as claim_time,
  created_at + INTERVAL '24 hours' as next_available_24hr,
  NOW() as current_time,
  CASE 
    WHEN NOW() >= (created_at + INTERVAL '24 hours') THEN 'Available Now'
    ELSE 'Still in Cooldown'
  END as status
FROM daily_logins
ORDER BY created_at DESC
LIMIT 10;

-- =====================================================
-- 5. MIGRATION NOTES
-- =====================================================

/*
MIGRATION INSTRUCTIONS:

1. Run this SQL script in Supabase SQL Editor
2. Update the API endpoints to use these new functions
3. The new system will:
   - Check for claims in the last 24 hours (not calendar day)
   - Calculate next available as exactly 24 hours from last claim
   - Return precise countdown information

BENEFITS:
- True 24-hour cooldown (not midnight reset)
- Consistent timer regardless of when user claims
- More accurate countdown display
- Prevents gaming the system by claiming at 11:59 PM and 12:01 AM

EXAMPLE USAGE:
- User claims at 3:15 PM → Next available at 3:15 PM next day
- User claims at 11:59 PM → Next available at 11:59 PM next day
- Timer always shows exactly 24 hours, not "until midnight"
*/
