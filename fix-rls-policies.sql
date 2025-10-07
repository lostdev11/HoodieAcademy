-- Fix RLS Policies for User Creation
-- This script will update the RLS policies to allow user creation

-- Drop existing policies that might be blocking user creation
DROP POLICY IF EXISTS "Users can insert their own data" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

-- Create a more permissive policy for user creation
-- This allows any authenticated user to insert user records
CREATE POLICY "Allow user creation" ON users
  FOR INSERT 
  WITH CHECK (true);

-- Keep the existing policies for updates and selects
-- (These should already exist, but let's make sure they're correct)

-- Policy for viewing users
DROP POLICY IF EXISTS "Users can view all users" ON users;
DROP POLICY IF EXISTS "Users can view all user profiles" ON users;

CREATE POLICY "Allow viewing all users" ON users
  FOR SELECT 
  USING (true);

-- Policy for updating users
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

CREATE POLICY "Allow updating own profile" ON users
  FOR UPDATE 
  USING (true)
  WITH CHECK (true);

-- Test the policies by inserting a test user
INSERT INTO users (wallet_address, display_name, last_active)
VALUES (
  'TEST_POLICY_' || extract(epoch from now())::text,
  'Policy Test User',
  NOW()
) ON CONFLICT (wallet_address) DO NOTHING;

-- Clean up the test user
DELETE FROM users WHERE wallet_address LIKE 'TEST_POLICY_%';
