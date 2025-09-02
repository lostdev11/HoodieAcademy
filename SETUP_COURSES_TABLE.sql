-- =====================================================
-- COMPLETE COURSES TABLE SETUP FOR HOODIE ACADEMY
-- Run this in your Supabase SQL Editor
-- =====================================================

-- Step 1: Drop and recreate the courses table with proper structure
DROP TABLE IF EXISTS courses CASCADE;

CREATE TABLE courses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  emoji TEXT DEFAULT '📚',
  badge TEXT,
  squad TEXT,
  level TEXT DEFAULT 'beginner',
  access TEXT DEFAULT 'free',
  category TEXT DEFAULT 'general',
  totalLessons INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  is_published BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  cover_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  updated_by UUID
);

-- Step 2: Create indexes for performance
CREATE INDEX idx_courses_visible ON courses(is_visible);
CREATE INDEX idx_courses_published ON courses(is_published);
CREATE INDEX idx_courses_squad ON courses(squad);
CREATE INDEX idx_courses_level ON courses(level);
CREATE INDEX idx_courses_access ON courses(access);
CREATE INDEX idx_courses_category ON courses(category);
CREATE INDEX idx_courses_created_at ON courses(created_at);
CREATE INDEX idx_courses_sort_order ON courses(sort_order);

-- Step 3: Enable Row Level Security
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policies
CREATE POLICY "Everyone can view courses" ON courses
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert courses" ON courses
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  );

CREATE POLICY "Admins can update courses" ON courses
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  );

CREATE POLICY "Admins can delete courses" ON courses
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  );

-- Step 5: Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_courses_updated_at
    BEFORE UPDATE ON courses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Step 6: Enable real-time for courses table
ALTER PUBLICATION supabase_realtime ADD TABLE courses;

-- Step 7: Insert sample courses
INSERT INTO courses (id, slug, title, description, emoji, badge, squad, level, access, category, totalLessons, is_visible, is_published, sort_order) VALUES
('nft-mastery', 'nft-mastery', 'NFT Mastery', 'Learn the ins and outs of NFTs, from creation to trading and community building, with interactive quizzes and mock minting.', '👾', 'NFT Ninja', 'creators', 'beginner', 'free', 'nft', 4, true, true, 1),
('wallet-wizardry', 'wallet-wizardry', 'Wallet Wizardry', 'Master wallet setup with interactive quizzes and MetaMask integration.', '🔒', 'Vault Keeper', 'decoders', 'beginner', 'free', 'wallet', 4, true, true, 2),
('meme-coin-mania', 'meme-coin-mania', 'Meme Coin Mania', 'Navigate the wild world of meme coins with strategic insights and risk management.', '🚀', 'Meme Lord', 'raiders', 'intermediate', 'free', 'trading', 3, true, true, 3),
('c120-browser-hygiene', 'c120-browser-hygiene', 'Browser Hygiene & Setup', 'Master browser security for Web3 trading. Learn to segment browsers, manage extensions safely, control permissions, and harden your setup against drainers and scams.', '🛡️', 'Browser Guardian', 'decoders', 'beginner', 'free', 'cybersecurity', 5, true, true, 4),
('s120-cold-truths-self-custody', 's120-cold-truths-self-custody', 'Cold Truths: Self Custody', 'Master the fundamentals of self-custody and cold storage for your digital assets.', '❄️', 'Cold Storage Master', 'decoders', 'intermediate', 'hoodie', 'security', 6, true, true, 5),
('a120-ai-vocab', 'a120-ai-vocab', 'AI Vocabulary', 'Build your AI literacy with essential terminology and concepts.', '🤖', 'AI Linguist', 'creators', 'beginner', 'free', 'ai', 4, true, true, 6),
('a150-prompt-engineering', 'a150-prompt-engineering', 'Prompt Engineering', 'Master the art of crafting effective prompts for AI systems.', '🎯', 'Prompt Master', 'creators', 'intermediate', 'free', 'ai', 5, true, true, 7),
('t100-chart-literacy', 't100-chart-literacy', 'Chart Literacy', 'Learn to read and interpret trading charts effectively.', '📊', 'Chart Reader', 'raiders', 'beginner', 'free', 'trading', 4, true, true, 8),
('l100-lore-identity', 'l100-lore-identity', 'Lore as Identity Fuel', 'Learn to use lore and storytelling to build powerful personal identity and community influence.', '📖', 'Lore Master', 'speakers', 'beginner', 'free', 'lore', 3, true, true, 9),
('o120-raid-psychology', 'o120-raid-psychology', 'Raid Psychology 101', 'Master the psychology behind successful raids and social manipulation.', '⚔️', 'Raid Commander', 'raiders', 'intermediate', 'free', 'psychology', 4, true, true, 10);

-- Step 8: Verify the setup
SELECT 
  'Courses table setup complete' as status,
  COUNT(*) as total_courses,
  COUNT(CASE WHEN is_visible = true THEN 1 END) as visible_courses,
  COUNT(CASE WHEN is_published = true THEN 1 END) as published_courses
FROM courses;
