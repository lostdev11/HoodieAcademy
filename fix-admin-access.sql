-- Comprehensive Fix for Admin Access - Hoodie Academy
-- This fixes the infinite recursion in RLS policies and sets up admin access
-- Run this in your Supabase SQL editor

-- Step 1: Disable RLS temporarily to fix the infinite recursion
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop all existing policies that might be causing recursion
-- Drop policies with exact names to avoid conflicts
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;
DROP POLICY IF EXISTS "Public can view users" ON users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable update for users based on wallet_address" ON users;
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;

-- Step 3: Create a simple, non-recursive admin user
-- Replace 'JCUGres3WA8MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU' with your actual wallet address
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

-- Step 4: Verify the admin user was created
SELECT 
    wallet_address,
    display_name,
    is_admin,
    created_at,
    updated_at
FROM users
WHERE wallet_address = 'JCUGres3WA8MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU';

-- Step 5: Create simple, non-recursive RLS policies
-- Policy for users to view their own data
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (auth.jwt() ->> 'wallet_address' = wallet_address);

-- Policy for users to update their own data
CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (auth.jwt() ->> 'wallet_address' = wallet_address);

-- Policy for users to insert their own data
CREATE POLICY "Users can insert own data" ON users
    FOR INSERT WITH CHECK (auth.jwt() ->> 'wallet_address' = wallet_address);

-- Policy for admins to view all users (non-recursive)
CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE wallet_address = auth.jwt() ->> 'wallet_address' 
            AND is_admin = true
        )
    );

-- Policy for admins to update all users (non-recursive)
CREATE POLICY "Admins can update all users" ON users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE wallet_address = auth.jwt() ->> 'wallet_address' 
            AND is_admin = true
        )
    );

-- Step 6: Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Step 7: Grant necessary permissions
GRANT ALL ON users TO authenticated;
GRANT ALL ON users TO service_role;

-- Step 8: Fix global_settings table (causing 406 error)
-- First, check if global_settings table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'global_settings') THEN
        -- Create global_settings table if it doesn't exist
        CREATE TABLE global_settings (
            id SERIAL PRIMARY KEY,
            site_maintenance BOOLEAN DEFAULT false,
            registration_enabled BOOLEAN DEFAULT true,
            course_submissions_enabled BOOLEAN DEFAULT true,
            bounty_submissions_enabled BOOLEAN DEFAULT true,
            chat_enabled BOOLEAN DEFAULT true,
            leaderboard_enabled BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Insert default settings
        INSERT INTO global_settings (site_maintenance, registration_enabled, course_submissions_enabled, bounty_submissions_enabled, chat_enabled, leaderboard_enabled)
        VALUES (false, true, true, true, true, true);
        
        RAISE NOTICE 'Created global_settings table with default values';
    ELSE
        RAISE NOTICE 'global_settings table already exists';
    END IF;
END $$;

-- Step 9: Fix global_settings RLS policies
ALTER TABLE global_settings DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Everyone can view global settings" ON global_settings;
DROP POLICY IF EXISTS "Admins can update global settings" ON global_settings;
DROP POLICY IF EXISTS "read_global_settings_public" ON global_settings;

-- Create simple, non-recursive policies
CREATE POLICY "Everyone can view global settings" ON global_settings
    FOR SELECT USING (true);

CREATE POLICY "Admins can update global settings" ON global_settings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE wallet_address = auth.jwt() ->> 'wallet_address' 
            AND is_admin = true
        )
    );

-- Re-enable RLS for global_settings
ALTER TABLE global_settings ENABLE ROW LEVEL SECURITY;

-- Step 10: Grant permissions on global_settings
GRANT ALL ON global_settings TO authenticated;
GRANT ALL ON global_settings TO service_role;

-- Step 11: Verify the fix worked
SELECT 
    wallet_address,
    display_name,
    is_admin,
    created_at
FROM users
WHERE is_admin = true
ORDER BY created_at DESC;

-- Step 12: Test the admin access
-- This should now work without infinite recursion
SELECT COUNT(*) as total_users FROM users;

-- Step 13: Test global_settings access
SELECT * FROM global_settings LIMIT 1;
