-- Add NFT prize field to bounties table
-- Run this in your Supabase SQL editor

-- Add NFT prize columns to bounties table
ALTER TABLE bounties ADD COLUMN IF NOT EXISTS nft_prize TEXT;
ALTER TABLE bounties ADD COLUMN IF NOT EXISTS nft_prize_image TEXT;
ALTER TABLE bounties ADD COLUMN IF NOT EXISTS nft_prize_description TEXT;

-- Update the reward_type constraint to include NFT
ALTER TABLE bounties DROP CONSTRAINT IF EXISTS bounties_reward_type_check;
ALTER TABLE bounties ADD CONSTRAINT bounties_reward_type_check 
  CHECK (reward_type IN ('XP', 'SOL', 'NFT'));

-- Create index for NFT prizes
CREATE INDEX IF NOT EXISTS idx_bounties_nft_prize ON bounties(nft_prize);

-- Verify the table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'bounties' 
ORDER BY ordinal_position;
