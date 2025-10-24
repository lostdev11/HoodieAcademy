-- =====================================================
-- QUICK ADMIN ACCESS FIX
-- =====================================================
-- This is a minimal fix for immediate admin access issues

-- =====================================================
-- STEP 1: Create/Update admin function
-- =====================================================

CREATE OR REPLACE FUNCTION public.is_wallet_admin(wallet TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Always allow service role (for API calls)
  IF current_setting('request.jwt.claims', true)::json->>'role' = 'service_role' THEN
    RETURN TRUE;
  END IF;
  
  -- Check if wallet is in the users table with is_admin = true
  IF EXISTS (
    SELECT 1 
    FROM users 
    WHERE wallet_address = wallet 
    AND is_admin = true
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- Fallback: Check hardcoded admin wallets
  RETURN wallet IN (
    'JCUGres3WA8MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU',
    'qg7pNNZq7qDQuc6Xkd1x4NvS2VM3aHtCqHEzucZxRGA',
    '7vswdZFphxbtd1tCB5EhLNn2khiDiKmQEehSNUFHjz7M',
    '63B9jg8iBy9pf4W4VDizbQnBD45QujmzbHyGRtHxknr7'
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.is_wallet_admin(TEXT) TO authenticated, anon;

-- =====================================================
-- STEP 2: Fix critical RLS policies
-- =====================================================

-- Fix bounties policies
DROP POLICY IF EXISTS "bounties read open" ON public.bounties;
DROP POLICY IF EXISTS "bounties admin write" ON public.bounties;

CREATE POLICY "bounties read all" ON public.bounties
  FOR SELECT USING (true);

CREATE POLICY "bounties admin write" ON public.bounties
  FOR ALL USING (public.is_wallet_admin(auth.jwt() ->> 'wallet_address'));

-- Fix users policies
DROP POLICY IF EXISTS "users read all" ON public.users;
DROP POLICY IF EXISTS "users admin write" ON public.users;

CREATE POLICY "users read all" ON public.users
  FOR SELECT USING (true);

CREATE POLICY "users admin write" ON public.users
  FOR ALL USING (public.is_wallet_admin(auth.jwt() ->> 'wallet_address'));

-- =====================================================
-- STEP 3: Ensure admin users exist
-- =====================================================

-- Insert admin users if they don't exist
INSERT INTO users (wallet_address, display_name, is_admin, total_xp, level, created_at, updated_at)
VALUES 
  ('JCUGres3WA8MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU', 'Admin 1', true, 0, 1, NOW(), NOW()),
  ('qg7pNNZq7qDQuc6Xkd1x4NvS2VM3aHtCqHEzucZxRGA', 'Admin 2', true, 0, 1, NOW(), NOW()),
  ('7vswdZFphxbtd1tCB5EhLNn2khiDiKmQEehSNUFHjz7M', 'Admin 3', true, 0, 1, NOW(), NOW()),
  ('63B9jg8iBy9pf4W4VDizbQnBD45QujmzbHyGRtHxknr7', 'Admin 4', true, 0, 1, NOW(), NOW())
ON CONFLICT (wallet_address) 
DO UPDATE SET 
  is_admin = true,
  updated_at = NOW();

-- =====================================================
-- STEP 4: Test admin access
-- =====================================================

-- Test the admin function
SELECT 
  'Testing admin access...' as status,
  public.is_wallet_admin('qg7pNNZq7qDQuc6Xkd1x4NvS2VM3aHtCqHEzucZxRGA') as admin_test;

-- Show admin users
SELECT 
  'Admin users:' as info,
  wallet_address,
  display_name,
  is_admin
FROM users 
WHERE is_admin = true;
