-- =====================================================
-- COURSE EXAM SYSTEM - Complete Setup
-- =====================================================
-- This creates tables for course final exams with admin approval
-- and squad-based access control

-- =====================================================
-- 1. CREATE COURSE_EXAMS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS course_exams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id TEXT NOT NULL,
  course_slug TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  
  -- Exam Configuration
  passing_score INTEGER DEFAULT 70,  -- Minimum percentage to pass
  total_questions INTEGER NOT NULL,
  time_limit_minutes INTEGER,        -- NULL = no time limit
  attempts_allowed INTEGER DEFAULT 3, -- How many times can attempt
  
  -- Squad Restrictions
  squad_restricted BOOLEAN DEFAULT false,
  allowed_squads TEXT[],             -- Array of squad names (e.g., ['Creators', 'Speakers'])
  
  -- Rewards
  xp_reward INTEGER DEFAULT 100,
  bonus_xp INTEGER DEFAULT 50,       -- Bonus XP for perfect score
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  requires_approval BOOLEAN DEFAULT true, -- Admin must approve before XP awarded
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT,
  
  -- Foreign key to courses table
  CONSTRAINT fk_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- =====================================================
-- 2. CREATE EXAM_SUBMISSIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS exam_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_id UUID NOT NULL REFERENCES course_exams(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  
  -- Submission Data
  answers JSONB NOT NULL,              -- User's answers: {"q1": "answer1", "q2": "answer2"}
  score INTEGER NOT NULL,               -- Calculated score (0-100)
  passed BOOLEAN NOT NULL,              -- Did they pass?
  
  -- Timing
  started_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  time_taken_seconds INTEGER,           -- How long they took
  
  -- Approval Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  
  -- Admin Review
  reviewed_by TEXT,                     -- Admin wallet who reviewed
  reviewed_at TIMESTAMPTZ,
  admin_notes TEXT,
  
  -- XP Award
  xp_awarded INTEGER DEFAULT 0,
  xp_awarded_at TIMESTAMPTZ,
  
  -- Metadata
  attempt_number INTEGER DEFAULT 1,     -- Which attempt is this
  ip_address TEXT,                      -- For fraud detection
  user_agent TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. CREATE INDEXES
-- =====================================================

-- Course Exams Indexes
CREATE INDEX IF NOT EXISTS idx_course_exams_course_id ON course_exams(course_id);
CREATE INDEX IF NOT EXISTS idx_course_exams_course_slug ON course_exams(course_slug);
CREATE INDEX IF NOT EXISTS idx_course_exams_squad_restricted ON course_exams(squad_restricted);
CREATE INDEX IF NOT EXISTS idx_course_exams_is_active ON course_exams(is_active);

-- Exam Submissions Indexes
CREATE INDEX IF NOT EXISTS idx_exam_submissions_exam_id ON exam_submissions(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_submissions_wallet ON exam_submissions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_exam_submissions_status ON exam_submissions(status);
CREATE INDEX IF NOT EXISTS idx_exam_submissions_passed ON exam_submissions(passed);
CREATE INDEX IF NOT EXISTS idx_exam_submissions_created_at ON exam_submissions(created_at);

-- Composite index for checking user attempts
CREATE INDEX IF NOT EXISTS idx_exam_submissions_user_exam 
ON exam_submissions(wallet_address, exam_id, created_at DESC);

-- =====================================================
-- 4. CREATE CONSTRAINTS
-- =====================================================

-- Prevent score out of range
ALTER TABLE exam_submissions 
ADD CONSTRAINT check_score_range 
CHECK (score >= 0 AND score <= 100);

-- Prevent negative attempt numbers
ALTER TABLE exam_submissions 
ADD CONSTRAINT check_attempt_positive 
CHECK (attempt_number > 0);

-- Prevent negative time
ALTER TABLE exam_submissions 
ADD CONSTRAINT check_time_positive 
CHECK (time_taken_seconds IS NULL OR time_taken_seconds >= 0);

-- =====================================================
-- 5. ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE course_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_submissions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 6. CREATE RLS POLICIES - COURSE_EXAMS
-- =====================================================

-- Everyone can view active exams
CREATE POLICY "Users can view active exams" ON course_exams
  FOR SELECT USING (is_active = true);

-- Admins can do anything
CREATE POLICY "Admins can manage exams" ON course_exams
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'
      AND users.is_admin = true
    )
  );

-- =====================================================
-- 7. CREATE RLS POLICIES - EXAM_SUBMISSIONS
-- =====================================================

