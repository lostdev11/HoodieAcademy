-- =====================================================
-- Fix Global Settings RLS Policies
-- This script fixes the global_settings table access issue
-- =====================================================

-- =====================================================
-- 1. CHECK CURRENT RLS STATUS
-- =====================================================

-- Check if RLS is enabled on global_settings
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'global_settings';

-- Check existing policies on global_settings
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
WHERE tablename = 'global_settings';

-- =====================================================
-- 2. FIX GLOBAL_SETTINGS RLS POLICIES
-- =====================================================

-- Enable RLS on global_settings (if not already enabled)
ALTER TABLE global_settings ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "read_global_settings" ON global_settings;
DROP POLICY IF EXISTS "Allow public read access" ON global_settings;
DROP POLICY IF EXISTS "Anyone can read global settings" ON global_settings;

-- Create a policy that allows anyone to read global_settings
-- This is safe because global_settings contains public configuration
CREATE POLICY "read_global_settings" ON global_settings
  FOR SELECT 
  USING (true);

-- =====================================================
-- 3. VERIFY THE FIX
-- =====================================================

-- Test that we can read from global_settings
SELECT 'Global Settings Test' as test_name, COUNT(*) as settings_count 
FROM global_settings;

-- Check the policy was created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'global_settings';

-- =====================================================
-- 4. INSERT DEFAULT SETTINGS IF MISSING
-- =====================================================

-- Ensure we have default global settings
INSERT INTO global_settings (
  site_maintenance, 
  registration_enabled, 
  course_submissions_enabled, 
  bounty_submissions_enabled, 
  chat_enabled, 
  leaderboard_enabled
)
VALUES (false, true, true, true, true, true)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 5. FINAL VERIFICATION
-- =====================================================

-- Verify we can read the settings
SELECT 
  'Final Test' as test_name,
  site_maintenance,
  registration_enabled,
  course_submissions_enabled,
  bounty_submissions_enabled,
  chat_enabled,
  leaderboard_enabled
FROM global_settings
LIMIT 1;
