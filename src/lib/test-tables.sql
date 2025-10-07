-- Test script to verify tables were created correctly
-- Run this after running the minimal schema

-- Check if all tables exist
SELECT 
  table_name,
  CASE 
    WHEN table_name IN ('profiles', 'wallets', 'sessions', 'event_log', 'course_progress', 'placement_progress', 'admin_approvals') 
    THEN '✅ Created'
    ELSE '❌ Missing'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('profiles', 'wallets', 'sessions', 'event_log', 'course_progress', 'placement_progress', 'admin_approvals')
ORDER BY table_name;

-- Check if columns exist in profiles table
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Check if event_kind enum exists
SELECT 
  typname as enum_name,
  enumlabel as enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid 
WHERE typname = 'event_kind'
ORDER BY e.enumsortorder;
