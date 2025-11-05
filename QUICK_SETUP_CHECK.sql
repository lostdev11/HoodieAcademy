-- =============================================
-- Quick Setup Verification Queries
-- Run these to verify everything is set up correctly
-- =============================================

-- 1. Verify all new columns exist
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE (table_name = 'feedback_updates' AND column_name = 'original_submission_id')
   OR (table_name = 'user_feedback_submissions' AND column_name = 'completion_status')
ORDER BY table_name, column_name;

-- 2. Verify upvote table was created
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'user_feedback_upvotes'
ORDER BY ordinal_position;

-- 3. Verify triggers exist
SELECT 
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name LIKE '%feedback%'
   OR trigger_name LIKE '%upvote%'
ORDER BY trigger_name;

-- 4. Verify functions exist
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_name IN (
  'update_feedback_upvote_count',
  'update_feedback_completion_status',
  'update_user_feedback_updated_at'
);

-- 5. Check indexes were created
SELECT 
  indexname,
  tablename,
  indexdef
FROM pg_indexes
WHERE indexname LIKE 'idx_%feedback%'
   OR indexname LIKE 'idx_%upvote%'
ORDER BY tablename, indexname;

-- 6. Verify RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('user_feedback_upvotes')
ORDER BY tablename, policyname;

-- 7. Check your existing data with new fields
SELECT 
  id,
  title,
  status,
  upvotes,
  completion_status,
  admin_notes
FROM user_feedback_submissions
ORDER BY created_at DESC
LIMIT 10;

-- 8. Summary of current state
SELECT 
  'Total Submissions' as metric,
  COUNT(*)::text as value
FROM user_feedback_submissions
UNION ALL
SELECT 
  'Total Upvotes' as metric,
  COUNT(*)::text
FROM user_feedback_upvotes
UNION ALL
SELECT 
  'Linked Patch Notes' as metric,
  COUNT(*)::text
FROM feedback_updates
WHERE original_submission_id IS NOT NULL
UNION ALL
SELECT 
  'Avg Upvotes per Submission' as metric,
  ROUND(AVG(upvotes), 2)::text
FROM user_feedback_submissions;

-- 9. Check for any issues with completion_status
SELECT 
  status,
  COUNT(*) as submissions,
  MIN(completion_status) as min_completion,
  MAX(completion_status) as max_completion,
  AVG(completion_status)::numeric(5,2) as avg_completion
FROM user_feedback_submissions
GROUP BY status
ORDER BY status;

-- 10. Verify trigger logic works (should all match)
SELECT 
  ufs.id,
  ufs.title,
  ufs.upvotes as database_count,
  COUNT(ufu.id) as actual_count,
  CASE 
    WHEN ufs.upvotes = COUNT(ufu.id) THEN '✅ Match'
    ELSE '❌ Mismatch'
  END as status
FROM user_feedback_submissions ufs
LEFT JOIN user_feedback_upvotes ufu ON ufs.id = ufu.feedback_id
GROUP BY ufs.id, ufs.title, ufs.upvotes
HAVING ufs.upvotes != COUNT(ufu.id)
LIMIT 5;

-- This should return 0 rows if triggers are working correctly

