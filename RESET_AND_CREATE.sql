-- RESET AND CREATE - Use this if RUN_THIS_FIRST.sql still has issues
-- This drops problematic tables and recreates them cleanly

-- =====================================================
-- OPTION 1: Drop and recreate course_progress only
-- =====================================================

-- Drop the table and start fresh
DROP TABLE IF EXISTS course_progress CASCADE;

-- Create course_progress table
CREATE TABLE course_progress (
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
CREATE INDEX idx_course_progress_wallet ON course_progress(wallet_address);
CREATE INDEX idx_course_progress_course ON course_progress(course_slug);
CREATE INDEX idx_course_progress_completion ON course_progress(completion_percentage);
CREATE INDEX idx_course_progress_wallet_course ON course_progress(wallet_address, course_slug);

-- Create update function
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

-- Helper function
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
  SELECT 
    COUNT(*) FILTER (WHERE (value->>'status')::text = 'completed'),
    COUNT(*)
  INTO v_completed_count, v_total_count
  FROM jsonb_array_elements(p_lesson_data);
  
  IF v_total_count > 0 THEN
    v_completion_pct := (v_completed_count * 100) / v_total_count;
  ELSE
    v_completion_pct := 0;
  END IF;
  
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

-- =====================================================
-- DONE! course_progress table is now ready
-- =====================================================

