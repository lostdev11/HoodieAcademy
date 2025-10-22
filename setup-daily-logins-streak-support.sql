-- ============================================
-- DAILY LOGINS - STREAK SUPPORT
-- ============================================
-- Adds support for calculating login streaks

-- First, check if claim_utc_date exists and drop it if it's a generated column
-- We'll recreate it as a regular column
DO $$ 
BEGIN
    -- Drop the column if it exists (whether generated or not)
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'daily_logins' 
        AND column_name = 'claim_utc_date'
    ) THEN
        ALTER TABLE daily_logins DROP COLUMN claim_utc_date;
    END IF;
END $$;

-- Add created_at column if it doesn't exist (with default)
ALTER TABLE daily_logins 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Now add claim_utc_date as a regular (non-generated) column
ALTER TABLE daily_logins 
ADD COLUMN claim_utc_date DATE;

-- Populate claim_utc_date from existing created_at timestamps
-- If created_at is null, use CURRENT_DATE
UPDATE daily_logins 
SET claim_utc_date = COALESCE(
    DATE(created_at AT TIME ZONE 'UTC'),
    CURRENT_DATE
);

-- Make claim_utc_date required going forward
ALTER TABLE daily_logins 
ALTER COLUMN claim_utc_date SET NOT NULL;

-- Set default for new rows
ALTER TABLE daily_logins 
ALTER COLUMN claim_utc_date SET DEFAULT CURRENT_DATE;

-- Drop old UNIQUE constraint if it exists
ALTER TABLE daily_logins 
DROP CONSTRAINT IF EXISTS daily_logins_wallet_address_date_key;

-- Add new UNIQUE constraint using claim_utc_date
ALTER TABLE daily_logins 
ADD CONSTRAINT daily_logins_wallet_address_date_unique 
UNIQUE (wallet_address, claim_utc_date);

-- Create index for streak queries
CREATE INDEX IF NOT EXISTS idx_daily_logins_wallet_date 
ON daily_logins(wallet_address, claim_utc_date DESC);

-- Add comment
COMMENT ON COLUMN daily_logins.claim_utc_date IS 'The UTC date (YYYY-MM-DD) when the claim was made';

-- ============================================
-- FUNCTION: Calculate Current Streak
-- ============================================

