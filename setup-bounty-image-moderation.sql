-- =====================================================
-- BOUNTY IMAGE UPLOAD & MODERATION SYSTEM SETUP
-- =====================================================
-- Run this in your Supabase SQL Editor to set up image moderation

-- Create moderated_images table
CREATE TABLE IF NOT EXISTS moderated_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    public_url TEXT NOT NULL,
    wallet_address VARCHAR(44) NOT NULL,
    context VARCHAR(100) DEFAULT 'bounty_submission',
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'approved', 'rejected', 'deleted')),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_by VARCHAR(44),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    review_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create moderation_logs table
CREATE TABLE IF NOT EXISTS moderation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image_id UUID NOT NULL REFERENCES moderated_images(id) ON DELETE CASCADE,
    action VARCHAR(20) NOT NULL CHECK (action IN ('approve', 'reject', 'delete')),
    reason TEXT,
    admin_wallet VARCHAR(44) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_moderated_images_status ON moderated_images(status);
CREATE INDEX IF NOT EXISTS idx_moderated_images_wallet ON moderated_images(wallet_address);
CREATE INDEX IF NOT EXISTS idx_moderated_images_uploaded_at ON moderated_images(uploaded_at);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_image_id ON moderation_logs(image_id);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_admin_wallet ON moderation_logs(admin_wallet);

-- Create RLS policies
ALTER TABLE moderated_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own images" ON moderated_images;
DROP POLICY IF EXISTS "Admins can view all images" ON moderated_images;
DROP POLICY IF EXISTS "Only admins can view moderation logs" ON moderation_logs;

-- Policy for moderated_images: Users can only see their own images
CREATE POLICY "Users can view their own images" ON moderated_images
    FOR SELECT USING (wallet_address = auth.jwt() ->> 'wallet_address');

-- Policy for moderated_images: Admins can view all images
CREATE POLICY "Admins can view all images" ON moderated_images
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE wallet_address = auth.jwt() ->> 'wallet_address' 
            AND is_admin = true
        )
    );

-- Policy for moderation_logs: Only admins can view logs
CREATE POLICY "Only admins can view moderation logs" ON moderation_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE wallet_address = auth.jwt() ->> 'wallet_address' 
            AND is_admin = true
        )
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_moderated_images_updated_at ON moderated_images;
CREATE TRIGGER update_moderated_images_updated_at 
    BEFORE UPDATE ON moderated_images 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VERIFY SETUP
-- =====================================================

-- Check if tables were created successfully
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'moderated_images') THEN
        RAISE NOTICE '✅ moderated_images table created successfully';
    ELSE
        RAISE NOTICE '❌ moderated_images table creation failed';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'moderation_logs') THEN
        RAISE NOTICE '✅ moderation_logs table created successfully';
    ELSE
        RAISE NOTICE '❌ moderation_logs table creation failed';
    END IF;
END $$;

-- Display table schemas
SELECT 'moderated_images' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'moderated_images'
ORDER BY ordinal_position;

SELECT 'moderation_logs' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'moderation_logs'
ORDER BY ordinal_position;

