-- =====================================================
-- RUN THIS FIRST - Complete Setup for Hoodie Academy
-- =====================================================
-- This ensures all tables and columns exist before running other migrations

-- =====================================================
-- 1. ENABLE UUID EXTENSION
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 2. CREATE OR UPDATE USERS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT UNIQUE NOT NULL,
  display_name TEXT,
  username TEXT,
  total_xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  profile_picture TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add squad columns if they don't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS squad TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS squad_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS squad_selected_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS squad_lock_end_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS squad_change_count INTEGER DEFAULT 0;

-- Add user status flags if they don't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS placement_test_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS placement_test_completed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_setup_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_setup_completed_at TIMESTAMP WITH TIME ZONE;

-- Create indexes on users table
CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_squad ON users(squad);
CREATE INDEX IF NOT EXISTS idx_users_squad_lock ON users(squad_lock_end_date);
CREATE INDEX IF NOT EXISTS idx_users_xp ON users(total_xp);
CREATE INDEX IF NOT EXISTS idx_users_level ON users(level);

-- =====================================================
-- 3. CREATE COURSE PROGRESS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS course_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT NOT NULL,
  course_slug TEXT NOT NULL,
  lesson_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  completion_percentage INTEGER DEFAULT 0,
  total_lessons INTEGER DEFAULT 0,
  completed_lessons INTEGER DEFAULT 0,
  last_lesson_index INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(wallet_address, course_slug)
);

-- Add columns if they don't exist (in case table was created without them)
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'course_progress') THEN
    ALTER TABLE course_progress ADD COLUMN IF NOT EXISTS wallet_address TEXT;
    ALTER TABLE course_progress ADD COLUMN IF NOT EXISTS course_slug TEXT;
    ALTER TABLE course_progress ADD COLUMN IF NOT EXISTS lesson_data JSONB DEFAULT '[]'::jsonb;
    ALTER TABLE course_progress ADD COLUMN IF NOT EXISTS completion_percentage INTEGER DEFAULT 0;
    ALTER TABLE course_progress ADD COLUMN IF NOT EXISTS total_lessons INTEGER DEFAULT 0;
    ALTER TABLE course_progress ADD COLUMN IF NOT EXISTS completed_lessons INTEGER DEFAULT 0;
    ALTER TABLE course_progress ADD COLUMN IF NOT EXISTS last_lesson_index INTEGER DEFAULT 0;
    ALTER TABLE course_progress ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;
    ALTER TABLE course_progress ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    ALTER TABLE course_progress ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- Create indexes on course_progress (only if wallet_address column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'course_progress' AND column_name = 'wallet_address'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_course_progress_wallet ON course_progress(wallet_address);
    CREATE INDEX IF NOT EXISTS idx_course_progress_wallet_course ON course_progress(wallet_address, course_slug);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_course_progress_course ON course_progress(course_slug);
CREATE INDEX IF NOT EXISTS idx_course_progress_completion ON course_progress(completion_percentage);

-- Create update function BEFORE trigger
CREATE OR REPLACE FUNCTION update_course_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS course_progress_updated_at_trigger ON course_progress;
CREATE TRIGGER course_progress_updated_at_trigger
  BEFORE UPDATE ON course_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_course_progress_updated_at();

-- =====================================================
-- 4. CREATE USER FEEDBACK TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS user_feedback_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('bug_report', 'feature_request', 'improvement', 'ui_ux', 'performance')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'approved', 'implemented', 'rejected')),
  wallet_address TEXT NOT NULL,
  upvotes INTEGER DEFAULT 0,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add columns if they don't exist
ALTER TABLE user_feedback_submissions ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE user_feedback_submissions ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE user_feedback_submissions ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE user_feedback_submissions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE user_feedback_submissions ADD COLUMN IF NOT EXISTS wallet_address TEXT;
ALTER TABLE user_feedback_submissions ADD COLUMN IF NOT EXISTS upvotes INTEGER DEFAULT 0;
ALTER TABLE user_feedback_submissions ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE user_feedback_submissions ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE user_feedback_submissions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create indexes on user_feedback_submissions
CREATE INDEX IF NOT EXISTS idx_user_feedback_status ON user_feedback_submissions(status);
CREATE INDEX IF NOT EXISTS idx_user_feedback_category ON user_feedback_submissions(category);
CREATE INDEX IF NOT EXISTS idx_user_feedback_wallet ON user_feedback_submissions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_user_feedback_created_at ON user_feedback_submissions(created_at DESC);

-- =====================================================
-- 5. CREATE FEEDBACK UPDATES TABLE (You Asked We Fixed)
-- =====================================================

CREATE TABLE IF NOT EXISTS feedback_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('bug_fix', 'feature', 'improvement', 'ui_ux', 'performance')),
  status TEXT NOT NULL DEFAULT 'fixed' CHECK (status IN ('fixed', 'in_progress', 'planned')),
  requested_by TEXT,
  fixed_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  upvotes INTEGER DEFAULT 0,
  priority INTEGER DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_feedback_updates_category ON feedback_updates(category);
