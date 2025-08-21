-- Verification Script for Admin Setup
-- Run these queries to verify your admin setup is working

-- =====================================================
-- 1. CHECK ADMIN USERS
-- =====================================================

-- Check if admin users exist
SELECT 
  wallet_address,
  display_name,
  squad,
  is_admin,
  created_at,
  last_active
FROM users 
WHERE is_admin = TRUE
ORDER BY created_at;

-- =====================================================
-- 2. CHECK TOTAL USER COUNT
-- =====================================================

-- Count total users
SELECT COUNT(*) as total_users FROM users;

-- Count admin users
SELECT COUNT(*) as admin_users FROM users WHERE is_admin = TRUE;

-- Count regular users
SELECT COUNT(*) as regular_users FROM users WHERE is_admin = FALSE OR is_admin IS NULL;

-- =====================================================
-- 3. CHECK RLS POLICIES
-- =====================================================

-- Check existing policies on users table
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
WHERE tablename = 'users'
ORDER BY policyname;

-- =====================================================
-- 4. TEST ADMIN ACCESS
-- =====================================================

-- This query should work if you're connected as an admin
-- (You'll need to run this from your application with admin wallet connected)
SELECT 
  'Admin access test' as test_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM users 
      WHERE wallet_address = auth.jwt() ->> 'wallet_address' 
      AND is_admin = TRUE
    ) THEN '✅ Admin access confirmed'
    ELSE '❌ Admin access denied'
  END as result;
