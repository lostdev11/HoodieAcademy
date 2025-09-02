@echo off
echo ========================================
echo Hoodie Academy Course Import Script
echo ========================================
echo.

echo Step 1: Generating SQL import file...
node import-courses-to-admin.js
echo.

echo Step 2: Course import completed!
echo.
echo Next steps:
echo 1. Copy the contents of import-courses.sql
echo 2. Paste into your Supabase SQL Editor
echo 3. Run the SQL to import courses
echo 4. Run: node verify-courses-import.js
echo.
echo Press any key to exit...
pause >nul
