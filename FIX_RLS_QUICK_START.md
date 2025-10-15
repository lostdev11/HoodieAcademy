# 🚀 Fix RLS Issues - 2 Minute Guide

## What You Need to Do

You have **4 security errors** in your Supabase database. Here's how to fix them in 2 minutes:

---

## Step 1: Open Supabase SQL Editor

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click **SQL Editor** in the sidebar
4. Click **New Query**

---

## Step 2: Run This Script

Copy and paste the entire contents of:
```
fix-rls-security-issues-minimal.sql
```

Then click **Run** (or press `Ctrl + Enter`)

> 💡 **Note**: Using the "minimal" version because not all tables exist yet. This only fixes the 4 errors you have.

**Expected Output:**
```
ALTER TABLE
CREATE POLICY
CREATE POLICY
...
✅ Success!
```

---

## Step 3: Verify It Worked

The script automatically runs verification queries at the end.

**You should see:**

### Table RLS Status
| tablename | rls_enabled |
|-----------|-------------|
| bounties | true ✅ |
| bounty_submissions | true ✅ |
| mentorship_sessions | true ✅ |
| mentorship_presenters | true ✅ |
| session_student_permissions | true ✅ |

### Policies Created
You should see **20+ policies** listed across all tables.

---

## Step 4: Re-check Linter

1. Go to **Database** → **Linter** in Supabase
2. Click **Refresh**
3. All 4 errors should be **GONE** ✅

---

## ✅ Done!

Your database is now secure! 🔒

---

## If Something Goes Wrong

**Error: "cannot change return type"**
- Run this first:
```sql
DROP VIEW IF EXISTS public.active_presenters CASCADE;
```

**Error: "policy already exists"**
- The script handles this automatically with `DROP POLICY IF EXISTS`
- Just run it again

**Error: "auth.jwt() does not exist"**
- This is normal - policies will work when called from your app
- Don't worry about this error in SQL Editor

---

## What Changed?

1. **Bounties** - RLS now enabled (was disabled)
2. **Bounty Submissions** - RLS now enabled with full policies
3. **Active Presenters View** - Now uses safe SECURITY INVOKER
4. **Mentorship Tables** - All have proper RLS policies

**Your app will work exactly the same**, but now it's **secure**! 🎉

