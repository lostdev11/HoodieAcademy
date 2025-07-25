-- Diagnostic script to check exam table status
-- Run this first to see what exists in your database

-- Check if tables exist
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables 
WHERE tablename LIKE '%exam%'
ORDER BY tablename;

-- Check if exam_progress table exists and show its structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'exam_progress'
ORDER BY ordinal_position;

-- Check if exam_approvals table exists and show its structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'exam_approvals'
ORDER BY ordinal_position;

-- Check for any tables with 'wallet' in the name
SELECT 
  schemaname,
  tablename
FROM pg_tables 
WHERE tablename LIKE '%wallet%'
ORDER BY tablename;

-- Check for any tables with 'progress' in the name
SELECT 
  schemaname,
  tablename
FROM pg_tables 
WHERE tablename LIKE '%progress%'
ORDER BY tablename;

-- Check for any tables with 'approval' in the name
SELECT 
  schemaname,
  tablename
FROM pg_tables 
WHERE tablename LIKE '%approval%'
ORDER BY tablename; 