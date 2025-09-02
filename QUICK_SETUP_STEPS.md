# 🚨 QUICK FIX: Database Setup Error

## ❌ **The Problem:**
You're getting this error:
```
ERROR: 42703: column "squad" does not exist
ERROR: 42601: syntax error at or near "#"
```

## ✅ **The Solution:**
You need to set up the database schema BEFORE importing courses.

## 🎯 **Step-by-Step Fix:**

### **Step 1: Set Up Database Schema**
1. **Go to Supabase Dashboard** → **SQL Editor**
2. **Copy the contents of `setup-database.sql`** (not the markdown file!)
3. **Paste into SQL Editor** and click **Run**

### **Step 2: Import Courses**
1. **Copy the contents of `import-courses.sql`** (not the markdown file!)
2. **Paste into SQL Editor** and click **Run**

### **Step 3: Verify**
Run: `node verify-courses-import.js`

## 🚨 **What You Did Wrong:**
- ❌ You tried to run `COURSE_IMPORT_GUIDE.md` (markdown file)
- ❌ You tried to import courses before creating the database table
- ❌ The `squad` column doesn't exist because the table wasn't created

## ✅ **What You Need to Do:**
1. **Run `setup-database.sql` FIRST** (creates the table with `squad` column)
2. **Then run `import-courses.sql`** (imports the courses)
3. **Don't run markdown files** - they're just documentation!

## 🔍 **File Types:**
- **`.sql` files** = Database commands (run these)
- **`.md` files** = Documentation (read these, don't run)

## 💡 **Quick Test:**
After running `setup-database.sql`, you should see:
```
status: Database setup completed successfully!
courses_table_exists: 1
```

Then you can proceed with importing courses!
