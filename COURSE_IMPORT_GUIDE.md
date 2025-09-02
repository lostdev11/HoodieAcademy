# Course Import Guide for Hoodie Academy Admin Dashboard

## 🚀 Overview

This guide will help you import all 39 existing courses into your Supabase admin dashboard database. The import script has already been generated and is ready to use.

## 📋 Prerequisites

1. **Supabase Project Setup**: Ensure your Supabase project is running and accessible
2. **Environment Variables**: Configure your `.env.local` file with Supabase credentials
3. **Database Schema**: The admin dashboard schema should be set up (see `src/lib/admin-dashboard-schema.sql`)

## 🔧 Environment Setup

Create or update your `.env.local` file with:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## 📊 Import Summary

The import script has processed **39 courses** with the following breakdown:

- **Squads**: 
  - Decoders: 10 courses
  - Speakers: 8 courses  
  - Raiders: 11 courses
  - Creators: 9 courses
  - All Squads: 1 course

- **Levels**:
  - Beginner: 22 courses
  - Intermediate: 11 courses
  - Advanced: 6 courses

- **Access**:
  - Free: 25 courses
  - Squad-gated: 4 courses
  - Hoodie-gated: 8 courses
  - Optional: 1 course
  - DAO-only: 1 course

## 🗄️ Database Schema Updates

The import script will automatically add these columns if they don't exist:
- `slug` - URL-friendly course identifier
- `cover_url` - Course cover image URL
- `sort_order` - Course ordering for display

## 📥 Import Methods

### Method 1: Supabase SQL Editor (Recommended)

1. **Open Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to **SQL Editor**

2. **Run the Import Script**
   - Copy the contents of `import-courses.sql`
   - Paste into the SQL editor
   - Click **Run** to execute

3. **Verify Import**
   - Check the verification queries at the bottom of the script
   - Ensure all 39 courses are imported

### Method 2: Command Line (Advanced)

If you prefer using the Supabase CLI:

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your_project_ref

# Run the import script
supabase db reset --linked
# Then copy the SQL content into your database
```

## 🔍 Verification Queries

After import, run these queries to verify success:

```sql
-- Check total courses imported
SELECT COUNT(*) as total_courses FROM courses;

-- Check courses by squad
SELECT squad, COUNT(*) as course_count 
FROM courses 
GROUP BY squad 
ORDER BY course_count DESC;

-- Check courses by level
SELECT level, COUNT(*) as course_count 
FROM courses 
GROUP BY level 
ORDER BY course_count DESC;

-- Check courses by access
SELECT access, COUNT(*) as course_count 
FROM courses 
GROUP BY access 
ORDER BY course_count DESC;

-- List all imported courses
SELECT 
  id,
  slug,
  title,
  squad,
  level,
  access,
  is_visible,
  is_published,
  sort_order
FROM courses 
ORDER BY sort_order, title;
```

## ⚙️ Post-Import Configuration

### 1. Course Visibility
By default, all courses are:
- `is_visible: true` - Visible in the course catalog
- `is_published: false` - Not yet published (requires admin approval)

### 2. Publishing Courses
To publish courses, update their status:

```sql
-- Publish all courses (optional)
UPDATE courses SET is_published = true;

-- Publish specific courses
UPDATE courses 
SET is_published = true 
WHERE squad = 'decoders' AND level = 'beginner';

-- Publish by category
UPDATE courses 
SET is_published = true 
WHERE category = 'cybersecurity';
```

### 3. Course Ordering
Set custom sort order for courses:

```sql
-- Update sort order for specific courses
UPDATE courses SET sort_order = 1 WHERE id = 'a120-ai-vocab';
UPDATE courses SET sort_order = 2 WHERE id = 'a150-prompt-engineering';
-- Continue for other courses as needed
```

## 🎯 Admin Dashboard Features

Once imported, you can:

1. **View All Courses**: See all 39 courses in the admin dashboard
2. **Edit Course Details**: Modify titles, descriptions, access levels
3. **Control Visibility**: Toggle course visibility and publication status
4. **Track Progress**: Monitor user progress across all courses
5. **Manage Access**: Control which squads/levels can access courses

## 🚨 Troubleshooting

### Common Issues

1. **Permission Denied**
   - Ensure you're using the correct Supabase credentials
   - Check that your user has admin privileges

2. **Table Not Found**
   - Run the admin dashboard schema setup first
   - Verify table names match exactly

3. **Duplicate Key Errors**
   - The import script uses `ON CONFLICT` to handle duplicates
   - This is normal and will update existing courses

4. **Missing Columns**
   - The script automatically adds missing columns
   - Check the ALTER TABLE statements in the import file

### Error Recovery

If the import fails partway through:

```sql
-- Check what was imported
SELECT COUNT(*) FROM courses;

-- Clear failed import (if needed)
DELETE FROM courses WHERE created_at > NOW() - INTERVAL '1 hour';

-- Re-run the import script
```

## 📈 Next Steps

After successful import:

1. **Review Course Data**: Verify all courses appear correctly
2. **Set Publication Status**: Decide which courses to publish immediately
3. **Configure Access Levels**: Adjust squad and level restrictions as needed
4. **Test User Experience**: Verify courses work in the frontend
5. **Monitor Analytics**: Track course engagement and completion rates

## 🔄 Re-importing

To update courses with new data:

1. **Regenerate Import Script**: Run `node import-courses-to-admin.js`
2. **Review Changes**: Check the new SQL file for updates
3. **Run Import**: Execute the new SQL in Supabase
4. **Verify Updates**: Ensure changes are applied correctly

## 📞 Support

If you encounter issues:

1. Check the Supabase logs for error details
2. Verify your database schema matches the expected structure
3. Ensure all environment variables are correctly set
4. Review the import script output for any processing errors

---

**✨ Your Hoodie Academy courses are now ready for the admin dashboard!**
