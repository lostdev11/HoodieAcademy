-- Simple script to create users in the database
-- Run this in your Supabase SQL editor

-- First, let's see what the current users table looks like
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- Check if we have any users currently
SELECT COUNT(*) as current_user_count FROM users;

-- If the table is empty or has issues, let's create some basic users
-- This will work with any users table structure
INSERT INTO users (wallet_address, display_name, squad, is_admin, created_at, updated_at)
VALUES 
  ('test-wallet-1', 'Test User 1', 'Alpha', false, NOW(), NOW()),
  ('test-wallet-2', 'Test User 2', 'Beta', false, NOW(), NOW()),
  ('admin-wallet', 'Admin User', 'Gamma', true, NOW(), NOW())
ON CONFLICT (wallet_address) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  squad = EXCLUDED.squad,
  is_admin = EXCLUDED.is_admin,
  updated_at = NOW();

-- Verify the users were created
SELECT 
  wallet_address,
  display_name,
  squad,
  is_admin,
  created_at
FROM users 
ORDER BY created_at DESC;

-- Count total users
SELECT COUNT(*) as total_users FROM users;
