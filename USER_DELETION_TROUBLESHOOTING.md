# User Deletion Troubleshooting Guide 🔧
**Date:** October 21, 2025

## Issue: "Error: User not found" when trying to delete user

You're getting a "User not found" error when trying to delete a user in the admin dashboard. Let's debug this step by step.

---

## Step 1: Use the Debugger

I've added a temporary debugger to your admin dashboard. Here's how to use it:

1. **Go to:** `http://localhost:3001/admin-dashboard`
2. **Click:** "Users" tab
3. **Look for:** "🗑️ User Deletion Debugger" at the top
4. **Enter** the wallet address of the user you're trying to delete
5. **Click:** "Debug Deletion"

### What the Debugger Shows:

**✅ Good Signs:**
- Target User Exists: ✅ Yes
- Admin Exists: ✅ Yes  
- Is Admin: ✅ Yes
- Delete API Success: ✅ Yes

**❌ Problem Signs:**
- Target User Exists: ❌ No ← **This is your issue**
- Admin Exists: ❌ No
- Is Admin: ❌ No
- Delete API Success: ❌ No

---

## Step 2: Check Your Database

### Option A: Use the SQL Script

1. **Open Supabase Dashboard** → SQL Editor
2. **Copy and paste** the contents of `debug-user-deletion.sql`
3. **Replace** `TARGET_WALLET_ADDRESS` with the wallet you're trying to delete
4. **Replace** `ADMIN_WALLET_ADDRESS` with your admin wallet
5. **Run the queries** one by one

### Option B: Quick Database Check

```sql
-- Check if the user exists
SELECT 
  wallet_address,
  display_name,
  squad,
  is_admin,
  total_xp
FROM users 
WHERE wallet_address = 'WALLET_YOU_WANT_TO_DELETE';
```

**Expected Result:** Should return 1 row with user data
**Problem:** Returns 0 rows = User doesn't exist in database

---

## Step 3: Common Causes & Solutions

### Cause 1: User Doesn't Exist in Database

**Symptoms:**
- Debugger shows "Target User Exists: ❌ No"
- Database query returns 0 rows

**Possible Reasons:**
- User was already deleted
- User never registered properly
- Wrong wallet address
- Database sync issue

**Solution:**
```sql
-- Check if user exists with similar wallet address
SELECT wallet_address, display_name 
FROM users 
WHERE wallet_address LIKE '%PARTIAL_WALLET%';
```

### Cause 2: Case Sensitivity Issues

**Symptoms:**
- Wallet address looks correct but user not found

**Solution:**
- Check exact case of wallet address
- Try both uppercase and lowercase versions

### Cause 3: User in Different Table

**Symptoms:**
- User exists but not in `users` table

**Solution:**
```sql
-- Check if user exists in other tables
SELECT 'user_activity' as table_name, wallet_address, COUNT(*) as count
FROM user_activity 
WHERE wallet_address = 'TARGET_WALLET'
GROUP BY wallet_address

UNION ALL

SELECT 'users' as table_name, wallet_address, COUNT(*) as count
FROM users 
WHERE wallet_address = 'TARGET_WALLET'
GROUP BY wallet_address;
```

### Cause 4: Database Connection Issues

**Symptoms:**
- API returns errors
- Database queries fail

**Solution:**
- Check Supabase connection
- Verify environment variables
- Check Supabase logs

---

## Step 4: Test with a Known User

### Create a Test User

```sql
-- Create a test user for deletion testing
INSERT INTO users (
  wallet_address,
  display_name,
  username,
  squad,
  total_xp,
  is_admin,
  created_at,
  updated_at
) VALUES (
  'test-delete-wallet-123',
  'Test Delete User',
  'testdelete',
  'Creators',
  1000,
  false,
  NOW(),
  NOW()
);
```

### Try Deleting the Test User

1. **Use the debugger** with wallet: `test-delete-wallet-123`
2. **Should work** if your admin setup is correct
3. **If it fails**, the issue is with admin permissions

---

## Step 5: Check Admin Permissions

### Verify You're an Admin

```sql
-- Check your admin status
SELECT 
  wallet_address,
  display_name,
  is_admin,
  created_at
FROM users 
WHERE wallet_address = 'YOUR_ADMIN_WALLET';
```

**Expected:** `is_admin` should be `true`

### Make Yourself Admin (if needed)

