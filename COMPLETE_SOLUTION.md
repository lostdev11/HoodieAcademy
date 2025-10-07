# 🔧 Complete Solution: Wallet Connection User Data Creation

## Problem Summary
The admin dashboard shows 0 users because Row Level Security (RLS) policies are blocking user creation when wallets connect. The system is properly set up but needs RLS policy fixes.

## ✅ What's Already Working
- ✅ Database tables exist and are accessible
- ✅ User sync service is implemented (`src/lib/simple-user-sync.ts`)
- ✅ Admin dashboard is updated to use the sync service
- ✅ Wallet connection hook is updated (`src/hooks/use-wallet-supabase.ts`)
- ✅ API endpoint exists (`src/app/api/users/route.ts`)

## 🔒 Current Issue
```
new row violates row-level security policy for table "users"
```

## 🛠️ Solutions (Choose One)

### Option 1: Fix RLS Policies (Recommended)
Run this SQL in your Supabase SQL Editor:

```sql
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can insert their own data" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

-- Create permissive policy for user creation
CREATE POLICY "Allow user creation" ON users
  FOR INSERT 
  WITH CHECK (true);

-- Ensure viewing policy exists
DROP POLICY IF EXISTS "Users can view all users" ON users;
CREATE POLICY "Allow viewing all users" ON users
  FOR SELECT 
  USING (true);

-- Ensure update policy exists
DROP POLICY IF EXISTS "Users can update their own data" ON users;
CREATE POLICY "Allow updating users" ON users
  FOR UPDATE 
  USING (true)
  WITH CHECK (true);
```

### Option 2: Fix Service Role Key
1. Go to Supabase Dashboard > Settings > API
2. Copy your service role key
3. Update your `.env.local` file:
   ```
   SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key_here
   ```

### Option 3: Disable RLS Temporarily (Quick Fix)
```sql
-- Temporarily disable RLS for testing
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
```

## 🧪 Testing the Fix

After applying one of the solutions above:

1. **Connect a wallet** - This should automatically create a user record
2. **Check the admin dashboard** - Should now show the user
3. **Verify in database** - Check the `users` table in Supabase

## 📊 Expected Results

After the fix, when a wallet connects:
- ✅ User record is created in the `users` table
- ✅ Admin dashboard shows the user in the user list
- ✅ All metrics update (Total Users, Active Users, etc.)
- ✅ User can be managed through the admin interface

## 🔍 Debugging

If it still doesn't work:

1. **Check browser console** for error messages
2. **Check Supabase logs** in the dashboard
3. **Verify the service role key** is correct
4. **Test the API endpoint** directly

## 📁 Files Modified

- `src/hooks/use-wallet-supabase.ts` - Updated to use simplified user sync
- `src/lib/simple-user-sync.ts` - New simplified user sync service
- `src/app/admin/AdminDashboard.tsx` - Updated to use simplified user sync
- `src/app/api/users/route.ts` - API endpoint for user creation

## 🎯 Next Steps

1. Apply one of the RLS fixes above
2. Test wallet connection
3. Verify admin dashboard shows users
4. If needed, run the database schema fix: `fix-database-schema.sql`

The system is ready to work once the RLS policies are fixed!
