-- Create squad_chat table for Hoodie Academy
-- Run this in your Supabase SQL editor

-- Create the squad_chat table
CREATE TABLE IF NOT EXISTS squad_chat (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  text TEXT NOT NULL,
  sender TEXT NOT NULL,
  sender_display_name TEXT,
  squad TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_squad_chat_squad ON squad_chat(squad);
CREATE INDEX IF NOT EXISTS idx_squad_chat_sender ON squad_chat(sender);
CREATE INDEX IF NOT EXISTS idx_squad_chat_timestamp ON squad_chat(timestamp);
CREATE INDEX IF NOT EXISTS idx_squad_chat_created_at ON squad_chat(created_at);

-- Enable RLS (Row Level Security)
ALTER TABLE squad_chat ENABLE ROW LEVEL SECURITY;

-- Create policies for squad_chat
-- Users can view messages from their squad
CREATE POLICY "Users can view squad messages" ON squad_chat
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.wallet_address = auth.jwt() ->> 'wallet_address'
      AND users.squad = squad_chat.squad
    )
  );

-- Users can insert messages to their squad
CREATE POLICY "Users can insert squad messages" ON squad_chat
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.wallet_address = auth.jwt() ->> 'wallet_address'
      AND users.squad = squad_chat.squad
    )
  );

-- Admins can do everything
CREATE POLICY "Admins can do everything on squad_chat" ON squad_chat
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.wallet_address = auth.jwt() ->> 'wallet_address'
      AND users.is_admin = true
    )
  );

-- Insert some sample messages for testing (optional)
INSERT INTO squad_chat (text, sender, sender_display_name, squad) VALUES
('Welcome to the Hoodie Creators squad! 🎨', 'system', 'System', 'Hoodie Creators'),
('Welcome to the Hoodie Decoders squad! 🧠', 'system', 'System', 'Hoodie Decoders'),
('Welcome to the Hoodie Speakers squad! 🎤', 'system', 'System', 'Hoodie Speakers'),
('Welcome to the Hoodie Raiders squad! ⚔️', 'system', 'System', 'Hoodie Raiders'),
('Welcome to the Hoodie Rangers squad! 🦅', 'system', 'System', 'Hoodie Rangers'),
('Welcome to the Treasury Builders squad! 🏦', 'system', 'System', 'Treasury Builders')
ON CONFLICT DO NOTHING;

-- Verify the table was created
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'squad_chat' 
ORDER BY ordinal_position;

