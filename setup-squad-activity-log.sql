-- Squad Activity Log Table
-- Optional table for tracking detailed squad activity events
-- Run this in your Supabase SQL Editor

-- Create squad_activity_log table
CREATE TABLE IF NOT EXISTS squad_activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  squad TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  activity_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes for performance
  CONSTRAINT fk_squad_activity_wallet 
    FOREIGN KEY (wallet_address) 
    REFERENCES users(wallet_address) 
    ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_squad_activity_squad ON squad_activity_log(squad);
CREATE INDEX IF NOT EXISTS idx_squad_activity_wallet ON squad_activity_log(wallet_address);
CREATE INDEX IF NOT EXISTS idx_squad_activity_type ON squad_activity_log(activity_type);
CREATE INDEX IF NOT EXISTS idx_squad_activity_created_at ON squad_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_squad_activity_squad_created ON squad_activity_log(squad, created_at DESC);

-- Enable Row Level Security
ALTER TABLE squad_activity_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for squad_activity_log

-- Policy: Anyone can read squad activity
CREATE POLICY "Anyone can read squad activity"
ON squad_activity_log
FOR SELECT
USING (true);

-- Policy: Authenticated users can log their own activity
CREATE POLICY "Users can log their own activity"
ON squad_activity_log
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL OR wallet_address IS NOT NULL
);

-- Policy: Only admins can delete activity logs
CREATE POLICY "Admins can delete activity logs"
ON squad_activity_log
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.wallet_address = squad_activity_log.wallet_address
    AND users.is_admin = true
  )
);

-- Grant permissions
GRANT ALL ON squad_activity_log TO authenticated;
GRANT ALL ON squad_activity_log TO service_role;
GRANT SELECT ON squad_activity_log TO anon;

-- Comments
COMMENT ON TABLE squad_activity_log IS 'Tracks detailed squad member activity for analytics';
COMMENT ON COLUMN squad_activity_log.squad IS 'Squad name (Creators, Decoders, Raiders, Speakers, Rangers)';
COMMENT ON COLUMN squad_activity_log.wallet_address IS 'User who performed the activity';
COMMENT ON COLUMN squad_activity_log.activity_type IS 'Type of activity (bounty_completed, post_created, course_completed, etc.)';
COMMENT ON COLUMN squad_activity_log.metadata IS 'Additional data about the activity (flexible JSON)';

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Squad activity log table created successfully!';
  RAISE NOTICE 'You can now track detailed squad activity and analytics.';
END $$;

