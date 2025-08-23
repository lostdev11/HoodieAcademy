-- Simplified Database Tables Setup for Hoodie Academy
-- Run this in your Supabase SQL editor to resolve 404/500 errors

-- =====================================================
-- 1. USERS TABLE (if not exists)
-- =====================================================

CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT UNIQUE NOT NULL,
  display_name TEXT,
  squad TEXT,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_squad ON users(squad);
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin);

-- =====================================================
-- 2. GLOBAL SETTINGS TABLE (if not exists)
-- =====================================================

CREATE TABLE IF NOT EXISTS global_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  site_maintenance BOOLEAN DEFAULT false,
  registration_enabled BOOLEAN DEFAULT true,
  course_submissions_enabled BOOLEAN DEFAULT true,
  bounty_submissions_enabled BOOLEAN DEFAULT true,
  chat_enabled BOOLEAN DEFAULT true,
  leaderboard_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID
);

-- Insert default global settings if table is empty
INSERT INTO global_settings (id, site_maintenance, registration_enabled, course_submissions_enabled, bounty_submissions_enabled, chat_enabled, leaderboard_enabled)
VALUES (
  gen_random_uuid(),
  false,
  true,
  true,
  true,
  true,
  true
)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 3. FEATURE FLAGS TABLE (if not exists)
-- =====================================================

CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  enabled BOOLEAN DEFAULT false,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID
);

-- Insert some default feature flags
INSERT INTO feature_flags (key, enabled, description) VALUES
  ('retailstar_rewards', true, 'Enable RetailStar rewards system'),
  ('bounty_xp', true, 'Enable bounty XP system'),
  ('squad_chat', true, 'Enable squad chat functionality'),
  ('leaderboard', true, 'Enable leaderboard system'),
  ('achievements', true, 'Enable achievement system')
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- 4. PROFILES TABLE (if not exists)
-- =====================================================

CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY, -- Using TEXT to match wallet addresses
  pfp_url TEXT,
  pfp_asset_id TEXT,
  pfp_last_verified TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);
CREATE INDEX IF NOT EXISTS idx_profiles_pfp_asset_id ON profiles(pfp_asset_id);

-- =====================================================
-- 5. USER ACTIVITY LOGS TABLE (if not exists)
-- =====================================================

CREATE TABLE IF NOT EXISTS user_activity_logs (
  id SERIAL PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  activity_type TEXT NOT NULL,
  activity_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_agent TEXT,
  ip_address TEXT,
  profile_data JSONB,
  course_data JSONB,
  wallet_data JSONB,
  achievement_data JSONB,
  session_data JSONB,
  metadata JSONB,
  notes TEXT,
  display_name TEXT GENERATED ALWAYS AS (profile_data->>'display_name') STORED,
  squad TEXT GENERATED ALWAYS AS (profile_data->>'squad') STORED,
  course_id TEXT GENERATED ALWAYS AS (course_data->>'course_id') STORED
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_activity_wallet_address ON user_activity_logs(wallet_address);
CREATE INDEX IF NOT EXISTS idx_user_activity_timestamp ON user_activity_logs(activity_timestamp);
CREATE INDEX IF NOT EXISTS idx_user_activity_type ON user_activity_logs(activity_type);

-- =====================================================
-- 6. ANNOUNCEMENTS TABLE (if not exists)
-- =====================================================

CREATE TABLE IF NOT EXISTS announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  is_published BOOLEAN DEFAULT false,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID
);

-- =====================================================
-- 7. EVENTS TABLE (if not exists)
-- =====================================================

CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 8. BOUNTIES TABLE (if not exists)
-- =====================================================

CREATE TABLE IF NOT EXISTS bounties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  reward_amount INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 9. COURSES TABLE (if not exists)
-- =====================================================

CREATE TABLE IF NOT EXISTS courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  content JSONB,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 10. COURSE PROGRESS TABLE (if not exists)
-- =====================================================

CREATE TABLE IF NOT EXISTS course_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  course_id UUID NOT NULL,
  progress_percentage INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

-- =====================================================
-- 11. SUBMISSIONS TABLE (if not exists)
-- =====================================================

CREATE TABLE IF NOT EXISTS submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  course_id UUID NOT NULL,
  content TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 12. CREATE TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for all tables with updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_global_settings_updated_at
    BEFORE UPDATE ON global_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feature_flags_updated_at
    BEFORE UPDATE ON feature_flags
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_announcements_updated_at
    BEFORE UPDATE ON announcements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bounties_updated_at
    BEFORE UPDATE ON bounties
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at
    BEFORE UPDATE ON courses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_course_progress_updated_at
    BEFORE UPDATE ON course_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_submissions_updated_at
    BEFORE UPDATE ON submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 13. VERIFY TABLES CREATED
-- =====================================================

-- Check if tables exist
SELECT 
  expected_tables.table_name,
  CASE 
    WHEN ist.table_name IS NOT NULL THEN '✅ Created'
    ELSE '❌ Missing'
  END as status
FROM (
  VALUES 
    ('users'),
    ('global_settings'),
    ('feature_flags'),
    ('profiles'),
    ('user_activity_logs'),
    ('announcements'),
    ('events'),
    ('bounties'),
    ('courses'),
    ('course_progress'),
    ('submissions')
) AS expected_tables(table_name)
LEFT JOIN information_schema.tables ist 
  ON ist.table_name = expected_tables.table_name 
  AND ist.table_schema = 'public'
ORDER BY expected_tables.table_name;

-- =====================================================
-- 14. TEST DATA INSERTION
-- =====================================================

-- Test inserting a sample user
INSERT INTO users (wallet_address, display_name, squad, is_admin) 
VALUES ('test-wallet-123', 'Test User', 'raiders', false)
ON CONFLICT (wallet_address) DO NOTHING;

-- Test querying global settings
SELECT 'Global Settings Test' as test_name, COUNT(*) as count FROM global_settings;

-- Test querying feature flags
SELECT 'Feature Flags Test' as test_name, COUNT(*) as count FROM feature_flags;
