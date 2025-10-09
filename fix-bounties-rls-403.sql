-- Fix 403 errors on bounties endpoint by simplifying RLS policies
-- This removes restrictive policies and allows everyone to read bounties

-- =====================================================
-- STEP 1: Create the is_admin() function if it doesn't exist
-- =====================================================

CREATE OR REPLACE FUNCTION public.is_admin() 
RETURNS BOOLEAN 
LANGUAGE plpgsql 
STABLE 
SECURITY DEFINER
AS $$
DECLARE 
  w TEXT; 
BEGIN
  -- Check if this is a service role (always admin)
  IF current_setting('request.jwt.claims', true)::json->>'role' = 'service_role' THEN
    RETURN TRUE;
  END IF;
  
  -- 1) JWT role claim
  IF (auth.jwt() ->> 'role') = 'admin' THEN 
    RETURN TRUE; 
  END IF;
  
  -- 2) Check users table for is_admin flag
  BEGIN
    IF auth.uid() IS NOT NULL THEN
      IF EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() 
        AND is_admin = true
      ) THEN 
        RETURN TRUE; 
      END IF;
    END IF;
  EXCEPTION 
    WHEN OTHERS THEN 
      -- If there's an error, continue to next check
      NULL;
  END;
  
  -- 3) Admin wallet table (if you have one)
  BEGIN
    IF auth.uid() IS NOT NULL THEN
      SELECT primary_wallet INTO w 
      FROM public.users 
      WHERE id = auth.uid();
      
      IF w IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.admin_wallets 
        WHERE wallet_address = w
      ) THEN 
        RETURN TRUE; 
      END IF;
    END IF;
  EXCEPTION 
    WHEN OTHERS THEN 
      NULL;
  END;
  
  RETURN FALSE;
END $$;

-- Grant execute permission to authenticated and anon users
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;

-- =====================================================
-- STEP 2: Drop existing policies that might be causing conflicts
-- =====================================================
DROP POLICY IF EXISTS "bounties read open" ON public.bounties;
DROP POLICY IF EXISTS "bounties admin write" ON public.bounties;
DROP POLICY IF EXISTS "Everyone can view bounties" ON public.bounties;
DROP POLICY IF EXISTS "Admins can insert bounties" ON public.bounties;
DROP POLICY IF EXISTS "Admins can update bounties" ON public.bounties;
DROP POLICY IF EXISTS "Admins can delete bounties" ON public.bounties;
DROP POLICY IF EXISTS "Everyone can view active bounties" ON public.bounties;
DROP POLICY IF EXISTS "Admins can manage all bounties" ON public.bounties;

-- =====================================================
-- STEP 3: Create simple, clear policies
-- =====================================================

-- 1. Anyone can read bounties (no restrictions)
CREATE POLICY "public_read_bounties" ON public.bounties
  FOR SELECT 
  USING (true);

-- 2. Admins can insert bounties (using is_admin function or service role)
CREATE POLICY "admin_insert_bounties" ON public.bounties
  FOR INSERT 
  WITH CHECK (
    -- Allow service role key (bypasses RLS anyway)
    auth.role() = 'service_role' OR
    -- Or check if user is admin via the is_admin function
    (auth.uid() IS NOT NULL AND public.is_admin())
  );

-- 3. Admins can update bounties
CREATE POLICY "admin_update_bounties" ON public.bounties
  FOR UPDATE 
  USING (
    auth.role() = 'service_role' OR
    (auth.uid() IS NOT NULL AND public.is_admin())
  )
  WITH CHECK (
    auth.role() = 'service_role' OR
    (auth.uid() IS NOT NULL AND public.is_admin())
  );

-- 4. Admins can delete bounties
CREATE POLICY "admin_delete_bounties" ON public.bounties
  FOR DELETE 
  USING (
    auth.role() = 'service_role' OR
    (auth.uid() IS NOT NULL AND public.is_admin())
  );

-- =====================================================
-- STEP 4: Verify everything is set up correctly
-- =====================================================

-- Check that the function exists
SELECT 
  routine_name, 
  routine_type,
  security_type
FROM information_schema.routines
WHERE routine_schema = 'public' 
AND routine_name = 'is_admin';

-- Check that the policies are set correctly
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive,
  cmd
FROM pg_policies 
WHERE tablename = 'bounties'
ORDER BY policyname;

-- Test the is_admin function (should return false for anonymous user)
SELECT public.is_admin() as is_current_user_admin;

