-- XP Bounty System Database Setup
-- Run this in your Supabase SQL editor

-- =====================================================
-- 1. ENSURE USERS TABLE HAS XP FIELDS
-- =====================================================

-- Add XP fields to users table if they don't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS total_xp INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;

-- Update existing users to have default XP values
UPDATE users 
SET 
  total_xp = COALESCE(total_xp, 0),
  level = COALESCE(level, 1)
WHERE total_xp IS NULL OR level IS NULL;

-- =====================================================
-- 2. ENSURE COURSE_COMPLETIONS TABLE EXISTS
-- =====================================================

CREATE TABLE IF NOT EXISTS course_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  course_id TEXT NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  xp_earned INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(wallet_address, course_id)
);

-- Create indexes for course_completions
CREATE INDEX IF NOT EXISTS idx_course_completions_wallet ON course_completions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_course_completions_course ON course_completions(course_id);
CREATE INDEX IF NOT EXISTS idx_course_completions_completed_at ON course_completions(completed_at);

-- =====================================================
-- 3. ENSURE USER_ACTIVITY TABLE EXISTS
-- =====================================================

CREATE TABLE IF NOT EXISTS user_activity (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  activity_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for user_activity
CREATE INDEX IF NOT EXISTS idx_user_activity_wallet ON user_activity(wallet_address);
CREATE INDEX IF NOT EXISTS idx_user_activity_type ON user_activity(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_created_at ON user_activity(created_at);

-- =====================================================
-- 4. CREATE XP BOUNTY TRACKING TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS xp_bounties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  xp_amount INTEGER NOT NULL,
  bounty_type TEXT NOT NULL, -- 'admin', 'course', 'daily', 'manual'
  reason TEXT NOT NULL,
  awarded_by TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for xp_bounties
CREATE INDEX IF NOT EXISTS idx_xp_bounties_wallet ON xp_bounties(wallet_address);
CREATE INDEX IF NOT EXISTS idx_xp_bounties_type ON xp_bounties(bounty_type);
CREATE INDEX IF NOT EXISTS idx_xp_bounties_created_at ON xp_bounties(created_at);

-- =====================================================
-- 5. CREATE DAILY LOGIN TRACKING TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS daily_login_bonuses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  login_date DATE NOT NULL,
  xp_awarded INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(wallet_address, login_date)
);

-- Create indexes for daily_login_bonuses
CREATE INDEX IF NOT EXISTS idx_daily_login_wallet ON daily_login_bonuses(wallet_address);
CREATE INDEX IF NOT EXISTS idx_daily_login_date ON daily_login_bonuses(login_date);

-- =====================================================
-- 6. ENABLE RLS POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE course_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_bounties ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_login_bonuses ENABLE ROW LEVEL SECURITY;

-- Course completions policies (drop and recreate to avoid conflicts)
DROP POLICY IF EXISTS "Users can view all course completions" ON course_completions;
DROP POLICY IF EXISTS "Users can insert their own course completions" ON course_completions;
DROP POLICY IF EXISTS "Service role can manage all course completions" ON course_completions;

CREATE POLICY "Users can view all course completions" ON course_completions
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own course completions" ON course_completions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can manage all course completions" ON course_completions
  FOR ALL USING (auth.role() = 'service_role');

-- User activity policies (drop and recreate to avoid conflicts)
DROP POLICY IF EXISTS "Users can view all user activity" ON user_activity;
DROP POLICY IF EXISTS "Users can insert their own activity" ON user_activity;
DROP POLICY IF EXISTS "Service role can manage all user activity" ON user_activity;

CREATE POLICY "Users can view all user activity" ON user_activity
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own activity" ON user_activity
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can manage all user activity" ON user_activity
  FOR ALL USING (auth.role() = 'service_role');

-- XP bounties policies
DROP POLICY IF EXISTS "Users can view all XP bounties" ON xp_bounties;
DROP POLICY IF EXISTS "Users can insert XP bounties" ON xp_bounties;
DROP POLICY IF EXISTS "Service role can manage all XP bounties" ON xp_bounties;

CREATE POLICY "Users can view all XP bounties" ON xp_bounties
  FOR SELECT USING (true);

CREATE POLICY "Users can insert XP bounties" ON xp_bounties
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can manage all XP bounties" ON xp_bounties
  FOR ALL USING (auth.role() = 'service_role');

-- Daily login bonuses policies
DROP POLICY IF EXISTS "Users can view all daily login bonuses" ON daily_login_bonuses;
DROP POLICY IF EXISTS "Users can insert their own daily login bonuses" ON daily_login_bonuses;
DROP POLICY IF EXISTS "Service role can manage all daily login bonuses" ON daily_login_bonuses;

CREATE POLICY "Users can view all daily login bonuses" ON daily_login_bonuses
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own daily login bonuses" ON daily_login_bonuses
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can manage all daily login bonuses" ON daily_login_bonuses
  FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- 7. CREATE HELPER FUNCTIONS
-- =====================================================

-- Function to calculate user level from XP
CREATE OR REPLACE FUNCTION calculate_user_level(total_xp INTEGER)
RETURNS INTEGER AS $$
BEGIN
  RETURN FLOOR(total_xp / 1000) + 1;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user can claim daily login bonus
CREATE OR REPLACE FUNCTION can_claim_daily_login(user_wallet_address TEXT, check_date DATE DEFAULT CURRENT_DATE)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM daily_login_bonuses 
    WHERE daily_login_bonuses.wallet_address = user_wallet_address 
    AND daily_login_bonuses.login_date = check_date
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get user's XP bounty history
CREATE OR REPLACE FUNCTION get_user_xp_history(user_wallet_address TEXT, limit_count INTEGER DEFAULT 50)
RETURNS TABLE (
  id UUID,
  xp_amount INTEGER,
  bounty_type TEXT,
  reason TEXT,
  awarded_by TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    xb.id,
    xb.xp_amount,
    xb.bounty_type,
    xb.reason,
    xb.awarded_by,
    xb.created_at
  FROM xp_bounties xb
  WHERE xb.wallet_address = user_wallet_address
  ORDER BY xb.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 8. GRANT PERMISSIONS
-- =====================================================

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION calculate_user_level(INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION can_claim_daily_login(TEXT, DATE) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_user_xp_history(TEXT, INTEGER) TO anon, authenticated;

-- =====================================================
-- 9. INSERT SAMPLE DATA (OPTIONAL)
-- =====================================================

-- Insert some sample course XP rewards
INSERT INTO xp_bounties (wallet_address, xp_amount, bounty_type, reason, awarded_by, metadata) VALUES
('sample_wallet_1', 100, 'course', 'Completed Wallet Wizardry course', 'system', '{"course_id": "wallet-wizardry"}'),
('sample_wallet_1', 5, 'daily', 'Daily login bonus', 'system', '{"login_date": "2024-01-01"}'),
('sample_wallet_2', 50, 'admin', 'Admin bonus for participation', 'admin_wallet', '{"admin_note": "Great participation in community"}')
ON CONFLICT DO NOTHING;

-- =====================================================
-- 10. VERIFY SETUP
-- =====================================================

-- Test the functions
SELECT calculate_user_level(1500); -- Should return 2
SELECT can_claim_daily_login('test_wallet'); -- Should return true if no bonus claimed today

-- Show table structures
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('users', 'course_completions', 'user_activity', 'xp_bounties', 'daily_login_bonuses')
ORDER BY table_name, ordinal_position;

COMMENT ON TABLE xp_bounties IS 'Tracks all XP awards given to users';
COMMENT ON TABLE daily_login_bonuses IS 'Tracks daily login bonus claims to prevent duplicates';
COMMENT ON TABLE course_completions IS 'Tracks course completions and XP earned';
COMMENT ON TABLE user_activity IS 'General user activity logging';
