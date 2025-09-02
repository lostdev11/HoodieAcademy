# 🚀 Course Import Guide for Hoodie Academy Admin Dashboard

This guide explains how to import all existing courses from your `public/courses` directory into the admin database, so admins can manage course visibility and publication status.

## 📋 Overview

The Hoodie Academy currently has **37 courses** stored as JSON files in the `public/courses` directory. This import process will:

- ✅ Add all courses to the admin database
- ✅ Set appropriate squad, level, and access permissions
- ✅ Maintain course metadata (titles, descriptions, emojis, badges)
- ✅ Set courses as visible but unpublished by default
- ✅ Allow admins to control visibility and publication status

## 🛠️ Import Methods

### Method 1: Node.js Script (Recommended)

**Prerequisites:**
- Node.js installed on your system
- Access to the project directory

**Steps:**
1. Open terminal/command prompt in your project root
2. Run the import script:
   ```bash
   node import-courses-to-admin.js
   ```
3. The script will generate `import-courses.sql`
4. Copy the SQL content and run it in your Supabase SQL editor

**What it does:**
- Reads all course JSON files from `public/courses/`
- Maps squad names, levels, and access permissions
- Generates SQL INSERT statements with conflict resolution
- Provides verification queries to check the import

### Method 2: Browser Console Script

**Prerequisites:**
- Access to your admin dashboard
- Browser developer tools

**Steps:**
1. Navigate to your admin dashboard (`/admin`)
2. Open browser developer tools (F12)
3. Go to Console tab
4. Copy and paste the content of `import-courses-browser.js`
5. Press Enter to load the script
6. Run `importAllCourses()` to start the import

**What it does:**
- Uses the admin dashboard's API endpoints
- Imports courses one by one with progress tracking
- Provides real-time feedback and error handling
- Automatically refreshes the dashboard data

## 📊 Course Categories & Distribution

### By Squad:
- **Creators**: 15 courses (NFT, Art, AI, Lore)
- **Raiders**: 8 courses (Trading, NFT Games)
- **Decoders**: 6 courses (Security, Blockchain, Wallet)
- **Rangers**: 8 courses (Community, Leadership)

### By Level:
- **Beginner**: 18 courses
- **Intermediate**: 15 courses  
- **Advanced**: 4 courses

### By Access:
- **Free**: 28 courses
- **Hoodie Holder**: 8 courses
- **DAO Member**: 1 course

## 🔧 Database Schema Requirements

Ensure your `courses` table has these columns:

```sql
CREATE TABLE IF NOT EXISTS courses (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  emoji TEXT,
  badge TEXT,
  squad TEXT,
  level TEXT,
  access TEXT,
  category TEXT,
  totalLessons INTEGER DEFAULT 0,
  cover_url TEXT,
  sort_order INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 📝 Import Process Details

### 1. Data Mapping
- **Squad Mapping**: `Creators` → `creators`, `Decoders` → `decoders`, etc.
- **Level Mapping**: `beginner`, `intermediate`, `advanced`
- **Access Mapping**: `free`, `hoodie`, `dao`
- **Category Mapping**: Based on `pathType` or inferred from content

### 2. Default Values
- **Visibility**: All courses start as `visible = true`
- **Publication**: All courses start as `published = false`
- **Sort Order**: Sequential numbering (1-37)
- **Cover URL**: Set to `null` (can be added later)

### 3. Conflict Resolution
- Uses `ON CONFLICT (id) DO UPDATE` for existing courses
- Updates all fields if a course already exists
- Maintains data integrity

## ✅ Post-Import Steps

### 1. Verify Import
Run these queries in your Supabase SQL editor:
```sql
-- Check total courses
SELECT COUNT(*) as total_courses FROM courses;

-- Check by squad
SELECT squad, COUNT(*) as course_count 
FROM courses GROUP BY squad ORDER BY course_count DESC;

-- Check visibility status
SELECT is_visible, is_published, COUNT(*) 
FROM courses GROUP BY is_visible, is_published;
```

### 2. Admin Dashboard Setup
1. Navigate to `/admin` in your application
2. Go to the "Courses" tab
3. Verify all 37 courses are visible
4. Check that courses show appropriate squad, level, and access badges

### 3. Configure Course Settings
- **Sort Order**: Adjust `sort_order` for better organization
- **Visibility**: Hide courses that aren't ready for users
- **Publication**: Publish courses that are complete and ready
- **Access Control**: Verify squad and access restrictions

## 🚨 Troubleshooting

### Common Issues:

**1. Courses not appearing in admin dashboard**
- Check if the API endpoint `/api/courses` is working
- Verify database connection and permissions
- Check browser console for JavaScript errors

**2. Import script errors**
- Ensure all course JSON files are valid JSON
- Check file permissions for the courses directory
- Verify Node.js version compatibility

**3. Database constraint violations**
- Check for duplicate course IDs
- Verify unique constraints on `slug` field
- Ensure all required fields are present

### Error Recovery:

**If import fails partway through:**
1. Check which courses were successfully imported
2. Fix any data issues in the source JSON files
3. Re-run the import script (it will skip existing courses)
4. Use the verification queries to identify missing courses

## 🔄 Updating Existing Courses

To update course information after import:

1. **Via Admin Dashboard**: Use the edit functionality in the Courses tab
2. **Via Database**: Update directly in Supabase SQL editor
3. **Via API**: Use PUT/PATCH requests to `/api/courses/[id]`

## 📈 Monitoring & Maintenance

### Regular Tasks:
- Monitor course completion rates
- Update course content and descriptions
- Adjust access permissions based on user feedback
- Archive or remove outdated courses

### Performance Considerations:
- The import process adds ~37 courses to your database
- Monitor database performance after import
- Consider adding indexes on frequently queried fields

## 🎯 Next Steps

After successful import:

1. **Test Course Visibility**: Verify courses appear correctly for different user types
2. **Set Publication Status**: Publish courses that are ready for users
3. **Configure Access Control**: Ensure squad and access restrictions work properly
4. **Monitor User Experience**: Check that users can access appropriate courses
5. **Plan Content Updates**: Use the admin dashboard to manage course content

## 📞 Support

If you encounter issues during the import process:

1. Check the browser console for error messages
2. Verify database schema matches requirements
3. Test API endpoints independently
4. Review course JSON files for data integrity

---

**Happy importing! 🚀**

Your Hoodie Academy admin dashboard will soon have full control over all 37 courses, allowing you to manage visibility, publication status, and access control with ease.
