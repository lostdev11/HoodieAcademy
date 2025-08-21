-- Admin Setup Script for Hoodie Academy
-- Run this script in your Supabase SQL editor to add admin functionality

-- =====================================================
-- 1. ADD ADMIN FIELD TO USERS TABLE
-- =====================================================

-- Add is_admin column to users table if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Create index for admin users
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin);

-- =====================================================
-- 2. CREATE/UPDATE ADMIN USERS
-- =====================================================

-- Insert or update admin users (all four admin wallets)
INSERT INTO users (wallet_address, display_name, squad, is_admin, created_at, last_active) 
VALUES 
  ('qg7pNNZq7qDQuc6Xkd1x4NvS2VM3aHtCqHEzucZxRGA', 'Prince', 'Creators', TRUE, NOW(), NOW()),
  ('JCUGres3WA8MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU', 'Prince 1', 'Creators', TRUE, NOW(), NOW()),
  ('7vswdZFphxbtd1tCB5EhLNn2khiDiKmQEehSNUFHjz7M', 'Kong', 'Creators', TRUE, NOW(), NOW()),
  ('63B9jg8iBy9pf4W4VDizbQnBD45QujmzbHyGRtHxknr7', 'Kong 1', 'Creators', TRUE, NOW(), NOW())
ON CONFLICT (wallet_address) 
DO UPDATE SET 
  is_admin = EXCLUDED.is_admin,
  display_name = EXCLUDED.display_name,
  squad = EXCLUDED.squad,
  last_active = NOW();

-- =====================================================
-- 3. UPDATE RLS POLICIES FOR ADMIN ACCESS
-- =====================================================

-- Drop existing policies that need admin access
DROP POLICY IF EXISTS "Users can update their own data" ON users;

-- Create new policies with admin access
CREATE POLICY "Users can update their own data or admin can update any" ON users
  FOR UPDATE USING (
    auth.jwt() ->> 'wallet_address' = wallet_address 
    OR 
    EXISTS (
      SELECT 1 FROM users 
      WHERE wallet_address = auth.jwt() ->> 'wallet_address' 
      AND is_admin = TRUE
    )
  );

-- Add admin policy for viewing all user data
CREATE POLICY "Admins can view all user data" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE wallet_address = auth.jwt() ->> 'wallet_address' 
      AND is_admin = TRUE
    )
  );

-- =====================================================
-- 4. VERIFY ADMIN SETUP
-- =====================================================

-- Check admin users
SELECT 
  wallet_address,
  display_name,
  squad,
  is_admin,
  created_at
FROM users 
WHERE is_admin = TRUE
ORDER BY created_at;

-- Check table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name = 'is_admin';
