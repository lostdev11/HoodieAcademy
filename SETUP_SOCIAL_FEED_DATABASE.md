# 🚀 Social Feed Database Setup - Quick Guide

## Issue

You're seeing a **500 error** when trying to access the social feed because the database tables haven't been created yet.

```
Error: relation "social_posts" does not exist
```

---

## ✅ Solution (5 Minutes)

### Step 1: Open Supabase

1. Go to [supabase.com](https://supabase.com)
2. Log into your project
3. Find your Hoodie Academy project

### Step 2: Run SQL Script

1. Click **"SQL Editor"** in the left sidebar
2. Click **"New Query"**
3. Open the file `setup-social-feed.sql` in your project
4. **Copy ALL the contents** of that file
5. **Paste** into the Supabase SQL Editor
6. Click **"Run"** (or press Ctrl+Enter)

### Step 3: Verify

You should see messages like:
```
CREATE TABLE
CREATE INDEX
CREATE TRIGGER
...
Success!
```

### Step 4: Refresh

Go back to `/social` page and refresh. The error should be gone!

---

## 📋 What Gets Created

The SQL script creates **4 tables**:

1. **`social_posts`** - User posts with engagement metrics
2. **`social_comments`** - Comments and replies
3. **`social_reactions`** - Likes/dislikes
4. **`social_post_views`** - View tracking

Plus:
- ✅ Indexes for performance
- ✅ Row Level Security policies
- ✅ Triggers for auto-updating counters
- ✅ Sample data (optional)

---

## 🎯 After Setup

Once you run the script, you'll be able to:

✅ **Create posts** (trial users get 1 free post)
✅ **Comment** on posts (3 XP each)
✅ **Like/dislike** posts (creator gets 1 XP)
✅ **View** all community posts
✅ **Filter** by squad and tags
✅ **Sort** by newest, popular, trending

---

## 🔧 Troubleshooting

### "Permission denied"

Make sure you're logged into Supabase with admin access.

### "Already exists"

Tables already exist! The 500 error might be something else. Check browser console.

### Still getting errors

1. Check the console for specific error messages
2. Verify Supabase credentials in `.env`
3. Make sure RLS policies are set correctly

---

## 📁 File Location

The SQL script is in your project root:

```
your-project/
  ├── setup-social-feed.sql  ← This file!
  ├── src/
  ├── package.json
  └── ...
```

---

## ⚡ Quick Command (Alternative)

If you have `psql` or Supabase CLI:

```bash
# Using psql
psql your_database_url < setup-social-feed.sql

# Using Supabase CLI
supabase db push
```

---

**Once setup is complete, the Social Feed will work perfectly!** 🎉

Need help? The setup-social-feed.sql file has comments explaining each section.

