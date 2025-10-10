-- Squad Selection System with 30-Day Lock
-- This adds squad selection fields to the users table with lock period tracking

-- Add squad columns to users table if they don't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS squad TEXT,
ADD COLUMN IF NOT EXISTS squad_id TEXT,
ADD COLUMN IF NOT EXISTS squad_selected_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS squad_lock_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS squad_change_count INTEGER DEFAULT 0;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_users_squad ON users(squad);
CREATE INDEX IF NOT EXISTS idx_users_squad_id ON users(squad_id);
CREATE INDEX IF NOT EXISTS idx_users_squad_lock ON users(squad_lock_end_date);

-- Function to check if a user's squad is locked
CREATE OR REPLACE FUNCTION is_squad_locked(user_wallet TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  lock_date TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT squad_lock_end_date INTO lock_date
  FROM users
  WHERE wallet_address = user_wallet;
  
  IF lock_date IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN NOW() < lock_date;
END;
$$ LANGUAGE plpgsql;

-- Function to get remaining lock days
CREATE OR REPLACE FUNCTION get_remaining_lock_days(user_wallet TEXT)
RETURNS INTEGER AS $$
DECLARE
  lock_date TIMESTAMP WITH TIME ZONE;
  days_remaining INTEGER;
BEGIN
  SELECT squad_lock_end_date INTO lock_date
  FROM users
  WHERE wallet_address = user_wallet;
  
  IF lock_date IS NULL OR NOW() >= lock_date THEN
    RETURN 0;
  END IF;
  
  days_remaining := CEIL(EXTRACT(EPOCH FROM (lock_date - NOW())) / 86400);
  RETURN days_remaining;
END;
$$ LANGUAGE plpgsql;

-- Function to update squad with 30-day lock
CREATE OR REPLACE FUNCTION update_user_squad(
  user_wallet TEXT,
  new_squad TEXT,
  new_squad_id TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  current_lock_date TIMESTAMP WITH TIME ZONE;
  is_locked BOOLEAN;
BEGIN
  -- Check if squad is currently locked
  SELECT squad_lock_end_date INTO current_lock_date
  FROM users
  WHERE wallet_address = user_wallet;
  
  -- Check if locked
  IF current_lock_date IS NOT NULL AND NOW() < current_lock_date THEN
    RAISE EXCEPTION 'Squad is locked until %', current_lock_date;
  END IF;
  
  -- Update squad with new 30-day lock
  UPDATE users
  SET 
    squad = new_squad,
    squad_id = new_squad_id,
    squad_selected_at = NOW(),
    squad_lock_end_date = NOW() + INTERVAL '30 days',
    squad_change_count = COALESCE(squad_change_count, 0) + 1,
    updated_at = NOW()
  WHERE wallet_address = user_wallet;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON COLUMN users.squad IS 'User''s current squad name (e.g., "Hoodie Creators")';
COMMENT ON COLUMN users.squad_id IS 'User''s current squad ID (e.g., "creators")';
COMMENT ON COLUMN users.squad_selected_at IS 'When the user selected their current squad';
COMMENT ON COLUMN users.squad_lock_end_date IS 'Date when the 30-day squad lock expires';
COMMENT ON COLUMN users.squad_change_count IS 'Number of times user has changed squads';

-- Sample query to check locked users
-- SELECT wallet_address, squad, squad_lock_end_date, 
--        get_remaining_lock_days(wallet_address) as days_remaining
-- FROM users 
-- WHERE squad_lock_end_date > NOW();

-- Enable RLS if not already enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then create new ones
DROP POLICY IF EXISTS "Users can read own squad data" ON users;
DROP POLICY IF EXISTS "Users can update own squad" ON users;

-- Allow users to read their own squad data
CREATE POLICY "Users can read own squad data"
  ON users FOR SELECT
  USING (true);

-- Allow users to update their own squad (but validation happens in function)
CREATE POLICY "Users can update own squad"
  ON users FOR UPDATE
  USING (true);