-- Users can view their own submissions
CREATE POLICY "Users can view own submissions" ON exam_submissions
  FOR SELECT USING (
    wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'
  );

-- Users can insert their own submissions
CREATE POLICY "Users can create submissions" ON exam_submissions
  FOR INSERT WITH CHECK (
    wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'
  );

-- Admins can view all submissions
CREATE POLICY "Admins can view all submissions" ON exam_submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'
      AND users.is_admin = true
    )
  );

-- Admins can update submissions (for approval/rejection)
CREATE POLICY "Admins can update submissions" ON exam_submissions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'
      AND users.is_admin = true
    )
  );

-- =====================================================
-- 8. CREATE HELPER FUNCTIONS
-- =====================================================

-- Function to check if user can take exam (squad restriction + attempts)
CREATE OR REPLACE FUNCTION can_user_take_exam(
  p_wallet_address TEXT,
  p_exam_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_exam RECORD;
  v_user_squad TEXT;
  v_attempts_taken INTEGER;
  v_result JSONB;
BEGIN
  -- Get exam details
  SELECT * INTO v_exam FROM course_exams WHERE id = p_exam_id;
  
  IF v_exam IS NULL THEN
    RETURN jsonb_build_object(
      'can_take', false,
      'reason', 'Exam not found'
    );
  END IF;
  
  -- Check if exam is active
  IF v_exam.is_active = false THEN
    RETURN jsonb_build_object(
      'can_take', false,
      'reason', 'Exam is not active'
    );
  END IF;
  
  -- Get user's squad
  SELECT squad INTO v_user_squad FROM users WHERE wallet_address = p_wallet_address;
  
  -- Check squad restriction
  IF v_exam.squad_restricted = true THEN
    IF v_user_squad IS NULL OR NOT (v_user_squad = ANY(v_exam.allowed_squads)) THEN
      RETURN jsonb_build_object(
        'can_take', false,
        'reason', 'This exam is restricted to specific squads',
        'required_squads', v_exam.allowed_squads
      );
    END IF;
  END IF;
  
  -- Check attempt limit
  SELECT COUNT(*) INTO v_attempts_taken 
  FROM exam_submissions 
  WHERE wallet_address = p_wallet_address AND exam_id = p_exam_id;
  
  IF v_attempts_taken >= v_exam.attempts_allowed THEN
    RETURN jsonb_build_object(
      'can_take', false,
      'reason', 'Maximum attempts reached',
      'attempts_used', v_attempts_taken,
      'attempts_allowed', v_exam.attempts_allowed
    );
  END IF;
  
  -- User can take the exam
  RETURN jsonb_build_object(
    'can_take', true,
    'attempts_remaining', v_exam.attempts_allowed - v_attempts_taken,
    'attempts_used', v_attempts_taken
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to approve exam and award XP
CREATE OR REPLACE FUNCTION approve_exam_submission(
  p_submission_id UUID,
  p_admin_wallet TEXT
) RETURNS JSONB AS $$
DECLARE
  v_submission RECORD;
  v_exam RECORD;
  v_xp_to_award INTEGER;
BEGIN
  -- Get submission
  SELECT * INTO v_submission FROM exam_submissions WHERE id = p_submission_id;
  
  IF v_submission IS NULL THEN
    RAISE EXCEPTION 'Submission not found';
  END IF;
  
  -- Get exam details
  SELECT * INTO v_exam FROM course_exams WHERE id = v_submission.exam_id;
  
  -- Calculate XP to award
  v_xp_to_award := v_exam.xp_reward;
  IF v_submission.score = 100 THEN
    v_xp_to_award := v_xp_to_award + v_exam.bonus_xp;
  END IF;
  
  -- Update submission
  UPDATE exam_submissions SET
    status = 'approved',
    reviewed_by = p_admin_wallet,
    reviewed_at = NOW(),
    xp_awarded = v_xp_to_award,
    xp_awarded_at = NOW(),
    updated_at = NOW()
  WHERE id = p_submission_id;
  
  -- Award XP to user
  UPDATE users SET
    total_xp = COALESCE(total_xp, 0) + v_xp_to_award,
    updated_at = NOW()
  WHERE wallet_address = v_submission.wallet_address;
  
  -- Mark course as completed if passed
  IF v_submission.passed THEN
    INSERT INTO course_completions (wallet_address, course_id, course_slug, completed_at, xp_awarded)
    VALUES (v_submission.wallet_address, v_exam.course_id, v_exam.course_slug, NOW(), v_xp_to_award)
    ON CONFLICT (wallet_address, course_slug) DO UPDATE SET
      completed_at = NOW(),
      xp_awarded = GREATEST(course_completions.xp_awarded, v_xp_to_award);
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'xp_awarded', v_xp_to_award,
    'submission_id', p_submission_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 9. CREATE COURSE_COMPLETIONS TABLE (if not exists)
-- =====================================================

CREATE TABLE IF NOT EXISTS course_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  course_id TEXT NOT NULL,
  course_slug TEXT NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  xp_awarded INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(wallet_address, course_slug)
);

CREATE INDEX IF NOT EXISTS idx_course_completions_wallet ON course_completions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_course_completions_course ON course_completions(course_slug);

ALTER TABLE course_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own completions" ON course_completions
  FOR SELECT USING (
    wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'
  );

CREATE POLICY "Admins can view all completions" ON course_completions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'
      AND users.is_admin = true
    )
  );

