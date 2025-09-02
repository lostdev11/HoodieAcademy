# Database Fix Instructions for Hoodie Academy

## 🚨 Current Issues
- **400 Bad Request** when fetching courses
- **406 Not Acceptable** when fetching global settings  
- **500 Internal Server Error** for several database queries
- **No courses showing** in the course tab

## 🔧 Quick Fix Steps

### Step 1: Run the Database Fix Script
1. Go to your **Supabase Dashboard**
2. Navigate to **SQL Editor**
3. Copy and paste the entire contents of `COMPLETE_DATABASE_FIX.sql`
4. Click **"Run"** to execute the script

### Step 2: Verify the Fix
After running the script, you should see:
- ✅ **Database setup completed successfully!**
- ✅ **3 sample courses** inserted
- ✅ **All required tables** created with proper structure

## 📊 What the Fix Script Does

1. **Creates/Fixes Courses Table**
   - Adds all missing columns (`slug`, `emoji`, `badge`, `squad`, etc.)
   - Sets proper defaults for `is_visible` and `is_published`
   - Creates necessary indexes for performance

2. **Creates Global Settings Table**
   - Site maintenance flags
   - Feature toggles for various systems
   - Default values for all settings

3. **Creates Users Table**
   - Wallet address storage
   - Admin status tracking
   - Squad assignments

4. **Creates Submissions Table**
   - Bounty submission tracking
   - Upvote system support

5. **Sets Up Security**
   - Row Level Security (RLS) policies
   - Proper permissions for public/admin access

6. **Inserts Sample Data**
   - 3 sample courses (NFT Mastery, Wallet Wizardry, Meme Coin Mania)
   - All courses set to visible and published

## 🎯 Expected Results

After running the fix:
- **Courses tab** should show 3 sample courses
- **No more 400/406/500 errors** in console
- **Admin dashboard** should work properly
- **All database queries** should succeed

## 🔍 Troubleshooting

If you still see errors after running the script:

1. **Check Supabase Logs**
   - Go to Supabase Dashboard → Logs
   - Look for any SQL errors

2. **Verify Table Structure**
   - Go to Supabase Dashboard → Table Editor
   - Check that `courses` table has all required columns

3. **Check RLS Policies**
   - Ensure Row Level Security is enabled
   - Verify policies allow public read access

## 📝 Manual Verification

Run this query in SQL Editor to verify everything is working:

```sql
-- Check all tables
SELECT 
    'Database setup completed successfully!' as status,
    (SELECT COUNT(*) FROM courses) as total_courses,
    (SELECT COUNT(*) FROM global_settings) as global_settings_count,
    (SELECT COUNT(*) FROM users) as total_users;

-- Check courses specifically
SELECT 
    id, title, is_visible, is_published, squad, level
FROM courses 
ORDER BY sort_order;
```

## 🚀 Next Steps

After the database is fixed:
1. **Test the courses tab** - should show 3 courses
2. **Test admin dashboard** - should load without errors
3. **Import more courses** using the admin bulk import feature
4. **Customize course settings** as needed

## 📞 Need Help?

If you continue to experience issues:
1. Check the browser console for specific error messages
2. Verify your Supabase environment variables are correct
3. Ensure your Supabase project has the correct permissions

