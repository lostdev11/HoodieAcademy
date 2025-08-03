-- Bounty XP Tracking Schema
-- This schema tracks bounty submissions and XP awards for the Hoodie Academy platform

-- Bounty submissions tracking
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bounty_submissions_wallet ON bounty_submissions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_bounty_submissions_bounty ON bounty_submissions(bounty_id);
CREATE INDEX IF NOT EXISTS idx_bounty_submissions_placement ON bounty_submissions(placement);
CREATE INDEX IF NOT EXISTS idx_bounty_submissions_created ON bounty_submissions(created_at);

-- Enable RLS
ALTER TABLE bounty_submissions ENABLE ROW LEVEL SECURITY;

-- Create policies
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
CREATE INDEX IF NOT EXISTS idx_user_xp_total ON user_xp(total_xp);

-- Enable RLS for user_xp
ALTER TABLE user_xp ENABLE ROW LEVEL SECURITY;

-- Create policies for user_xp
CREATE POLICY "Users can view all XP data" ON user_xp
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own XP" ON user_xp
  FOR UPDATE USING (auth.jwt() ->> 'wallet_address' = wallet_address);

CREATE POLICY "System can insert XP records" ON user_xp
  FOR INSERT WITH CHECK (true);

-- XP transaction history
CREATE TABLE IF NOT EXISTS xp_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  xp_amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('bounty_submission', 'bounty_winner', 'course_completion', 'streak_bonus')),
  reference_id TEXT, -- bounty_id, course_id, etc.
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

CREATE POLICY "System can insert XP transactions" ON xp_transactions
  FOR INSERT WITH CHECK (true);

-- Updated trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_bounty_submissions_updated_at 
    BEFORE UPDATE ON bounty_submissions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_xp_updated_at 
    BEFORE UPDATE ON user_xp 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Function to award XP for bounty submission
CREATE OR REPLACE FUNCTION award_bounty_xp(
  p_wallet_address TEXT,
  p_bounty_id TEXT,
  p_submission_id TEXT,
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
  p_submission_id TEXT,
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
  INSERT INTO user_xp (wallet_address, total_xp, bounty_xp)
  VALUES (p_wallet_address, v_new_total, p_xp_bonus)
  ON CONFLICT (wallet_address) 
  DO UPDATE SET 
    total_xp = user_xp.total_xp + p_xp_bonus,
    bounty_xp = user_xp.bounty_xp + p_xp_bonus,
    updated_at = NOW();

  -- Record transaction
  INSERT INTO xp_transactions (wallet_address, xp_amount, transaction_type, reference_id, description)
  VALUES (p_wallet_address, p_xp_bonus, 'bounty_winner', p_bounty_id, 
          'Winner bonus for ' || p_placement || ' place');

  RETURN v_new_total;
END;
$$ LANGUAGE plpgsql; 