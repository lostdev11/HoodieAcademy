-- =========================================
-- UPDATE VOTING POWER FORMULA TO GIVE XP MORE WEIGHT
-- =========================================
-- This updates the voting power calculation to give XP more weight
-- New formula: (HOOD × 0.4) + (XP × 0.002 × 0.6)
-- This means XP has 60% weight vs HOOD's 40%, and XP multiplier is doubled
-- =========================================

-- =========================================
-- 1. UPDATE CALCULATE VOTING POWER FUNCTION
-- =========================================

CREATE OR REPLACE FUNCTION calculate_voting_power(
  p_hood_balance BIGINT,
  p_xp_amount INTEGER
)
RETURNS BIGINT
LANGUAGE plpgsql
AS $$
DECLARE
  v_hood_power DECIMAL;
  v_xp_power DECIMAL;
  v_total_power BIGINT;
BEGIN
  -- New formula: 0.4 × HOOD + 0.6 × (XP × 0.002)
  -- XP now has 60% weight and 2x multiplier (was 0.001, now 0.002)
  v_hood_power := p_hood_balance * 0.4;
  v_xp_power := (p_xp_amount * 0.002) * 0.6;
  v_total_power := FLOOR(v_hood_power + v_xp_power);
  
  RETURN v_total_power;
END;
$$;

-- =========================================
-- 2. UPDATE GET USER VOTING POWER FUNCTION
-- =========================================

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
  
  -- Calculate voting power: (HOOD × 0.4) + (XP × 0.002 × 0.6)
  v_voting_power := calculate_voting_power(v_hood_balance, v_xp_amount);
  
  RETURN jsonb_build_object(
    'wallet_address', p_wallet_address,
    'hood_balance', v_hood_balance,
    'xp_amount', v_xp_amount,
    'voting_power', v_voting_power,
    'hood_contribution', FLOOR(v_hood_balance * 0.4),
    'xp_contribution', FLOOR((v_xp_amount * 0.002) * 0.6)
  );
END;
$$;

-- =========================================
-- 3. VERIFICATION
-- =========================================

-- Test the new formula
-- Example: User with 10,000 HOOD and 50,000 XP
-- Old: (10,000 × 0.5) + (50,000 × 0.001 × 0.5) = 5,000 + 25 = 5,025
-- New: (10,000 × 0.4) + (50,000 × 0.002 × 0.6) = 4,000 + 60 = 4,060
-- 
-- Example: User with 1,000 HOOD and 100,000 XP
-- Old: (1,000 × 0.5) + (100,000 × 0.001 × 0.5) = 500 + 50 = 550
-- New: (1,000 × 0.4) + (100,000 × 0.002 × 0.6) = 400 + 120 = 520
--
-- Example: User with 0 HOOD and 200,000 XP
-- Old: (0 × 0.5) + (200,000 × 0.001 × 0.5) = 0 + 100 = 100
-- New: (0 × 0.4) + (200,000 × 0.002 × 0.6) = 0 + 240 = 240
--
-- XP now has significantly more impact, especially for users with high XP!

SELECT 'Voting power formula updated successfully!' AS status;

