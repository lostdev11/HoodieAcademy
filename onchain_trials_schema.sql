-- On-Chain Trials Database Schema
-- Run this SQL in your Supabase SQL Editor to create the necessary tables

-- Table: onchain_trials_scores
-- Stores leaderboard and player statistics
CREATE TABLE IF NOT EXISTS onchain_trials_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet TEXT NOT NULL,
  username TEXT,
  best_score INTEGER DEFAULT 0,
  success_rate DECIMAL(5, 4) DEFAULT 0.0000, -- 0.0000 to 1.0000
  streak INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(wallet)
);

-- Table: onchain_trials_predictions
-- Stores prediction records (for future Anchor program integration)
CREATE TABLE IF NOT EXISTS onchain_trials_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet TEXT NOT NULL,
  prediction_type TEXT NOT NULL CHECK (prediction_type IN ('beat_median_score', 'complete_under_time')),
  stake_amount DECIMAL(18, 9) NOT NULL, -- SOL amount (supports up to 9 decimal places)
  locked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  result TEXT CHECK (result IN ('win', 'loss', 'pending')),
  game_score INTEGER,
  transaction_signature TEXT, -- Solana transaction signature
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_onchain_trials_scores_wallet ON onchain_trials_scores(wallet);
CREATE INDEX IF NOT EXISTS idx_onchain_trials_scores_streak ON onchain_trials_scores(streak DESC);
CREATE INDEX IF NOT EXISTS idx_onchain_trials_scores_success_rate ON onchain_trials_scores(success_rate DESC);
CREATE INDEX IF NOT EXISTS idx_onchain_trials_predictions_wallet ON onchain_trials_predictions(wallet);
CREATE INDEX IF NOT EXISTS idx_onchain_trials_predictions_result ON onchain_trials_predictions(result);
CREATE INDEX IF NOT EXISTS idx_onchain_trials_predictions_locked_at ON onchain_trials_predictions(locked_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update updated_at
CREATE TRIGGER update_onchain_trials_scores_updated_at
  BEFORE UPDATE ON onchain_trials_scores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_onchain_trials_predictions_updated_at
  BEFORE UPDATE ON onchain_trials_predictions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE onchain_trials_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE onchain_trials_predictions ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read scores (for leaderboard)
CREATE POLICY "Anyone can read scores"
  ON onchain_trials_scores
  FOR SELECT
  USING (true);

-- Policy: Users can insert/update their own scores
CREATE POLICY "Users can manage their own scores"
  ON onchain_trials_scores
  FOR ALL
  USING (true); -- In production, you'd check: auth.uid()::text = wallet

-- Policy: Anyone can read predictions (for transparency)
CREATE POLICY "Anyone can read predictions"
  ON onchain_trials_predictions
  FOR SELECT
  USING (true);

-- Policy: Users can insert their own predictions
CREATE POLICY "Users can insert their own predictions"
  ON onchain_trials_predictions
  FOR INSERT
  WITH CHECK (true); -- In production, validate wallet matches authenticated user

-- Policy: System can update predictions (for result processing)
CREATE POLICY "System can update predictions"
  ON onchain_trials_predictions
  FOR UPDATE
  USING (true); -- In production, restrict to admin/service role

-- Grant necessary permissions
GRANT SELECT ON onchain_trials_scores TO anon, authenticated;
GRANT INSERT, UPDATE ON onchain_trials_scores TO authenticated;
GRANT SELECT ON onchain_trials_predictions TO anon, authenticated;
GRANT INSERT ON onchain_trials_predictions TO authenticated;

