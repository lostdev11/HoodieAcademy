# 🔧 Fix Database Setup Issue

## ❌ **Current Problem:**
You're getting this error:
```
ERROR: 42P01: relation "quiz_results" does not exist
LINE 128: LEFT JOIN quiz_results qr ON u.wallet_address = qr.wallet_address
```

This happens because you're trying to run the leaderboard setup **before** the complete database setup.

## ✅ **Solution: Run Files in Correct Order**

### **Step 1: Check What's Missing**
First, run this to see what tables exist:
```sql
-- Copy and paste this in Supabase SQL Editor:
src/lib/check-database-status.sql
```

### **Step 2: Run Complete Database Setup FIRST**
```sql
-- Copy and paste this in Supabase SQL Editor:
src/lib/complete-database-setup-clean.sql
```

This creates ALL tables including:
- ✅ `users`
- ✅ `course_completions`
- ✅ `quiz_results` ← **This is what was missing!**
- ✅ `badges`
- ✅ `submissions`
- ✅ `bounty_submissions`
- ✅ `user_xp`
- ✅ `xp_transactions`
- ✅ `retailstar_rewards`
- ✅ `user_retailstar_rewards`
- ✅ `retailstar_tasks`
- ✅ `user_task_completions`

### **Step 3: Run Leaderboard Setup SECOND**
```sql
-- Copy and paste this in Supabase SQL Editor:
src/lib/leaderboard-setup-clean.sql
```

This creates:
- ✅ `get_leaderboard_rankings()` function
- ✅ `leaderboard_view` view

## 🚨 **Why This Error Happens:**

The leaderboard SQL references tables that don't exist yet:
```sql
LEFT JOIN quiz_results qr ON u.wallet_address = qr.wallet_address
```

But `quiz_results` table is created by the complete database setup, not the leaderboard setup.

## 📋 **Correct Order:**

1. **Complete Database Setup** → Creates all tables
2. **Leaderboard Setup** → Creates functions that reference tables

## 🧪 **Test After Setup:**

```sql
-- Test leaderboard function
SELECT * FROM get_leaderboard_rankings() LIMIT 5;

-- Test leaderboard view
SELECT * FROM leaderboard_view LIMIT 5;
```

## ⚡ **Quick Fix:**

**Run the complete database setup FIRST, then the leaderboard setup!** 