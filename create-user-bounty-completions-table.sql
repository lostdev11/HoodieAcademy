-- Create user_bounty_completions table to track completed bounties
-- This table tracks when a user has successfully completed a bounty

CREATE TABLE IF NOT EXISTS user_bounty_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  bounty_id TEXT NOT NULL,
  submission_id UUID NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  xp_awarded INTEGER DEFAULT 0,
  sol_prize DECIMAL(10, 8) DEFAULT 0,
  placement TEXT CHECK (placement IN ('first', 'second', 'third')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(wallet_address, bounty_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_bounty_completions_wallet ON user_bounty_completions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_user_bounty_completions_bounty ON user_bounty_completions(bounty_id);
CREATE INDEX IF NOT EXISTS idx_user_bounty_completions_completed ON user_bounty_completions(completed_at);
CREATE INDEX IF NOT EXISTS idx_user_bounty_completions_placement ON user_bounty_completions(placement);

-- Enable RLS
ALTER TABLE user_bounty_completions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all bounty completions" ON user_bounty_completions
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert bounty completions" ON user_bounty_completions
  FOR INSERT USING (auth.jwt() ->> 'is_admin' = 'true');

CREATE POLICY "Admins can update bounty completions" ON user_bounty_completions
  FOR UPDATE USING (auth.jwt() ->> 'is_admin' = 'true');

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_bounty_completions_updated_at 
    BEFORE UPDATE ON user_bounty_completions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Function to mark bounty as completed
CREATE OR REPLACE FUNCTION mark_bounty_completed(
  p_wallet_address TEXT,
  p_bounty_id TEXT,
  p_submission_id UUID,
  p_xp_awarded INTEGER DEFAULT 10,
  p_sol_prize DECIMAL(10, 8) DEFAULT 0,
  p_placement TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_bounty_exists BOOLEAN;
  v_already_completed BOOLEAN;
BEGIN
  -- Check if bounty exists
  SELECT EXISTS(SELECT 1 FROM bounties WHERE id = p_bounty_id) INTO v_bounty_exists;
  
  IF NOT v_bounty_exists THEN
    RAISE EXCEPTION 'Bounty with id % does not exist', p_bounty_id;
  END IF;

  -- Check if user already completed this bounty
  SELECT EXISTS(
    SELECT 1 FROM user_bounty_completions 
    WHERE wallet_address = p_wallet_address 
    AND bounty_id = p_bounty_id
  ) INTO v_already_completed;

  IF v_already_completed THEN
    RAISE EXCEPTION 'User has already completed this bounty';
  END IF;

  -- Insert bounty completion record
  INSERT INTO user_bounty_completions (
    wallet_address, 
    bounty_id, 
    submission_id, 
    xp_awarded, 
    sol_prize, 
    placement
  ) VALUES (
    p_wallet_address, 
    p_bounty_id, 
    p_submission_id, 
    p_xp_awarded, 
    p_sol_prize, 
    p_placement
  );

  -- Award XP to user
  PERFORM award_bounty_xp(p_wallet_address, p_bounty_id, p_submission_id, p_xp_awarded);

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
