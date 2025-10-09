# Bounty 403 Error - Diagnosis and Fix

## Issue Summary
A **403 Forbidden error** was occurring when trying to access specific bounties via the API endpoint `/api/bounties/[id]`, despite the admin data service successfully fetching other data.

```
api/bounties/b6c9029a-c455-4e76-b176-1f41c167045f:1 Failed to load resource: the server responded with a status of 403 ()
```

## Root Causes Identified

### 1. Edge Runtime + Environment Variable Issues
- The API route was using `export const runtime = 'edge';`
- Edge runtime can have issues accessing environment variables, especially `SUPABASE_SERVICE_ROLE_KEY`
- The Supabase client was being initialized at module level, which could fail in edge runtime

### 2. Conflicting RLS Policies
The database has multiple conflicting Row Level Security (RLS) policies on the `bounties` table:

**Restrictive Policy** (from `tracking-schema-complete.sql`):
```sql
CREATE POLICY IF NOT EXISTS "bounties read open" ON public.bounties
  FOR SELECT USING (status IN ('open','draft') AND (public.is_admin() OR status='open'));
```

This policy:
- Only allows reading bounties with status 'open' or 'draft'
- Checks `public.is_admin()` which relies on `auth.uid()` being set
- Fails for wallet-based authentication where `auth.uid()` is null

**Permissive Policy** (from `admin-dashboard-schema.sql`):
```sql
CREATE POLICY "Everyone can view bounties" ON bounties
  FOR SELECT USING (true);
```

This policy allows everyone to read bounties, but may be overridden by the restrictive policy.

## Solutions Implemented

### Fix 1: Removed Edge Runtime and Improved Client Initialization

**Changes to** `src/app/api/bounties/[id]/route.ts`:

1. **Removed edge runtime** - Commented out `export const runtime = 'edge';`
2. **Created a client factory function** - `getSupabaseClient()` that:
   - Validates environment variables before use
   - Creates a fresh client for each request
   - Disables session management (not needed for service role)
   - Provides better error messages

3. **Updated all route handlers** (GET, PATCH, DELETE) to use the new client factory

```typescript
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables');
    throw new Error('Supabase configuration missing');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
```

### Fix 2: Database RLS Policy Fix

**Created** `fix-bounties-rls-403.sql` to:

1. **Drop all conflicting policies** on the bounties table
2. **Create clear, simple policies**:
   - Public read access for all bounties
   - Admin-only write access (INSERT, UPDATE, DELETE)
   - Explicitly allow service role to bypass checks

The new policies ensure:
- Anyone can read bounties (no authentication required for GET)
- Service role key always has full access
- Wallet-based admin authentication works correctly

## How to Apply the Fixes

### Step 1: Verify Environment Variables
```bash
node check-api-config.js
```

This will verify that:
- `NEXT_PUBLIC_SUPABASE_URL` is set
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set
- `SUPABASE_SERVICE_ROLE_KEY` is set

### Step 2: Update Database RLS Policies

Run the SQL script in your Supabase SQL Editor:
```sql
-- Open Supabase Dashboard > SQL Editor
-- Paste contents of fix-bounties-rls-403.sql
-- Run the script
```

This will:
- Remove conflicting policies
- Create new, simplified policies
- Show you the active policies for verification

### Step 3: Restart Your Development Server

```bash
# Stop the current server (Ctrl+C)
npm run dev
# or
npm run build && npm start
```

### Step 4: Clear Browser Cache

1. Open DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

### Step 5: Test the Fix

1. Navigate to the bounties page
2. Try to view a specific bounty
3. Check the browser console - the 403 error should be gone
4. Verify bounties are loading correctly

## Verification

After applying fixes, you should see in the console:
- ✅ All bounties fetching successfully
- ✅ No 403 errors
- ✅ Bounty details loading correctly

## Additional Files Created

1. **`fix-bounties-rls-403.sql`** - Database policy fix
2. **`check-api-config.js`** - Environment variable checker
3. **`BOUNTY_403_ERROR_FIX.md`** - This documentation

## Technical Notes

### Why Edge Runtime Can Cause Issues

Edge runtime runs in a lightweight V8 isolate with:
- Limited Node.js APIs
- Different environment variable access
- Potential cold start issues
- Different error handling

For API routes that need reliable database access with service role credentials, using the default Node.js runtime is more reliable.

### Service Role vs Anon Key

- **Anon Key**: Limited access, respects RLS policies
- **Service Role Key**: Full access, bypasses RLS policies (used in API routes)

The service role key should only be used in server-side code (API routes, server components) and never exposed to the client.

### RLS Policy Conflicts

When multiple policies exist for the same operation:
- Policies are combined with OR logic
- A restrictive policy can still block access if other conditions aren't met
- Service role bypasses all RLS, but functions called within policies might still fail

## Prevention

To avoid similar issues in the future:

1. **Use consistent RLS policies** - Have a single source of truth for policies
2. **Test with service role** - Ensure API routes work with service role key
3. **Avoid edge runtime for complex operations** - Use Node.js runtime for database operations
4. **Validate environment variables** - Check they're available before use
5. **Document policy changes** - Track all RLS policy modifications

## Related Files

- `src/app/api/bounties/[id]/route.ts` - Updated API route
- `src/lib/tracking-schema-complete.sql` - Contains restrictive RLS policies
- `src/lib/admin-dashboard-schema.sql` - Contains permissive RLS policies
- `fix-bounties-rls-403.sql` - Policy fix script
- `check-api-config.js` - Configuration checker

## Status

- ✅ API route updated
- ✅ Client initialization improved
- ✅ Edge runtime removed
- ✅ SQL fix script created
- ✅ Documentation complete
- ⏳ Database policies need to be updated (run SQL script)
- ⏳ Testing required after database update

