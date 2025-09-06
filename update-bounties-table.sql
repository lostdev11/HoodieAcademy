-- Update Bounties Table for Enhanced Bounty Management
-- Run this in your Supabase SQL editor

-- Add new columns to bounties table
ALTER TABLE bounties ADD COLUMN IF NOT EXISTS reward_type TEXT DEFAULT 'XP';
ALTER TABLE bounties ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ;
ALTER TABLE bounties ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Update existing bounties to have reward_type as 'XP' if null
UPDATE bounties SET reward_type = 'XP' WHERE reward_type IS NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_bounties_reward_type ON bounties(reward_type);
CREATE INDEX IF NOT EXISTS idx_bounties_start_date ON bounties(start_date);
CREATE INDEX IF NOT EXISTS idx_bounties_hidden ON bounties(hidden);

-- Update the updated_at column when any row is modified
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_bounties_updated_at ON bounties;
CREATE TRIGGER update_bounties_updated_at
    BEFORE UPDATE ON bounties
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Verify the table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'bounties'
ORDER BY ordinal_position;

-- Test insert a sample bounty
INSERT INTO bounties (
    title,
    short_desc,
    reward,
    reward_type,
    start_date,
    deadline,
    status,
    hidden,
    squad_tag,
    submissions
) VALUES (
    'Test Bounty',
    'This is a test bounty to verify the new structure',
    '1000',
    'XP',
    NOW(),
    NOW() + INTERVAL '7 days',
    'active',
    false,
    'Creators',
    0
) ON CONFLICT DO NOTHING;

-- Show all bounties to verify
SELECT 
    id,
    title,
    reward,
    reward_type,
    start_date,
    deadline,
    status,
    hidden,
    squad_tag,
    submissions,
    created_at,
    updated_at
FROM bounties
ORDER BY created_at DESC;
