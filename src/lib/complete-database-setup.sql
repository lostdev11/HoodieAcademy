-- Complete Database Setup for Hoodie Academy
-- Run this script in your Supabase SQL editor to set up all required tables

-- =====================================================
-- 1. USERS TABLE (Base table - must be created first)
-- =====================================================

CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT UNIQUE NOT NULL,
  display_name TEXT,
  squad TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_active TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for users
CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_squad ON users(squad);

-- Enable RLS for users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies for users
CREATE POLICY "Users can view all users" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own data" ON users
  FOR INSERT WITH CHECK (auth.jwt() ->> 'wallet_address' = wallet_address);

CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE USING (auth.jwt() ->> 'wallet_address' = wallet_address);

-- =====================================================
-- 2. COURSE COMPLETIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS course_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL REFERENCES users(wallet_address) ON DELETE CASCADE,
  course_id TEXT NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  approved BOOLEAN DEFAULT FALSE,
  UNIQUE(wallet_address, course_id)
);

-- Create indexes for course_completions
CREATE INDEX IF NOT EXISTS idx_course_completions_wallet ON course_completions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_course_completions_course ON course_completions(course_id);

-- Enable RLS for course_completions
ALTER TABLE course_completions ENABLE ROW LEVEL SECURITY;

-- Create policies for course_completions
CREATE POLICY "Users can view all course completions" ON course_completions
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own course completions" ON course_completions
  FOR INSERT WITH CHECK (auth.jwt() ->> 'wallet_address' = wallet_address);

-- =====================================================
-- 3. QUIZ RESULTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS quiz_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL REFERENCES users(wallet_address) ON DELETE CASCADE,
  quiz_id TEXT NOT NULL,
  score INTEGER NOT NULL,
  passed BOOLEAN NOT NULL,
  answers JSONB DEFAULT '{}',
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(wallet_address, quiz_id)
);

-- Create indexes for quiz_results
CREATE INDEX IF NOT EXISTS idx_quiz_results_wallet ON quiz_results(wallet_address);
CREATE INDEX IF NOT EXISTS idx_quiz_results_quiz ON quiz_results(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_passed ON quiz_results(passed);

-- Enable RLS for quiz_results
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;

-- Create policies for quiz_results
CREATE POLICY "Users can view all quiz results" ON quiz_results
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own quiz results" ON quiz_results
  FOR INSERT WITH CHECK (auth.jwt() ->> 'wallet_address' = wallet_address);

-- =====================================================
-- 4. BADGES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL REFERENCES users(wallet_address) ON DELETE CASCADE,
  badge_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(wallet_address, badge_id)
);

-- Create indexes for badges
CREATE INDEX IF NOT EXISTS idx_badges_wallet ON badges(wallet_address);
CREATE INDEX IF NOT EXISTS idx_badges_badge_id ON badges(badge_id);

-- Enable RLS for badges
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;

-- Create policies for badges
CREATE POLICY "Users can view all badges" ON badges
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own badges" ON badges
  FOR INSERT WITH CHECK (auth.jwt() ->> 'wallet_address' = wallet_address);

-- =====================================================
-- 5. SUBMISSIONS TABLE
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
-- 6. BOUNTY XP SYSTEM
-- =====================================================

-- Bounty submissions tracking
CREATE TABLE IF NOT EXISTS bounty_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  bounty_id TEXT NOT NULL,
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
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

-- XP tracking table for users
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

-- Enable RLS for user_xp
ALTER TABLE user_xp ENABLE ROW LEVEL SECURITY;

-- Create policies for user_xp
CREATE POLICY "Users can view their own XP" ON user_xp
  FOR SELECT USING (auth.jwt() ->> 'wallet_address' = wallet_address);

CREATE POLICY "Users can insert their own XP" ON user_xp
  FOR INSERT WITH CHECK (auth.jwt() ->> 'wallet_address' = wallet_address);

CREATE POLICY "Users can update their own XP" ON user_xp
  FOR UPDATE USING (auth.jwt() ->> 'wallet_address' = wallet_address);

