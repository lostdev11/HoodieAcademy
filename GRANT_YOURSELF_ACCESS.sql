-- =====================================================
-- GRANT YOURSELF PRESENTER ACCESS
-- =====================================================
-- Use this to give yourself admin/presenter permissions
-- so you can test the "GO LIVE" button
-- =====================================================

-- ⚠️ IMPORTANT: Replace 'YOUR_WALLET_ADDRESS_HERE' with your actual wallet address!

-- Grant Admin Access (Full Control)
SELECT grant_presenter_role(
  'YOUR_WALLET_ADDRESS_HERE',  -- ← CHANGE THIS!
  'admin',                      -- role name
  true,                         -- can_create_sessions
  true,                         -- can_go_live
  'SYSTEM',                     -- assigned_by
  NULL                          -- never expires
);

-- =====================================================
-- VERIFY IT WORKED
-- =====================================================

-- Check your permissions:
SELECT * FROM presenter_roles 
WHERE wallet_address = 'YOUR_WALLET_ADDRESS_HERE';  -- ← CHANGE THIS!

-- Should return a row showing:
-- - wallet_address: YOUR_WALLET
-- - role_name: admin
-- - can_create_sessions: true
-- - can_go_live: true
-- - can_manage_all_sessions: true

-- =====================================================
-- TEST PERMISSION CHECK
-- =====================================================

-- Test if you can go live:
SELECT * FROM can_user_go_live('YOUR_WALLET_ADDRESS_HERE');  -- ← CHANGE THIS!

-- Should return:
-- allowed = true
-- reason = 'Admin access'
-- role = 'admin'

-- =====================================================
-- DONE!
-- =====================================================

-- You now have admin access to:
-- ✅ Create sessions
-- ✅ Go live on ANY session
-- ✅ End ANY session
-- ✅ Grant presenter access to others
-- ✅ Revoke presenter access
-- ✅ Full system control

-- Next: Visit /mentorship/[session-id] and you'll see the "GO LIVE" button!

