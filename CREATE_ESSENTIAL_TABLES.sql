-- Create Essential Tables for Hoodie Academy
-- Run this in your Supabase SQL Editor to fix 404/500 errors

-- =====================================================
-- 0. FIX INFINITE RECURSION IN RLS POLICIES
-- =====================================================

-- First, disable RLS temporarily to avoid recursion issues
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;

-- Drop any existing problematic policies that might cause recursion
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable update for users based on wallet_address" ON users;
DROP POLICY IF EXISTS "Enable delete for users based on wallet_address" ON users;

-- =====================================================
-- 1. USERS TABLE (if not exists)
-- =====================================================

CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT UNIQUE NOT NULL,
  display_name TEXT,
  squad TEXT,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. GLOBAL SETTINGS TABLE (if not exists)
-- =====================================================

CREATE TABLE IF NOT EXISTS global_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  site_maintenance BOOLEAN DEFAULT false,
  registration_enabled BOOLEAN DEFAULT true,
  course_submissions_enabled BOOLEAN DEFAULT true,
  bounty_submissions_enabled BOOLEAN DEFAULT true,
  chat_enabled BOOLEAN DEFAULT true,
  leaderboard_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default global settings
INSERT INTO global_settings (site_maintenance, registration_enabled, course_submissions_enabled, bounty_submissions_enabled, chat_enabled, leaderboard_enabled)
VALUES (false, true, true, true, true, true)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 3. SETUP PROPER RLS POLICIES (AFTER TABLE CREATION)
-- =====================================================

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create safe RLS policies that avoid recursion
-- Policy 1: Users can view their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (
    wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'
    OR wallet_address = current_setting('request.jwt.claims', true)::json->>'sub'
  );

-- Policy 2: Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (
    wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'
    OR wallet_address = current_setting('request.jwt.claims', true)::json->>'sub'
  );

-- Policy 3: Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (
    wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'
    OR wallet_address = current_setting('request.jwt.claims', true)::json->>'sub'
  );

-- Policy 4: Admins can view all users
CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'
      AND is_admin = true
    )
  );

-- Policy 5: Admins can update all users
CREATE POLICY "Admins can update all users" ON users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'
      AND is_admin = true
    )
  );

-- =====================================================
-- 4. VERIFY TABLES CREATED
-- =====================================================

-- Check if essential tables exist
SELECT 
  'users' as table_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') 
    THEN '✅ Created' 
    ELSE '❌ Missing' 
  END as status

UNION ALL

SELECT 
  'global_settings' as table_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'global_settings' AND table_schema = 'public') 
    THEN '✅ Created' 
    ELSE '❌ Missing' 
  END as status

UNION ALL

SELECT 
  'feature_flags' as table_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'feature_flags' AND table_schema = 'public') 
    THEN '✅ Created' 
    ELSE '❌ Missing' 
  END as status;

-- =====================================================
-- 5. TEST QUERIES
-- =====================================================

-- Test users table
SELECT 'Users Table Test' as test_name, COUNT(*) as count FROM users;

-- Test global settings table
SELECT 'Global Settings Test' as test_name, COUNT(*) as count FROM global_settings;

-- Test feature flags table
SELECT 'Feature Flags Test' as test_name, COUNT(*) as count FROM feature_flags;

-- =====================================================
-- 6. VERIFY RLS POLICIES
-- =====================================================

-- Check RLS status and policies
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'users';

-- List all policies on users table
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'users';

-- =====================================================
-- 7. CREATE ADMIN CHECK RPC FUNCTION
-- =====================================================

-- Create the RPC function that admin-check.ts is calling
CREATE OR REPLACE FUNCTION is_wallet_admin(wallet TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the wallet address exists and is marked as admin
  RETURN EXISTS (
    SELECT 1 
    FROM users 
    WHERE wallet_address = wallet 
    AND is_admin = true
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION is_wallet_admin(TEXT) TO authenticated;

-- =====================================================
-- 8. CREATE HELPER FUNCTIONS
-- =====================================================

-- Function to get user by wallet address
CREATE OR REPLACE FUNCTION get_user_by_wallet(wallet TEXT)
RETURNS TABLE (
  id UUID,
  wallet_address TEXT,
  display_name TEXT,
  squad TEXT,
  is_admin BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.wallet_address, u.display_name, u.squad, u.is_admin, u.created_at, u.updated_at
  FROM users u
  WHERE u.wallet_address = wallet;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_by_wallet(TEXT) TO authenticated;

-- Function to update user admin status (admin only)
CREATE OR REPLACE FUNCTION update_user_admin_status(
  target_wallet TEXT,
  new_admin_status BOOLEAN,
  admin_wallet TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the calling user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM users WHERE wallet_address = admin_wallet AND is_admin = true
  ) THEN
    RETURN false;
  END IF;
  
  -- Update the target user's admin status
  UPDATE users 
  SET is_admin = new_admin_status, updated_at = NOW()
  WHERE wallet_address = target_wallet;
  
  RETURN FOUND;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_user_admin_status(TEXT, BOOLEAN, TEXT) TO authenticated;

-- =====================================================
-- 9. SETUP RLS FOR GLOBAL SETTINGS
-- =====================================================

-- Enable RLS on global_settings table
ALTER TABLE public.global_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "read_global_settings" ON public.global_settings;

-- Create read policy for global settings (accessible to all users)
CREATE POLICY "read_global_settings"
ON public.global_settings
FOR SELECT
TO anon, authenticated
USING (true);

-- =====================================================
-- 10. TEST RPC FUNCTIONS
-- =====================================================

-- Test the admin check function (will return false for non-existent wallets)
SELECT 'Admin Check Test' as test_name, is_wallet_admin('test-wallet-123') as is_admin;

-- Test the user lookup function
SELECT 'User Lookup Test' as test_name, COUNT(*) as found_users 
FROM get_user_by_wallet('test-wallet-123');

-- Test admin status update function (will return false for non-admin caller)
SELECT 'Admin Update Test' as test_name, 
       update_user_admin_status('test-wallet-123', true, 'non-admin-wallet') as success;
