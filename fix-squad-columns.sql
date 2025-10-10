-- Quick fix for missing squad columns
-- Run this first if you're getting "column squad_id does not exist" error

-- Add squad columns to users table if they don't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS squad TEXT,
ADD COLUMN IF NOT EXISTS squad_id TEXT,
ADD COLUMN IF NOT EXISTS squad_selected_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS squad_lock_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS squad_change_count INTEGER DEFAULT 0;

-- Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name IN ('squad', 'squad_id', 'squad_selected_at', 'squad_lock_end_date', 'squad_change_count')
ORDER BY column_name;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Squad columns added to users table successfully!';
  RAISE NOTICE '📋 You can now run the complete system setup script.';
END $$;
