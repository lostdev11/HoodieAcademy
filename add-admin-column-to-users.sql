-- Add is_admin column to users table if it doesn't exist
-- This script is safe to run multiple times

-- Check if is_admin column exists, if not add it
DO $$
BEGIN
    -- Add is_admin column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'is_admin'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added is_admin column to users table';
    ELSE
        RAISE NOTICE 'is_admin column already exists in users table';
    END IF;
END $$;

-- Set your wallet as admin (replace with your actual wallet address)
UPDATE public.users 
SET is_admin = TRUE 
WHERE wallet_address = 'JCUGres3WA8MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU';

-- Verify the admin status
SELECT 
    wallet_address,
    display_name,
    is_admin,
    total_xp,
    level
FROM public.users 
WHERE wallet_address = 'JCUGres3WA8MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU';

-- Show all users with admin status
SELECT 
    wallet_address,
    display_name,
    is_admin,
    total_xp,
    level,
    created_at
FROM public.users 
ORDER BY created_at DESC;
