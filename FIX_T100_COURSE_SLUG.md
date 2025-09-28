# Fix for T100 Course 404 Error

## Problem
The course "T100 🎯 Intro to Indicators: RSI, BBands, Fibs + Candle Basics" is returning a 404 error because the slug in the database is set to a UUID (`ab647c24-8554-4bc5-a275-53456bc0851e`) instead of the proper slug (`t100-chart-literacy`).

## Root Cause
- Course exists in database with ID: `ab647c24-8554-4bc5-a275-53456bc0851e`
- Course title: "T100 🎯 Intro to Indicators: RSI, BBands, Fibs + Candle Basics"
- Current slug: `ab647c24-8554-4bc5-a275-53456bc0851e` (UUID)
- Expected slug: `t100-chart-literacy`
- Course is published: `true`

## Solutions

### Option 1: Direct Database Fix (Recommended)
Run this SQL in the Supabase SQL editor:

```sql
-- Fix T100 course slug from UUID to proper slug
UPDATE courses 
SET slug = 't100-chart-literacy'
WHERE id = 'ab647c24-8554-4bc5-a275-53456bc0851e'
AND title ILIKE '%T100%';

-- Verify the update
SELECT id, slug, title, is_published 
FROM courses 
WHERE title ILIKE '%T100%';
```

### Option 2: API Route Fix
Use the admin API route at `/api/admin/fix-course-slug` with:
```json
{
  "courseId": "ab647c24-8554-4bc5-a275-53456bc0851e",
  "newSlug": "t100-chart-literacy",
  "walletAddress": "JCUGres3WA8MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU"
}
```

### Option 3: Temporary Workaround
Create a redirect in `next.config.js` or add a custom route that maps the UUID slug to the proper course.

## Verification
After fixing, the course should be accessible at:
- `/courses/t100-chart-literacy/`
- The course file exists at: `public/courses/t100-chart-literacy.json`

## Files Involved
- Database: `courses` table
- Course file: `public/courses/t100-chart-literacy.json`
- API route: `src/app/api/courses/[slug]/route.ts`
- Course page: `src/app/courses/[slug]/page.tsx`
