-- Fix Courses API Issues
-- Run this in Supabase SQL Editor

-- 1. Check if courses table exists and has required columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'courses'
ORDER BY ordinal_position;

-- 2. Check if course_sections table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'course_sections'
);

-- 3. Add missing columns if they don't exist
ALTER TABLE courses ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

-- 4. Update existing courses to have default values
UPDATE courses 
SET 
  is_published = COALESCE(is_published, true),
  is_hidden = COALESCE(is_hidden, false),
  order_index = COALESCE(order_index, 0)
WHERE is_published IS NULL 
   OR is_hidden IS NULL 
   OR order_index IS NULL;

-- 5. Create course_sections table if it doesn't exist
CREATE TABLE IF NOT EXISTS course_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  estimated_duration INTEGER DEFAULT 0,
  is_required BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_courses_is_published ON courses(is_published);
CREATE INDEX IF NOT EXISTS idx_courses_is_hidden ON courses(is_hidden);
CREATE INDEX IF NOT EXISTS idx_courses_order_index ON courses(order_index);
CREATE INDEX IF NOT EXISTS idx_course_sections_course_id ON course_sections(course_id);

-- 7. Test query to see what data exists
SELECT 
  id,
  title,
  squad_id,
  is_published,
  is_hidden,
  order_index
FROM courses
LIMIT 5;

-- 8. Count courses
SELECT COUNT(*) as total_courses FROM courses;
