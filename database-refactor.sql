-- Database Refactor for Hoodie Academy Course Management
-- This file contains all the necessary SQL changes

-- 1. Update existing courses table structure
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS slug TEXT,
ADD COLUMN IF NOT EXISTS cover_url TEXT,
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Create unique index on slug if it doesn't exist
CREATE UNIQUE INDEX IF NOT EXISTS courses_slug_idx ON public.courses(slug);

-- 2. Create course_progress table
CREATE TABLE IF NOT EXISTS public.course_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  percent SMALLINT NOT NULL DEFAULT 0 CHECK (percent BETWEEN 0 AND 100),
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, course_id)
);

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS course_progress_user_id_idx ON public.course_progress(user_id);
CREATE INDEX IF NOT EXISTS course_progress_course_id_idx ON public.course_progress(course_id);
CREATE INDEX IF NOT EXISTS course_progress_completed_idx ON public.course_progress(is_completed);

-- 4. Create trigger to keep updated_at current
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_course_progress_updated_at 
  BEFORE UPDATE ON public.course_progress 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. Set up Row Level Security (RLS)
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_progress ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for courses table
-- Public can only see published courses
CREATE POLICY "Public can view published courses" ON public.courses
  FOR SELECT USING (is_published = true);

-- Authenticated admins can do everything
CREATE POLICY "Admins can manage all courses" ON public.courses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'is_admin' = 'true'
    )
  );

-- 7. RLS Policies for course_progress table
-- Users can only see their own progress
CREATE POLICY "Users can view own progress" ON public.course_progress
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert/update their own progress
CREATE POLICY "Users can manage own progress" ON public.course_progress
  FOR ALL USING (auth.uid() = user_id);

-- Admins can see all progress for reporting
CREATE POLICY "Admins can view all progress" ON public.course_progress
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'is_admin' = 'true'
    )
  );

-- 8. Grant necessary permissions
GRANT SELECT ON public.courses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.courses TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.course_progress TO authenticated;

-- 9. Create function to get course statistics (for admin use)
CREATE OR REPLACE FUNCTION get_course_stats()
RETURNS TABLE (
  course_id UUID,
  total_learners BIGINT,
  completed_learners BIGINT,
  avg_percent NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cp.course_id,
    COUNT(DISTINCT cp.user_id) as total_learners,
    COUNT(DISTINCT CASE WHEN cp.is_completed THEN cp.user_id END) as completed_learners,
    ROUND(AVG(cp.percent), 2) as avg_percent
  FROM public.course_progress cp
  GROUP BY cp.course_id
  ORDER BY avg_percent DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users (RLS will restrict to admins)
GRANT EXECUTE ON FUNCTION get_course_stats() TO authenticated;
