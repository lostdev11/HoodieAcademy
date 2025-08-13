-- Comprehensive User Activity Logging Setup for Admin Dashboard
-- Run this in your Supabase SQL editor

-- Create the user_activity_logs table
CREATE TABLE IF NOT EXISTS user_activity_logs (
  id SERIAL PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  activity_type TEXT NOT NULL, -- 'profile_update', 'squad_assignment', 'wallet_connect', 'wallet_disconnect', 'course_start', 'course_complete', 'course_approval', 'badge_earned', 'exam_taken', 'login', 'logout'
  activity_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_agent TEXT,
  ip_address TEXT,
  
  -- Profile-related fields
  profile_data JSONB, -- Store profile changes (display_name, squad, etc.)
  
  -- Course-related fields
  course_data JSONB, -- Store course info (course_id, completion_status, etc.)
  
  -- Wallet-related fields
  wallet_data JSONB, -- Store wallet connection details
  
  -- Badge/achievement fields
  achievement_data JSONB, -- Store badge/achievement info
  
  -- Session fields
  session_data JSONB, -- Store session information
  
  -- Metadata
  metadata JSONB, -- Store any additional context
  notes TEXT, -- For admin notes
  
  -- Computed fields for easy querying
  display_name TEXT GENERATED ALWAYS AS (profile_data->>'display_name') STORED,
  squad TEXT GENERATED ALWAYS AS (profile_data->>'squad') STORED,
  course_id TEXT GENERATED ALWAYS AS (course_data->>'course_id') STORED
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_activity_wallet_address ON user_activity_logs(wallet_address);
CREATE INDEX IF NOT EXISTS idx_user_activity_timestamp ON user_activity_logs(activity_timestamp);
CREATE INDEX IF NOT EXISTS idx_user_activity_type ON user_activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_display_name ON user_activity_logs(display_name);
CREATE INDEX IF NOT EXISTS idx_user_activity_squad ON user_activity_logs(squad);
CREATE INDEX IF NOT EXISTS idx_user_activity_course_id ON user_activity_logs(course_id);

-- Enable Row Level Security (RLS)
ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Admins can view all user activity logs" ON user_activity_logs
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert user activity logs" ON user_activity_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can update user activity logs" ON user_activity_logs
  FOR UPDATE USING (true);

-- Create a view for easy admin queries
CREATE OR REPLACE VIEW user_activity_summary AS
SELECT 
  wallet_address,
  display_name,
  squad,
  COUNT(*) as total_activities,
  MAX(activity_timestamp) as last_activity,
  MIN(activity_timestamp) as first_activity,
  COUNT(CASE WHEN activity_type = 'course_complete' THEN 1 END) as courses_completed,
  COUNT(CASE WHEN activity_type = 'course_start' THEN 1 END) as courses_started,
  COUNT(CASE WHEN activity_type = 'badge_earned' THEN 1 END) as badges_earned,
  COUNT(CASE WHEN activity_type = 'login' THEN 1 END) as login_count,
  COUNT(CASE WHEN activity_type = 'profile_update' THEN 1 END) as profile_updates,
  COUNT(CASE WHEN activity_type = 'squad_assignment' THEN 1 END) as squad_changes
FROM user_activity_logs
GROUP BY wallet_address, display_name, squad
ORDER BY last_activity DESC;

-- Create a view for course activity summary
CREATE OR REPLACE VIEW course_activity_summary AS
SELECT 
  course_id,
  COUNT(DISTINCT wallet_address) as unique_users,
  COUNT(CASE WHEN activity_type = 'course_start' THEN 1 END) as total_starts,
  COUNT(CASE WHEN activity_type = 'course_complete' THEN 1 END) as total_completions,
  COUNT(CASE WHEN activity_type = 'course_approval' THEN 1 END) as total_approvals,
  AVG(EXTRACT(EPOCH FROM (activity_timestamp - LAG(activity_timestamp) OVER (PARTITION BY wallet_address, course_id ORDER BY activity_timestamp)))) as avg_completion_time_seconds
FROM user_activity_logs
WHERE course_id IS NOT NULL
GROUP BY course_id
ORDER BY total_completions DESC;

-- Create a view for squad activity summary
CREATE OR REPLACE VIEW squad_activity_summary AS
SELECT 
  squad,
  COUNT(DISTINCT wallet_address) as unique_members,
  COUNT(*) as total_activities,
  COUNT(CASE WHEN activity_type = 'course_complete' THEN 1 END) as courses_completed,
  COUNT(CASE WHEN activity_type = 'badge_earned' THEN 1 END) as badges_earned,
  MAX(activity_timestamp) as last_activity
FROM user_activity_logs
WHERE squad IS NOT NULL
GROUP BY squad
ORDER BY total_activities DESC;

-- Insert sample data for testing (optional)
-- INSERT INTO user_activity_logs (wallet_address, activity_type, profile_data, course_data, notes)
-- VALUES (
--   'test-wallet-123',
--   'profile_update',
--   '{"display_name": "Test User", "squad": "🎤 Hoodie Speakers"}',
--   NULL,
--   'Test profile update'
-- );
