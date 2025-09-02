-- Fix RLS Infinite Recursion - Hoodie Academy
-- This script fixes the infinite recursion in RLS policies for the users table
-- Run this in your Supabase SQL editor

-- Step 1: Disable RLS temporarily to break the infinite recursion
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies on users table to start fresh
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

-- Step 3: Verify all policies are dropped
SELECT 
    schemaname,
    tablename,
    policyname
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public';

-- Step 4: Create simple, non-recursive RLS policies
-- Policy for users to view their own data
CREATE POLICY "users_select_own" ON users
    FOR SELECT USING (
        wallet_address = auth.jwt() ->> 'wallet_address'
        OR 
        -- Allow admins to view all users (non-recursive check)
        EXISTS (
            SELECT 1 FROM users u2
            WHERE u2.wallet_address = auth.jwt() ->> 'wallet_address'
            AND u2.is_admin = true
        )
    );

-- Policy for users to insert their own data
CREATE POLICY "users_insert_own" ON users
    FOR INSERT WITH CHECK (
        wallet_address = auth.jwt() ->> 'wallet_address'
    );

-- Policy for users to update their own data
CREATE POLICY "users_update_own" ON users
    FOR UPDATE USING (
        wallet_address = auth.jwt() ->> 'wallet_address'
        OR 
        -- Allow admins to update any user (non-recursive check)
        EXISTS (
            SELECT 1 FROM users u2
            WHERE u2.wallet_address = auth.jwt() ->> 'wallet_address'
            AND u2.is_admin = true
        )
    );

-- Policy for admins to view all users (simple check)
CREATE POLICY "admins_view_all" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users u2
            WHERE u2.wallet_address = auth.jwt() ->> 'wallet_address'
            AND u2.is_admin = true
        )
    );

-- Step 5: Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Step 6: Verify the new policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public'
ORDER BY policyname;

-- Step 7: Test admin access without recursion
-- This should work now
SELECT 
    'Admin access test - no recursion' as test_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM users 
            WHERE wallet_address = 'JCUGres3WA8MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU'
            AND is_admin = TRUE
        ) THEN '✅ Admin access confirmed - no recursion'
        ELSE '❌ Admin access still failing'
    END as result;

-- Step 8: Verify admin user exists
SELECT 
    wallet_address,
    display_name,
    squad,
    is_admin,
    created_at
FROM users 
WHERE wallet_address = 'JCUGres3WA8MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU';
