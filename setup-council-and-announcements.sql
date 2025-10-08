-- Setup tables for Council Notices, Announcements, and Spotlights
-- Run this in your Supabase SQL Editor

-- Council Notices Table
CREATE TABLE IF NOT EXISTS council_notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  directive_date TEXT,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT,
  expires_at TIMESTAMPTZ
);

-- Academy Announcements Table
CREATE TABLE IF NOT EXISTS academy_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'general' CHECK (category IN ('general', 'course', 'event', 'bounty', 'system')),
  is_expandable BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  posted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT,
  expires_at TIMESTAMPTZ
);

-- Academy Spotlight Table
CREATE TABLE IF NOT EXISTS academy_spotlight (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote TEXT NOT NULL,
  author TEXT NOT NULL,
  author_title TEXT,
  author_squad TEXT,
  author_image TEXT,
  is_active BOOLEAN DEFAULT true,
  featured_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_council_notices_active ON council_notices(is_active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_council_notices_priority ON council_notices(priority, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_academy_announcements_active ON academy_announcements(is_active, posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_academy_announcements_category ON academy_announcements(category, posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_academy_spotlight_active ON academy_spotlight(is_active, featured_at DESC);

-- Enable Row Level Security
ALTER TABLE council_notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_spotlight ENABLE ROW LEVEL SECURITY;

-- Policies for council_notices
CREATE POLICY "Anyone can view active council notices"
  ON council_notices FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can insert council notices"
  ON council_notices FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can update council notices"
  ON council_notices FOR UPDATE
  USING (true);

CREATE POLICY "Admins can delete council notices"
  ON council_notices FOR DELETE
  USING (true);

-- Policies for academy_announcements
CREATE POLICY "Anyone can view active announcements"
  ON academy_announcements FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can insert announcements"
  ON academy_announcements FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can update announcements"
  ON academy_announcements FOR UPDATE
  USING (true);

CREATE POLICY "Admins can delete announcements"
  ON academy_announcements FOR DELETE
  USING (true);

-- Policies for academy_spotlight
CREATE POLICY "Anyone can view active spotlights"
  ON academy_spotlight FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can insert spotlights"
  ON academy_spotlight FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can update spotlights"
  ON academy_spotlight FOR UPDATE
  USING (true);

CREATE POLICY "Admins can delete spotlights"
  ON academy_spotlight FOR DELETE
  USING (true);

-- Insert sample data
INSERT INTO council_notices (title, content, directive_date, priority, created_by)
VALUES 
  ('Hoodie Scholar Council Directive (January 28, 2025)', 
   'Phase 3 rollout is live. Squad leaders must submit their launch assignment by Friday. Students, complete your weekly missions to earn badge upgrades. New lore entries are being added to the Hall of Records daily.',
   'January 28, 2025',
   'high',
   'Council');

INSERT INTO academy_announcements (title, content, category, created_by)
VALUES 
  ('New Course: Trading Psychology', 
   'Master the mental game of trading with our latest course. Learn to manage emotions, develop discipline, and make better trading decisions.',
   'course',
   'Academy Admin'),
  ('Welcome to Hoodie Academy!', 
   'Begin your journey into Web3 mastery. Connect your wallet, join a squad, and start earning XP through courses and bounties.',
   'general',
   'Academy Admin');

INSERT INTO academy_spotlight (quote, author, author_title, author_squad, created_by)
VALUES 
  ('In the chaos of the market, find your rhythm.',
   'RangerPrime',
   'Rangers Lead',
   'Rangers',
   'Academy Admin');

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_council_notices_updated_at BEFORE UPDATE ON council_notices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_academy_announcements_updated_at BEFORE UPDATE ON academy_announcements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_academy_spotlight_updated_at BEFORE UPDATE ON academy_spotlight
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

