-- Automatic XP Award System for Hoodie Academy
-- This sets up triggers and functions to automatically award XP for user actions

-- =====================================================
-- 1. CREATE XP EVENTS TABLE (if not exists)
-- =====================================================

CREATE TABLE IF NOT EXISTS xp_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('course', 'bounty', 'quiz', 'streak', 'admin_adjustment', 'referral', 'daily_login')),
  source_id TEXT,
  delta INTEGER NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_xp_events_wallet ON xp_events(wallet_address);
CREATE INDEX IF NOT EXISTS idx_xp_events_source ON xp_events(source);
CREATE INDEX IF NOT EXISTS idx_xp_events_created_at ON xp_events(created_at DESC);

-- Enable RLS
ALTER TABLE xp_events ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own XP events"
  ON xp_events FOR SELECT
  USING (true);

CREATE POLICY "System can insert XP events"
  ON xp_events FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- 2. CREATE/UPDATE USER_XP TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS user_xp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT UNIQUE NOT NULL,
  total_xp INTEGER DEFAULT 0,
  bounty_xp INTEGER DEFAULT 0,
  course_xp INTEGER DEFAULT 0,
  streak_xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  last_xp_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_xp_wallet ON user_xp(wallet_address);
CREATE INDEX IF NOT EXISTS idx_user_xp_total_xp ON user_xp(total_xp DESC);
CREATE INDEX IF NOT EXISTS idx_user_xp_level ON user_xp(level DESC);

-- Enable RLS
ALTER TABLE user_xp ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view all XP data"
  ON user_xp FOR SELECT
  USING (true);

CREATE POLICY "System can update XP"
  ON user_xp FOR UPDATE
  USING (true);

CREATE POLICY "System can insert XP"
  ON user_xp FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- 3. FUNCTION: Award XP
-- =====================================================

CREATE OR REPLACE FUNCTION award_xp(
  p_wallet_address TEXT,
  p_source TEXT,
  p_source_id TEXT,
  p_xp_amount INTEGER,
  p_reason TEXT
) RETURNS JSONB AS $$
DECLARE
  v_user_xp RECORD;
  v_new_total INTEGER;
  v_new_level INTEGER;
  v_xp_type TEXT;
