-- Create user_activity table that's missing from the database
-- This table is referenced in robust-user-sync.ts but doesn't exist

CREATE TABLE IF NOT EXISTS user_activity (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  activity_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for user_activity
CREATE INDEX IF NOT EXISTS idx_user_activity_wallet_address ON user_activity(wallet_address);
CREATE INDEX IF NOT EXISTS idx_user_activity_type ON user_activity(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_created_at ON user_activity(created_at);

-- Enable RLS for user_activity
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;

-- Create policies for user_activity
CREATE POLICY "Users can view all activity" ON user_activity
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own activity" ON user_activity
  FOR INSERT WITH CHECK (true);

-- Allow service role to manage all activity
CREATE POLICY "Service role can manage all activity" ON user_activity
  FOR ALL USING (auth.role() = 'service_role');

-- Grant permissions
GRANT ALL ON user_activity TO authenticated;
GRANT ALL ON user_activity TO service_role;
