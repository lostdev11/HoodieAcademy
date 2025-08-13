-- Wallet Connections Logging Setup for Admin Dashboard
-- Run this in your Supabase SQL editor

-- Create the wallet_connections table
CREATE TABLE IF NOT EXISTS wallet_connections (
  id SERIAL PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  connection_type TEXT NOT NULL, -- 'connect', 'disconnect', 'verification_success', 'verification_failed'
  connection_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_agent TEXT,
  ip_address TEXT,
  verification_result JSONB, -- Store NFT verification details
  session_data JSONB, -- Store any session-related data
  notes TEXT -- For admin notes
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_wallet_connections_wallet_address ON wallet_connections(wallet_address);
CREATE INDEX IF NOT EXISTS idx_wallet_connections_timestamp ON wallet_connections(connection_timestamp);
CREATE INDEX IF NOT EXISTS idx_wallet_connections_type ON wallet_connections(connection_type);

-- Enable Row Level Security (RLS)
ALTER TABLE wallet_connections ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows admins to view all connections
-- You can restrict this later based on your admin role system
CREATE POLICY "Admins can view all wallet connections" ON wallet_connections
  FOR SELECT USING (true);

-- Create a policy that allows admins to insert new connections
CREATE POLICY "Admins can insert wallet connections" ON wallet_connections
  FOR INSERT WITH CHECK (true);

-- Create a policy that allows admins to update connections
CREATE POLICY "Admins can update wallet connections" ON wallet_connections
  FOR UPDATE USING (true);

-- Insert a sample connection for testing (optional)
-- INSERT INTO wallet_connections (wallet_address, connection_type, verification_result, notes)
-- VALUES ('test-wallet-123', 'connect', '{"nft_count": 1, "wifhoodie_found": true}', 'Test connection');

-- Create a view for easy admin queries
CREATE OR REPLACE VIEW wallet_connections_summary AS
SELECT 
  wallet_address,
  COUNT(*) as total_connections,
  MAX(connection_timestamp) as last_connection,
  MIN(connection_timestamp) as first_connection,
  COUNT(CASE WHEN connection_type = 'verification_success' THEN 1 END) as successful_verifications,
  COUNT(CASE WHEN connection_type = 'verification_failed' THEN 1 END) as failed_verifications
FROM wallet_connections
GROUP BY wallet_address
ORDER BY last_connection DESC;
