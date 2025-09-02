-- Complete Fix for Admin Access - Hoodie Academy
-- This script will fix the admin access issue for wallet JCUGres3WA8MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU
-- Run this in your Supabase SQL editor

-- Step 1: Add is_admin column if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Step 2: Create index for admin users
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin);

-- Step 3: Insert or update the admin user
INSERT INTO users (
    wallet_address, 
    display_name, 
    squad,
    is_admin, 
    created_at,
    updated_at,
    last_active
) VALUES (
    'JCUGres3WA8MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU',
    'Prince 1',
    'Creators',
    true,
    NOW(),
    NOW(),
    NOW()
) ON CONFLICT (wallet_address) 
DO UPDATE SET 
    is_admin = true,
    display_name = 'Prince 1',
    squad = 'Creators',
    updated_at = NOW(),
    last_active = NOW();

-- Step 4: Verify the admin user was created
SELECT 
    wallet_address,
    display_name,
    squad,
    is_admin,
    created_at,
    updated_at,
    last_active
FROM users
WHERE wallet_address = 'JCUGres3WA8MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU';

-- Step 5: Check all admin users
SELECT 
    wallet_address,
    display_name,
    squad,
    is_admin,
    created_at
FROM users 
WHERE is_admin = TRUE
ORDER BY created_at;

-- Step 6: Test admin access
-- This should return the admin user if everything is working
SELECT 
    'Admin access test' as test_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM users 
            WHERE wallet_address = 'JCUGres3WA8MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU'
            AND is_admin = TRUE
        ) THEN '✅ Admin access confirmed'
        ELSE '❌ Admin access denied'
    END as result;
