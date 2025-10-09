-- Add missing columns to users table
-- This script is safe to run multiple times

-- Add is_admin column if it doesn't exist
DO $$
BEGIN
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

-- Add total_xp column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'total_xp'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.users ADD COLUMN total_xp INTEGER DEFAULT 0;
        RAISE NOTICE 'Added total_xp column to users table';
    ELSE
        RAISE NOTICE 'total_xp column already exists in users table';
    END IF;
END $$;

-- Add level column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'level'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.users ADD COLUMN level INTEGER DEFAULT 1;
        RAISE NOTICE 'Added level column to users table';
    ELSE
        RAISE NOTICE 'level column already exists in users table';
    END IF;
END $$;

-- Set your wallet as admin
UPDATE public.users 
SET is_admin = TRUE 
WHERE wallet_address = 'JCUGres3WA8MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU';

-- Verify the changes
SELECT 
    wallet_address,
    display_name,
    is_admin,
    total_xp,
    level,
    created_at
FROM public.users 
ORDER BY created_at DESC;
