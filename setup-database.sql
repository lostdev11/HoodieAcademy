-- =====================================================
-- SIMPLIFIED DATABASE SETUP FOR HOODIE ACADEMY
-- Run this FIRST in your Supabase SQL Editor
-- =====================================================

-- 1. Create courses table
CREATE TABLE IF NOT EXISTS courses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  emoji TEXT,
  squad TEXT,
  level TEXT,
  access TEXT,
  description TEXT,
  totalLessons INTEGER DEFAULT 0,
  category TEXT,
  is_visible BOOLEAN DEFAULT true,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  updated_by UUID
);

-- 2. Add additional columns that the import script needs
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS slug TEXT,
ADD COLUMN IF NOT EXISTS badge TEXT,
ADD COLUMN IF NOT EXISTS cover_url TEXT,
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- 3. Create indexes
CREATE INDEX IF NOT EXISTS idx_courses_visible ON courses(is_visible);
CREATE INDEX IF NOT EXISTS idx_courses_published ON courses(is_published);
CREATE INDEX IF NOT EXISTS idx_courses_squad ON courses(squad);
CREATE INDEX IF NOT EXISTS idx_courses_created_at ON courses(created_at);
CREATE UNIQUE INDEX IF NOT EXISTS courses_slug_idx ON courses(slug);

-- 4. Enable RLS (Row Level Security)
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- 5. Create basic policies
CREATE POLICY "Everyone can view courses" ON courses
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert courses" ON courses
  FOR INSERT USING (true);

CREATE POLICY "Admins can update courses" ON courses
  FOR UPDATE USING (true);

CREATE POLICY "Admins can delete courses" ON courses
  FOR DELETE USING (true);

-- 6. Verification query
SELECT 'Database setup completed successfully!' as status;
SELECT COUNT(*) as courses_table_exists FROM information_schema.tables WHERE table_name = 'courses';
