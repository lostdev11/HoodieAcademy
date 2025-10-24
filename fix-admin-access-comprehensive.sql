-- =====================================================
-- COMPREHENSIVE ADMIN ACCESS FIX
-- =====================================================
-- This script fixes all admin access issues by:
-- 1. Creating a unified admin authentication system
-- 2. Fixing RLS policies that are blocking admin access
-- 3. Ensuring all admin functions work consistently

-- =====================================================
-- STEP 1: Drop conflicting policies and functions
-- =====================================================

-- Drop existing admin functions to avoid conflicts
DROP FUNCTION IF EXISTS is_wallet_admin(TEXT);
DROP FUNCTION IF EXISTS public.is_admin();
DROP FUNCTION IF EXISTS is_admin();

-- Drop problematic RLS policies
DROP POLICY IF EXISTS "bounties read open" ON public.bounties;
DROP POLICY IF EXISTS "bounties admin write" ON public.bounties;
DROP POLICY IF EXISTS "bounties read all" ON public.bounties;
DROP POLICY IF EXISTS "bounties admin all" ON public.bounties;
DROP POLICY IF EXISTS "bounties self read" ON public.bounties;
DROP POLICY IF EXISTS "bounties self write" ON public.bounties;

-- =====================================================
-- STEP 2: Create unified admin authentication system
-- =====================================================

-- Create a comprehensive admin check function
CREATE OR REPLACE FUNCTION public.is_wallet_admin(wallet TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Always allow service role (for API calls)
  IF current_setting('request.jwt.claims', true)::json->>'role' = 'service_role' THEN
    RETURN TRUE;
  END IF;
  
  -- Check if wallet is in the users table with is_admin = true
  IF EXISTS (
    SELECT 1 
    FROM users 
    WHERE wallet_address = wallet 
    AND is_admin = true
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- Fallback: Check hardcoded admin wallets
  RETURN wallet IN (
    'JCUGres3WA8MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU',
    'qg7pNNZq7qDQuc6Xkd1x4NvS2VM3aHtCqHEzucZxRGA',
    '7vswdZFphxbtd1tCB5EhLNn2khiDiKmQEehSNUFHjz7M',
    '63B9jg8iBy9pf4W4VDizbQnBD45QujmzbHyGRtHxknr7'
  );
END;
$$;

-- Grant execute permission to all users
GRANT EXECUTE ON FUNCTION public.is_wallet_admin(TEXT) TO authenticated, anon;

-- =====================================================
-- STEP 3: Create simplified RLS policies
-- =====================================================

-- Fix bounties table policies
CREATE POLICY "bounties read all" ON public.bounties
  FOR SELECT USING (true);

CREATE POLICY "bounties admin write" ON public.bounties
  FOR ALL USING (public.is_wallet_admin(auth.jwt() ->> 'wallet_address'));

-- Fix users table policies
DROP POLICY IF EXISTS "users read all" ON public.users;
DROP POLICY IF EXISTS "users admin write" ON public.users;
DROP POLICY IF EXISTS "users self read" ON public.users;
DROP POLICY IF EXISTS "users self write" ON public.users;

CREATE POLICY "users read all" ON public.users
  FOR SELECT USING (true);

CREATE POLICY "users admin write" ON public.users
  FOR ALL USING (public.is_wallet_admin(auth.jwt() ->> 'wallet_address'));

-- Fix user_feedback_submissions policies
DROP POLICY IF EXISTS "Anyone can submit feedback" ON public.user_feedback_submissions;
DROP POLICY IF EXISTS "Anyone can read feedback" ON public.user_feedback_submissions;
DROP POLICY IF EXISTS "Admins can update feedback" ON public.user_feedback_submissions;

CREATE POLICY "Anyone can submit feedback" ON public.user_feedback_submissions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can read feedback" ON public.user_feedback_submissions
  FOR SELECT USING (true);

CREATE POLICY "Admins can update feedback" ON public.user_feedback_submissions
  FOR UPDATE USING (public.is_wallet_admin(auth.jwt() ->> 'wallet_address'));

-- Fix student_of_the_week_settings policies
DROP POLICY IF EXISTS "Anyone can read student of the week settings" ON public.student_of_the_week_settings;
DROP POLICY IF EXISTS "Admins can update student of the week settings" ON public.student_of_the_week_settings;

CREATE POLICY "Anyone can read student of the week settings" ON public.student_of_the_week_settings
  FOR SELECT USING (true);

CREATE POLICY "Admins can update student of the week settings" ON public.student_of_the_week_settings
  FOR ALL USING (public.is_wallet_admin(auth.jwt() ->> 'wallet_address'));

-- =====================================================
-- STEP 4: Ensure admin users exist in database
-- =====================================================

-- Insert admin users if they don't exist
INSERT INTO users (wallet_address, display_name, is_admin, total_xp, level, created_at, updated_at)
VALUES 
  ('JCUGres3WA8MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU', 'Admin 1', true, 0, 1, NOW(), NOW()),
  ('qg7pNNZq7qDQuc6Xkd1x4NvS2VM3aHtCqHEzucZxRGA', 'Admin 2', true, 0, 1, NOW(), NOW()),
  ('7vswdZFphxbtd1tCB5EhLNn2khiDiKmQEehSNUFHjz7M', 'Admin 3', true, 0, 1, NOW(), NOW()),
  ('63B9jg8iBy9pf4W4VDizbQnBD45QujmzbHyGRtHxknr7', 'Admin 4', true, 0, 1, NOW(), NOW())
ON CONFLICT (wallet_address) 
DO UPDATE SET 
  is_admin = true,
  updated_at = NOW();

-- =====================================================
-- STEP 5: Create helper function for API authentication
-- =====================================================

-- Create a function that works with service role
CREATE OR REPLACE FUNCTION public.check_admin_access(wallet TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Always allow service role
  IF current_setting('request.jwt.claims', true)::json->>'role' = 'service_role' THEN
    RETURN TRUE;
  END IF;
  
  -- Check admin status
  RETURN public.is_wallet_admin(wallet);
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.check_admin_access(TEXT) TO authenticated, anon;

-- =====================================================
-- STEP 6: Test admin access
-- =====================================================

-- Test the admin function
SELECT 
  wallet_address,
  is_admin,
  public.is_wallet_admin(wallet_address) as function_result
FROM users 
WHERE is_admin = true;

-- Show current admin users
SELECT 
  'Admin users in database:' as info,
  COUNT(*) as count
FROM users 
WHERE is_admin = true;

-- =====================================================
-- STEP 7: Verify RLS policies
-- =====================================================

-- Check RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('users', 'bounties', 'user_feedback_submissions', 'student_of_the_week_settings');

-- List policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('users', 'bounties', 'user_feedback_submissions', 'student_of_the_week_settings')
ORDER BY tablename, policyname;
