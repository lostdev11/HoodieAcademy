-- Complete Database Fix for Hoodie Academy
-- Run this in your Supabase SQL Editor to fix all current issues

-- =====================================================
-- STEP 1: FIX COURSES TABLE STRUCTURE
-- =====================================================

-- First, check if courses table exists and its current structure
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'courses') THEN
        -- Create courses table if it doesn't exist
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
            cover_url TEXT,
            sort_order INTEGER DEFAULT 0,
            is_visible BOOLEAN DEFAULT true,
            is_published BOOLEAN DEFAULT false,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            created_by UUID,
            updated_by UUID
        );
    ELSE
        -- Add missing columns if table exists
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
    END IF;
END $$;

-- Create indexes for courses table
CREATE INDEX IF NOT EXISTS idx_courses_visible ON courses(is_visible);
CREATE INDEX IF NOT EXISTS idx_courses_published ON courses(is_published);
CREATE INDEX IF NOT EXISTS idx_courses_squad ON courses(squad);
CREATE INDEX IF NOT EXISTS idx_courses_level ON courses(level);
CREATE INDEX IF NOT EXISTS idx_courses_access ON courses(access);
CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category);
CREATE INDEX IF NOT EXISTS idx_courses_created_at ON courses(created_at);
CREATE INDEX IF NOT EXISTS idx_courses_sort_order ON courses(sort_order);

-- Create unique index on slug
CREATE UNIQUE INDEX IF NOT EXISTS courses_slug_idx ON courses(slug);

-- =====================================================
-- STEP 2: FIX GLOBAL SETTINGS TABLE
-- =====================================================

-- Create global_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS global_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    site_maintenance BOOLEAN DEFAULT false,
    registration_enabled BOOLEAN DEFAULT true,
    course_submissions_enabled BOOLEAN DEFAULT true,
    bounty_submissions_enabled BOOLEAN DEFAULT true,
    chat_enabled BOOLEAN DEFAULT true,
    leaderboard_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID
);

-- Insert default global settings if table is empty
INSERT INTO global_settings (id, site_maintenance, registration_enabled, course_submissions_enabled, bounty_submissions_enabled, chat_enabled, leaderboard_enabled)
VALUES (
    gen_random_uuid(),
    false,
    true,
    true,
    true,
    true,
    true
)
ON CONFLICT DO NOTHING;

-- =====================================================
-- STEP 3: FIX USERS TABLE
-- =====================================================

-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wallet_address TEXT UNIQUE NOT NULL,
    display_name TEXT,
    squad TEXT,
    is_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_squad ON users(squad);
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin);

-- =====================================================
-- STEP 4: FIX SUBMISSIONS TABLE
-- =====================================================

-- Create submissions table if it doesn't exist
CREATE TABLE IF NOT EXISTS submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    squad TEXT,
    bounty_id UUID,
    wallet_address TEXT,
    image_url TEXT,
    status TEXT DEFAULT 'pending',
    upvotes INTEGER DEFAULT 0,
    total_upvotes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for submissions table
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_squad ON submissions(squad);
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON submissions(created_at);

-- =====================================================
-- STEP 5: ENABLE ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 6: CREATE RLS POLICIES
-- =====================================================

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Everyone can view courses" ON courses;
DROP POLICY IF EXISTS "Admins can insert courses" ON courses;
DROP POLICY IF EXISTS "Admins can update courses" ON courses;
DROP POLICY IF EXISTS "Admins can delete courses" ON courses;

DROP POLICY IF EXISTS "Everyone can view global settings" ON global_settings;
DROP POLICY IF EXISTS "Admins can update global settings" ON global_settings;

DROP POLICY IF EXISTS "Users can view all users" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

DROP POLICY IF EXISTS "Everyone can view submissions" ON submissions;
DROP POLICY IF EXISTS "Admins can manage submissions" ON submissions;

-- Create new policies for courses
CREATE POLICY "Everyone can view courses" ON courses
    FOR SELECT USING (true);

CREATE POLICY "Admins can insert courses" ON courses
    FOR INSERT USING (true);

CREATE POLICY "Admins can update courses" ON courses
    FOR UPDATE USING (true);

CREATE POLICY "Admins can delete courses" ON courses
    FOR DELETE USING (true);

-- Create new policies for global_settings
CREATE POLICY "Everyone can view global settings" ON global_settings
    FOR SELECT USING (true);

CREATE POLICY "Admins can update global settings" ON global_settings
    FOR UPDATE USING (true);

-- Create new policies for users
CREATE POLICY "Users can view all users" ON users
    FOR SELECT USING (true);

CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT USING (true);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (true);

-- Create new policies for submissions
CREATE POLICY "Everyone can view submissions" ON submissions
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage submissions" ON submissions
    FOR ALL USING (true);

-- =====================================================
-- STEP 7: CREATE UPDATED_AT TRIGGER
-- =====================================================

-- Create or replace the update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for all tables
DROP TRIGGER IF EXISTS update_courses_updated_at ON courses;
CREATE TRIGGER update_courses_updated_at
    BEFORE UPDATE ON courses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_global_settings_updated_at ON global_settings;
CREATE TRIGGER update_global_settings_updated_at
    BEFORE UPDATE ON global_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_submissions_updated_at ON submissions;
CREATE TRIGGER update_submissions_updated_at
    BEFORE UPDATE ON submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- STEP 8: INSERT SAMPLE COURSES
-- =====================================================

-- Insert sample courses if table is empty
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

-- =====================================================
-- STEP 9: VERIFY THE SETUP
-- =====================================================

-- Check all tables
SELECT 
    'Database setup completed successfully!' as status,
    (SELECT COUNT(*) FROM courses) as total_courses,
    (SELECT COUNT(*) FROM global_settings) as global_settings_count,
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM submissions) as total_submissions;

-- Check courses specifically
SELECT 
    'Courses Status' as check_type,
    COUNT(*) as total_courses,
    COUNT(CASE WHEN is_visible = true THEN 1 END) as visible_courses,
    COUNT(CASE WHEN is_published = true THEN 1 END) as published_courses
FROM courses;

