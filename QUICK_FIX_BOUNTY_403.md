# Quick Fix Guide: Bounty 403 Error

## What Was Fixed

Your bounty API was returning 403 errors due to:
1. Edge runtime issues with environment variables
2. Conflicting database RLS policies

## Quick Steps to Apply Fix

### 1. Check Your Environment (1 min)

```bash
node check-api-config.js
```

Make sure all three variables show ✅:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`  
- `SUPABASE_SERVICE_ROLE_KEY`

If any are missing, add them to your `.env.local` file.

### 2. Fix Database Policies (2 min)

1. Open [Supabase Dashboard](https://app.supabase.com)
2. Go to **SQL Editor**
3. Open `fix-bounties-rls-403.sql` from your project
4. Copy all contents
5. Paste into SQL Editor
6. Click **RUN**

You should see a table showing the new policies at the end.

### 3. Restart Your Dev Server (1 min)

Press `Ctrl+C` in your terminal, then:

```bash
npm run dev
```

Or if you're running a build:

```bash
npm run build
npm start
```

### 4. Clear Browser Cache (30 sec)

1. Open your app in the browser
2. Press `F12` to open DevTools
3. Right-click the refresh button
4. Select "Empty Cache and Hard Reload"

### 5. Test (1 min)

1. Navigate to your bounties page
2. Click on any bounty
3. Check the browser console (F12)
4. ✅ No more 403 errors!

## What Changed in Your Code

**File Modified:** `src/app/api/bounties/[id]/route.ts`

- ✅ Removed edge runtime
- ✅ Added better error handling
- ✅ Fixed Supabase client initialization
- ✅ Added environment variable validation

## If It Still Doesn't Work

### Check Console Logs

Look for these new, more helpful error messages:

```
❌ Missing Supabase environment variables
```
→ Add missing vars to `.env.local`

```
Error fetching bounty: ...
```
→ Check the error details in the console

### Verify Database Policies

Run this in Supabase SQL Editor to check active policies:

```sql
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'bounties';
```

You should see:
- `public_read_bounties` (SELECT)
- `admin_insert_bounties` (INSERT)
- `admin_update_bounties` (UPDATE)
- `admin_delete_bounties` (DELETE)

### Still Having Issues?

1. Check that bounties have the correct status values
2. Verify your wallet address is in the admin_wallets table
3. Check Network tab in DevTools for actual error response

## Summary

**Total Time:** ~5 minutes  
**Files Changed:** 1 (API route)  
**Database Changes:** Updated RLS policies  
**Risk Level:** Low (read operations are now public, write operations still protected)

---

For detailed technical explanation, see `BOUNTY_403_ERROR_FIX.md`

