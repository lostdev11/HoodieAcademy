-- Update Access Control Database - Hoodie Academy
-- Run this in your Supabase SQL Editor to add access control support

-- =====================================================
-- 1. UPDATE COURSES TABLE WITH ACCESS CONTROL
-- =====================================================

-- Add access control columns to courses table
ALTER TABLE courses ADD COLUMN IF NOT EXISTS access_type VARCHAR(50) DEFAULT 'free';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS squad_gate VARCHAR(100);
ALTER TABLE courses ADD COLUMN IF NOT EXISTS nft_collection VARCHAR(255);
ALTER TABLE courses ADD COLUMN IF NOT EXISTS dao_governance BOOLEAN DEFAULT false;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS premium_price DECIMAL(10,2);
ALTER TABLE courses ADD COLUMN IF NOT EXISTS whitelist_enabled BOOLEAN DEFAULT false;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS custom_rules JSONB;

-- Create index for access control
CREATE INDEX IF NOT EXISTS idx_courses_access_type ON courses(access_type);
CREATE INDEX IF NOT EXISTS idx_courses_squad_gate ON courses(squad_gate);
CREATE INDEX IF NOT EXISTS idx_courses_nft_collection ON courses(nft_collection);

-- =====================================================
-- 2. CREATE ACCESS CONTROL RULES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS access_control_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    rule_name VARCHAR(255) NOT NULL,
    rule_type VARCHAR(50) NOT NULL, -- 'free', 'dao', 'squad', 'hoodie', 'premium', 'whitelist', 'custom'
    description TEXT,
    squad_restriction VARCHAR(100),
    nft_collection VARCHAR(255),
    nft_required_count INTEGER DEFAULT 1,
    dao_governance_token VARCHAR(255),
    dao_min_tokens DECIMAL(20,8),
    premium_price DECIMAL(10,2),
    whitelist_addresses TEXT[], -- Array of wallet addresses
    custom_rules JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for access control rules
CREATE INDEX IF NOT EXISTS idx_access_rules_type ON access_control_rules(rule_type);
CREATE INDEX IF NOT EXISTS idx_access_rules_active ON access_control_rules(is_active);

-- =====================================================
-- 3. CREATE WHITELIST TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS whitelist (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wallet_address VARCHAR(255) NOT NULL,
    access_level VARCHAR(50) DEFAULT 'basic', -- 'basic', 'premium', 'admin'
    squad VARCHAR(100),
    added_by VARCHAR(255), -- Admin wallet that added this address
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for whitelist
CREATE INDEX IF NOT EXISTS idx_whitelist_wallet ON whitelist(wallet_address);
CREATE INDEX IF NOT EXISTS idx_whitelist_active ON whitelist(is_active);
CREATE INDEX IF NOT EXISTS idx_whitelist_squad ON whitelist(squad);

-- =====================================================
-- 4. INSERT DEFAULT ACCESS CONTROL RULES
-- =====================================================

INSERT INTO access_control_rules (rule_name, rule_type, description) VALUES
('Free Access', 'free', 'Open access for everyone'),
('DAO Governance', 'dao', 'Access for DAO token holders'),
('Squad Gated', 'squad', 'Access restricted to specific squad members'),
('Hoodie Gated', 'hoodie', 'Access only for WifHoodie NFT holders'),
('Premium Access', 'premium', 'Paid access with premium features'),
('Whitelist Only', 'whitelist', 'Invite-only access'),
('Custom Rules', 'custom', 'Advanced access control rules')
ON CONFLICT (rule_name) DO NOTHING;

-- =====================================================
-- 5. UPDATE EXISTING COURSES WITH DEFAULT ACCESS
-- =====================================================

-- Set default access type for existing courses
UPDATE courses 
SET access_type = 'free' 
WHERE access_type IS NULL;

-- =====================================================
-- 6. GRANT PERMISSIONS
-- =====================================================

-- Grant permissions to authenticated users
GRANT ALL ON access_control_rules TO authenticated;
GRANT ALL ON whitelist TO authenticated;

-- Grant permissions to service role
GRANT ALL ON access_control_rules TO service_role;
GRANT ALL ON whitelist TO service_role;

-- =====================================================
-- 7. VERIFY CHANGES
-- =====================================================

-- Check courses table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'courses' 
AND column_name IN ('access_type', 'squad_gate', 'nft_collection', 'dao_governance', 'premium_price', 'whitelist_enabled')
ORDER BY column_name;

-- Check access control rules
SELECT rule_name, rule_type, description, is_active 
FROM access_control_rules 
ORDER BY rule_type;

-- Check whitelist table
SELECT COUNT(*) as whitelist_count FROM whitelist;