```sql
-- Make yourself an admin
UPDATE users 
SET is_admin = true
WHERE wallet_address = 'YOUR_WALLET_ADDRESS';
```

---

## Step 6: Manual Deletion (if API fails)

If the API keeps failing, you can manually delete the user:

```sql
-- Step 1: Delete user activity
DELETE FROM user_activity 
WHERE wallet_address = 'TARGET_WALLET_ADDRESS';

-- Step 2: Delete user
DELETE FROM users 
WHERE wallet_address = 'TARGET_WALLET_ADDRESS';

-- Step 3: Verify deletion
SELECT COUNT(*) FROM users 
WHERE wallet_address = 'TARGET_WALLET_ADDRESS';
-- Should return 0
```

---

## Step 7: Check for Foreign Key Issues

### Check Related Data

```sql
-- Check what data would be affected
SELECT 
  'user_activity' as table_name,
  COUNT(*) as record_count
FROM user_activity 
WHERE wallet_address = 'TARGET_WALLET_ADDRESS'

UNION ALL

SELECT 
  'users' as table_name,
  COUNT(*) as record_count
FROM users 
WHERE wallet_address = 'TARGET_WALLET_ADDRESS';
```

### Check Foreign Key Constraints

```sql
-- Check if there are constraints preventing deletion
SELECT 
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'users';
```

---

## Step 8: API Debugging

### Check API Logs

1. **Open browser console** (F12)
2. **Try to delete a user**
3. **Look for network requests** to `/api/admin/users/delete`
4. **Check the response** for detailed error messages

### Test API Directly

```javascript
// Test the delete API directly in browser console
fetch('/api/admin/users/delete', {
  method: 'DELETE',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    admin_wallet: 'YOUR_ADMIN_WALLET',
    target_wallet: 'TARGET_WALLET'
  })
})
.then(response => response.json())
.then(data => console.log('Delete API Response:', data));
```

---

## Step 9: Common Solutions

### Solution 1: User Already Deleted

**Problem:** User was already deleted but still showing in UI
**Solution:** Refresh the users list

### Solution 2: Wrong Wallet Address

**Problem:** Copy-paste error in wallet address
**Solution:** Double-check the exact wallet address

### Solution 3: Database Sync Issue

**Problem:** User exists but API can't find them
**Solution:** 
1. Check database connection
2. Restart your dev server
3. Clear browser cache

### Solution 4: RLS (Row Level Security) Issues

**Problem:** Database policies blocking access
**Solution:**
```sql
-- Temporarily disable RLS for testing
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
-- Test deletion
-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
```

---

## Step 10: Verify the Fix

### Test Checklist:

- [ ] User exists in database
- [ ] You are marked as admin
- [ ] Wallet addresses are correct (case-sensitive)
- [ ] No foreign key constraints blocking deletion
- [ ] API returns success response
- [ ] User is removed from users list

---

## Quick Fix Commands

### Make Yourself Admin:
```sql
UPDATE users 
SET is_admin = true
WHERE wallet_address = 'YOUR_WALLET_ADDRESS';
```

### Check User Exists:
```sql
SELECT * FROM users 
WHERE wallet_address = 'TARGET_WALLET_ADDRESS';
```

### Manual Delete (if API fails):
```sql
DELETE FROM user_activity WHERE wallet_address = 'TARGET_WALLET_ADDRESS';
DELETE FROM users WHERE wallet_address = 'TARGET_WALLET_ADDRESS';
```

---

## Still Not Working?

### Debug Steps:

1. **Use the debugger** on admin dashboard
2. **Check database** with SQL queries
3. **Test with a known user** (create test user)
4. **Check browser console** for API errors
5. **Verify admin permissions**
6. **Check Supabase logs**

### Get Help:

1. **Share debugger output** from admin dashboard
2. **Share SQL query results** from database
3. **Include browser console errors**
4. **Share the exact wallet addresses** you're using

---

## Remove Debugger (When Done)

Once the issue is fixed, remove the debugger:

1. **Edit** `src/app/admin-dashboard/page.tsx`
2. **Remove** the import: `import UserDeleteDebugger from '@/components/debug/UserDeleteDebugger';`
3. **Remove** the debugger component from the Users tab

---

## Success! 🎉

Once it's working, you should see:
- ✅ User deletion works without errors
- ✅ User is removed from the users list
- ✅ No "User not found" errors
- ✅ Deletion is logged in user_activity

**The user deletion feature is now working properly!** 🗑️✨
