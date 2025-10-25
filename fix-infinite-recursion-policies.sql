-- =====================================================
-- Fix Infinite Recursion in Users Table RLS Policies
-- This script fixes the critical infinite recursion issue
-- =====================================================

-- =====================================================
-- 1. DISABLE RLS TEMPORARILY TO BREAK THE RECURSION
-- =====================================================

-- Disable RLS on users table to stop the infinite recursion
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. DROP ALL EXISTING PROBLEMATIC POLICIES
-- =====================================================

-- Drop all existing policies that might cause recursion
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable update for users based on wallet_address" ON users;
DROP POLICY IF EXISTS "Enable delete for users based on wallet_address" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;
DROP POLICY IF EXISTS "Admins can delete all users" ON users;

-- =====================================================
-- 3. CREATE SAFE RLS POLICIES (NO RECURSION)
-- =====================================================

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow all authenticated users to read users table
-- This is safe because we're not checking admin status within the policy
CREATE POLICY "Allow authenticated users to read users" ON users
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy 2: Allow users to insert their own profile
CREATE POLICY "Allow users to insert own profile" ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'
    OR wallet_address = current_setting('request.jwt.claims', true)::json->>'sub'
  );

-- Policy 3: Allow users to update their own profile
CREATE POLICY "Allow users to update own profile" ON users
  FOR UPDATE
  TO authenticated
  USING (
    wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'
    OR wallet_address = current_setting('request.jwt.claims', true)::json->>'sub'
  );

-- Policy 4: Allow users to delete their own profile
CREATE POLICY "Allow users to delete own profile" ON users
  FOR DELETE
  TO authenticated
  USING (
    wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'
    OR wallet_address = current_setting('request.jwt.claims', true)::json->>'sub'
  );

-- =====================================================
-- 4. CREATE ADMIN FUNCTIONS (SECURITY DEFINER)
-- =====================================================

-- Function to check if a wallet is admin (bypasses RLS)
CREATE OR REPLACE FUNCTION is_wallet_admin(wallet TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- This function runs with elevated privileges and bypasses RLS
  RETURN EXISTS (
    SELECT 1 
    FROM users 
    WHERE wallet_address = wallet 
    AND is_admin = true
  );
END;
$$;

-- Function to get user by wallet (bypasses RLS for admin operations)
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
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.wallet_address, u.display_name, u.squad, u.is_admin, u.created_at, u.updated_at
  FROM users u
  WHERE u.wallet_address = wallet;
END;
$$;

-- Function to update user admin status (admin only)
CREATE OR REPLACE FUNCTION update_user_admin_status(
  target_wallet TEXT,
  new_admin_status BOOLEAN,
  admin_wallet TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the calling user is an admin (bypasses RLS)
  IF NOT EXISTS (
    SELECT 1 FROM users WHERE wallet_address = admin_wallet AND is_admin = true
  ) THEN
    RETURN false;
  END IF;
  
  -- Update the target user's admin status (bypasses RLS)
  UPDATE users 
  SET is_admin = new_admin_status, updated_at = NOW()
  WHERE wallet_address = target_wallet;
  
  RETURN FOUND;
END;
$$;

-- Function to create or update user (for wallet connection tracking)
CREATE OR REPLACE FUNCTION upsert_user(
  user_wallet TEXT,
  user_display_name TEXT DEFAULT NULL,
  user_squad TEXT DEFAULT NULL
)
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
SET search_path = public
AS $$
BEGIN
  -- Insert or update user (bypasses RLS)
  INSERT INTO users (wallet_address, display_name, squad)
  VALUES (user_wallet, user_display_name, user_squad)
  ON CONFLICT (wallet_address)
  DO UPDATE SET
    display_name = COALESCE(EXCLUDED.display_name, users.display_name),
    squad = COALESCE(EXCLUDED.squad, users.squad),
    updated_at = NOW()
  RETURNING users.id, users.wallet_address, users.display_name, users.squad, users.is_admin, users.created_at, users.updated_at;
END;
$$;

-- =====================================================
-- 5. GRANT PERMISSIONS
-- =====================================================

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION is_wallet_admin(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_by_wallet(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_admin_status(TEXT, BOOLEAN, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_user(TEXT, TEXT, TEXT) TO authenticated;

-- =====================================================
-- 6. VERIFY THE FIX
-- =====================================================

-- Check RLS status
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

-- Test the admin check function
SELECT 'Admin Check Test' as test_name, is_wallet_admin('test-wallet-123') as is_admin;

-- Test the user lookup function
SELECT 'User Lookup Test' as test_name, COUNT(*) as found_users 
FROM get_user_by_wallet('test-wallet-123');

-- =====================================================
-- 7. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Ensure we have proper indexes
CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin);
CREATE INDEX IF NOT EXISTS idx_users_squad ON users(squad);

-- =====================================================
-- 8. VERIFY FOREIGN KEY CONSTRAINTS
-- =====================================================

-- Check if foreign key constraints exist for social tables
SELECT
  tc.table_name,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('social_posts', 'social_comments', 'social_reactions', 'social_post_views')
ORDER BY tc.table_name, tc.constraint_name;

-- =====================================================
-- 9. FINAL STATUS CHECK
-- =====================================================

-- Check if essential tables exist and are accessible
SELECT 
  'users' as table_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') 
    THEN '✅ Created' 
    ELSE '❌ Missing' 
  END as status

UNION ALL

SELECT 
  'social_posts' as table_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'social_posts' AND table_schema = 'public') 
    THEN '✅ Created' 
    ELSE '❌ Missing' 
  END as status

UNION ALL

SELECT 
  'social_comments' as table_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'social_comments' AND table_schema = 'public') 
    THEN '✅ Created' 
    ELSE '❌ Missing' 
  END as status;

-- Test a simple query to ensure no recursion
SELECT 'Recursion Test' as test_name, COUNT(*) as user_count FROM users;

-- =====================================================
-- 10. FIX GLOBAL_SETTINGS RLS POLICIES
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

-- Insert default settings if missing
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

-- Test that we can read from global_settings
SELECT 'Global Settings Test' as test_name, COUNT(*) as settings_count 
FROM global_settings;
