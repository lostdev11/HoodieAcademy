-- Check Admin Status Script for Hoodie Academy
-- Run this in your Supabase SQL editor to diagnose admin access issues

-- 1. Check all users and their admin status
SELECT 
    wallet_address,
    display_name,
    is_admin,
    created_at,
    last_active
FROM users
ORDER BY is_admin DESC, created_at DESC;

-- 2. Check specifically for admin users
SELECT 
    wallet_address,
    display_name,
    created_at,
    last_active
FROM users
WHERE is_admin = true
ORDER BY created_at DESC;

-- 3. Check if a specific wallet exists and its admin status
-- Replace 'YOUR_WALLET_ADDRESS_HERE' with your actual wallet address
SELECT 
    wallet_address,
    display_name,
    is_admin,
    created_at,
    last_active
FROM users
WHERE wallet_address = 'YOUR_WALLET_ADDRESS_HERE';

-- 4. Set a wallet as admin (run this if your wallet exists but isn't admin)
-- Replace 'YOUR_WALLET_ADDRESS_HERE' with your actual wallet address
UPDATE users 
SET is_admin = true
WHERE wallet_address = 'YOUR_WALLET_ADDRESS_HERE';

-- 5. Insert a new admin user if your wallet doesn't exist
-- Replace 'YOUR_WALLET_ADDRESS_HERE' with your actual wallet address
-- Replace 'Your Display Name' with your preferred display name
INSERT INTO users (
    wallet_address, 
    display_name, 
    is_admin, 
    created_at,
    last_active
) VALUES (
    'YOUR_WALLET_ADDRESS_HERE',
    'Your Display Name',
    true,
    NOW(),
    NOW()
) ON CONFLICT (wallet_address) 
DO UPDATE SET 
    is_admin = true,
    last_active = NOW();

-- 6. Verify the change worked
SELECT 
    wallet_address,
    display_name,
    is_admin,
    created_at,
    last_active
FROM users
WHERE wallet_address = 'YOUR_WALLET_ADDRESS_HERE';

-- 7. Check RLS policies on the users table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'users';

-- 8. Check if there are any constraints on the users table
SELECT 
    constraint_name,
    constraint_type,
    table_name,
    column_name
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage ccu 
    ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_name = 'users';

-- 9. Check the actual structure of your users table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;
