# Fixed: is_admin() Function Missing

## What Happened

When you tried to run the SQL fix script, you got this error:
```
ERROR: 42883: function public.is_admin() does not exist
```

This is because the RLS policies reference a function `is_admin()` that wasn't created in your database yet.

## ✅ I've Updated the Fix Script

The file `fix-bounties-rls-403.sql` now includes:

1. **Creates the `is_admin()` function first**
2. **Drops old conflicting policies**
3. **Creates new simplified policies**
4. **Verifies everything worked**

## How to Apply the Complete Fix

### Step 1: Run the Updated SQL Script

1. Open your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **SQL Editor** (left sidebar)
4. Click **New query**
5. Open `fix-bounties-rls-403.sql` in your code editor
6. Copy **ALL** the contents (it's now longer, includes the function)
7. Paste into Supabase SQL Editor
8. Click **RUN** (or press Ctrl+Enter)

### Step 2: Check the Results

You should see **3 result sets**:

**Result 1: Function Created**
```
routine_name | routine_type | security_type
is_admin     | FUNCTION     | DEFINER
```
✅ This confirms the function was created

**Result 2: Policies Created**
```
policyname              | cmd
admin_delete_bounties   | DELETE
admin_insert_bounties   | INSERT
admin_update_bounties   | UPDATE
public_read_bounties    | SELECT
```
✅ This shows 4 policies (1 read, 3 admin write)

**Result 3: Function Test**
```
is_current_user_admin
false
```
✅ This is normal (you're running as anonymous)

### Step 3: Restart Your Dev Server

```bash
# Press Ctrl+C to stop
npm run dev
```

### Step 4: Test in Browser

1. Reload your app (hard refresh: Ctrl+Shift+R)
2. Navigate to bounties page
3. Click on a bounty
4. Open DevTools console (F12)
5. ✅ No more 403 errors!

## What the is_admin() Function Does

This function checks if the current user is an admin by:

1. **Service Role Check** - API routes using service role key are always admin
2. **JWT Role Check** - Checks if JWT has 'admin' role claim
3. **Users Table Check** - Checks if user has `is_admin = true` in the users table
4. **Admin Wallets Check** - Checks if user's wallet is in the admin_wallets table

The function is marked as `SECURITY DEFINER` so it runs with elevated permissions to query the users table even when called from RLS policies.

## Troubleshooting

### If you get "auth.jwt() does not exist"

This means Supabase Auth helpers aren't installed. The function will still work for service role checks, which is what your API uses.

### If you get "table admin_wallets does not exist"

That's okay! The function has error handling and will skip that check. It will still work with the other checks.

### If policies still show conflicts

Run this to see all policies:
```sql
SELECT policyname FROM pg_policies WHERE tablename = 'bounties';
```

Then manually drop any extra ones:
```sql
DROP POLICY IF EXISTS "policy_name_here" ON public.bounties;
```

## Summary

✅ **Updated File:** `fix-bounties-rls-403.sql`  
✅ **What Changed:** Added `is_admin()` function creation  
✅ **What to Do:** Run the complete script in Supabase SQL Editor  
✅ **Time Required:** 2 minutes  

The fix is now complete and ready to apply!

