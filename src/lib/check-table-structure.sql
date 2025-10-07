-- Check the actual structure of your tables
-- Run this to see what columns exist

-- Check profiles table structure
SELECT 
  'profiles' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Check all tracking tables
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('profiles', 'wallets', 'sessions', 'event_log', 'course_progress', 'placement_progress', 'admin_approvals')
ORDER BY table_name, ordinal_position;
