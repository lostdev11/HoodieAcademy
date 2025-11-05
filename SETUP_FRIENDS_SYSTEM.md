# Setup Friends System - Quick Guide

## ✅ Correct SQL File to Run

Make sure you run this file in Supabase SQL Editor:

**`setup-friends-system.sql`** ✅

This is the SQL file with proper PostgreSQL syntax.

## ❌ DON'T Run This File

**DO NOT** run `AUTOMATIC_USER_CREATION.md` - that's a markdown documentation file, not SQL!

## Step-by-Step Setup

### 1. Open Supabase Dashboard
- Go to your Supabase project
- Navigate to **SQL Editor**

### 2. Run the Migration
- Click **"New Query"**
- Copy the entire contents of `setup-friends-system.sql`
- Paste into the SQL Editor
- Click **"Run"** or press `Ctrl/Cmd + Enter`

### 3. Verify Table Created
- Go to **Table Editor**
- You should see a new table called **`friends`**
- Check that it has these columns:
  - `id` (UUID)
  - `follower_wallet` (TEXT)
  - `following_wallet` (TEXT)
  - `created_at` (TIMESTAMP)

### 4. Test the System
1. Connect a wallet to your app
2. Go to `/profile` to see your profile
3. Try to follow another user

## Common Issues

### Issue: "syntax error at or near '#'"
**Solution:** You ran a `.md` file instead of a `.sql` file. Make sure you're running `setup-friends-system.sql`!

### Issue: "relation 'users' does not exist"
**Solution:** You need to run the users table setup first. Check `RUN_THIS_FIRST.sql` or other setup files.

### Issue: "relation 'friends' already exists"
**Solution:** The table already exists. Either drop it first or modify the CREATE statement.

## What Gets Created

### Database Objects
- ✅ `friends` table
- ✅ 4 indexes for performance
- ✅ RLS policies for security
- ✅ Helper functions
- ✅ Triggers for timestamps

### API Endpoints (Already in codebase)
- ✅ `/api/friends` - List, add, remove friends
- ✅ `/api/friends/check` - Check follow status
- ✅ `/api/friends/stats` - Get counts

### UI Components (Already in codebase)
- ✅ Public profile view `/profile/[wallet]`
- ✅ Friends card on profile
- ✅ Follow/Unfollow buttons

## Troubleshooting

If you see any errors during setup, please share:
1. The exact error message
2. Which file you tried to run
3. A screenshot if possible

## Next Steps

Once the table is created successfully:
1. Test following another user
2. Check that friends appear in the list
3. Visit a public profile at `/profile/[wallet]`
4. Share with your community!

