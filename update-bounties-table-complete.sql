-- Complete bounties table schema update
-- This script updates the bounties table to match the expected schema

-- First, let's see what columns currently exist
-- (This is just for reference - the actual table will be updated below)

-- Drop the existing bounties table and recreate it with the correct schema
DROP TABLE IF EXISTS bounties CASCADE;

-- Create the bounties table with the correct schema
CREATE TABLE bounties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  short_desc TEXT NOT NULL,
  reward TEXT NOT NULL,
  reward_type VARCHAR(10) DEFAULT 'XP' CHECK (reward_type IN ('XP', 'SOL')),
  start_date TIMESTAMPTZ,
  deadline TIMESTAMPTZ,
  link_to TEXT,
  image TEXT,
  squad_tag TEXT,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired')),
  hidden BOOLEAN DEFAULT false,
  submissions INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create an index on status for better query performance
CREATE INDEX IF NOT EXISTS idx_bounties_status ON bounties(status);
CREATE INDEX IF NOT EXISTS idx_bounties_squad_tag ON bounties(squad_tag);
CREATE INDEX IF NOT EXISTS idx_bounties_created_at ON bounties(created_at);

-- Insert some sample bounties for testing
INSERT INTO bounties (title, short_desc, reward, reward_type, status, hidden, submissions) VALUES
('Welcome Bounty', 'Complete your first course to earn XP', '100', 'XP', 'active', false, 0),
('Community Engagement', 'Participate in squad discussions', '50', 'XP', 'active', false, 0),
('Advanced Trading', 'Complete advanced trading course', '5', 'SOL', 'active', false, 0);

-- Verify the table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'bounties' 
ORDER BY ordinal_position;
