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

-- Enable RLS (Row Level Security)
ALTER TABLE squad_chat ENABLE ROW LEVEL SECURITY;

-- Create policies for squad_chat
CREATE POLICY "Users can view squad messages" ON squad_chat
  FOR SELECT USING (true);

CREATE POLICY "Users can insert squad messages" ON squad_chat
  FOR INSERT WITH CHECK (true);

-- Insert sample welcome messages
INSERT INTO squad_chat (text, sender, sender_display_name, squad) VALUES
('Welcome to the Hoodie Creators squad! 🎨', 'system', 'System', '🎨 Hoodie Creators'),
('Welcome to the Hoodie Decoders squad! 🧠', 'system', 'System', '🧠 Hoodie Decoders'),
('Welcome to the Hoodie Speakers squad! 🎤', 'system', 'System', '🎤 Hoodie Speakers'),
('Welcome to the Hoodie Raiders squad! ⚔️', 'system', 'System', '⚔️ Hoodie Raiders'),
('Welcome to the Hoodie Rangers squad! 🦅', 'system', 'System', '🦅 Hoodie Rangers'),
('Welcome to the Treasury Builders squad! 🏦', 'system', 'System', '🏦 Treasury Builders')
ON CONFLICT DO NOTHING;
