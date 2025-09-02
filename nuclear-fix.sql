-- NUCLEAR FIX for RLS Infinite Recursion - Hoodie Academy
-- This completely disables RLS and rebuilds everything from scratch
-- Run this in your Supabase SQL editor

-- Step 1: COMPLETELY DISABLE RLS on all tables
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE global_settings DISABLE ROW LEVEL SECURITY;

-- Step 2: DROP ALL POLICIES on users table (nuclear option)
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Drop all policies on users table
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'users' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON users';
        RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
    END LOOP;
    
    -- Also try to drop any remaining policies by name
    EXECUTE 'DROP POLICY IF EXISTS "Users can view own data" ON users';
    EXECUTE 'DROP POLICY IF EXISTS "Users can update own data" ON users';
    EXECUTE 'DROP POLICY IF EXISTS "Users can insert own data" ON users';
    EXECUTE 'DROP POLICY IF EXISTS "Admins can view all users" ON users';
    EXECUTE 'DROP POLICY IF EXISTS "Admins can update all users" ON users';
    EXECUTE 'DROP POLICY IF EXISTS "users_select_policy" ON users';
    EXECUTE 'DROP POLICY IF EXISTS "users_insert_policy" ON users';
    EXECUTE 'DROP POLICY IF EXISTS "users_update_policy" ON users';
    
    RAISE NOTICE 'All policies dropped from users table';
END $$;

-- Step 3: DROP ALL POLICIES on global_settings table
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'global_settings' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON global_settings';
        RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
    END LOOP;
    
    RAISE NOTICE 'All policies dropped from global_settings table';
END $$;

-- Step 4: Verify no policies remain
SELECT 
    schemaname,
    tablename,
    policyname
FROM pg_policies 
WHERE tablename IN ('users', 'global_settings') 
AND schemaname = 'public';

-- Step 5: Create your admin user (if not exists)
INSERT INTO users (
    wallet_address, 
    display_name, 
    is_admin, 
    created_at,
    updated_at
) VALUES (
    'JCUGres3WA8MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU',
    'Admin User',
    true,
    NOW(),
    NOW()
) ON CONFLICT (wallet_address) 
DO UPDATE SET 
    is_admin = true,
    updated_at = NOW();

-- Step 6: Test basic access (should work now)
SELECT COUNT(*) as total_users FROM users;
SELECT wallet_address, is_admin FROM users WHERE wallet_address = 'JCUGres3MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU';
SELECT * FROM global_settings LIMIT 1;

-- Step 7: Create VERY SIMPLE policies (only if you want RLS)
-- WARNING: Only uncomment these if you want RLS enabled
/*
-- Enable RLS with simple policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_settings ENABLE ROW LEVEL SECURITY;

-- Create ultra-simple policies
CREATE POLICY "users_all" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "global_settings_all" ON global_settings FOR ALL USING (true) WITH CHECK (true);
*/

-- Step 8: Final verification
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name IN ('users', 'global_settings') 
AND table_schema = 'public';
