# 🗄️ Database Setup Guide for Hoodie Academy

## Overview

This guide will help you set up the complete database schema for Hoodie Academy, including all tables, functions, and the leaderboard system.

## 📋 Setup Order

**IMPORTANT**: Run these files in the exact order shown below to avoid foreign key constraint errors.

### 1. Complete Database Setup
**File**: `src/lib/complete-database-setup.sql`

This creates all the base tables in the correct order:
- ✅ `users` (base table)
- ✅ `course_completions` 
- ✅ `quiz_results`
- ✅ `badges`
- ✅ `submissions`
- ✅ `bounty_submissions`
- ✅ `user_xp`
- ✅ `xp_transactions`
- ✅ `retailstar_rewards`
- ✅ `user_retailstar_rewards`
- ✅ `retailstar_tasks`
- ✅ `user_task_completions`

**Run this first in your Supabase SQL editor**

### 2. Leaderboard Setup
**File**: `src/lib/leaderboard-setup.sql`

This creates the leaderboard function and view that references the tables created in step 1.

**Run this second in your Supabase SQL editor**

## 🔧 How to Run

### Option 1: Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `complete-database-setup.sql`
4. Click **Run**
5. Copy and paste the contents of `leaderboard-setup.sql`
6. Click **Run**

### Option 2: Command Line (if you have psql access)
```bash
# Run complete database setup
psql -h db.supabase.co -U postgres -d postgres -f src/lib/complete-database-setup.sql

# Run leaderboard setup
psql -h db.supabase.co -U postgres -d postgres -f src/lib/leaderboard-setup.sql
```

## ✅ Verification

After running both files, you can verify the setup by running this query in the SQL editor:

```sql
-- Check that all tables were created successfully
SELECT 
  table_name,
  CASE 
    WHEN table_name IN ('users', 'course_completions', 'quiz_results', 'badges', 'submissions', 'bounty_submissions', 'user_xp', 'xp_transactions', 'retailstar_rewards', 'user_retailstar_rewards', 'retailstar_tasks', 'user_task_completions') 
    THEN '✅ Created'
    ELSE '❌ Missing'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('users', 'course_completions', 'quiz_results', 'badges', 'submissions', 'bounty_submissions', 'user_xp', 'xp_transactions', 'retailstar_rewards', 'user_retailstar_rewards', 'retailstar_tasks', 'user_task_completions')
ORDER BY table_name;
```

## 🚨 Common Errors & Solutions

### Error: "foreign key constraint cannot be implemented"
**Cause**: Tables created in wrong order or wrong data types
**Solution**: Run `complete-database-setup.sql` first, which creates tables in the correct order

### Error: "relation does not exist"
**Cause**: Leaderboard SQL trying to reference tables that don't exist yet
**Solution**: Run `complete-database-setup.sql` before `leaderboard-setup.sql`

### Error: "column does not exist"
**Cause**: Column name mismatch (e.g., `wallet_id` vs `wallet_address`)
**Solution**: All SQL files now use `wallet_address` consistently

## 🎯 What's Included

### Core Tables
- **Users**: User profiles and squad assignments
- **Course Completions**: Track course progress
- **Quiz Results**: Store quiz scores and passes
- **Badges**: Achievement tracking
- **Submissions**: Bounty and course submissions

### XP System
- **User XP**: Total XP tracking
- **XP Transactions**: Detailed XP history
- **Bounty Submissions**: Bounty-specific XP tracking

### Retailstar Rewards
- **Rewards Catalog**: Available rewards
- **User Rewards**: Awarded rewards tracking
- **Tasks**: Task assignments
- **Task Completions**: Completion tracking

### Functions
- `award_bounty_xp()`: Award XP for bounty submissions
- `award_winner_bonus()`: Award bonus XP for winners
- `award_retailstar_reward()`: Award retailstar rewards
- `get_leaderboard_rankings()`: Get leaderboard data

## 🧪 Testing

After setup, you can test the system:

```sql
-- Test leaderboard function
SELECT * FROM get_leaderboard_rankings() LIMIT 10;

-- Test leaderboard view
SELECT * FROM leaderboard_view LIMIT 10;

-- Test bounty XP function
SELECT award_bounty_xp('test-wallet', 'test-bounty', gen_random_uuid(), 10);
```

## 📞 Support

If you encounter any issues:
1. Check the error message carefully
2. Ensure you ran the files in the correct order
3. Verify all tables exist using the verification query above
4. Check that your Supabase project has the correct permissions 