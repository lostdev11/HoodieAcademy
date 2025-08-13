-- Quick User Activity Logging Setup
-- Run this in your Supabase SQL editor

-- Create the user_activity_logs table
CREATE TABLE IF NOT EXISTS user_activity_logs (
  id SERIAL PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  activity_type TEXT NOT NULL,
  activity_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_agent TEXT,
  ip_address TEXT,
  profile_data JSONB,
  course_data JSONB,
  wallet_data JSONB,
  achievement_data JSONB,
  session_data JSONB,
  metadata JSONB,
  notes TEXT
);

-- Create basic indexes
CREATE INDEX IF NOT EXISTS idx_user_activity_wallet_address ON user_activity_logs(wallet_address);
CREATE INDEX IF NOT EXISTS idx_user_activity_timestamp ON user_activity_logs(activity_timestamp);
CREATE INDEX IF NOT EXISTS idx_user_activity_type ON user_activity_logs(activity_type);

-- Enable RLS
ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (you can restrict this later)
CREATE POLICY "Allow all operations" ON user_activity_logs FOR ALL USING (true);

-- Insert a test record to verify it works
INSERT INTO user_activity_logs (wallet_address, activity_type, notes)
VALUES ('test-wallet-123', 'test', 'Test activity log entry')
ON CONFLICT DO NOTHING;
