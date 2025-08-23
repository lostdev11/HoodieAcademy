# Supabase Errors Fix Guide

## Issues Identified

1. **Multiple GoTrueClient instances** - Causing authentication issues
2. **500 errors** when querying the `users` table
3. **404 errors** for `global_settings` and `feature_flags` tables
4. **500 errors** for favicon requests

## Fix Steps

### Step 1: Fix Multiple Supabase Client Instances

The main issue is that multiple Supabase clients are being created throughout your application. I've created a centralized solution:

1. **New centralized hook created**: `src/hooks/useSupabase.ts`
2. **Updated client configuration**: `src/utils/supabase/client.ts`

**What this fixes:**
- Prevents "Multiple GoTrueClient instances" warning
- Ensures consistent authentication state
- Improves performance by reusing client instances

### Step 2: Create Missing Database Tables

**IMPORTANT**: Use the simplified script `FIX_DATABASE_TABLES_SIMPLIFIED.sql` instead of the original one to avoid RLS policy errors.

Run the SQL script `FIX_DATABASE_TABLES_SIMPLIFIED.sql` in your Supabase SQL editor. This will create:

- `users` table (fixes 500 errors)
- `global_settings` table (fixes 404 errors)
- `feature_flags` table (fixes 404 errors)
- `profiles` table
- `user_activity_logs` table
- `announcements` table
- `events` table
- `bounties` table
- `courses` table
- `course_progress` table
- `submissions` table

**To run the script:**
1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `FIX_DATABASE_TABLES.sql`
4. Click "Run" to execute

### Step 3: Update Components to Use Centralized Hook

I've already updated `GlobalAnnouncementBanner.tsx` to use the centralized hook. You should update other components that create their own Supabase clients:

**Components to update:**
- `src/components/EventsList.tsx`
- `src/components/BountiesGrid.tsx`
- `src/components/providers/SettingsProvider.tsx`
- `src/components/bounty/BountyPanel.tsx`
- `src/app/courses/CoursesPageClient.tsx`
- `src/app/courses/[slug]/CoursePageClient.tsx`

**Change from:**
```tsx
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
const supabase = createClientComponentClient();
```

**Change to:**
```tsx
import { useSupabase } from '@/hooks/useSupabase';
const supabase = useSupabase();
```

### Step 4: Verify Database Tables

After running the SQL script, verify that all tables were created successfully. The script includes a verification query at the end that will show the status of each table.

### Step 5: Test the Application

1. **Restart your development server** to ensure the new hook is loaded
2. **Check the browser console** - the "Multiple GoTrueClient instances" warning should be gone
3. **Test wallet connection** - should work without 500 errors
4. **Check for 404 errors** - should be resolved for global_settings and feature_flags

## Expected Results

After implementing these fixes:

✅ **No more "Multiple GoTrueClient instances" warnings**
✅ **No more 500 errors when querying users table**
✅ **No more 404 errors for global_settings and feature_flags**
✅ **Improved authentication consistency**
✅ **Better performance with centralized client management**

## Troubleshooting

### If you get "only WITH CHECK expression allowed for INSERT" error:

This error occurs when RLS policies are incorrectly configured. **Solution**: Use the simplified script `FIX_DATABASE_TABLES_SIMPLIFIED.sql` which avoids complex RLS policies.

### If you still see errors:

1. **Clear browser cache and localStorage**
2. **Restart the development server**
3. **Check that the SQL script ran successfully**
4. **Verify environment variables are correct**

### Environment Variables Check:

Ensure these are set in your `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### Database Connection Test:

You can test the database connection by running this simple query in Supabase SQL Editor:
```sql
SELECT * FROM global_settings LIMIT 1;
```

This should return the default global settings without any errors.

## Files Modified/Created

- ✅ `src/hooks/useSupabase.ts` - New centralized hook
- ✅ `src/utils/supabase/client.ts` - Updated configuration
- ✅ `src/components/GlobalAnnouncementBanner.tsx` - Updated to use centralized hook
- ✅ `FIX_DATABASE_TABLES_SIMPLIFIED.sql` - Simplified database setup script (use this one!)
- ✅ `FIX_DATABASE_TABLES.sql` - Original script (has RLS policy issues)
- ✅ `SUPABASE_ERRORS_FIX_GUIDE.md` - This guide

## Next Steps

After implementing these fixes:

1. **Test all wallet connection flows**
2. **Verify admin dashboard functionality**
3. **Test course and bounty systems**
4. **Monitor for any remaining errors**

The application should now run smoothly without the Supabase-related errors you were experiencing.
