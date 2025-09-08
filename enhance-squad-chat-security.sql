-- Enhanced squad chat security with squad-specific access control
-- Run this AFTER the basic setup-squad-chat.sql script

-- Drop existing policies to replace them with more secure ones
DROP POLICY IF EXISTS "Users can view squad messages" ON squad_chat;
DROP POLICY IF EXISTS "Users can insert squad messages" ON squad_chat;

-- Create more restrictive policies that check squad membership
-- Note: These policies assume you have a users table with squad information
-- If you don't have this, the basic policies will work but be less secure

-- Policy for viewing messages: Users can only see messages from their assigned squad
CREATE POLICY "Users can view their squad messages" ON squad_chat
  FOR SELECT USING (
    squad IN (
      SELECT squad FROM users 
      WHERE wallet_address = auth.jwt() ->> 'sub'
    )
  );

-- Policy for inserting messages: Users can only send messages to their assigned squad
CREATE POLICY "Users can insert to their squad" ON squad_chat
  FOR INSERT WITH CHECK (
    squad IN (
      SELECT squad FROM users 
      WHERE wallet_address = auth.jwt() ->> 'sub'
    )
  );

-- Alternative: If you want to allow all authenticated users to view all messages
-- but only insert to their own squad, use these policies instead:

-- CREATE POLICY "Authenticated users can view all messages" ON squad_chat
--   FOR SELECT USING (auth.role() = 'authenticated');

-- CREATE POLICY "Users can insert to their squad only" ON squad_chat
--   FOR INSERT WITH CHECK (
--     squad IN (
--       SELECT squad FROM users 
--       WHERE wallet_address = auth.jwt() ->> 'sub'
--     )
--   );

-- Add a function to check squad membership (optional)
CREATE OR REPLACE FUNCTION user_belongs_to_squad(user_squad TEXT, requested_squad TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Normalize squad names for comparison
  user_squad := LOWER(REGEXP_REPLACE(user_squad, '^[🎨🧠🎤⚔️🦅🏦]+\s*', ''));
  requested_squad := LOWER(REGEXP_REPLACE(requested_squad, '^[🎨🧠🎤⚔️🦅🏦]+\s*', ''));
  
  -- Check various squad name formats
  RETURN (
    user_squad = requested_squad OR
    user_squad = SPLIT_PART(requested_squad, ' ', 2) OR  -- "creators" matches "hoodie creators"
    SPLIT_PART(user_squad, ' ', 2) = requested_squad OR  -- "hoodie creators" matches "creators"
    user_squad = SPLIT_PART(requested_squad, '-', 2) OR   -- "creators" matches "hoodie-creators"
    SPLIT_PART(user_squad, ' ', 2) = SPLIT_PART(requested_squad, '-', 2)  -- "hoodie creators" matches "hoodie-creators"
  );
END;
$$ LANGUAGE plpgsql;
