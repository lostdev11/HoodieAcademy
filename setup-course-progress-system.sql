-- Course Progress System - Global Cross-Device Progress Tracking
-- This enables users to access their course progress from any device

-- =====================================================
-- COURSE PROGRESS TABLE
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

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_course_progress_wallet ON course_progress(wallet_address);
CREATE INDEX IF NOT EXISTS idx_course_progress_course ON course_progress(course_slug);
CREATE INDEX IF NOT EXISTS idx_course_progress_completion ON course_progress(completion_percentage);
CREATE INDEX IF NOT EXISTS idx_course_progress_wallet_course ON course_progress(wallet_address, course_slug);

-- Auto-update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_course_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS course_progress_updated_at_trigger ON course_progress;
CREATE TRIGGER course_progress_updated_at_trigger
  BEFORE UPDATE ON course_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_course_progress_updated_at();

-- =====================================================
-- USER STATUS FLAGS
-- =====================================================

-- Add user status columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS placement_test_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS placement_test_completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS profile_setup_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS profile_setup_completed_at TIMESTAMP WITH TIME ZONE;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_onboarding ON users(onboarding_completed);
CREATE INDEX IF NOT EXISTS idx_users_placement ON users(placement_test_completed);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to update lesson progress
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
    COUNT(*) FILTER (WHERE value->>'status' = 'completed'),
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

-- Function to get user's total course completion
CREATE OR REPLACE FUNCTION get_user_total_completion(p_wallet_address TEXT)
RETURNS TABLE(
  total_courses INTEGER,
  completed_courses INTEGER,
  in_progress_courses INTEGER,
  overall_completion_pct NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_courses,
    COUNT(*) FILTER (WHERE completion_percentage = 100)::INTEGER as completed_courses,
    COUNT(*) FILTER (WHERE completion_percentage > 0 AND completion_percentage < 100)::INTEGER as in_progress_courses,
    COALESCE(AVG(completion_percentage), 0)::NUMERIC as overall_completion_pct
  FROM course_progress
  WHERE wallet_address = p_wallet_address;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE course_progress ENABLE ROW LEVEL SECURITY;

-- Users can read their own progress
DROP POLICY IF EXISTS "Users can read own progress" ON course_progress;
CREATE POLICY "Users can read own progress"
  ON course_progress FOR SELECT
  USING (true);

-- Users can insert/update their own progress
DROP POLICY IF EXISTS "Users can update own progress" ON course_progress;
CREATE POLICY "Users can update own progress"
  ON course_progress FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can modify own progress" ON course_progress;
CREATE POLICY "Users can modify own progress"
  ON course_progress FOR UPDATE
  USING (true);

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE course_progress IS 'Stores user course progress across all devices';
COMMENT ON COLUMN course_progress.wallet_address IS 'User wallet address';
COMMENT ON COLUMN course_progress.course_slug IS 'Course identifier (e.g., meme-coin-mania)';
COMMENT ON COLUMN course_progress.lesson_data IS 'JSON array of lesson statuses [{"index": 0, "status": "completed"}, ...]';
COMMENT ON COLUMN course_progress.completion_percentage IS 'Overall course completion (0-100)';
COMMENT ON COLUMN course_progress.completed_at IS 'When course was 100% completed';

COMMENT ON COLUMN users.onboarding_completed IS 'Whether user completed onboarding flow';
COMMENT ON COLUMN users.placement_test_completed IS 'Whether user completed placement/squad test';
COMMENT ON COLUMN users.profile_setup_completed IS 'Whether user set up their profile';

-- =====================================================
-- SAMPLE QUERIES
-- =====================================================

-- Get user's course progress
-- SELECT * FROM course_progress WHERE wallet_address = '0x...';

-- Get user's completion stats
-- SELECT * FROM get_user_total_completion('0x...');

-- Get all users who completed a specific course
-- SELECT wallet_address, completed_at 
-- FROM course_progress 
-- WHERE course_slug = 'meme-coin-mania' AND completion_percentage = 100;

-- Get course completion rates
-- SELECT 
--   course_slug,
--   COUNT(*) as total_users,
--   COUNT(*) FILTER (WHERE completion_percentage = 100) as completed_users,
--   AVG(completion_percentage) as avg_completion
-- FROM course_progress
-- GROUP BY course_slug
-- ORDER BY avg_completion DESC;

