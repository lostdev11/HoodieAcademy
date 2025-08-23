-- Admin Dashboard Database Schema Setup
-- Run this script in your Supabase SQL editor to set up all required tables

-- =====================================================
-- 1. COURSES TABLE (if not exists)
-- =====================================================

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

-- Create indexes for courses
CREATE INDEX IF NOT EXISTS idx_courses_visible ON courses(is_visible);
CREATE INDEX IF NOT EXISTS idx_courses_published ON courses(is_published);
CREATE INDEX IF NOT EXISTS idx_courses_squad ON courses(squad);
CREATE INDEX IF NOT EXISTS idx_courses_created_at ON courses(created_at);

-- Enable RLS for courses
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Create policies for courses
CREATE POLICY "Everyone can view courses" ON courses
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert courses" ON courses
  FOR INSERT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  );

CREATE POLICY "Admins can update courses" ON courses
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  );

CREATE POLICY "Admins can delete courses" ON courses
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  );

-- =====================================================
-- 2. ANNOUNCEMENTS TABLE (if not exists)
-- =====================================================

CREATE TABLE IF NOT EXISTS announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  updated_by UUID
);

-- Create indexes for announcements
CREATE INDEX IF NOT EXISTS idx_announcements_published ON announcements(is_published);
CREATE INDEX IF NOT EXISTS idx_announcements_starts_at ON announcements(starts_at);
CREATE INDEX IF NOT EXISTS idx_announcements_ends_at ON announcements(ends_at);
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at);

-- Enable RLS for announcements
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Create policies for announcements
CREATE POLICY "Everyone can view announcements" ON announcements
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert announcements" ON announcements
  FOR INSERT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  );

CREATE POLICY "Admins can update announcements" ON announcements
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  );

CREATE POLICY "Admins can delete announcements" ON announcements
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  );

-- =====================================================
-- 3. EVENTS TABLE (if not exists)
-- =====================================================

CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  date DATE,
  time TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  updated_by UUID
);

-- Create indexes for events
CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at);

-- Enable RLS for events
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Create policies for events
CREATE POLICY "Everyone can view events" ON events
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert events" ON events
  FOR INSERT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  );

CREATE POLICY "Admins can update events" ON events
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  );

CREATE POLICY "Admins can delete events" ON events
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  );

-- =====================================================
-- 4. BOUNTIES TABLE (if not exists)
-- =====================================================

CREATE TABLE IF NOT EXISTS bounties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  short_desc TEXT,
  reward TEXT,
  deadline DATE,
  link_to TEXT,
  image TEXT,
  squad_tag TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired')),
  hidden BOOLEAN DEFAULT false,
  submissions INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  updated_by UUID
);

-- Create indexes for bounties
CREATE INDEX IF NOT EXISTS idx_bounties_status ON bounties(status);
CREATE INDEX IF NOT EXISTS idx_bounties_hidden ON bounties(hidden);
CREATE INDEX IF NOT EXISTS idx_bounties_squad_tag ON bounties(squad_tag);
CREATE INDEX IF NOT EXISTS idx_bounties_deadline ON bounties(deadline);
CREATE INDEX IF NOT EXISTS idx_bounties_created_at ON bounties(created_at);

-- Enable RLS for bounties
ALTER TABLE bounties ENABLE ROW LEVEL SECURITY;

-- Create policies for bounties
CREATE POLICY "Everyone can view bounties" ON bounties
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert bounties" ON bounties
  FOR INSERT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  );

CREATE POLICY "Admins can update bounties" ON bounties
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  );

CREATE POLICY "Admins can delete bounties" ON bounties
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  );

-- =====================================================
-- 5. COURSE PROGRESS TABLE (if not exists)
-- =====================================================

CREATE TABLE IF NOT EXISTS course_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL,
  completed_lessons JSONB DEFAULT '[]',
  progress_percentage INTEGER DEFAULT 0,
  last_accessed TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

