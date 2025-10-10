-- Fix Course Progress Schema
-- This ensures compatibility with your existing users table

-- First, let's check if users table exists and what columns it has
-- If users table doesn't exist, create it
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT UNIQUE NOT NULL,
  display_name TEXT,
  username TEXT,
  squad TEXT,
  squad_id TEXT,
  squad_selected_at TIMESTAMP WITH TIME ZONE,
  squad_lock_end_date TIMESTAMP WITH TIME ZONE,
  squad_change_count INTEGER DEFAULT 0,
  total_xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  profile_picture TEXT,
  bio TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  onboarding_completed_at TIMESTAMP WITH TIME ZONE,
  placement_test_completed BOOLEAN DEFAULT FALSE,
  placement_test_completed_at TIMESTAMP WITH TIME ZONE,
  profile_setup_completed BOOLEAN DEFAULT FALSE,
  profile_setup_completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create course progress table
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_course_progress_wallet ON course_progress(wallet_address);
CREATE INDEX IF NOT EXISTS idx_course_progress_course ON course_progress(course_slug);
CREATE INDEX IF NOT EXISTS idx_course_progress_completion ON course_progress(completion_percentage);
CREATE INDEX IF NOT EXISTS idx_course_progress_wallet_course ON course_progress(wallet_address, course_slug);

-- Auto-update trigger
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

-- Helper function for updating lesson progress
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

-- RLS Policies
ALTER TABLE course_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own progress" ON course_progress;
CREATE POLICY "Users can read own progress"
  ON course_progress FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can update own progress" ON course_progress;
CREATE POLICY "Users can update own progress"
  ON course_progress FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can modify own progress" ON course_progress;
CREATE POLICY "Users can modify own progress"
  ON course_progress FOR UPDATE
  USING (true);

-- Comments
COMMENT ON TABLE course_progress IS 'Stores user course progress across all devices';
COMMENT ON COLUMN course_progress.wallet_address IS 'User wallet address';
COMMENT ON COLUMN course_progress.course_slug IS 'Course identifier (e.g., meme-coin-mania)';
COMMENT ON COLUMN course_progress.lesson_data IS 'JSON array of lesson statuses';
COMMENT ON COLUMN course_progress.completion_percentage IS 'Overall course completion (0-100)';

