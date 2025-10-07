-- Verification script to check if the tracking system is set up correctly
-- Run this to verify your setup

-- Check if all tables exist
SELECT 
  'Tables' as check_type,
  table_name as name,
  CASE 
    WHEN table_name IN ('profiles', 'wallets', 'sessions', 'event_log', 'course_progress', 'placement_progress', 'admin_approvals') 
    THEN '✅ Created'
    ELSE '❌ Missing'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('profiles', 'wallets', 'sessions', 'event_log', 'course_progress', 'placement_progress', 'admin_approvals')

UNION ALL

-- Check if event_kind enum exists
SELECT 
  'Enum' as check_type,
  typname as name,
  '✅ Created' as status
FROM pg_type 
WHERE typname = 'event_kind'

UNION ALL

-- Check RLS status
SELECT 
  'RLS' as check_type,
  schemaname||'.'||tablename as name,
  CASE WHEN rowsecurity THEN '✅ Enabled' ELSE '❌ Disabled' END as status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'wallets', 'sessions', 'event_log', 'course_progress', 'placement_progress', 'admin_approvals')

ORDER BY check_type, name;
