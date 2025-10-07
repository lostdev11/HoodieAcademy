-- Ensure User Tracking Tables Exist
-- This script creates all necessary tables for wallet-based user tracking
-- Run this in your Supabase SQL editor

-- =====================================================
-- 1. USERS TABLE (Core user data)
-- =====================================================

CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT UNIQUE NOT NULL,
  display_name TEXT,
  squad TEXT,
  profile_completed BOOLEAN DEFAULT false,
  squad_test_completed BOOLEAN DEFAULT false,
  placement_test_completed BOOLEAN DEFAULT false,
  is_admin BOOLEAN DEFAULT false,
  last_active TIMESTAMPTZ,
  last_seen TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  username TEXT,
  bio TEXT,
  profile_picture TEXT,
  total_xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  xp_total INTEGER DEFAULT 0
);

-- Create indexes for users
CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_squad ON users(squad);
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin);
CREATE INDEX IF NOT EXISTS idx_users_last_active ON users(last_active);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Enable RLS for users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies for users (more permissive for user creation)
CREATE POLICY "Users can view all user profiles" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.jwt() ->> 'wallet_address' = wallet_address);

CREATE POLICY "Users can insert their own profile" ON users
  FOR INSERT WITH CHECK (auth.jwt() ->> 'wallet_address' = wallet_address);

-- Allow service role to manage all users (for API endpoints)
CREATE POLICY "Service role can manage all users" ON users
  FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- 2. USER ACTIVITY TABLE
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

-- Allow service role to manage all activity
CREATE POLICY "Service role can manage all activity" ON user_activity
  FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- 3. WALLET CONNECTIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS wallet_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  connection_type TEXT NOT NULL,
  provider TEXT DEFAULT 'phantom',
  user_agent TEXT,
  ip_address TEXT,
  verification_result JSONB DEFAULT '{}',
  session_data JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  disconnected_at TIMESTAMPTZ,
  notes TEXT
);

-- Create indexes for wallet_connections
CREATE INDEX IF NOT EXISTS idx_wallet_connections_wallet_address ON wallet_connections(wallet_address);
CREATE INDEX IF NOT EXISTS idx_wallet_connections_connected_at ON wallet_connections(connected_at);
CREATE INDEX IF NOT EXISTS idx_wallet_connections_type ON wallet_connections(connection_type);
CREATE INDEX IF NOT EXISTS idx_wallet_connections_provider ON wallet_connections(provider);

-- Enable RLS for wallet_connections
ALTER TABLE wallet_connections ENABLE ROW LEVEL SECURITY;

-- Create policies for wallet_connections
CREATE POLICY "Users can view all wallet connections" ON wallet_connections
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own connections" ON wallet_connections
  FOR INSERT WITH CHECK (auth.jwt() ->> 'wallet_address' = wallet_address);

-- Allow service role to manage all connections
CREATE POLICY "Service role can manage all connections" ON wallet_connections
  FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- 4. USER XP TABLE (Optional - for XP tracking)
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
CREATE POLICY "Users can view all XP" ON user_xp
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own XP" ON user_xp
  FOR UPDATE USING (auth.jwt() ->> 'wallet_address' = wallet_address);

CREATE POLICY "Users can insert their own XP" ON user_xp
  FOR INSERT WITH CHECK (auth.jwt() ->> 'wallet_address' = wallet_address);

-- Allow service role to manage all XP
CREATE POLICY "Service role can manage all XP" ON user_xp
  FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- 5. CREATE HELPER FUNCTIONS
-- =====================================================

-- Function to check if a wallet is admin
CREATE OR REPLACE FUNCTION is_wallet_admin(wallet TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE wallet_address = wallet 
    AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user count
CREATE OR REPLACE FUNCTION get_user_count()
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM users);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get active user count (last 24 hours)
CREATE OR REPLACE FUNCTION get_active_user_count()
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*) FROM users 
    WHERE last_active > NOW() - INTERVAL '24 hours'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. CREATE VIEWS FOR ADMIN DASHBOARD
-- =====================================================

-- View for user summary with activity
CREATE OR REPLACE VIEW user_summary AS
SELECT 
  u.*,
  COUNT(ua.id) as activity_count,
  COUNT(wc.id) as connection_count,
  MAX(ua.created_at) as last_activity,
  MAX(wc.connected_at) as last_connection
FROM users u
LEFT JOIN user_activity ua ON u.wallet_address = ua.wallet_address
LEFT JOIN wallet_connections wc ON u.wallet_address = wc.wallet_address
GROUP BY u.id, u.wallet_address, u.display_name, u.squad, u.profile_completed, 
         u.squad_test_completed, u.placement_test_completed, u.is_admin, 
         u.last_active, u.last_seen, u.created_at, u.updated_at, u.username, 
         u.bio, u.profile_picture, u.total_xp, u.level, u.xp_total;

-- View for wallet connections summary
CREATE OR REPLACE VIEW wallet_connections_summary AS
SELECT 
  wallet_address,
  COUNT(*) as total_connections,
  MAX(connected_at) as last_connection,
  MIN(connected_at) as first_connection,
  COUNT(CASE WHEN connection_type = 'connect' THEN 1 END) as successful_connections,
  COUNT(CASE WHEN connection_type = 'disconnect' THEN 1 END) as disconnections,
  COUNT(CASE WHEN connection_type = 'verification_success' THEN 1 END) as successful_verifications,
  COUNT(CASE WHEN connection_type = 'verification_failed' THEN 1 END) as failed_verifications
FROM wallet_connections
GROUP BY wallet_address
ORDER BY last_connection DESC;

-- =====================================================
-- 7. INSERT SAMPLE DATA (Optional)
-- =====================================================

-- Insert a sample admin user if none exists
INSERT INTO users (wallet_address, display_name, is_admin, last_active, created_at, updated_at)
SELECT 'JCUGres3WA8MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU', 'Admin User', true, NOW(), NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE wallet_address = 'JCUGres3WA8MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU');

-- =====================================================
-- 8. GRANT PERMISSIONS
-- =====================================================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON users TO authenticated;
GRANT SELECT, INSERT ON user_activity TO authenticated;
GRANT SELECT, INSERT ON wallet_connections TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_xp TO authenticated;

-- Grant permissions to service role
GRANT ALL ON users TO service_role;
GRANT ALL ON user_activity TO service_role;
GRANT ALL ON wallet_connections TO service_role;
GRANT ALL ON user_xp TO service_role;

-- Grant permissions on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION is_wallet_admin(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION is_wallet_admin(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION get_user_count() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_count() TO service_role;
GRANT EXECUTE ON FUNCTION get_active_user_count() TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_user_count() TO service_role;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

-- This script has completed successfully!
-- All necessary tables for wallet-based user tracking have been created.
-- The system will now automatically track all wallet connections and create user records.
