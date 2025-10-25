# Fix Social Feed 500 Error

## Problem

You're seeing this error when creating posts:

```
Failed to create post - Could not find a relationship between 'social_posts' and 'users' in the schema cache
```

## Root Cause

The `social_posts` table is missing foreign key constraints that relate it to the `users` table. Supabase's auto-generated relationship feature requires these foreign keys to exist.

## Solution

### Option 1: For NEW Databases (Recommended)

Run the updated `setup-social-feed.sql` file which now includes the foreign key constraints:

1. Go to Supabase SQL Editor
2. Open `setup-social-feed.sql`
3. Copy and paste the entire contents
4. Run the script

This will create all tables with the correct foreign key relationships.

### Option 2: For EXISTING Databases

If you already have the social feed tables set up, run the migration script:

1. Go to Supabase SQL Editor
2. Open `fix-social-posts-foreign-keys.sql`
3. Copy and paste the entire contents
4. Run the script

This will add the missing foreign key constraints to your existing tables.

## What Changed

### 1. Updated `setup-social-feed.sql`

Added foreign key constraints to all social tables:

```sql
CREATE TABLE social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL REFERENCES users(wallet_address) ON DELETE CASCADE,
  ...
);
```

### 2. Updated API Routes

- Fixed the relationship query syntax from `author:users!...` to `users!...`
- Added mapping to transform `users` response to `author` for frontend compatibility

### 3. Files Modified

- `setup-social-feed.sql` - Added foreign key constraints
- `src/app/api/social/posts/route.ts` - Fixed relationship syntax
- `src/app/api/admin/social/route.ts` - Fixed relationship syntax

## Verification

After running the migration, verify the constraints exist:

```sql
SELECT
  tc.table_name,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('social_posts', 'social_comments', 'social_reactions', 'social_post_views');
```

You should see foreign key constraints for all social tables.

## Testing

After applying the fix:

1. Try creating a social post
2. Check that posts load without errors
3. Verify that user information (display_name, level, squad) shows correctly

If you still see errors, check the Supabase logs for specific error messages.