CREATE OR REPLACE FUNCTION calculate_user_streak(p_wallet_address TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_streak INTEGER := 0;
    v_current_date DATE;
    v_check_date DATE;
    v_has_claim BOOLEAN;
BEGIN
    -- Start with today's date (UTC)
    v_current_date := CURRENT_DATE;
    v_check_date := v_current_date;
    
    -- Check each consecutive day going backwards
    LOOP
        -- Check if user claimed on this date
        SELECT EXISTS(
            SELECT 1 
            FROM daily_logins 
            WHERE wallet_address = p_wallet_address 
            AND claim_utc_date = v_check_date
        ) INTO v_has_claim;
        
        -- If no claim found, stop counting
        IF NOT v_has_claim THEN
            -- Special case: if we haven't started counting yet and it's not today,
            -- the user hasn't claimed today, so streak is 0
            IF v_streak = 0 AND v_check_date = v_current_date THEN
                RETURN 0;
            END IF;
            EXIT;
        END IF;
        
        -- Increment streak and check previous day
        v_streak := v_streak + 1;
        v_check_date := v_check_date - INTERVAL '1 day';
        
        -- Safety limit: stop after checking 365 days
        IF v_streak >= 365 THEN
            EXIT;
        END IF;
    END LOOP;
    
    RETURN v_streak;
END;
$$;

-- ============================================
-- FUNCTION: Get Streak Stats
-- ============================================

CREATE OR REPLACE FUNCTION get_user_streak_stats(p_wallet_address TEXT)
RETURNS TABLE (
    current_streak INTEGER,
    longest_streak INTEGER,
    total_claims INTEGER,
    last_claim_date DATE
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN QUERY
    WITH user_claims AS (
        SELECT claim_utc_date
        FROM daily_logins
        WHERE wallet_address = p_wallet_address
        ORDER BY claim_utc_date
    ),
    streak_groups AS (
        SELECT 
            claim_utc_date,
            claim_utc_date - (ROW_NUMBER() OVER (ORDER BY claim_utc_date))::INTEGER AS streak_group
        FROM user_claims
    ),
    streak_lengths AS (
        SELECT 
            COUNT(*) as streak_length,
            MIN(claim_utc_date) as streak_start,
            MAX(claim_utc_date) as streak_end
        FROM streak_groups
        GROUP BY streak_group
    )
    SELECT 
        calculate_user_streak(p_wallet_address) as current_streak,
        COALESCE((SELECT MAX(streak_length) FROM streak_lengths)::INTEGER, 0) as longest_streak,
        COALESCE((SELECT COUNT(*)::INTEGER FROM user_claims), 0) as total_claims,
        (SELECT MAX(claim_utc_date) FROM user_claims) as last_claim_date;
END;
$$;

-- ============================================
-- FUNCTION: Check If User Claimed Yesterday
-- ============================================

CREATE OR REPLACE FUNCTION user_claimed_yesterday(p_wallet_address TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_yesterday DATE;
BEGIN
    v_yesterday := CURRENT_DATE - INTERVAL '1 day';
    
    RETURN EXISTS(
        SELECT 1
        FROM daily_logins
        WHERE wallet_address = p_wallet_address
        AND claim_utc_date = v_yesterday
    );
END;
$$;

-- ============================================
-- FUNCTION: Get Streak Leaderboard
-- ============================================

CREATE OR REPLACE FUNCTION get_streak_leaderboard(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
    wallet_address TEXT,
    display_name TEXT,
    current_streak INTEGER,
    longest_streak INTEGER,
    total_claims INTEGER,
    last_claim_date DATE
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dl.wallet_address,
        COALESCE(u.display_name, SUBSTRING(dl.wallet_address, 1, 8) || '...') as display_name,
        calculate_user_streak(dl.wallet_address) as current_streak,
        (SELECT stats.longest_streak FROM get_user_streak_stats(dl.wallet_address) stats) as longest_streak,
        COUNT(dl.id)::INTEGER as total_claims,
        MAX(dl.claim_utc_date) as last_claim_date
    FROM daily_logins dl
    LEFT JOIN users u ON u.wallet_address = dl.wallet_address
    GROUP BY dl.wallet_address, u.display_name
    HAVING calculate_user_streak(dl.wallet_address) > 0
    ORDER BY current_streak DESC, total_claims DESC
    LIMIT p_limit;
END;
$$;

-- ============================================
-- TESTING QUERIES
-- ============================================

-- Test streak calculation for a specific user
-- SELECT * FROM get_user_streak_stats('your_wallet_address_here');

-- Test current streak
-- SELECT calculate_user_streak('your_wallet_address_here');

-- Check if user claimed yesterday
-- SELECT user_claimed_yesterday('your_wallet_address_here');

-- View streak leaderboard
-- SELECT * FROM get_streak_leaderboard(10);

-- View all claims for a user
-- SELECT wallet_address, claim_utc_date, created_at
-- FROM daily_logins
-- WHERE wallet_address = 'your_wallet_address_here'
-- ORDER BY claim_utc_date DESC;

-- ============================================
-- EXAMPLE: Manually insert test data
-- ============================================

-- Insert consecutive claims for testing (uncomment to use)
-- DO $$
-- DECLARE
--     test_wallet TEXT := 'TestWallet123';
--     i INTEGER;
-- BEGIN
--     FOR i IN 0..6 LOOP
--         INSERT INTO daily_logins (wallet_address, claim_utc_date, xp_awarded, created_at)
--         VALUES (
--             test_wallet,
--             CURRENT_DATE - i,
--             5,
--             NOW() - (i || ' days')::INTERVAL
--         )
--         ON CONFLICT (wallet_address, claim_utc_date) DO NOTHING;
--     END LOOP;
-- END $$;

-- Check the test data
-- SELECT * FROM get_user_streak_stats('TestWallet123');

