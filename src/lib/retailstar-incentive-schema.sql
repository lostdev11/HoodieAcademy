-- Retailstar Incentive System Database Schema
-- This schema tracks non-monetary rewards for squad members

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

-- Create indexes for performance
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

-- Enable RLS
ALTER TABLE retailstar_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_retailstar_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE retailstar_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_task_completions ENABLE ROW LEVEL SECURITY;

-- Create policies
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

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_retailstar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_retailstar_rewards_updated_at 
    BEFORE UPDATE ON retailstar_rewards 
    FOR EACH ROW 
    EXECUTE FUNCTION update_retailstar_updated_at();

CREATE TRIGGER update_user_retailstar_rewards_updated_at 
    BEFORE UPDATE ON user_retailstar_rewards 
    FOR EACH ROW 
    EXECUTE FUNCTION update_retailstar_updated_at();

CREATE TRIGGER update_retailstar_tasks_updated_at 
    BEFORE UPDATE ON retailstar_tasks 
    FOR EACH ROW 
    EXECUTE FUNCTION update_retailstar_updated_at();

CREATE TRIGGER update_user_task_completions_updated_at 
    BEFORE UPDATE ON user_task_completions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_retailstar_updated_at();

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