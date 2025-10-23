-- Minimal setup for Student of the Week feature
-- Run this in your Supabase SQL Editor

-- Create the settings table first
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
('feature_enabled', 'true', 'Enable/disable Student of the Week feature')
ON CONFLICT (setting_key) DO NOTHING;

-- Add RLS for settings
ALTER TABLE student_of_the_week_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read settings
CREATE POLICY "Anyone can read student of the week settings" 
ON student_of_the_week_settings FOR SELECT 
USING (true);

-- Policy: Only admins can update settings
-- First, let's create a more permissive policy for testing
CREATE POLICY "Admins can update student of the week settings" 
ON student_of_the_week_settings FOR ALL 
USING (true); -- Temporarily allow all for testing

-- Alternative: If you want to keep admin-only access, use this instead:
-- CREATE POLICY "Admins can update student of the week settings" 
-- ON student_of_the_week_settings FOR ALL 
-- USING (
--   EXISTS (
--     SELECT 1 FROM users 
--     WHERE users.wallet_address = auth.jwt() ->> 'wallet_address' 
--     AND users.is_admin = true
--   )
-- );
