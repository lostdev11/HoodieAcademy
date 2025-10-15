-- =========================================
-- FIX SUPABASE RLS SECURITY ISSUES
-- =========================================
-- This script addresses all RLS linter errors:
-- 1. Enable RLS on bounties table (has policies but RLS disabled)
-- 2. Enable RLS on bounty_submissions table (public table without RLS)
-- 3. Fix active_presenters view (SECURITY DEFINER issue)
--
-- Run this in Supabase SQL Editor
-- =========================================

-- =========================================
-- 1. ENABLE RLS ON BOUNTIES TABLE
-- =========================================
-- The bounties table has policies but RLS is not enabled

ALTER TABLE public.bounties ENABLE ROW LEVEL SECURITY;

-- Verify existing policies (should already exist based on linter output)
-- If not, we'll create them:

-- Public read access for all bounties
DROP POLICY IF EXISTS "public_read_bounties" ON public.bounties;
CREATE POLICY "public_read_bounties" 
  ON public.bounties 
  FOR SELECT 
  USING (true);

-- Admin can insert bounties
DROP POLICY IF EXISTS "admin_insert_bounties" ON public.bounties;
CREATE POLICY "admin_insert_bounties" 
  ON public.bounties 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE wallet_address = auth.jwt() ->> 'wallet_address' 
      AND is_admin = true
    )
  );

-- Admin can update bounties
DROP POLICY IF EXISTS "admin_update_bounties" ON public.bounties;
CREATE POLICY "admin_update_bounties" 
  ON public.bounties 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE wallet_address = auth.jwt() ->> 'wallet_address' 
      AND is_admin = true
    )
  );

-- Admin can delete bounties
DROP POLICY IF EXISTS "admin_delete_bounties" ON public.bounties;
CREATE POLICY "admin_delete_bounties" 
  ON public.bounties 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE wallet_address = auth.jwt() ->> 'wallet_address' 
      AND is_admin = true
    )
  );

-- =========================================
-- 2. ENABLE RLS ON BOUNTY_SUBMISSIONS TABLE
-- =========================================
-- This table is public but RLS is not enabled

ALTER TABLE public.bounty_submissions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for bounty_submissions

-- Public can read all submissions (for transparency)
DROP POLICY IF EXISTS "public_read_submissions" ON public.bounty_submissions;
CREATE POLICY "public_read_submissions" 
  ON public.bounty_submissions 
  FOR SELECT 
  USING (true);

-- Users can insert their own submissions
DROP POLICY IF EXISTS "users_insert_own_submissions" ON public.bounty_submissions;
CREATE POLICY "users_insert_own_submissions" 
  ON public.bounty_submissions 
  FOR INSERT 
  WITH CHECK (
    wallet_address = auth.jwt() ->> 'wallet_address'
  );

-- Users can update their own submissions (before approval)
DROP POLICY IF EXISTS "users_update_own_submissions" ON public.bounty_submissions;
CREATE POLICY "users_update_own_submissions" 
  ON public.bounty_submissions 
  FOR UPDATE 
  USING (
    wallet_address = auth.jwt() ->> 'wallet_address' 
    AND status != 'approved'
  );

-- Admins can update any submission (for approval/rejection)
DROP POLICY IF EXISTS "admin_update_submissions" ON public.bounty_submissions;
CREATE POLICY "admin_update_submissions" 
  ON public.bounty_submissions 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE wallet_address = auth.jwt() ->> 'wallet_address' 
      AND is_admin = true
    )
  );

-- Admins can delete any submission
DROP POLICY IF EXISTS "admin_delete_submissions" ON public.bounty_submissions;
CREATE POLICY "admin_delete_submissions" 
  ON public.bounty_submissions 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE wallet_address = auth.jwt() ->> 'wallet_address' 
      AND is_admin = true
    )
  );

-- =========================================
-- 3. FIX ACTIVE_PRESENTERS VIEW
-- =========================================
-- The active_presenters view uses SECURITY DEFINER which can be a security risk
-- We'll recreate it without SECURITY DEFINER

-- Drop the old view
DROP VIEW IF EXISTS public.active_presenters;

-- Recreate without SECURITY DEFINER
-- SECURITY INVOKER means it uses the permissions of the querying user
CREATE VIEW public.active_presenters
WITH (security_invoker=true)
AS
SELECT 
  p.id,
  p.name,
  p.wallet_address,
  p.bio,
  p.expertise,
  p.social_links,
  p.is_approved,
  p.created_at,
  p.updated_at
FROM public.mentorship_presenters p
WHERE p.is_approved = true;

-- Grant read access to authenticated users
GRANT SELECT ON public.active_presenters TO authenticated;
GRANT SELECT ON public.active_presenters TO anon;

