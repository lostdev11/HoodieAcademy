-- User Tracking Schema for Hoodie Academy
-- This schema provides comprehensive user tracking based on wallet connections and squad placement

-- =====================================================
-- 1. USERS TABLE (Enhanced)
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
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for users
CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_squad ON users(squad);
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin);
CREATE INDEX IF NOT EXISTS idx_users_last_active ON users(last_active);

-- Enable RLS for users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies for users
CREATE POLICY "Users can view all user profiles" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.jwt() ->> 'wallet_address' = wallet_address);

CREATE POLICY "Users can insert their own profile" ON users
  FOR INSERT WITH CHECK (auth.jwt() ->> 'wallet_address' = wallet_address);

-- =====================================================
-- 2. USER XP TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS user_xp (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT UNIQUE NOT NULL,
  total_xp INTEGER DEFAULT 0,
  bounty_xp INTEGER DEFAULT 0,
  course_xp INTEGER DEFAULT 0,
  streak_xp INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for user_xp
CREATE INDEX IF NOT EXISTS idx_user_xp_wallet ON user_xp(wallet_address);
CREATE INDEX IF NOT EXISTS idx_user_xp_total ON user_xp(total_xp);

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
-- 3. USER ACTIVITY TABLE
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
CREATE INDEX IF NOT EXISTS idx_user_activity_created ON user_activity(created_at);

-- Enable RLS for user_activity
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;

-- Create policies for user_activity
CREATE POLICY "Users can view all activity" ON user_activity
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own activity" ON user_activity
  FOR INSERT WITH CHECK (auth.jwt() ->> 'wallet_address' = wallet_address);

-- =====================================================
-- 4. PLACEMENT TESTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS placement_tests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  squad TEXT NOT NULL,
  score INTEGER,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for placement_tests
CREATE INDEX IF NOT EXISTS idx_placement_tests_wallet ON placement_tests(wallet_address);
CREATE INDEX IF NOT EXISTS idx_placement_tests_squad ON placement_tests(squad);
CREATE INDEX IF NOT EXISTS idx_placement_tests_completed ON placement_tests(completed_at);

-- Enable RLS for placement_tests
ALTER TABLE placement_tests ENABLE ROW LEVEL SECURITY;

-- Create policies for placement_tests
CREATE POLICY "Users can view all placement tests" ON placement_tests
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own placement tests" ON placement_tests
  FOR INSERT WITH CHECK (auth.jwt() ->> 'wallet_address' = wallet_address);

-- =====================================================
-- 5. SUBMISSIONS TABLE (Enhanced)
-- =====================================================

CREATE TABLE IF NOT EXISTS submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  squad TEXT,
  course_ref TEXT,
  bounty_id TEXT,
  wallet_address TEXT NOT NULL,
  image_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  upvotes JSONB DEFAULT '{}',
  total_upvotes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for submissions
CREATE INDEX IF NOT EXISTS idx_submissions_wallet_address ON submissions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_submissions_bounty_id ON submissions(bounty_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON submissions(created_at);
CREATE INDEX IF NOT EXISTS idx_submissions_squad ON submissions(squad);

-- Enable RLS for submissions
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Create policies for submissions
CREATE POLICY "Users can view all submissions" ON submissions
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own submissions" ON submissions
  FOR INSERT WITH CHECK (auth.jwt() ->> 'wallet_address' = wallet_address);

CREATE POLICY "Users can update their own submissions" ON submissions
  FOR UPDATE USING (auth.jwt() ->> 'wallet_address' = wallet_address);

-- =====================================================
-- 6. BOUNTY SUBMISSIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS bounty_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  bounty_id TEXT NOT NULL,
  submission_id TEXT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  xp_awarded INTEGER DEFAULT 0,
  placement TEXT CHECK (placement IN ('first', 'second', 'third')),
  sol_prize DECIMAL(10, 8) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(wallet_address, bounty_id, submission_id)
);

-- Create indexes for bounty_submissions
CREATE INDEX IF NOT EXISTS idx_bounty_submissions_wallet ON bounty_submissions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_bounty_submissions_bounty ON bounty_submissions(bounty_id);
CREATE INDEX IF NOT EXISTS idx_bounty_submissions_placement ON bounty_submissions(placement);
CREATE INDEX IF NOT EXISTS idx_bounty_submissions_created ON bounty_submissions(created_at);

-- Enable RLS for bounty_submissions
ALTER TABLE bounty_submissions ENABLE ROW LEVEL SECURITY;

-- Create policies for bounty_submissions
CREATE POLICY "Users can view all bounty submissions" ON bounty_submissions
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own bounty submissions" ON bounty_submissions
  FOR INSERT WITH CHECK (auth.jwt() ->> 'wallet_address' = wallet_address);

CREATE POLICY "Admins can update bounty submissions" ON bounty_submissions
  FOR UPDATE USING (auth.jwt() ->> 'is_admin' = 'true');

-- =====================================================
-- 7. COURSE COMPLETIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS course_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  course_id TEXT NOT NULL,
  course_title TEXT,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  xp_awarded INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for course_completions
CREATE INDEX IF NOT EXISTS idx_course_completions_wallet ON course_completions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_course_completions_course ON course_completions(course_id);
CREATE INDEX IF NOT EXISTS idx_course_completions_completed ON course_completions(completed_at);

-- Enable RLS for course_completions
ALTER TABLE course_completions ENABLE ROW LEVEL SECURITY;

-- Create policies for course_completions
CREATE POLICY "Users can view all course completions" ON course_completions
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own course completions" ON course_completions
  FOR INSERT WITH CHECK (auth.jwt() ->> 'wallet_address' = wallet_address);

-- =====================================================
-- 8. TRIGGERS FOR UPDATED_AT
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

CREATE TRIGGER update_user_xp_updated_at 
    BEFORE UPDATE ON user_xp 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_submissions_updated_at 
    BEFORE UPDATE ON submissions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bounty_submissions_updated_at 
    BEFORE UPDATE ON bounty_submissions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 9. FUNCTIONS FOR XP MANAGEMENT
-- =====================================================

-- Function to award bounty XP
CREATE OR REPLACE FUNCTION award_bounty_xp(
  p_wallet_address TEXT,
  p_bounty_id TEXT,
  p_submission_id TEXT,
  p_xp_amount INTEGER
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  -- Insert or update bounty submission
  INSERT INTO bounty_submissions (wallet_address, bounty_id, submission_id, xp_awarded)
  VALUES (p_wallet_address, p_bounty_id, p_submission_id, p_xp_amount)
  ON CONFLICT (wallet_address, bounty_id, submission_id) 
  DO UPDATE SET 
    xp_awarded = EXCLUDED.xp_awarded,
    updated_at = NOW();

  -- Update user XP
  INSERT INTO user_xp (wallet_address, bounty_xp, total_xp)
  VALUES (p_wallet_address, p_xp_amount, p_xp_amount)
  ON CONFLICT (wallet_address)
  DO UPDATE SET 
    bounty_xp = user_xp.bounty_xp + p_xp_amount,
    total_xp = user_xp.total_xp + p_xp_amount,
    updated_at = NOW();

  -- Return success
  result := json_build_object('success', true, 'xp_awarded', p_xp_amount);
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to check if wallet is admin
CREATE OR REPLACE FUNCTION is_wallet_admin(wallet TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE wallet_address = wallet 
    AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 10. SAMPLE DATA (Optional)
-- =====================================================

-- Insert sample admin user
INSERT INTO users (wallet_address, display_name, squad, profile_completed, squad_test_completed, placement_test_completed, is_admin)
VALUES ('JCUGres3WA8MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU', 'Admin User', 'Creators', true, true, true, true)
ON CONFLICT (wallet_address) DO NOTHING;

-- Insert sample user XP
INSERT INTO user_xp (wallet_address, total_xp, bounty_xp, course_xp, streak_xp)
VALUES ('JCUGres3WA8MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU', 100, 50, 30, 20)
ON CONFLICT (wallet_address) DO NOTHING;
