-- Fix existing feedback policies
-- Run this in your Supabase SQL Editor

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can submit feedback" ON user_feedback_submissions;
DROP POLICY IF EXISTS "Anyone can read feedback" ON user_feedback_submissions;
DROP POLICY IF EXISTS "Admins can update feedback" ON user_feedback_submissions;

-- Recreate the policies with correct permissions
CREATE POLICY "Anyone can submit feedback"
  ON user_feedback_submissions
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can read feedback"
  ON user_feedback_submissions
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can update feedback"
  ON user_feedback_submissions
  FOR UPDATE
  USING (true);

-- Verify the table exists and has data
SELECT 
  COUNT(*) as total_feedback,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_feedback,
  COUNT(CASE WHEN status = 'reviewing' THEN 1 END) as reviewing_feedback,
  COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_feedback,
  COUNT(CASE WHEN status = 'implemented' THEN 1 END) as implemented_feedback,
  COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_feedback
FROM user_feedback_submissions;

-- Show recent feedback submissions
SELECT 
  id,
  title,
  category,
  status,
  wallet_address,
  created_at
FROM user_feedback_submissions 
ORDER BY created_at DESC 
LIMIT 10;
