-- Enable Real-time for Courses Table
-- Run this in your Supabase SQL editor to enable real-time functionality

-- Enable real-time for the courses table
ALTER PUBLICATION supabase_realtime ADD TABLE courses;

-- Verify real-time is enabled
SELECT 
  schemaname,
  tablename,
  pubname
FROM pg_publication_tables 
WHERE tablename = 'courses';

-- Check if the courses table has the required fields
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'courses' 
  AND column_name IN ('is_visible', 'is_published')
ORDER BY column_name;

-- Create indexes for better real-time performance (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_courses_visible_realtime ON courses(is_visible);
CREATE INDEX IF NOT EXISTS idx_courses_published_realtime ON courses(is_published);
CREATE INDEX IF NOT EXISTS idx_courses_updated_at_realtime ON courses(updated_at);

-- Enable Row Level Security (RLS) if not already enabled
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Create or update policies for real-time access
-- Allow all users to read courses (needed for real-time subscriptions)
CREATE POLICY "Allow read access for real-time" ON courses
  FOR SELECT USING (true);

-- Ensure admin policies exist for modifications
CREATE POLICY "Admins can modify courses" ON courses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  );

-- Verify the setup
SELECT 
  'Real-time setup complete' as status,
  COUNT(*) as total_courses,
  COUNT(CASE WHEN is_visible = true THEN 1 END) as visible_courses,
  COUNT(CASE WHEN is_published = true THEN 1 END) as published_courses
FROM courses;
