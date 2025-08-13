-- Supabase Setup for Profile Picture System
-- Run this in your Supabase SQL editor

-- Create the profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY, -- Using TEXT to match wallet addresses
  pfp_url TEXT,
  pfp_asset_id TEXT,
  pfp_last_verified TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);
CREATE INDEX IF NOT EXISTS idx_profiles_pfp_asset_id ON profiles(pfp_asset_id);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows users to read and update their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid()::text = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid()::text = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid()::text = id);

-- For now, allow all operations (you can restrict this later)
-- CREATE POLICY "Allow all operations" ON profiles FOR ALL USING (true);

-- Insert a sample profile for testing (optional)
-- INSERT INTO profiles (id, pfp_url, pfp_asset_id) 
-- VALUES ('test-wallet', 'https://example.com/image.jpg', 'test-asset-id')
-- ON CONFLICT (id) DO NOTHING;
