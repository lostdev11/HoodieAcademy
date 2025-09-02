-- Fix Missing Tables - Hoodie Academy
-- Run this in your Supabase SQL Editor to create missing tables

-- =====================================================
-- 1. CREATE BOUNTIES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS bounties (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    short_desc TEXT,
    squad_tag VARCHAR(100),
    reward VARCHAR(255),
    deadline TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'active',
    hidden BOOLEAN DEFAULT false,
    submissions INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for bounties
CREATE INDEX IF NOT EXISTS idx_bounties_status ON bounties(status);
CREATE INDEX IF NOT EXISTS idx_bounties_squad ON bounties(squad_tag);

-- =====================================================
-- 2. CREATE COURSES TABLE (if missing)
-- =====================================================

CREATE TABLE IF NOT EXISTS courses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    emoji VARCHAR(10),
    squad VARCHAR(100),
    level VARCHAR(50),
    access VARCHAR(50),
    description TEXT,
    total_lessons INTEGER,
    category VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_visible BOOLEAN DEFAULT true,
    is_published BOOLEAN DEFAULT false,
    slug VARCHAR(255) UNIQUE,
    sort_order INTEGER DEFAULT 0
);

-- Create index for courses
CREATE INDEX IF NOT EXISTS idx_courses_squad ON courses(squad);
CREATE INDEX IF NOT EXISTS idx_courses_visible ON courses(is_visible);
CREATE INDEX IF NOT EXISTS idx_courses_published ON courses(is_published);

-- =====================================================
-- 3. CREATE SUBMISSIONS TABLE (if missing)
-- =====================================================

CREATE TABLE IF NOT EXISTS submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    squad VARCHAR(100),
    bounty_id UUID REFERENCES bounties(id) ON DELETE CASCADE,
    wallet_address VARCHAR(255),
    image_url TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    upvotes INTEGER DEFAULT 0,
    total_upvotes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for submissions
CREATE INDEX IF NOT EXISTS idx_submissions_bounty ON submissions(bounty_id);
CREATE INDEX IF NOT EXISTS idx_submissions_wallet ON submissions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);

-- =====================================================
-- 4. GRANT PERMISSIONS
-- =====================================================

-- Grant permissions to authenticated users
GRANT ALL ON bounties TO authenticated;
GRANT ALL ON courses TO authenticated;
GRANT ALL ON submissions TO authenticated;

-- Grant permissions to service role
GRANT ALL ON bounties TO service_role;
GRANT ALL ON courses TO service_role;
GRANT ALL ON submissions TO service_role;

-- =====================================================
-- 5. VERIFY TABLES CREATED
-- =====================================================

-- Check all tables
SELECT 
    table_name,
    CASE 
        WHEN table_name IN ('bounties', 'courses', 'submissions') THEN '✅ Created'
        ELSE 'ℹ️ Existing'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('bounties', 'courses', 'submissions')
ORDER BY table_name;

-- Check table structures
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('bounties', 'courses', 'submissions')
ORDER BY table_name, ordinal_position;
