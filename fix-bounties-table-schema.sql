-- Fix bounties table schema to add missing columns
-- This script adds the missing reward_type column and ensures all required columns exist

-- Add reward_type column if it doesn't exist
ALTER TABLE bounties 
ADD COLUMN IF NOT EXISTS reward_type VARCHAR(10) DEFAULT 'XP';

-- Add any other missing columns that might be needed
ALTER TABLE bounties 
ADD COLUMN IF NOT EXISTS submissions INTEGER DEFAULT 0;

-- Update existing records to have default reward_type
UPDATE bounties 
SET reward_type = 'XP' 
WHERE reward_type IS NULL;

-- Verify the table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'bounties' 
ORDER BY ordinal_position;
