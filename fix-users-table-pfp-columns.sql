-- =====================================================
-- Fix Users Table - Add Missing PFP Columns
-- This script adds the missing columns that the profile/pfp API expects
-- =====================================================

-- Add missing PFP-related columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS pfp_asset_id TEXT,
ADD COLUMN IF NOT EXISTS pfp_last_verified TIMESTAMPTZ;

-- Create index for PFP asset ID for better performance
CREATE INDEX IF NOT EXISTS idx_users_pfp_asset_id ON users(pfp_asset_id);

-- Update existing users to have default values
UPDATE users 
SET 
  pfp_last_verified = COALESCE(pfp_last_verified, created_at)
WHERE pfp_last_verified IS NULL;

-- Test the fix by checking the table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND table_schema = 'public'
  AND column_name IN ('profile_picture', 'pfp_asset_id', 'pfp_last_verified')
ORDER BY column_name;
