-- ============================================
-- UNIFIED BOUNTY SCHEMA FIX
-- ============================================
-- This creates a single, consistent bounty table schema
-- that works with the admin dashboard

-- Drop existing bounties table to avoid conflicts
DROP TABLE IF EXISTS bounties CASCADE;

-- Create unified bounties table with all required fields
CREATE TABLE bounties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  short_desc TEXT,
  reward TEXT NOT NULL,
  reward_type VARCHAR(10) DEFAULT 'XP' CHECK (reward_type IN ('XP', 'SOL', 'NFT')),
  start_date TIMESTAMPTZ,
  deadline TIMESTAMPTZ,
  link_to TEXT,
  image TEXT,
  squad_tag TEXT,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired')),
  hidden BOOLEAN DEFAULT false,
  submissions INTEGER DEFAULT 0,
  
  -- NFT prize fields
  nft_prize TEXT,
  nft_prize_image TEXT,
  nft_prize_description TEXT,
  
  -- Tracking fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  updated_by UUID
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bounties_status ON bounties(status);
CREATE INDEX IF NOT EXISTS idx_bounties_squad_tag ON bounties(squad_tag);
CREATE INDEX IF NOT EXISTS idx_bounties_created_at ON bounties(created_at);
CREATE INDEX IF NOT EXISTS idx_bounties_hidden ON bounties(hidden);
CREATE INDEX IF NOT EXISTS idx_bounties_reward_type ON bounties(reward_type);

-- Create trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_bounties_updated_at ON bounties;
CREATE TRIGGER update_bounties_updated_at
    BEFORE UPDATE ON bounties
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE bounties ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for admin dashboard
CREATE POLICY "Everyone can view bounties" ON bounties
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage bounties" ON bounties
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'
      AND users.is_admin = true
    )
  );

-- Insert sample bounties for testing
INSERT INTO bounties (title, short_desc, reward, reward_type, status, hidden, submissions, squad_tag) VALUES
('Welcome Bounty', 'Complete your first course to earn XP', '100', 'XP', 'active', false, 0, 'Creators'),
('Community Engagement', 'Participate in squad discussions', '50', 'XP', 'active', false, 0, 'Speakers'),
('Advanced Trading', 'Complete advanced trading course', '5', 'SOL', 'active', false, 0, 'Raiders'),
('NFT Art Contest', 'Create amazing Hoodie Academy artwork', '1', 'NFT', 'active', false, 0, 'Decoders');

-- Verify the table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'bounties'
ORDER BY ordinal_position;

-- Show sample data
SELECT id, title, reward, reward_type, status, hidden, squad_tag FROM bounties LIMIT 5;
