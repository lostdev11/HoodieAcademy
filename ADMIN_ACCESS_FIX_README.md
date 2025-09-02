# 🔧 Admin Access Fix - Hoodie Academy

## 🚨 Problem Identified

The wallet `JCUGres3WA8MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU` is successfully connecting and holding a WifHoodie NFT, but it's not being recognized as an admin. This is causing the "Access Denied" error.

**Current Status:**
- ✅ Wallet connects successfully
- ✅ NFT verification works (finds 1 WifHoodie NFT)
- ❌ Admin status check fails (`isAdmin: false`)
- ❌ Access denied due to not being admin

## 🔍 Root Cause

The issue is that the admin setup SQL script hasn't been run yet, so:
1. The `is_admin` column doesn't exist in the `users` table, OR
2. The admin users haven't been inserted into the database

## 🛠️ Solution

### Option 1: Quick Fix (Recommended)

1. **Open your Supabase SQL Editor**
2. **Copy and paste the contents of `fix-admin-access-complete.sql`**
3. **Run the script**
4. **Refresh your application**

### Option 2: Manual Setup

If you prefer to do it manually:

```sql
-- Add is_admin column
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Create index
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin);

-- Insert admin user
INSERT INTO users (
    wallet_address, 
    display_name, 
    squad,
    is_admin, 
    created_at,
    updated_at,
    last_active
) VALUES (
    'JCUGres3WA8MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU',
    'Prince 1',
    'Creators',
    true,
    NOW(),
    NOW(),
    NOW()
) ON CONFLICT (wallet_address) 
DO UPDATE SET 
    is_admin = true,
    display_name = 'Prince 1',
    squad = 'Creators',
    updated_at = NOW(),
    last_active = NOW();
```

## ✅ Verification

After running the fix:

1. **Check the database:**
   ```sql
   SELECT wallet_address, display_name, is_admin 
   FROM users 
   WHERE wallet_address = 'JCUGres3WA8MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU';
   ```

2. **Test in the application:**
   - Connect with the wallet
   - Navigate to `/admin`
   - Should now have admin access

3. **Run the test script:**
   - Open browser console
   - Copy and paste `test-admin-fix.js`
   - Should show "SUCCESS: Wallet is now admin!"

## 🔄 What the Fix Does

1. **Adds `is_admin` column** to the `users` table if it doesn't exist
2. **Creates an index** for efficient admin queries
3. **Inserts the admin user** with `is_admin = true`
4. **Updates existing user** if they already exist
5. **Verifies the setup** with test queries

## 🎯 Expected Result

After applying the fix:
- The wallet `JCUGres3WA8MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU` will be recognized as admin
- Admin dashboard access will work properly
- No more "Access Denied" errors

## 🚀 Next Steps

1. **Apply the SQL fix** in Supabase
2. **Test the admin access** in your application
3. **Verify all admin features** work correctly
4. **Set up additional admin wallets** if needed

## 📁 Files Created

- `fix-admin-access-complete.sql` - Complete SQL fix
- `test-admin-fix.js` - Test script to verify the fix
- `ADMIN_ACCESS_FIX_README.md` - This documentation

## 🆘 If Issues Persist

If you still have problems after applying the fix:

1. **Check Supabase logs** for any SQL errors
2. **Verify the `users` table structure** has the `is_admin` column
3. **Confirm the admin user was inserted** with `is_admin = true`
4. **Clear browser localStorage** and reconnect wallet
5. **Check browser console** for any JavaScript errors

---

**Status:** Ready to fix ✅  
**Priority:** High 🔴  
**Estimated Time:** 5-10 minutes ⏱️
