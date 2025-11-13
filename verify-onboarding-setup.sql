-- Verification script for Onboarding Tasks System
-- Run this to verify the table was created correctly

-- Check 1: Verify table exists
SELECT 
  'Table Exists' as check_name,
  CASE 
    WHEN COUNT(*) = 1 THEN '✅ PASS' 
    ELSE '❌ FAIL' 
  END as status,
  CASE 
    WHEN COUNT(*) = 1 THEN 'onboarding_tasks table created successfully' 
    ELSE 'Table missing - rerun setup-onboarding-tasks.sql' 
  END as message
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'onboarding_tasks'

UNION ALL

-- Check 2: Verify columns exist
SELECT 
  'Columns Exist' as check_name,
  CASE 
    WHEN COUNT(*) >= 8 THEN '✅ PASS' 
    ELSE '❌ FAIL' 
  END as status,
  COUNT(*)::text || ' columns found (expected: 8)' as message
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'onboarding_tasks'

UNION ALL

-- Check 3: Verify indexes exist
SELECT 
  'Indexes Created' as check_name,
  CASE 
    WHEN COUNT(*) >= 3 THEN '✅ PASS' 
    ELSE '⚠️ WARNING' 
  END as status,
  COUNT(*)::text || ' indexes created for performance' as message
FROM pg_indexes 
WHERE tablename = 'onboarding_tasks'

UNION ALL

-- Check 4: Verify trigger exists
SELECT 
  'Trigger Created' as check_name,
  CASE 
    WHEN COUNT(*) >= 1 THEN '✅ PASS' 
    ELSE '❌ FAIL' 
  END as status,
  COUNT(*)::text || ' trigger(s) created for auto-updates' as message
FROM information_schema.triggers 
WHERE event_object_table = 'onboarding_tasks';

-- Display table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'onboarding_tasks'
ORDER BY ordinal_position;

-- Show current row count (should be 0 for new table)
SELECT 
  'Current Data' as info,
  COUNT(*) as total_tasks,
  COUNT(*) FILTER (WHERE completed = true) as completed_tasks,
  COUNT(*) FILTER (WHERE completed = false) as pending_tasks
FROM onboarding_tasks;

