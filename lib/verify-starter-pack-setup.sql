-- Verification script to check if starter_pack_claims table is set up correctly
-- Run this in Supabase SQL Editor to verify the setup

-- Check if table exists
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'starter_pack_claims'
ORDER BY ordinal_position;

-- Check indexes
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'starter_pack_claims';

-- Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'starter_pack_claims';

-- Check triggers
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'starter_pack_claims';

-- Check if RLS is enabled
SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'starter_pack_claims';

