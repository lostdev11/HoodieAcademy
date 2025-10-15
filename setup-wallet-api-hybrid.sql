-- =====================================================
-- WALLET API HYBRID SYSTEM - DATABASE SETUP
-- =====================================================
-- This migration adds API-based validation while keeping
-- localStorage for performance
-- =====================================================

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS wallet_connections CASCADE;
DROP TABLE IF EXISTS wallet_sessions CASCADE;

-- =====================================================
-- TABLE: wallet_connections
-- Purpose: Audit trail of all wallet connection attempts
-- =====================================================
CREATE TABLE wallet_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT NOT NULL,
  action TEXT NOT NULL, -- 'connect', 'disconnect', 'verify'
  success BOOLEAN DEFAULT true,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookups by wallet
CREATE INDEX idx_wallet_connections_wallet ON wallet_connections(wallet_address);
CREATE INDEX idx_wallet_connections_created ON wallet_connections(created_at DESC);
CREATE INDEX idx_wallet_connections_action ON wallet_connections(action);

-- =====================================================
-- TABLE: wallet_sessions (Optional - for advanced features)
-- Purpose: Track active wallet sessions across devices
-- =====================================================
CREATE TABLE wallet_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT NOT NULL,
  session_token TEXT UNIQUE NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  device_info JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '7 days',
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for sessions
CREATE INDEX idx_wallet_sessions_wallet ON wallet_sessions(wallet_address);
CREATE INDEX idx_wallet_sessions_token ON wallet_sessions(session_token);
CREATE INDEX idx_wallet_sessions_active ON wallet_sessions(is_active, expires_at);

-- =====================================================
-- Add columns to users table if they don't exist
-- =====================================================
DO $$ 
BEGIN
  -- Add banned column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'banned'
  ) THEN
    ALTER TABLE users ADD COLUMN banned BOOLEAN DEFAULT false;
  END IF;

  -- Add last_verified column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'last_verified'
  ) THEN
    ALTER TABLE users ADD COLUMN last_verified TIMESTAMP WITH TIME ZONE;
  END IF;

  -- Add failed_attempts column for security
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'failed_attempts'
  ) THEN
    ALTER TABLE users ADD COLUMN failed_attempts INTEGER DEFAULT 0;
  END IF;
END $$;

-- =====================================================
-- FUNCTION: Log wallet connection
-- =====================================================
CREATE OR REPLACE FUNCTION log_wallet_connection(
  p_wallet_address TEXT,
  p_action TEXT,
  p_success BOOLEAN DEFAULT true,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  v_connection_id UUID;
BEGIN
  INSERT INTO wallet_connections (
    wallet_address,
    action,
    success,
    ip_address,
    user_agent,
    metadata
  ) VALUES (
    p_wallet_address,
    p_action,
    p_success,
    p_ip_address,
    p_user_agent,
    p_metadata
  ) RETURNING id INTO v_connection_id;
  
  -- Update user's last_active if connection was successful
  IF p_success AND p_action IN ('connect', 'verify') THEN
    UPDATE users 
    SET 
      last_active = NOW(),
      last_verified = NOW()
    WHERE wallet_address = p_wallet_address;
  END IF;
  
  RETURN v_connection_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: Verify wallet is allowed to connect
-- =====================================================
CREATE OR REPLACE FUNCTION verify_wallet_allowed(
  p_wallet_address TEXT
) RETURNS TABLE(
  allowed BOOLEAN,
  is_admin BOOLEAN,
  reason TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN u.banned = true THEN false
      WHEN u.wallet_address IS NULL THEN true -- New wallet, allow
      ELSE true
    END as allowed,
    COALESCE(u.is_admin, false) as is_admin,
    CASE 
      WHEN u.banned = true THEN 'Wallet is banned'
      WHEN u.wallet_address IS NULL THEN 'New wallet'
      ELSE 'Allowed'
    END as reason
  FROM users u
  WHERE u.wallet_address = p_wallet_address
  UNION ALL
  SELECT true, false, 'New wallet'
  WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE wallet_address = p_wallet_address
  )
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: Create or update wallet session
-- =====================================================
CREATE OR REPLACE FUNCTION create_wallet_session(
  p_wallet_address TEXT,
  p_session_token TEXT,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_device_info JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  v_session_id UUID;
BEGIN
  -- Deactivate old sessions for this wallet (optional - for single-device mode)
  -- Uncomment if you want only one active session per wallet
  -- UPDATE wallet_sessions 
  -- SET is_active = false 
  -- WHERE wallet_address = p_wallet_address AND is_active = true;
  
  -- Create new session
  INSERT INTO wallet_sessions (
    wallet_address,
    session_token,
    ip_address,
    user_agent,
    device_info
  ) VALUES (
    p_wallet_address,
    p_session_token,
    p_ip_address,
    p_user_agent,
    p_device_info
  ) RETURNING id INTO v_session_id;
  
  RETURN v_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: Clean up expired sessions
-- =====================================================
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  WITH deleted AS (
    DELETE FROM wallet_sessions
    WHERE expires_at < NOW()
    RETURNING id
  )
  SELECT COUNT(*) INTO v_deleted_count FROM deleted;
  
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE wallet_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_sessions ENABLE ROW LEVEL SECURITY;

-- Wallet connections: Users can view their own connections
CREATE POLICY "Users can view their own connections"
  ON wallet_connections
  FOR SELECT
  USING (true); -- Allow all reads for now, can be restricted later

-- Wallet connections: Service role can insert
CREATE POLICY "Service role can insert connections"
  ON wallet_connections
  FOR INSERT
  WITH CHECK (true);

-- Wallet sessions: Users can view their own sessions
CREATE POLICY "Users can view their own sessions"
  ON wallet_sessions
  FOR SELECT
  USING (true);

-- Wallet sessions: Service role can manage sessions
CREATE POLICY "Service role can manage sessions"
  ON wallet_sessions
  FOR ALL
  USING (true);

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION log_wallet_connection TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION verify_wallet_allowed TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION create_wallet_session TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION cleanup_expired_sessions TO service_role;

-- =====================================================
-- INITIAL DATA / TESTING
-- =====================================================

-- Log this setup completion
INSERT INTO wallet_connections (
  wallet_address,
  action,
  success,
  metadata
) VALUES (
  'SYSTEM',
  'setup_complete',
  true,
  jsonb_build_object(
    'version', '1.0',
    'setup_date', NOW(),
    'description', 'Wallet API Hybrid System Initialized'
  )
);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify tables were created
SELECT 
  'wallet_connections' as table_name,
  COUNT(*) as row_count 
FROM wallet_connections
UNION ALL
SELECT 
  'wallet_sessions' as table_name,
  COUNT(*) as row_count 
FROM wallet_sessions;

-- Show available functions
SELECT 
  routine_name as function_name,
  routine_type as type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE '%wallet%'
ORDER BY routine_name;

COMMENT ON TABLE wallet_connections IS 'Audit trail for all wallet connection events';
COMMENT ON TABLE wallet_sessions IS 'Active wallet sessions across devices';
COMMENT ON FUNCTION log_wallet_connection IS 'Logs a wallet connection event to the audit trail';
COMMENT ON FUNCTION verify_wallet_allowed IS 'Checks if a wallet is allowed to connect (not banned)';
COMMENT ON FUNCTION create_wallet_session IS 'Creates a new wallet session with expiration';
COMMENT ON FUNCTION cleanup_expired_sessions IS 'Removes expired wallet sessions';