-- =========================================
-- 4. VERIFY ALL TABLES HAVE RLS
-- =========================================
-- Let's also check and enable RLS on related mentorship tables

-- Enable RLS on mentorship_sessions if not already enabled
ALTER TABLE public.mentorship_sessions ENABLE ROW LEVEL SECURITY;

-- Enable RLS on mentorship_presenters if not already enabled
ALTER TABLE public.mentorship_presenters ENABLE ROW LEVEL SECURITY;

-- Enable RLS on session_student_permissions if not already enabled
ALTER TABLE public.session_student_permissions ENABLE ROW LEVEL SECURITY;

-- =========================================
-- 5. CREATE POLICIES FOR MENTORSHIP TABLES
-- =========================================

-- Mentorship Sessions Policies
DROP POLICY IF EXISTS "public_read_sessions" ON public.mentorship_sessions;
CREATE POLICY "public_read_sessions" 
  ON public.mentorship_sessions 
  FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "admin_manage_sessions" ON public.mentorship_sessions;
CREATE POLICY "admin_manage_sessions" 
  ON public.mentorship_sessions 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE wallet_address = auth.jwt() ->> 'wallet_address' 
      AND is_admin = true
    )
  );

DROP POLICY IF EXISTS "mentor_manage_own_sessions" ON public.mentorship_sessions;
CREATE POLICY "mentor_manage_own_sessions" 
  ON public.mentorship_sessions 
  FOR ALL 
  USING (
    mentor_wallet = auth.jwt() ->> 'wallet_address'
  );

-- Mentorship Presenters Policies
DROP POLICY IF EXISTS "public_read_approved_presenters" ON public.mentorship_presenters;
CREATE POLICY "public_read_approved_presenters" 
  ON public.mentorship_presenters 
  FOR SELECT 
  USING (is_approved = true OR wallet_address = auth.jwt() ->> 'wallet_address');

DROP POLICY IF EXISTS "admin_manage_presenters" ON public.mentorship_presenters;
CREATE POLICY "admin_manage_presenters" 
  ON public.mentorship_presenters 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE wallet_address = auth.jwt() ->> 'wallet_address' 
      AND is_admin = true
    )
  );

-- Session Student Permissions Policies
DROP POLICY IF EXISTS "students_read_own_permissions" ON public.session_student_permissions;
CREATE POLICY "students_read_own_permissions" 
  ON public.session_student_permissions 
  FOR SELECT 
  USING (
    student_wallet = auth.jwt() ->> 'wallet_address'
    OR EXISTS (
      SELECT 1 FROM public.mentorship_sessions 
      WHERE id = session_id 
      AND mentor_wallet = auth.jwt() ->> 'wallet_address'
    )
    OR EXISTS (
      SELECT 1 FROM public.users 
      WHERE wallet_address = auth.jwt() ->> 'wallet_address' 
      AND is_admin = true
    )
  );

DROP POLICY IF EXISTS "students_insert_own_request" ON public.session_student_permissions;
CREATE POLICY "students_insert_own_request" 
  ON public.session_student_permissions 
  FOR INSERT 
  WITH CHECK (
    student_wallet = auth.jwt() ->> 'wallet_address'
  );

DROP POLICY IF EXISTS "hosts_manage_permissions" ON public.session_student_permissions;
CREATE POLICY "hosts_manage_permissions" 
  ON public.session_student_permissions 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.mentorship_sessions 
      WHERE id = session_id 
      AND mentor_wallet = auth.jwt() ->> 'wallet_address'
    )
    OR EXISTS (
      SELECT 1 FROM public.users 
      WHERE wallet_address = auth.jwt() ->> 'wallet_address' 
      AND is_admin = true
    )
  );

-- =========================================
-- 6. VERIFICATION QUERY
-- =========================================
-- Run this to verify RLS is enabled on all tables

SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'bounties',
    'bounty_submissions',
    'mentorship_sessions',
    'mentorship_presenters',
    'session_student_permissions'
  )
ORDER BY tablename;

-- Check policies
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
WHERE schemaname = 'public'
  AND tablename IN (
    'bounties',
    'bounty_submissions',
    'mentorship_sessions',
    'mentorship_presenters',
    'session_student_permissions'
  )
ORDER BY tablename, policyname;

-- =========================================
-- ✅ COMPLETE!
-- =========================================
-- All RLS security issues should now be resolved:
-- ✅ bounties table has RLS enabled
-- ✅ bounty_submissions table has RLS enabled  
-- ✅ active_presenters view uses SECURITY INVOKER
-- ✅ All mentorship tables have proper RLS policies
-- =========================================

