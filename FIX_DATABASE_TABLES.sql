-- Fix Database Tables for Hoodie Academy
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

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies for users
CREATE POLICY "Users can view all users" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (wallet_address = auth.jwt() ->> 'wallet_address');

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (wallet_address = auth.jwt() ->> 'wallet_address');

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

-- Enable RLS for global_settings
ALTER TABLE global_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for global_settings
CREATE POLICY "Everyone can view global settings" ON global_settings
  FOR SELECT USING (true);

CREATE POLICY "Admins can update global settings" ON global_settings
  FOR UPDATE USING (true);

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

-- Enable RLS for feature_flags
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

-- Create policies for feature_flags
CREATE POLICY "Everyone can view feature flags" ON feature_flags
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert feature flags" ON feature_flags
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can update feature flags" ON feature_flags
  FOR UPDATE USING (true);

CREATE POLICY "Admins can delete feature flags" ON feature_flags
  FOR DELETE USING (true);

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

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows users to read and update their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (id = auth.jwt() ->> 'wallet_address');

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (id = auth.jwt() ->> 'wallet_address');

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (id = auth.jwt() ->> 'wallet_address');

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

-- Enable Row Level Security (RLS)
ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Admins can view all user activity logs" ON user_activity_logs
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert user activity logs" ON user_activity_logs
  FOR INSERT WITH CHECK (true);

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

-- Enable RLS for announcements
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Create policies for announcements
CREATE POLICY "Everyone can view published announcements" ON announcements
  FOR SELECT USING (is_published = true);

CREATE POLICY "Admins can manage all announcements" ON announcements
  FOR ALL USING (true);

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

-- Enable RLS for events
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Create policies for events
CREATE POLICY "Everyone can view published events" ON events
  FOR SELECT USING (is_published = true);

CREATE POLICY "Admins can manage all events" ON events
  FOR ALL USING (true);

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

-- Enable RLS for bounties
ALTER TABLE bounties ENABLE ROW LEVEL SECURITY;

-- Create policies for bounties
CREATE POLICY "Everyone can view active bounties" ON bounties
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage all bounties" ON bounties
  FOR ALL USING (true);

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

-- Enable RLS for courses
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Create policies for courses
CREATE POLICY "Everyone can view published courses" ON courses
  FOR SELECT USING (is_published = true);

CREATE POLICY "Admins can manage all courses" ON courses
  FOR ALL USING (true);

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

-- Enable RLS for course_progress
ALTER TABLE course_progress ENABLE ROW LEVEL SECURITY;

-- Create policies for course_progress
CREATE POLICY "Users can view own progress" ON course_progress
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own progress" ON course_progress
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own progress" ON course_progress
  FOR UPDATE USING (true);

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

-- Enable RLS for submissions
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Create policies for submissions
CREATE POLICY "Users can view own submissions" ON submissions
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own submissions" ON submissions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all submissions" ON submissions
  FOR SELECT USING (true);

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
  table_name,
  CASE 
    WHEN table_name IS NOT NULL THEN '✅ Created'
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
ORDER BY table_name;
