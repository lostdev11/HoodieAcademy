-- Fix Admin Access for JCUGres3WA8MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU
-- Run this in your Supabase SQL editor

-- First, let's see what columns your users table actually has
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- Check if your wallet exists and its current status
SELECT 
    wallet_address,
    display_name,
    is_admin,
    created_at
FROM users
WHERE wallet_address = 'JCUGres3WA8MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU';

-- If your wallet exists but isn't admin, make it admin
UPDATE users 
SET is_admin = true
WHERE wallet_address = 'JCUGres3WA8MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU';

-- If your wallet doesn't exist, create it as admin
INSERT INTO users (
    wallet_address, 
    display_name, 
    is_admin, 
    created_at
) VALUES (
    'JCUGres3WA8MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU',
    'Admin User',
    true,
    NOW()
) ON CONFLICT (wallet_address) 
DO UPDATE SET 
    is_admin = true;

-- Verify the fix worked
SELECT 
    wallet_address,
    display_name,
    is_admin,
    created_at
FROM users
WHERE wallet_address = 'JCUGres3WA8MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU';

-- Show all admin users
SELECT 
    wallet_address,
    display_name,
    created_at
FROM users
WHERE is_admin = true
ORDER BY created_at DESC;
