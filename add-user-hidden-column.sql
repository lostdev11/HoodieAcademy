-- Add hidden column to users table
-- This allows users to be hidden instead of deleted (soft delete)

-- Add hidden column if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS hidden BOOLEAN DEFAULT false;

-- Add index for faster filtering
CREATE INDEX IF NOT EXISTS idx_users_hidden ON users(hidden);

-- Add hidden_at timestamp for tracking when user was hidden
ALTER TABLE users ADD COLUMN IF NOT EXISTS hidden_at TIMESTAMPTZ;

-- Add hidden_by to track who hid the user
ALTER TABLE users ADD COLUMN IF NOT EXISTS hidden_by TEXT;

-- Ensure hidden users are excluded from default queries
-- (This is handled in application code, but good to note here)

