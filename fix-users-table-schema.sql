-- Fix Users Table Schema to Match API Expectations
-- Run this in your Supabase SQL editor

-- First, let's check what columns exist in the current users table
-- and add the missing ones that the API expects

-- Add missing columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS last_active TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS squad_test_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS placement_test_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS total_xp INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS username TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS profile_picture TEXT,
ADD COLUMN IF NOT EXISTS xp_total INTEGER DEFAULT 0;

-- Update existing users to have default values
UPDATE users 
SET 
  last_active = COALESCE(last_active, created_at),
  profile_completed = COALESCE(profile_completed, false),
  squad_test_completed = COALESCE(squad_test_completed, false),
  placement_test_completed = COALESCE(placement_test_completed, false),
  last_seen = COALESCE(last_seen, created_at),
  total_xp = COALESCE(total_xp, 0),
  level = COALESCE(level, 1),
  xp_total = COALESCE(xp_total, 0)
WHERE last_active IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_last_active ON users(last_active);
CREATE INDEX IF NOT EXISTS idx_users_profile_completed ON users(profile_completed);
CREATE INDEX IF NOT EXISTS idx_users_squad_test_completed ON users(squad_test_completed);
CREATE INDEX IF NOT EXISTS idx_users_placement_test_completed ON users(placement_test_completed);
CREATE INDEX IF NOT EXISTS idx_users_total_xp ON users(total_xp);
CREATE INDEX IF NOT EXISTS idx_users_level ON users(level);

-- Insert some test users if the table is empty
INSERT INTO users (
  wallet_address, 
  display_name, 
  squad, 
  is_admin, 
  profile_completed, 
  squad_test_completed, 
  placement_test_completed,
  total_xp,
  level,
  xp_total,
  last_active,
  last_seen,
  created_at
) VALUES 
  (
    'test-wallet-1',
    'Test User 1',
    'Alpha',
    false,
    true,
    true,
    true,
    1500,
    3,
    1500,
    NOW(),
    NOW(),
    NOW() - INTERVAL '7 days'
  ),
  (
    'test-wallet-2', 
    'Test User 2',
    'Beta',
    false,
    true,
    true,
    false,
    800,
    2,
    800,
    NOW(),
    NOW(),
    NOW() - INTERVAL '3 days'
  ),
  (
    'admin-wallet',
    'Admin User',
    'Gamma',
    true,
    true,
    true,
    true,
    5000,
    10,
    5000,
    NOW(),
    NOW(),
    NOW() - INTERVAL '30 days'
  )
ON CONFLICT (wallet_address) DO NOTHING;

-- Verify the table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- Check if we have any users now
SELECT COUNT(*) as user_count FROM users;

-- Show sample users
SELECT 
  wallet_address,
  display_name,
  squad,
  is_admin,
  profile_completed,
  squad_test_completed,
  placement_test_completed,
  total_xp,
  level,
  last_active
FROM users 
ORDER BY created_at DESC 
LIMIT 5;
