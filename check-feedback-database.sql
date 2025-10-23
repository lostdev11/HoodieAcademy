-- Check feedback database status
-- Run this in your Supabase SQL Editor

-- 1. Check if the table exists and has data
SELECT 
  COUNT(*) as total_feedback,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_feedback,
  COUNT(CASE WHEN status = 'reviewing' THEN 1 END) as reviewing_feedback,
  COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_feedback,
  COUNT(CASE WHEN status = 'implemented' THEN 1 END) as implemented_feedback,
  COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_feedback
FROM user_feedback_submissions;

-- 2. Show recent feedback submissions
SELECT 
  id,
  title,
  category,
  status,
  wallet_address,
  created_at,
  updated_at
FROM user_feedback_submissions 
ORDER BY created_at DESC 
LIMIT 10;

-- 3. Check table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'user_feedback_submissions'
ORDER BY ordinal_position;

-- 4. Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'user_feedback_submissions';
