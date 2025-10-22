# Duplicate Users Fix - October 21, 2025

## Problem

You have duplicate user records showing in the admin dashboard's Users tab. This happens when the same `wallet_address` appears multiple times in the `users` table.

## Solution Applied

### 1. ✅ API Deduplication (Immediate Fix)

**File Modified:** `src/app/api/admin/users/route.ts`

Added deduplication logic that keeps only the most recent record for each wallet address. This fixes the display issue immediately without touching the database.

```typescript
// Deduplicate users by wallet_address (keep most recent)
const uniqueUsersMap = new Map();
users.forEach(user => {
  const existing = uniqueUsersMap.get(user.wallet_address);
  if (!existing || new Date(user.updated_at) > new Date(existing.updated_at)) {
    uniqueUsersMap.set(user.wallet_address, user);
  }
});
```

**Result:** Users tab now shows only unique users (keeps most recently updated record).

### 2. 🔧 Database Cleanup (Permanent Fix)

**File Created:** `fix-duplicate-users.sql`

Run this SQL script in Supabase to permanently remove duplicates from the database.

## How to Use

### Step 1: Check the Dashboard

1. Refresh your admin dashboard
2. Go to Users tab
3. The duplicates should now be gone (thanks to API deduplication)

### Step 2: Clean Up Database (Recommended)

1. **Check for duplicates:**
   ```sql
   SELECT 
     wallet_address,
     COUNT(*) as duplicate_count
   FROM users
   GROUP BY wallet_address
   HAVING COUNT(*) > 1;
   ```

2. **If duplicates found, run the cleanup script:**
   - Open Supabase Dashboard → SQL Editor
   - Copy the contents of `fix-duplicate-users.sql`
   - Review the script carefully
   - Execute it

3. **Verify cleanup:**
   ```sql
   SELECT wallet_address, COUNT(*) 
   FROM users 
   GROUP BY wallet_address 
   HAVING COUNT(*) > 1;
   ```
   Should return 0 rows.

## What the Cleanup Does

1. **Identifies Duplicates** - Shows you which wallet addresses have multiple records
2. **Removes Duplicates** - Keeps the most recent record (based on `updated_at`)
3. **Adds Constraint** - Prevents future duplicates with a UNIQUE constraint
4. **Verifies Results** - Confirms no duplicates remain

## Which Record is Kept?

The script keeps the record with the **most recent `updated_at` timestamp**. This ensures you keep the user's latest data (XP, level, squad, etc.).

If two records have the same `updated_at`, it uses `created_at` as a tiebreaker.

## Safety Features

✅ **Non-destructive in API** - API fix doesn't delete anything  
✅ **Keeps most recent** - Database cleanup preserves latest user data  
✅ **Prevents future duplicates** - Adds UNIQUE constraint  
✅ **Backup available** - Supabase has automatic backups  

## Manual Cleanup (Alternative)

If you want more control over which record to keep:

```sql
-- Example: Keep the user with highest XP
DELETE FROM users 
WHERE wallet_address = 'SPECIFIC_WALLET_HERE'
AND id != (
  SELECT id FROM users 
  WHERE wallet_address = 'SPECIFIC_WALLET_HERE'
  ORDER BY total_xp DESC, updated_at DESC
  LIMIT 1
);
```

## Common Causes of Duplicates

1. **Race Conditions** - Multiple simultaneous user creations
2. **Missing Constraint** - No UNIQUE constraint on wallet_address
3. **Manual Inserts** - Direct database inserts without checking
4. **Import Scripts** - Bulk imports without deduplication

## Prevention

The cleanup script adds a UNIQUE constraint:

```sql
ALTER TABLE users
ADD CONSTRAINT users_wallet_address_unique 
UNIQUE (wallet_address);
```

This prevents future duplicates at the database level.

## Testing

### Before Cleanup
```sql
-- Should show duplicates
SELECT wallet_address, COUNT(*) as count
FROM users
GROUP BY wallet_address
HAVING COUNT(*) > 1;
```

### After Cleanup
```sql
-- Should return 0 rows
SELECT wallet_address, COUNT(*) as count
FROM users
GROUP BY wallet_address
HAVING COUNT(*) > 1;
```

### Verify User Count
```sql
-- Check total users
SELECT COUNT(*) FROM users;

-- Check unique wallets
SELECT COUNT(DISTINCT wallet_address) FROM users;

-- These numbers should now match!
```

## Rollback

If something goes wrong:

1. **Supabase Dashboard → Database → Backups**
2. Select a backup from before you ran the script
3. Click "Restore"

## Summary

✅ **Immediate Fix** - API deduplication (already applied)  
✅ **Permanent Fix** - Database cleanup script provided  
✅ **Prevention** - UNIQUE constraint added  
✅ **Safe** - Keeps most recent data, backups available  

## Next Steps

1. ✅ Refresh admin dashboard - duplicates should be gone
2. ✅ Run `fix-duplicate-users.sql` in Supabase to clean database
3. ✅ Verify with the test queries above
4. ✅ Monitor for any new duplicates (should be prevented by constraint)

If you see new duplicates after this fix, it means there's an issue with user creation logic that needs investigation.

