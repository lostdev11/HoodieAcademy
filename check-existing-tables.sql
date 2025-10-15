-- =========================================
-- CHECK WHICH TABLES EXIST
-- =========================================
-- Run this to see what tables you have
-- This helps us understand what needs to be fixed

-- List all your public tables
SELECT 
  tablename,
  schemaname
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check which tables have RLS enabled
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY rls_enabled DESC, tablename;

-- Check which views exist
SELECT 
  table_name as viewname,
  view_definition
FROM information_schema.views 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check existing RLS policies
SELECT 
  tablename,
  policyname,
  permissive,
  cmd as operation
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