-- XP transactions tracking
CREATE TABLE IF NOT EXISTS xp_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  xp_amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('bounty_submission', 'bounty_winner', 'course_completion', 'streak_bonus')),
  reference_id TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for xp_transactions
CREATE INDEX IF NOT EXISTS idx_xp_transactions_wallet ON xp_transactions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_type ON xp_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_created ON xp_transactions(created_at);

-- Enable RLS for xp_transactions
ALTER TABLE xp_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for xp_transactions
CREATE POLICY "Users can view their own XP transactions" ON xp_transactions
  FOR SELECT USING (auth.jwt() ->> 'wallet_address' = wallet_address);

CREATE POLICY "Users can insert their own XP transactions" ON xp_transactions
  FOR INSERT WITH CHECK (auth.jwt() ->> 'wallet_address' = wallet_address);

-- =====================================================
-- 7. RETAILSTAR REWARDS SYSTEM
-- =====================================================

-- Retailstar rewards catalog
CREATE TABLE IF NOT EXISTS retailstar_rewards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reward_id TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('retail_ticket', 'domain_pfp', 'landing_page', 'lore_access', 'asset_pack', 'spotlight', 'role_upgrade')),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  squad_alignment TEXT[] NOT NULL,
  rarity TEXT NOT NULL CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
  requirements JSONB NOT NULL DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User retailstar rewards tracking
CREATE TABLE IF NOT EXISTS user_retailstar_rewards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  reward_id TEXT NOT NULL REFERENCES retailstar_rewards(reward_id),
  awarded_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'redeemed', 'expired')),
  metadata JSONB DEFAULT '{}',
  redeemed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Retailstar task assignments
CREATE TABLE IF NOT EXISTS retailstar_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  squad_target TEXT[] NOT NULL,
  tiered_rewards JSONB NOT NULL DEFAULT '{}',
  requirements JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User task completions
CREATE TABLE IF NOT EXISTS user_task_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  task_id TEXT NOT NULL REFERENCES retailstar_tasks(task_id),
  completion_level TEXT NOT NULL CHECK (completion_level IN ('basic', 'excellent', 'creative')),
  rewards_awarded TEXT[] NOT NULL DEFAULT '{}',
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for retailstar tables
CREATE INDEX IF NOT EXISTS idx_retailstar_rewards_type ON retailstar_rewards(type);
CREATE INDEX IF NOT EXISTS idx_retailstar_rewards_rarity ON retailstar_rewards(rarity);
CREATE INDEX IF NOT EXISTS idx_retailstar_rewards_squad ON retailstar_rewards USING GIN(squad_alignment);

CREATE INDEX IF NOT EXISTS idx_user_retailstar_rewards_wallet ON user_retailstar_rewards(wallet_address);
CREATE INDEX IF NOT EXISTS idx_user_retailstar_rewards_status ON user_retailstar_rewards(status);
CREATE INDEX IF NOT EXISTS idx_user_retailstar_rewards_awarded ON user_retailstar_rewards(awarded_at);

CREATE INDEX IF NOT EXISTS idx_retailstar_tasks_squad ON retailstar_tasks USING GIN(squad_target);
CREATE INDEX IF NOT EXISTS idx_retailstar_tasks_status ON retailstar_tasks(status);

CREATE INDEX IF NOT EXISTS idx_user_task_completions_wallet ON user_task_completions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_user_task_completions_task ON user_task_completions(task_id);
CREATE INDEX IF NOT EXISTS idx_user_task_completions_level ON user_task_completions(completion_level);

-- Enable RLS for retailstar tables
ALTER TABLE retailstar_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_retailstar_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE retailstar_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_task_completions ENABLE ROW LEVEL SECURITY;

-- Create policies for retailstar tables
CREATE POLICY "Anyone can view retailstar rewards" ON retailstar_rewards
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage retailstar rewards" ON retailstar_rewards
  FOR ALL USING (auth.jwt() ->> 'is_admin' = 'true');

CREATE POLICY "Users can view their own retailstar rewards" ON user_retailstar_rewards
  FOR SELECT USING (auth.jwt() ->> 'wallet_address' = wallet_address);

