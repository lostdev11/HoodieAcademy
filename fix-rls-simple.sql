-- Simple RLS Fix - Hoodie Academy
-- This script completely disables RLS temporarily to fix admin access
-- Run this in your Supabase SQL editor

-- Step 1: Completely disable RLS on users table
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop all existing policies
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'users' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON users';
        RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
    END LOOP;
END $$;

-- Step 3: Verify RLS is disabled and no policies exist
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'users' AND schemaname = 'public';

SELECT 
    schemaname,
    tablename,
    policyname
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public';

-- Step 4: Test admin access without RLS
SELECT 
    'Admin access test - RLS disabled' as test_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM users 
            WHERE wallet_address = 'JCUGres3WA8MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU'
            AND is_admin = TRUE
        ) THEN '✅ Admin access confirmed - RLS disabled'
        ELSE '❌ Admin access still failing'
    END as result;

-- Step 5: Show admin user details
SELECT 
    wallet_address,
    display_name,
    squad,
    is_admin,
    created_at
FROM users 
WHERE wallet_address = 'JCUGres3WA8MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU';

-- Step 6: Show all admin users
SELECT 
    wallet_address,
    display_name,
    squad,
    is_admin,
    created_at
FROM users 
WHERE is_admin = TRUE
ORDER BY created_at;
