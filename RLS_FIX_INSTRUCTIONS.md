# 🔒 RLS Policy Fix Instructions

## Problem
The admin dashboard shows 0 users because Row Level Security (RLS) policies are blocking user creation when wallets connect.

## Current Issue
```
new row violates row-level security policy for table "users"
```

## Solution

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

### Option 2: Use Service Role Key (Alternative)
If you prefer to keep RLS restrictive, update the user sync service to use the service role key:

1. Get your service role key from Supabase Dashboard > Settings > API
2. Add it to your `.env.local` file:
   ```
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```
3. Update the user sync service to use the service role key for user creation

### Option 3: Use API Endpoint (Current Workaround)
The system will fall back to using the API endpoint `/api/users` which should work with the current RLS setup.

## Testing
After applying the fix, test by:
1. Connecting a wallet
2. Checking if a user record is created
3. Verifying the admin dashboard shows the user

## Current Status
- ✅ Database tables exist and are accessible
- ✅ User sync service is implemented
- ✅ Admin dashboard is updated to use the sync service
- ❌ RLS policies are blocking user creation
- 🔄 Fallback to API endpoint should work