CREATE POLICY "Admins can manage user retailstar rewards" ON user_retailstar_rewards
  FOR ALL USING (auth.jwt() ->> 'is_admin' = 'true');

CREATE POLICY "Anyone can view retailstar tasks" ON retailstar_tasks
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage retailstar tasks" ON retailstar_tasks
  FOR ALL USING (auth.jwt() ->> 'is_admin' = 'true');

CREATE POLICY "Users can view their own task completions" ON user_task_completions
  FOR SELECT USING (auth.jwt() ->> 'wallet_address' = wallet_address);

CREATE POLICY "Users can insert their own task completions" ON user_task_completions
  FOR INSERT WITH CHECK (auth.jwt() ->> 'wallet_address' = wallet_address);

CREATE POLICY "Admins can manage task completions" ON user_task_completions
  FOR ALL USING (auth.jwt() ->> 'is_admin' = 'true');

-- =====================================================
-- 8. TRIGGERS AND FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
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

CREATE TRIGGER update_user_xp_updated_at 
    BEFORE UPDATE ON user_xp 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_retailstar_rewards_updated_at 
    BEFORE UPDATE ON retailstar_rewards 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_retailstar_rewards_updated_at 
    BEFORE UPDATE ON user_retailstar_rewards 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_retailstar_tasks_updated_at 
    BEFORE UPDATE ON retailstar_tasks 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_task_completions_updated_at 
    BEFORE UPDATE ON user_task_completions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Function to award bounty XP
CREATE OR REPLACE FUNCTION award_bounty_xp(
  p_wallet_address TEXT,
  p_bounty_id TEXT,
  p_submission_id UUID,
  p_xp_amount INTEGER DEFAULT 10
)
RETURNS INTEGER AS $$
DECLARE
  v_current_xp INTEGER;
  v_new_total INTEGER;
BEGIN
  -- Insert or update bounty submission record
  INSERT INTO bounty_submissions (wallet_address, bounty_id, submission_id, xp_awarded)
  VALUES (p_wallet_address, p_bounty_id, p_submission_id, p_xp_amount)
  ON CONFLICT (wallet_address, bounty_id, submission_id) 
  DO UPDATE SET xp_awarded = p_xp_amount, updated_at = NOW();

  -- Get current user XP
  SELECT COALESCE(total_xp, 0) INTO v_current_xp
  FROM user_xp 
  WHERE wallet_address = p_wallet_address;

  -- Calculate new total
  v_new_total := v_current_xp + p_xp_amount;

  -- Insert or update user XP
  INSERT INTO user_xp (wallet_address, total_xp, bounty_xp)
  VALUES (p_wallet_address, v_new_total, p_xp_amount)
  ON CONFLICT (wallet_address) 
  DO UPDATE SET 
    total_xp = user_xp.total_xp + p_xp_amount,
    bounty_xp = user_xp.bounty_xp + p_xp_amount,
    updated_at = NOW();

  -- Record transaction
  INSERT INTO xp_transactions (wallet_address, xp_amount, transaction_type, reference_id, description)
  VALUES (p_wallet_address, p_xp_amount, 'bounty_submission', p_bounty_id, 'Bounty submission XP');

  RETURN v_new_total;
END;
$$ LANGUAGE plpgsql;

-- Function to award winner bonus
CREATE OR REPLACE FUNCTION award_winner_bonus(
  p_wallet_address TEXT,
  p_bounty_id TEXT,
  p_submission_id UUID,
  p_placement TEXT,
  p_xp_bonus INTEGER,
  p_sol_prize DECIMAL(10, 8)
)
RETURNS INTEGER AS $$
DECLARE
  v_current_xp INTEGER;
  v_new_total INTEGER;