BEGIN
  -- Validate inputs
  IF p_wallet_address IS NULL OR p_xp_amount IS NULL OR p_xp_amount = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid parameters');
  END IF;

  -- Determine XP type based on source
  v_xp_type := CASE p_source
    WHEN 'course' THEN 'course_xp'
    WHEN 'bounty' THEN 'bounty_xp'
    WHEN 'daily_login' THEN 'streak_xp'
    WHEN 'streak' THEN 'streak_xp'
    ELSE 'bounty_xp'
  END;

  -- Get or create user XP record
  INSERT INTO user_xp (wallet_address, total_xp, bounty_xp, course_xp, streak_xp, level, last_xp_at)
  VALUES (p_wallet_address, 0, 0, 0, 0, 1, NOW())
  ON CONFLICT (wallet_address) DO NOTHING;

  SELECT * INTO v_user_xp FROM user_xp WHERE wallet_address = p_wallet_address;

  -- Calculate new totals
  v_new_total := v_user_xp.total_xp + p_xp_amount;
  v_new_level := FLOOR(v_new_total / 1000) + 1; -- 1000 XP per level

  -- Update user XP based on source type
  UPDATE user_xp
  SET 
    total_xp = v_new_total,
    bounty_xp = CASE WHEN v_xp_type = 'bounty_xp' THEN bounty_xp + p_xp_amount ELSE bounty_xp END,
    course_xp = CASE WHEN v_xp_type = 'course_xp' THEN course_xp + p_xp_amount ELSE course_xp END,
    streak_xp = CASE WHEN v_xp_type = 'streak_xp' THEN streak_xp + p_xp_amount ELSE streak_xp END,
    level = v_new_level,
    last_xp_at = NOW(),
    updated_at = NOW()
  WHERE wallet_address = p_wallet_address;

  -- Log XP event
  INSERT INTO xp_events (wallet_address, source, source_id, delta, reason)
  VALUES (p_wallet_address, p_source, p_source_id, p_xp_amount, p_reason);

  RETURN jsonb_build_object(
    'success', true,
    'xp_awarded', p_xp_amount,
    'new_total_xp', v_new_total,
    'new_level', v_new_level,
    'level_up', v_new_level > v_user_xp.level
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. FUNCTION: Award Course Completion XP
-- =====================================================

CREATE OR REPLACE FUNCTION award_course_completion_xp()
RETURNS TRIGGER AS $$
DECLARE
  v_xp_amount INTEGER := 50; -- Default XP for course completion
  v_course_name TEXT;
BEGIN
  -- Only award XP when approved changes from false to true
  IF (TG_OP = 'UPDATE' AND OLD.approved = false AND NEW.approved = true) OR 
     (TG_OP = 'INSERT' AND NEW.approved = true) THEN
    
    -- Get course name for logging
    SELECT title INTO v_course_name FROM courses WHERE slug = NEW.course_id OR id = NEW.course_id;
    
    -- Award XP
    PERFORM award_xp(
      NEW.wallet_address,
      'course',
      NEW.course_id,
      v_xp_amount,
      'Course completion: ' || COALESCE(v_course_name, NEW.course_id)
    );
    
    RAISE NOTICE 'Awarded % XP to % for completing course %', v_xp_amount, NEW.wallet_address, NEW.course_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. CREATE TRIGGERS FOR AUTOMATIC XP AWARDS
-- =====================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_award_course_xp ON course_completions;

-- Create trigger for course completions
CREATE TRIGGER trigger_award_course_xp
  AFTER INSERT OR UPDATE ON course_completions
  FOR EACH ROW
  EXECUTE FUNCTION award_course_completion_xp();

-- =====================================================
-- 6. XP AWARD AMOUNTS (Reference)
-- =====================================================

-- Course Completion: 50 XP (automatic)
-- Bounty Submission Approved: Variable based on bounty reward (automatic)
-- Quiz Completion: 25 XP (can be added)
-- Daily Login: 5 XP (can be added)
-- 7-Day Streak: 50 XP bonus (can be added)
-- Referral: 100 XP (can be added)

-- =====================================================
-- 7. HELPER FUNCTION: Get User XP Summary
-- =====================================================

CREATE OR REPLACE FUNCTION get_user_xp_summary(p_wallet_address TEXT)
RETURNS JSONB AS $$
DECLARE
  v_xp RECORD;
  v_recent_events JSONB;
BEGIN
  -- Get user XP data
  SELECT * INTO v_xp FROM user_xp WHERE wallet_address = p_wallet_address;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'wallet_address', p_wallet_address,
      'total_xp', 0,
      'level', 1,
      'message', 'No XP data found - user may be new'
    );
  END IF;
  
  -- Get recent XP events
  SELECT jsonb_agg(jsonb_build_object(
    'source', source,
    'delta', delta,
    'reason', reason,
    'created_at', created_at
  ) ORDER BY created_at DESC)
  INTO v_recent_events
  FROM xp_events
  WHERE wallet_address = p_wallet_address
  LIMIT 10;
  
  RETURN jsonb_build_object(
    'wallet_address', p_wallet_address,
    'total_xp', v_xp.total_xp,
    'bounty_xp', v_xp.bounty_xp,
    'course_xp', v_xp.course_xp,
    'streak_xp', v_xp.streak_xp,
    'level', v_xp.level,
    'xp_to_next_level', (v_xp.level * 1000) - v_xp.total_xp,
    'recent_events', COALESCE(v_recent_events, '[]'::jsonb)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. INITIALIZE XP FOR EXISTING USERS
-- =====================================================

-- Create XP records for users who don't have one yet
INSERT INTO user_xp (wallet_address, total_xp, bounty_xp, course_xp, streak_xp, level)
SELECT 
  wallet_address,
  0 as total_xp,
  0 as bounty_xp,
  0 as course_xp,
  0 as streak_xp,
  1 as level
FROM users
WHERE wallet_address NOT IN (SELECT wallet_address FROM user_xp)
ON CONFLICT (wallet_address) DO NOTHING;

-- =====================================================
-- DONE
-- =====================================================

SELECT 'Automatic XP system setup complete!' as status;
