-- Add Squad Fields to Users Table
-- Run this in your Supabase SQL Editor to ensure all squad fields exist

-- Add squad-related columns if they don't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS squad TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS squad_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS squad_selected_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS squad_lock_end_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS squad_change_count INTEGER DEFAULT 0;

-- Add level column if it doesn't exist (calculated from total_xp)
ALTER TABLE users ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;

-- Create index on squad for faster squad-based queries
CREATE INDEX IF NOT EXISTS idx_users_squad ON users(squad);
CREATE INDEX IF NOT EXISTS idx_users_squad_lock_end ON users(squad_lock_end_date);
CREATE INDEX IF NOT EXISTS idx_users_total_xp ON users(total_xp DESC);

-- Update existing users' levels based on their XP (if level is 1 but XP is higher)
UPDATE users 
SET level = FLOOR(COALESCE(total_xp, 0) / 1000) + 1
WHERE level = 1 AND total_xp > 0;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Squad fields added to users table successfully!';
  RAISE NOTICE 'All existing users can now be assigned to squads.';
  RAISE NOTICE 'Indexes created for optimized squad queries.';
END $$;

