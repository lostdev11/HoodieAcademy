-- Fix Database Schema for Hoodie Academy
-- This script will create missing tables and add missing columns

-- =====================================================
-- 1. UPDATE USERS TABLE - Add missing columns
-- =====================================================

-- Add missing columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS squad_test_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS placement_test_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS profile_picture TEXT,
ADD COLUMN IF NOT EXISTS username TEXT;

-- Update existing users to have last_seen = last_active
UPDATE users 
SET last_seen = last_active 
WHERE last_seen IS NULL AND last_active IS NOT NULL;

-- =====================================================
-- 2. CREATE USER XP TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS user_xp (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT UNIQUE NOT NULL,
  total_xp INTEGER DEFAULT 0,
  bounty_xp INTEGER DEFAULT 0,
  course_xp INTEGER DEFAULT 0,
  streak_xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for user_xp
CREATE INDEX IF NOT EXISTS idx_user_xp_wallet_address ON user_xp(wallet_address);
CREATE INDEX IF NOT EXISTS idx_user_xp_total_xp ON user_xp(total_xp);
CREATE INDEX IF NOT EXISTS idx_user_xp_level ON user_xp(level);

-- Enable RLS for user_xp
ALTER TABLE user_xp ENABLE ROW LEVEL SECURITY;

-- Create policies for user_xp
CREATE POLICY "Users can view all XP data" ON user_xp
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own XP" ON user_xp
  FOR UPDATE USING (auth.jwt() ->> 'wallet_address' = wallet_address);

CREATE POLICY "Users can insert their own XP" ON user_xp
  FOR INSERT WITH CHECK (auth.jwt() ->> 'wallet_address' = wallet_address);

-- =====================================================
-- 3. CREATE USER ACTIVITY TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS user_activity (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  activity_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for user_activity
CREATE INDEX IF NOT EXISTS idx_user_activity_wallet_address ON user_activity(wallet_address);
CREATE INDEX IF NOT EXISTS idx_user_activity_type ON user_activity(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_created_at ON user_activity(created_at);

-- Enable RLS for user_activity
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;

-- Create policies for user_activity
CREATE POLICY "Users can view all activity" ON user_activity
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own activity" ON user_activity
  FOR INSERT WITH CHECK (auth.jwt() ->> 'wallet_address' = wallet_address);

-- =====================================================
-- 4. CREATE WALLET CONNECTIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS wallet_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  connection_type TEXT NOT NULL,
  device_info JSONB DEFAULT '{}',
  session_data JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  disconnected_at TIMESTAMPTZ
);

-- Create indexes for wallet_connections
CREATE INDEX IF NOT EXISTS idx_wallet_connections_wallet_address ON wallet_connections(wallet_address);
CREATE INDEX IF NOT EXISTS idx_wallet_connections_connected_at ON wallet_connections(connected_at);

-- Enable RLS for wallet_connections
ALTER TABLE wallet_connections ENABLE ROW LEVEL SECURITY;

-- Create policies for wallet_connections
CREATE POLICY "Users can view all wallet connections" ON wallet_connections
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own connections" ON wallet_connections
  FOR INSERT WITH CHECK (auth.jwt() ->> 'wallet_address' = wallet_address);

-- =====================================================
-- 5. CREATE ADMIN FUNCTIONS
-- =====================================================

-- Function to check if wallet is admin
CREATE OR REPLACE FUNCTION is_wallet_admin(wallet TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if wallet is in admin list
  RETURN wallet IN (
    'JCUGres3WA8MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU',
    'qg7pNNZq7qDQuc6Xkd1x4NvS2VM3aHtCqHEzucZxRGA',
    '7vswdZFphxbtd1tCB5EhLNn2khiDiKmQEehSNUFHjz7M',
    '63B9jg8iBy9pf4W4VDizbQnBD45QujmzbHyGRtHxknr7'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user stats for admin dashboard
CREATE OR REPLACE FUNCTION get_user_stats()
RETURNS TABLE (
  total_users BIGINT,
  total_xp BIGINT,
  avg_level NUMERIC,
  total_submissions BIGINT,
  pending_submissions BIGINT,
  total_connections BIGINT,
  verified_nfts BIGINT,
  active_users BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COALESCE(SUM(total_xp), 0) FROM user_xp) as total_xp,
    (SELECT COALESCE(AVG(level), 0) FROM user_xp) as avg_level,
    (SELECT COUNT(*) FROM user_activity WHERE activity_type = 'bounty_submission') as total_submissions,
    (SELECT COUNT(*) FROM user_activity WHERE activity_type = 'bounty_submission' AND metadata->>'status' = 'pending') as pending_submissions,
    (SELECT COUNT(*) FROM wallet_connections) as total_connections,
    (SELECT COUNT(*) FROM users WHERE profile_completed = true) as verified_nfts,
    (SELECT COUNT(*) FROM users WHERE last_active > NOW() - INTERVAL '24 hours') as active_users;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. GRANT PERMISSIONS
-- =====================================================

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION is_wallet_admin(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_stats() TO authenticated;

-- =====================================================
-- 7. INSERT SAMPLE DATA (Optional)
-- =====================================================

-- Insert a test user for testing
INSERT INTO users (wallet_address, display_name, squad, profile_completed, last_active, last_seen)
VALUES (
  'TEST_WALLET_123456789',
  'Test User',
  'Alpha',
  true,
  NOW(),
  NOW()
) ON CONFLICT (wallet_address) DO NOTHING;

-- Insert corresponding XP record
INSERT INTO user_xp (wallet_address, total_xp, bounty_xp, course_xp, level)
VALUES (
  'TEST_WALLET_123456789',
  100,
  50,
  50,
  2
) ON CONFLICT (wallet_address) DO NOTHING;

-- Insert sample activity
INSERT INTO user_activity (wallet_address, activity_type, metadata)
VALUES (
  'TEST_WALLET_123456789',
  'wallet_connected',
  '{"test": true, "source": "database_setup"}'
) ON CONFLICT DO NOTHING;
