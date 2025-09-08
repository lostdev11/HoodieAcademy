import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST() {
  try {
    console.log('🏗️ Setting up squad_chat table...');
    
    // Try to insert a test message to see if table exists
    const { error: testError } = await supabase
      .from('squad_chat')
      .select('id')
      .limit(1);

    if (testError) {
      console.log('Squad chat table does not exist:', testError.message);
      
      // Try to create the table using a simple insert approach
      // This will fail if the table doesn't exist, but we can catch the error
      const { error: createError } = await supabase
        .from('squad_chat')
        .insert([{
          text: 'Test message to create table',
          sender: 'system',
          sender_display_name: 'System',
          squad: 'test'
        }]);

      if (createError) {
        console.log('Cannot create table via API, need manual setup');
        return NextResponse.json({ 
          success: false, 
          message: 'Squad chat table does not exist. Please run the create-squad-chat-table.sql script in your Supabase SQL editor.',
          instructions: [
            '1. Go to your Supabase dashboard',
            '2. Navigate to SQL Editor', 
            '3. Copy and paste the SQL script from create-squad-chat-table.sql',
            '4. Run the script to create the table',
            '5. The script will create the table, indexes, and sample data'
          ],
          sqlScript: `
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

-- Insert sample messages
INSERT INTO squad_chat (text, sender, sender_display_name, squad) VALUES
('Welcome to the Hoodie Creators squad! 🎨', 'system', 'System', '🎨 Hoodie Creators'),
('Welcome to the Hoodie Decoders squad! 🧠', 'system', 'System', '🧠 Hoodie Decoders'),
('Welcome to the Hoodie Speakers squad! 🎤', 'system', 'System', '🎤 Hoodie Speakers'),
('Welcome to the Hoodie Raiders squad! ⚔️', 'system', 'System', '⚔️ Hoodie Raiders'),
('Welcome to the Hoodie Rangers squad! 🦅', 'system', 'System', '🦅 Hoodie Rangers'),
('Welcome to the Treasury Builders squad! 🏦', 'system', 'System', '🏦 Treasury Builders')
ON CONFLICT DO NOTHING;
          `
        });
      }
    }

    console.log('✅ Squad chat table exists, inserting sample messages...');
    
    // Insert sample messages if they don't exist
    const { error: sampleError } = await supabase
      .from('squad_chat')
      .insert([
        { text: 'Welcome to the Hoodie Creators squad! 🎨', sender: 'system', sender_display_name: 'System', squad: '🎨 Hoodie Creators' },
        { text: 'Welcome to the Hoodie Decoders squad! 🧠', sender: 'system', sender_display_name: 'System', squad: '🧠 Hoodie Decoders' },
        { text: 'Welcome to the Hoodie Speakers squad! 🎤', sender: 'system', sender_display_name: 'System', squad: '🎤 Hoodie Speakers' },
        { text: 'Welcome to the Hoodie Raiders squad! ⚔️', sender: 'system', sender_display_name: 'System', squad: '⚔️ Hoodie Raiders' },
        { text: 'Welcome to the Hoodie Rangers squad! 🦅', sender: 'system', sender_display_name: 'System', squad: '🦅 Hoodie Rangers' },
        { text: 'Welcome to the Treasury Builders squad! 🏦', sender: 'system', sender_display_name: 'System', squad: '🏦 Treasury Builders' }
      ]);

    if (sampleError) {
      console.log('Sample messages may already exist:', sampleError.message);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Squad chat table is ready' 
    });

  } catch (error) {
    console.error('Error in squad chat setup:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
