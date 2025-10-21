-- User Activity Table for XP Tracking
-- This table stores all user activity logs including XP awards, logins, and achievements
-- Run this in your Supabase SQL editor

-- Create user_activity table
CREATE TABLE IF NOT EXISTS user_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  activity_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Indexes for faster queries
  CONSTRAINT user_activity_pkey PRIMARY KEY (id)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_user_activity_wallet 
  ON user_activity(wallet_address);

CREATE INDEX IF NOT EXISTS idx_user_activity_type 
  ON user_activity(activity_type);

CREATE INDEX IF NOT EXISTS idx_user_activity_created 
  ON user_activity(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_activity_wallet_type 
  ON user_activity(wallet_address, activity_type);

CREATE INDEX IF NOT EXISTS idx_user_activity_wallet_created 
  ON user_activity(wallet_address, created_at DESC);

-- Composite index for daily XP queries (most common query)
CREATE INDEX IF NOT EXISTS idx_user_activity_daily_xp 
  ON user_activity(wallet_address, activity_type, created_at DESC) 
  WHERE activity_type = 'xp_awarded';

-- Enable Row Level Security
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own activity" ON user_activity;
DROP POLICY IF EXISTS "System can insert activity" ON user_activity;
DROP POLICY IF EXISTS "Admins can read all activity" ON user_activity;

-- RLS Policies
-- 1. Users can read their own activity
CREATE POLICY "Users can read own activity"
  ON user_activity
  FOR SELECT
  USING (true); -- Allow reading for now, can be restricted later

-- 2. System (service role) can insert any activity
CREATE POLICY "System can insert activity"
  ON user_activity
  FOR INSERT
  WITH CHECK (true); -- System/service role bypasses this anyway

-- 3. Admins can read all activity
CREATE POLICY "Admins can read all activity"
  ON user_activity
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.wallet_address = auth.jwt() ->> 'sub'
      AND users.is_admin = true
    )
  );

-- Grant necessary permissions
GRANT SELECT, INSERT ON user_activity TO anon;
GRANT SELECT, INSERT ON user_activity TO authenticated;
GRANT ALL ON user_activity TO service_role;

-- Create a function to clean up old activity logs (optional, for maintenance)
CREATE OR REPLACE FUNCTION cleanup_old_activity_logs()
RETURNS void AS $$
BEGIN
  -- Delete activity logs older than 90 days
  DELETE FROM user_activity
  WHERE created_at < NOW() - INTERVAL '90 days'
  AND activity_type NOT IN ('xp_awarded', 'level_up'); -- Keep XP records
  
  RAISE NOTICE 'Old activity logs cleaned up';
END;
$$ LANGUAGE plpgsql;

-- Optional: Create a scheduled job to run cleanup monthly
-- (Requires pg_cron extension - enable in Supabase dashboard if needed)
-- SELECT cron.schedule(
--   'cleanup-old-activity',
--   '0 0 1 * *', -- First day of every month at midnight
--   $$SELECT cleanup_old_activity_logs()$$
-- );

-- Verify table was created
SELECT 
  'user_activity table created successfully!' as status,
  COUNT(*) as existing_records
FROM user_activity;

-- Show table structure
\d user_activity