-- =====================================================
-- 10. INSERT SAMPLE EXAM DATA
-- =====================================================

-- Example: Create final exam for AI Automation Curriculum (Creators squad)
INSERT INTO course_exams (
  course_id, 
  course_slug, 
  title, 
  description, 
  total_questions, 
  passing_score, 
  time_limit_minutes,
  attempts_allowed,
  squad_restricted,
  allowed_squads,
  xp_reward,
  bonus_xp,
  is_active,
  requires_approval
) VALUES (
  'ai-automation-curriculum',
  'ai-automation-curriculum',
  'AI Automation Final Exam',
  'Test your knowledge of AI automation tools and workflows',
  20,
  70,
  30,
  3,
  true,
  ARRAY['Creators', 'Decoders'],
  200,
  50,
  true,
  true
) ON CONFLICT DO NOTHING;

-- Example: Create final exam for NFT Mastery (All squads)
INSERT INTO course_exams (
  course_id, 
  course_slug, 
  title, 
  description, 
  total_questions, 
  passing_score, 
  time_limit_minutes,
  attempts_allowed,
  squad_restricted,
  allowed_squads,
  xp_reward,
  bonus_xp,
  is_active,
  requires_approval
) VALUES (
  'nft-mastery',
  'nft-mastery',
  'NFT Mastery Final Exam',
  'Prove your NFT expertise and earn certification',
  25,
  75,
  45,
  2,
  false,
  NULL,
  250,
  75,
  true,
  true
) ON CONFLICT DO NOTHING;

-- =====================================================
-- 11. CREATE VIEW FOR ADMIN DASHBOARD
-- =====================================================

CREATE OR REPLACE VIEW admin_exam_submissions_view AS
SELECT 
  es.id,
  es.exam_id,
  es.wallet_address,
  es.score,
  es.passed,
  es.status,
  es.attempt_number,
  es.submitted_at,
  es.time_taken_seconds,
  es.xp_awarded,
  
  -- Exam details
  ce.title as exam_title,
  ce.course_slug,
  ce.passing_score,
  ce.xp_reward,
  ce.bonus_xp,
  ce.squad_restricted,
  ce.allowed_squads,
  
  -- User details
  u.username,
  u.squad as user_squad,
  u.total_xp as user_total_xp,
  
  -- Course details
  c.title as course_title,
  c.emoji as course_emoji
  
FROM exam_submissions es
LEFT JOIN course_exams ce ON es.exam_id = ce.id
LEFT JOIN users u ON es.wallet_address = u.wallet_address
LEFT JOIN courses c ON ce.course_id = c.id
ORDER BY es.submitted_at DESC;

-- =====================================================
-- 12. CREATE TRIGGER FOR UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_exam_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER exam_submissions_updated_at
  BEFORE UPDATE ON exam_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_exam_updated_at();

CREATE TRIGGER course_exams_updated_at
  BEFORE UPDATE ON course_exams
  FOR EACH ROW
  EXECUTE FUNCTION update_exam_updated_at();

-- =====================================================
-- 13. VERIFICATION QUERIES
-- =====================================================

-- Check tables exist
SELECT 
  'course_exams' as table_name,
  COUNT(*) as record_count
FROM course_exams
UNION ALL
SELECT 
  'exam_submissions' as table_name,
  COUNT(*) as record_count
FROM exam_submissions
UNION ALL
SELECT 
  'course_completions' as table_name,
  COUNT(*) as record_count
FROM course_completions;

-- Show all columns in exam tables
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name IN ('course_exams', 'exam_submissions', 'course_completions')
ORDER BY table_name, ordinal_position;

-- =====================================================
-- SETUP COMPLETE!
-- =====================================================
SELECT 'Course Exam System Setup Complete! ✅' as status;

