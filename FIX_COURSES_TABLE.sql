-- Fix Courses Table Structure for Hoodie Academy
-- Run this in your Supabase SQL Editor to fix the schema mismatch

-- Step 1: Check current table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'courses' 
ORDER BY ordinal_position;

-- Step 2: Add missing columns if they don't exist
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS slug TEXT,
ADD COLUMN IF NOT EXISTS emoji TEXT DEFAULT '📚',
ADD COLUMN IF NOT EXISTS badge TEXT,
ADD COLUMN IF NOT EXISTS squad TEXT,
ADD COLUMN IF NOT EXISTS level TEXT DEFAULT 'beginner',
ADD COLUMN IF NOT EXISTS access TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general',
ADD COLUMN IF NOT EXISTS totalLessons INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS cover_url TEXT,
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false;

-- Step 3: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_courses_visible ON courses(is_visible);
CREATE INDEX IF NOT EXISTS idx_courses_published ON courses(is_published);
CREATE INDEX IF NOT EXISTS idx_courses_squad ON courses(squad);
CREATE INDEX IF NOT EXISTS idx_courses_level ON courses(level);
CREATE INDEX IF NOT EXISTS idx_courses_access ON courses(access);
CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category);
CREATE INDEX IF NOT EXISTS idx_courses_created_at ON courses(created_at);
CREATE INDEX IF NOT EXISTS idx_courses_sort_order ON courses(sort_order);

-- Step 4: Create unique index on slug if it doesn't exist
CREATE UNIQUE INDEX IF NOT EXISTS courses_slug_idx ON courses(slug);

-- Step 5: Enable Row Level Security
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Step 6: Drop existing policies and recreate them
DROP POLICY IF EXISTS "Everyone can view courses" ON courses;
DROP POLICY IF EXISTS "Admins can insert courses" ON courses;
DROP POLICY IF EXISTS "Admins can update courses" ON courses;
DROP POLICY IF EXISTS "Admins can delete courses" ON courses;

-- Step 7: Create RLS policies
CREATE POLICY "Everyone can view courses" ON courses
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert courses" ON courses
  FOR INSERT USING (true);

CREATE POLICY "Admins can update courses" ON courses
  FOR UPDATE USING (true);

CREATE POLICY "Admins can delete courses" ON courses
  FOR DELETE USING (true);

-- Step 8: Create updated_at trigger if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_courses_updated_at ON courses;
CREATE TRIGGER update_courses_updated_at
    BEFORE UPDATE ON courses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Step 9: Insert sample courses if table is empty
INSERT INTO courses (id, slug, title, description, emoji, badge, squad, level, access, category, totalLessons, is_visible, is_published, sort_order) 
SELECT 
  'nft-mastery',
  'nft-mastery',
  'NFT Mastery',
  'Learn the ins and outs of NFTs, from creation to trading and community building.',
  '👾',
  'NFT Ninja',
  'creators',
  'beginner',
  'free',
  'nft',
  4,
  true,
  true,
  1
WHERE NOT EXISTS (SELECT 1 FROM courses WHERE id = 'nft-mastery');

INSERT INTO courses (id, slug, title, description, emoji, badge, squad, level, access, category, totalLessons, is_visible, is_published, sort_order) 
SELECT 
  'wallet-wizardry',
  'wallet-wizardry',
  'Wallet Wizardry',
  'Master wallet setup with interactive quizzes and MetaMask integration.',
  '🔒',
  'Vault Keeper',
  'decoders',
  'beginner',
  'free',
  'wallet',
  4,
  true,
  true,
  2
WHERE NOT EXISTS (SELECT 1 FROM courses WHERE id = 'wallet-wizardry');

INSERT INTO courses (id, slug, title, description, emoji, badge, squad, level, access, category, totalLessons, is_visible, is_published, sort_order) 
SELECT 
  'meme-coin-mania',
  'meme-coin-mania',
  'Meme Coin Mania',
  'Navigate the wild world of meme coins with strategic insights and risk management.',
  '🚀',
  'Meme Lord',
  'raiders',
  'intermediate',
  'free',
  'trading',
  3,
  true,
  true,
  3
WHERE NOT EXISTS (SELECT 1 FROM courses WHERE id = 'meme-coin-mania');

-- Step 10: Verify the setup
SELECT 
  'Database setup completed successfully!' as status,
  COUNT(*) as total_courses,
  COUNT(CASE WHEN is_visible = true THEN 1 END) as visible_courses,
  COUNT(CASE WHEN is_published = true THEN 1 END) as published_courses
FROM courses;

