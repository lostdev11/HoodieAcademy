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
CREATE TRIGGER update_moderated_images_updated_at 
    BEFORE UPDATE ON moderated_images 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data (optional)
-- INSERT INTO moderated_images (filename, original_name, file_path, public_url, wallet_address, file_size, mime_type)
-- VALUES 
--     ('sample1.jpg', 'sample-image.jpg', '/path/to/sample1.jpg', '/uploads/moderated/sample1.jpg', 'sample-wallet-1', 1024000, 'image/jpeg'),
--     ('sample2.png', 'sample-image2.png', '/path/to/sample2.png', '/uploads/moderated/sample2.png', 'sample-wallet-2', 2048000, 'image/png');