CREATE INDEX IF NOT EXISTS idx_feedback_updates_status ON feedback_updates(status);
CREATE INDEX IF NOT EXISTS idx_feedback_updates_priority ON feedback_updates(priority DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_updates_date ON feedback_updates(fixed_date DESC);

-- =====================================================
-- 6. CREATE HELPER FUNCTIONS
-- =====================================================

-- Course progress update function
CREATE OR REPLACE FUNCTION update_lesson_progress(
  p_wallet_address TEXT,
  p_course_slug TEXT,
  p_lesson_data JSONB
)
RETURNS course_progress AS $$
DECLARE
  v_result course_progress;
  v_completed_count INTEGER;
  v_total_count INTEGER;
  v_completion_pct INTEGER;
BEGIN
  -- Count completed and total lessons
  SELECT 
    COUNT(*) FILTER (WHERE (value->>'status')::text = 'completed'),
    COUNT(*)
  INTO v_completed_count, v_total_count
  FROM jsonb_array_elements(p_lesson_data);
  
  -- Calculate completion percentage
  IF v_total_count > 0 THEN
    v_completion_pct := (v_completed_count * 100) / v_total_count;
  ELSE
    v_completion_pct := 0;
  END IF;
  
  -- Upsert progress
  INSERT INTO course_progress (
    wallet_address,
    course_slug,
    lesson_data,
    total_lessons,
    completed_lessons,
    completion_percentage,
    completed_at,
    updated_at
  ) VALUES (
    p_wallet_address,
    p_course_slug,
    p_lesson_data,
    v_total_count,
    v_completed_count,
    v_completion_pct,
    CASE WHEN v_completion_pct = 100 THEN NOW() ELSE NULL END,
    NOW()
  )
  ON CONFLICT (wallet_address, course_slug)
  DO UPDATE SET
    lesson_data = EXCLUDED.lesson_data,
    total_lessons = EXCLUDED.total_lessons,
    completed_lessons = EXCLUDED.completed_lessons,
    completion_percentage = EXCLUDED.completion_percentage,
    completed_at = CASE 
      WHEN EXCLUDED.completion_percentage = 100 AND course_progress.completed_at IS NULL 
      THEN NOW() 
      ELSE course_progress.completed_at 
    END,
    updated_at = NOW()
  RETURNING * INTO v_result;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Squad lock check function
CREATE OR REPLACE FUNCTION is_squad_locked(user_wallet TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  lock_date TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT squad_lock_end_date INTO lock_date
  FROM users
  WHERE wallet_address = user_wallet;
  
  IF lock_date IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN NOW() < lock_date;
END;
$$ LANGUAGE plpgsql;

-- Get remaining lock days
CREATE OR REPLACE FUNCTION get_remaining_lock_days(user_wallet TEXT)
RETURNS INTEGER AS $$
DECLARE
  lock_date TIMESTAMP WITH TIME ZONE;
  days_remaining INTEGER;
BEGIN
  SELECT squad_lock_end_date INTO lock_date
  FROM users
  WHERE wallet_address = user_wallet;
  
  IF lock_date IS NULL OR NOW() >= lock_date THEN
    RETURN 0;
  END IF;
  
  days_remaining := CEIL(EXTRACT(EPOCH FROM (lock_date - NOW())) / 86400);
  RETURN days_remaining;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. CREATE ADDITIONAL TRIGGERS (Feedback tables)
-- =====================================================

-- User feedback trigger function and trigger
CREATE OR REPLACE FUNCTION update_user_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_feedback_updated_at_trigger ON user_feedback_submissions;
CREATE TRIGGER user_feedback_updated_at_trigger
  BEFORE UPDATE ON user_feedback_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_feedback_updated_at();

-- Feedback updates trigger
DROP TRIGGER IF EXISTS feedback_updates_updated_at_trigger ON feedback_updates;
CREATE TRIGGER feedback_updates_updated_at_trigger
  BEFORE UPDATE ON feedback_updates
  FOR EACH ROW
  EXECUTE FUNCTION update_user_feedback_updated_at();

-- =====================================================
-- 8. ROW LEVEL SECURITY
-- =====================================================

-- Users table RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own data" ON users;
CREATE POLICY "Users can read own data"
  ON users FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can update own data" ON users;
CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  USING (true);

-- Course progress RLS  
ALTER TABLE course_progress ENABLE ROW LEVEL SECURITY;

-- User feedback RLS
ALTER TABLE user_feedback_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can submit feedback" ON user_feedback_submissions;
CREATE POLICY "Anyone can submit feedback"
  ON user_feedback_submissions FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can view feedback" ON user_feedback_submissions;
CREATE POLICY "Anyone can view feedback"
  ON user_feedback_submissions FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can update feedback" ON user_feedback_submissions;
CREATE POLICY "Admins can update feedback"
  ON user_feedback_submissions FOR UPDATE
  USING (true);

-- Feedback updates RLS
ALTER TABLE feedback_updates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view updates" ON feedback_updates;
CREATE POLICY "Anyone can view updates"
  ON feedback_updates FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Service role can manage updates" ON feedback_updates;
CREATE POLICY "Service role can manage updates"
  ON feedback_updates FOR ALL
  USING (true);

-- =====================================================
-- COMPLETE!
-- =====================================================
-- All tables, functions, triggers, and policies are now set up
-- You can now run the application!

