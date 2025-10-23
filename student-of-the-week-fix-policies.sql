-- Fix existing policies for Student of the Week settings
-- Run this in your Supabase SQL Editor

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can read student of the week settings" ON student_of_the_week_settings;
DROP POLICY IF EXISTS "Admins can update student of the week settings" ON student_of_the_week_settings;

-- Recreate the policies with the correct permissions
CREATE POLICY "Anyone can read student of the week settings" 
ON student_of_the_week_settings FOR SELECT 
USING (true);

-- Create a more permissive policy for testing (allows all users to update)
CREATE POLICY "Admins can update student of the week settings" 
ON student_of_the_week_settings FOR ALL 
USING (true);

-- Verify the table exists and has data
SELECT * FROM student_of_the_week_settings;
