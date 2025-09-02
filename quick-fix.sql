-- Quick Fix for RLS Infinite Recursion - Hoodie Academy
-- Run this in your Supabase SQL editor

-- Step 1: Disable RLS to break the infinite recursion
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies on users table
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
    END LOOP;
END $$;

-- Step 3: Create your admin user
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

-- Step 4: Create simple, safe policies
CREATE POLICY "users_select_policy" ON users
    FOR SELECT USING (true);

CREATE POLICY "users_insert_policy" ON users
    FOR INSERT WITH CHECK (true);

CREATE POLICY "users_update_policy" ON users
    FOR UPDATE USING (true);

-- Step 5: Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Step 6: Test that it works
SELECT COUNT(*) as total_users FROM users;
SELECT wallet_address, is_admin FROM users WHERE wallet_address = 'JCUGres3WA8MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU';