BEGIN
  -- Update bounty submission with placement and prize
  UPDATE bounty_submissions 
  SET placement = p_placement, sol_prize = p_sol_prize, updated_at = NOW()
  WHERE wallet_address = p_wallet_address 
    AND bounty_id = p_bounty_id 
    AND submission_id = p_submission_id;

  -- Get current user XP
  SELECT COALESCE(total_xp, 0) INTO v_current_xp
  FROM user_xp 
  WHERE wallet_address = p_wallet_address;

  -- Calculate new total
  v_new_total := v_current_xp + p_xp_bonus;

  -- Update user XP
  UPDATE user_xp 
  SET total_xp = v_new_total, bounty_xp = bounty_xp + p_xp_bonus, updated_at = NOW()
  WHERE wallet_address = p_wallet_address;

  -- Record transaction
  INSERT INTO xp_transactions (wallet_address, xp_amount, transaction_type, reference_id, description)
  VALUES (p_wallet_address, p_xp_bonus, 'bounty_winner', p_bounty_id, 'Winner bonus XP');

  RETURN v_new_total;
END;
$$ LANGUAGE plpgsql;

-- Function to award retailstar reward
CREATE OR REPLACE FUNCTION award_retailstar_reward(
  p_wallet_address TEXT,
  p_reward_id TEXT,
  p_metadata JSONB DEFAULT '{}',
  p_expires_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_reward_exists BOOLEAN;
  v_user_reward_id UUID;
BEGIN
  -- Check if reward exists
  SELECT EXISTS(SELECT 1 FROM retailstar_rewards WHERE reward_id = p_reward_id) INTO v_reward_exists;
  
  IF NOT v_reward_exists THEN
    RAISE EXCEPTION 'Reward % does not exist', p_reward_id;
  END IF;

  -- Insert user reward
  INSERT INTO user_retailstar_rewards (wallet_address, reward_id, metadata, expires_at)
  VALUES (p_wallet_address, p_reward_id, p_metadata, p_expires_at)
  RETURNING id INTO v_user_reward_id;

  RETURN v_user_reward_id;
END;
$$ LANGUAGE plpgsql;

-- Function to complete a retailstar task
CREATE OR REPLACE FUNCTION complete_retailstar_task(
  p_wallet_address TEXT,
  p_task_id TEXT,
  p_completion_level TEXT,
  p_rewards_awarded TEXT[]
)
RETURNS UUID AS $$
DECLARE
  v_task_exists BOOLEAN;
  v_completion_id UUID;
BEGIN
  -- Check if task exists
  SELECT EXISTS(SELECT 1 FROM retailstar_tasks WHERE task_id = p_task_id) INTO v_task_exists;
  
  IF NOT v_task_exists THEN
    RAISE EXCEPTION 'Task % does not exist', p_task_id;
  END IF;

  -- Insert task completion
  INSERT INTO user_task_completions (wallet_address, task_id, completion_level, rewards_awarded)
  VALUES (p_wallet_address, p_task_id, p_completion_level, p_rewards_awarded)
  RETURNING id INTO v_completion_id;

  -- Award rewards if specified
  IF array_length(p_rewards_awarded, 1) > 0 THEN
    FOR i IN 1..array_length(p_rewards_awarded, 1) LOOP
      PERFORM award_retailstar_reward(p_wallet_address, p_rewards_awarded[i]);
    END LOOP;
  END IF;

  RETURN v_completion_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's available rewards
CREATE OR REPLACE FUNCTION get_user_available_rewards(
  p_wallet_address TEXT,
  p_user_squad TEXT,
  p_submission_count INTEGER DEFAULT 0,
  p_placement TEXT DEFAULT NULL
)
RETURNS TABLE (
  reward_id TEXT,
  name TEXT,
  description TEXT,
  type TEXT,
  rarity TEXT,
  requirements JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rr.reward_id,
    rr.name,
    rr.description,
    rr.type,
    rr.rarity,
    rr.requirements
  FROM retailstar_rewards rr
  WHERE 
    p_user_squad = ANY(rr.squad_alignment)
    AND (rr.requirements->>'minSubmissions')::INTEGER <= p_submission_count
    AND (
      rr.requirements->>'minPlacement' IS NULL 
      OR p_placement IS NOT NULL
      OR (rr.requirements->>'minPlacement')::TEXT <= p_placement
    )
    AND NOT EXISTS (
      SELECT 1 FROM user_retailstar_rewards urr 
      WHERE urr.wallet_address = p_wallet_address 
      AND urr.reward_id = rr.reward_id
      AND urr.status IN ('active', 'pending')
    );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 9. SAMPLE DATA
-- =====================================================

-- Insert default retailstar rewards
INSERT INTO retailstar_rewards (reward_id, type, name, description, squad_alignment, rarity, requirements) VALUES
('retail_ticket_1', 'retail_ticket', '🎟️ Retail Ticket', 'Entry into raffles, future domain deals, or special mall events', ARRAY['creators', 'speakers', 'decoders', 'raiders'], 'common', '{"minSubmissions": 1}'),
('domain_pfp_upgrade', 'domain_pfp', '🪪 Domain PFP Upgrade', 'Custom banner + PFP design tied to a .sol domain', ARRAY['creators', 'speakers'], 'uncommon', '{"minSubmissions": 2, "minPlacement": "second"}'),
('landing_page_build', 'landing_page', '🧱 1-Page Landing Page Build', 'Fully built landing site for their own project or personal identity', ARRAY['creators', 'decoders'], 'rare', '{"minSubmissions": 3, "minPlacement": "first"}'),
('lore_access', 'lore_access', '🔐 Hidden Lore Access', 'Reveal secret rooms in Retailstar Mall or unlock cipher-gated paths', ARRAY['raiders', 'decoders'], 'epic', '{"minSubmissions": 2, "minPlacement": "first", "specialCriteria": "puzzle_solver"}'),
('asset_pack', 'asset_pack', '📦 Mallcore Asset Pack', 'Pre-built design assets (icons, buttons, templates) for their own use', ARRAY['creators'], 'uncommon', '{"minSubmissions": 1, "minPlacement": "second"}'),
('spotlight', 'spotlight', '📣 Public Spotlight', 'Featured in Academy post or quoted in homepage banner', ARRAY['speakers'], 'rare', '{"minSubmissions": 2, "minPlacement": "first"}'),
('role_upgrade', 'role_upgrade', '🧢 Squad Role Upgrade', 'Early access to special squad badges or emoji flair', ARRAY['creators', 'speakers', 'decoders', 'raiders'], 'common', '{"minSubmissions": 1}')
ON CONFLICT (reward_id) DO NOTHING;

-- Insert sample submission
INSERT INTO submissions (
  title, 
  description, 
  squad, 
  course_ref, 
  bounty_id, 
  wallet_address, 
  image_url, 
  status, 
  upvotes, 
  total_upvotes
) VALUES (
  'Cyber Hoodie Academy Student',
  'Created a pixel art character for the Hoodie Academy! Used a limited 8-color palette with cel shading.',
  'Creators',
  'v100-pixel-art-basics',
  'hoodie-visual',
  'JCUGres3WA8MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU',
  '/uploads/cyber-hoodie-student.png',
  'approved',
  '{"🔥": [{"userId": "user456", "squad": "Raiders", "timestamp": "2024-01-15T11:00:00.000Z"}], "⭐": [{"userId": "user123", "squad": "Creators", "timestamp": "2024-01-15T11:15:00.000Z"}]}',
  2
) ON CONFLICT DO NOTHING;

-- =====================================================
-- 10. VERIFICATION
-- =====================================================

-- Check that all tables were created successfully
SELECT 
  table_name,
  CASE 
    WHEN table_name IN ('users', 'course_completions', 'quiz_results', 'badges', 'submissions', 'bounty_submissions', 'user_xp', 'xp_transactions', 'retailstar_rewards', 'user_retailstar_rewards', 'retailstar_tasks', 'user_task_completions') 
    THEN '✅ Created'
    ELSE '❌ Missing'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('users', 'course_completions', 'quiz_results', 'badges', 'submissions', 'bounty_submissions', 'user_xp', 'xp_transactions', 'retailstar_rewards', 'user_retailstar_rewards', 'retailstar_tasks', 'user_task_completions')
ORDER BY table_name; 