-- Create indexes for course_progress
CREATE INDEX IF NOT EXISTS idx_course_progress_user ON course_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_course_progress_course ON course_progress(course_id);
CREATE INDEX IF NOT EXISTS idx_course_progress_progress ON course_progress(progress_percentage);

-- Enable RLS for course_progress
ALTER TABLE course_progress ENABLE ROW LEVEL SECURITY;

-- Create policies for course_progress
CREATE POLICY "Users can view their own progress" ON course_progress
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own progress" ON course_progress
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own progress" ON course_progress
  FOR UPDATE USING (user_id = auth.uid());

-- =====================================================
-- 6. GLOBAL SETTINGS TABLE (if not exists)
-- =====================================================

CREATE TABLE IF NOT EXISTS global_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  site_maintenance BOOLEAN DEFAULT false,
  registration_enabled BOOLEAN DEFAULT true,
  course_submissions_enabled BOOLEAN DEFAULT true,
  bounty_submissions_enabled BOOLEAN DEFAULT true,
  chat_enabled BOOLEAN DEFAULT true,
  leaderboard_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID
);

-- Insert default global settings if table is empty
INSERT INTO global_settings (id, site_maintenance, registration_enabled, course_submissions_enabled, bounty_submissions_enabled, chat_enabled, leaderboard_enabled)
VALUES (
  gen_random_uuid(),
  false,
  true,
  true,
  true,
  true,
  true
)
ON CONFLICT DO NOTHING;

-- Enable RLS for global_settings
ALTER TABLE global_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for global_settings
CREATE POLICY "Everyone can view global settings" ON global_settings
  FOR SELECT USING (true);

CREATE POLICY "Admins can update global settings" ON global_settings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  );

-- =====================================================
-- 7. FEATURE FLAGS TABLE (if not exists)
-- =====================================================

CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  enabled BOOLEAN DEFAULT false,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID
);

-- Enable RLS for feature_flags
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

-- Create policies for feature_flags
CREATE POLICY "Everyone can view feature flags" ON feature_flags
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert feature flags" ON feature_flags
  FOR INSERT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  );

CREATE POLICY "Admins can update feature flags" ON feature_flags
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  );

CREATE POLICY "Admins can delete feature flags" ON feature_flags
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  );

-- =====================================================
-- 8. ENABLE REALTIME FOR ALL TABLES
-- =====================================================

-- Enable realtime for all tables in the supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE courses;
ALTER PUBLICATION supabase_realtime ADD TABLE announcements;
ALTER PUBLICATION supabase_realtime ADD TABLE events;
ALTER PUBLICATION supabase_realtime ADD TABLE bounties;
ALTER PUBLICATION supabase_realtime ADD TABLE course_progress;
ALTER PUBLICATION supabase_realtime ADD TABLE global_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE feature_flags;

-- =====================================================
-- 9. CREATE UPDATED_AT TRIGGERS
-- =====================================================

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for all tables
CREATE TRIGGER update_courses_updated_at 
    BEFORE UPDATE ON courses 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_announcements_updated_at 
    BEFORE UPDATE ON announcements 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at 
    BEFORE UPDATE ON events 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bounties_updated_at 
    BEFORE UPDATE ON bounties 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_course_progress_updated_at 
    BEFORE UPDATE ON course_progress 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_global_settings_updated_at 
    BEFORE UPDATE ON global_settings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feature_flags_updated_at 
    BEFORE UPDATE ON feature_flags 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 10. VERIFICATION QUERY
-- =====================================================

-- Check that all tables were created successfully
SELECT 
  table_name,
  CASE 
    WHEN table_name IN ('courses', 'announcements', 'events', 'bounties', 'course_progress', 'global_settings', 'feature_flags') 
    THEN '✅ Created'
    ELSE '❌ Missing'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('courses', 'announcements', 'events', 'bounties', 'course_progress', 'global_settings', 'feature_flags')
ORDER BY table_name;
