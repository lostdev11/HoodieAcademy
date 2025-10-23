-- Student of the Week Database Schema
-- This creates the table and necessary indexes for managing Student of the Week

-- =====================================================
-- STUDENT OF THE WEEK TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS student_of_the_week (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT NOT NULL,
  display_name TEXT NOT NULL,
  username TEXT,
  squad TEXT,
  achievement TEXT NOT NULL,
  avatar_url TEXT,
  badge TEXT DEFAULT '🏅',
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by_wallet TEXT NOT NULL, -- Admin who created this entry
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS student_of_the_week_active_idx ON student_of_the_week(is_active);
CREATE INDEX IF NOT EXISTS student_of_the_week_week_start_idx ON student_of_the_week(week_start_date);
CREATE INDEX IF NOT EXISTS student_of_the_week_wallet_idx ON student_of_the_week(wallet_address);
CREATE INDEX IF NOT EXISTS student_of_the_week_current_idx ON student_of_the_week(week_start_date, week_end_date, is_active);

-- Create a unique constraint to prevent overlapping weeks
CREATE UNIQUE INDEX IF NOT EXISTS student_of_the_week_unique_week 
ON student_of_the_week(week_start_date, week_end_date) 
WHERE is_active = true;

-- Add RLS (Row Level Security) policies
ALTER TABLE student_of_the_week ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read active student of the week
CREATE POLICY "Anyone can read active student of the week" 
ON student_of_the_week FOR SELECT 
USING (is_active = true);

-- Policy: Only admins can insert/update/delete
CREATE POLICY "Admins can manage student of the week" 
ON student_of_the_week FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.wallet_address = auth.jwt() ->> 'wallet_address' 
    AND users.is_admin = true
  )
);

-- Create a function to get current student of the week
CREATE OR REPLACE FUNCTION get_current_student_of_the_week()
RETURNS TABLE (
  id UUID,
  wallet_address TEXT,
  display_name TEXT,
  username TEXT,
  squad TEXT,
  achievement TEXT,
  avatar_url TEXT,
  badge TEXT,
  week_start_date DATE,
  week_end_date DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.wallet_address,
    s.display_name,
    s.username,
    s.squad,
    s.achievement,
    s.avatar_url,
    s.badge,
    s.week_start_date,
    s.week_end_date
  FROM student_of_the_week s
  WHERE s.is_active = true
    AND CURRENT_DATE >= s.week_start_date
    AND CURRENT_DATE <= s.week_end_date
  ORDER BY s.week_start_date DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get all students of the week (for admin management)
CREATE OR REPLACE FUNCTION get_all_students_of_the_week()
RETURNS TABLE (
  id UUID,
  wallet_address TEXT,
  display_name TEXT,
  username TEXT,
  squad TEXT,
  achievement TEXT,
  avatar_url TEXT,
  badge TEXT,
  week_start_date DATE,
  week_end_date DATE,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.wallet_address,
    s.display_name,
    s.username,
    s.squad,
    s.achievement,
    s.avatar_url,
    s.badge,
    s.week_start_date,
    s.week_end_date,
    s.is_active,
    s.created_at
  FROM student_of_the_week s
  ORDER BY s.week_start_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_student_of_the_week_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER student_of_the_week_updated_at_trigger
  BEFORE UPDATE ON student_of_the_week
  FOR EACH ROW
  EXECUTE FUNCTION update_student_of_the_week_updated_at();

-- Create a settings table for Student of the Week toggle
CREATE TABLE IF NOT EXISTS student_of_the_week_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  description TEXT,
  updated_by_wallet TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default settings
INSERT INTO student_of_the_week_settings (setting_key, setting_value, description) VALUES 
('feature_enabled', 'true', 'Enable/disable Student of the Week feature'),
('auto_rotate', 'false', 'Automatically rotate students weekly')
ON CONFLICT (setting_key) DO NOTHING;

-- Add RLS for settings
ALTER TABLE student_of_the_week_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read settings
CREATE POLICY "Anyone can read student of the week settings" 
ON student_of_the_week_settings FOR SELECT 
USING (true);

-- Policy: Only admins can update settings
CREATE POLICY "Admins can update student of the week settings" 
ON student_of_the_week_settings FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.wallet_address = auth.jwt() ->> 'wallet_address' 
    AND users.is_admin = true
  )
);

-- Create function to get feature enabled status
CREATE OR REPLACE FUNCTION is_student_of_the_week_enabled()
RETURNS BOOLEAN AS $$
DECLARE
  enabled_value TEXT;
BEGIN
  SELECT setting_value INTO enabled_value
  FROM student_of_the_week_settings
  WHERE setting_key = 'feature_enabled';
  
  RETURN COALESCE(enabled_value = 'true', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the get_current_student_of_the_week function to check if feature is enabled
CREATE OR REPLACE FUNCTION get_current_student_of_the_week()
RETURNS TABLE (
  id UUID,
  wallet_address TEXT,
  display_name TEXT,
  username TEXT,
  squad TEXT,
  achievement TEXT,
  avatar_url TEXT,
  badge TEXT,
  week_start_date DATE,
  week_end_date DATE
) AS $$
BEGIN
  -- Check if feature is enabled first
  IF NOT is_student_of_the_week_enabled() THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT 
    s.id,
    s.wallet_address,
    s.display_name,
    s.username,
    s.squad,
    s.achievement,
    s.avatar_url,
    s.badge,
    s.week_start_date,
    s.week_end_date
  FROM student_of_the_week s
  WHERE s.is_active = true
    AND CURRENT_DATE >= s.week_start_date
    AND CURRENT_DATE <= s.week_end_date
  ORDER BY s.week_start_date DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert some sample data (optional - remove in production)
INSERT INTO student_of_the_week (
  wallet_address, 
  display_name, 
  username, 
  squad, 
  achievement, 
  avatar_url, 
  badge, 
  week_start_date, 
  week_end_date, 
  created_by_wallet
) VALUES (
  'sample_wallet_1',
  '@ChainWitch',
  'ChainWitch',
  'Speakers',
  'Submitted 3 trait designs + led a meme challenge',
  '/images/hoodie-academy-pixel-art-logo.png',
  '🏅',
  CURRENT_DATE - INTERVAL '7 days',
  CURRENT_DATE - INTERVAL '1 day',
  'admin_wallet'
), (
  'sample_wallet_2',
  '@CryptoVoyager',
  'CryptoVoyager',
  'Raiders',
  'Top 3 leaderboard + completed advanced course',
  '/images/hoodie-academy-pixel-art-logo.png',
  '⚔️',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '6 days',
  'admin_wallet'
) ON CONFLICT DO NOTHING;
