-- =========================================
-- MENTORSHIP & WALLET VERIFICATION FUNCTIONS
-- =========================================
-- This script creates all required database functions for:
-- 1. Wallet verification and logging
-- 2. Mentorship session management
-- 3. Go-live permissions

-- =========================================
-- DROP EXISTING FUNCTIONS FIRST (if they exist)
-- =========================================

-- Drop functions in correct order (reverse dependency)
DROP FUNCTION IF EXISTS log_wallet_connection(TEXT, TEXT, BOOLEAN, TEXT, TEXT, JSONB);
DROP FUNCTION IF EXISTS verify_wallet_allowed(TEXT);
DROP FUNCTION IF EXISTS can_user_go_live(TEXT, UUID);
DROP FUNCTION IF EXISTS go_live_session(UUID, TEXT);

-- =========================================
-- 1. WALLET VERIFICATION FUNCTION
-- =========================================

CREATE OR REPLACE FUNCTION verify_wallet_allowed(p_wallet_address TEXT)
RETURNS TABLE(
  allowed BOOLEAN,
  is_admin BOOLEAN,
  reason TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user RECORD;
BEGIN
  -- Check if user exists
  SELECT * INTO v_user
  FROM users
  WHERE wallet_address = p_wallet_address
  LIMIT 1;

  -- If user doesn't exist, allow (new wallet)
  IF NOT FOUND THEN
    RETURN QUERY SELECT 
      true AS allowed,
      false AS is_admin,
      'New wallet' AS reason;
    RETURN;
  END IF;

  -- If user is banned, deny
  IF v_user.banned = true THEN
    RETURN QUERY SELECT 
      false AS allowed,
      false AS is_admin,
      'Wallet is banned' AS reason;
    RETURN;
  END IF;

  -- Otherwise allow
  RETURN QUERY SELECT 
    true AS allowed,
    COALESCE(v_user.is_admin, false) AS is_admin,
    'Allowed' AS reason;
END;
$$;

-- =========================================
-- 2. WALLET CONNECTION LOGGING FUNCTION
-- =========================================

CREATE OR REPLACE FUNCTION log_wallet_connection(
  p_wallet_address TEXT,
  p_action TEXT,
  p_success BOOLEAN,
  p_ip_address TEXT DEFAULT 'unknown',
  p_user_agent TEXT DEFAULT 'unknown',
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert into wallet_connections table (create if doesn't exist)
  INSERT INTO wallet_connections (
    wallet_address,
    action,
    success,
    ip_address,
    user_agent,
    metadata,
    created_at
  ) VALUES (
    p_wallet_address,
    p_action,
    p_success,
    p_ip_address,
    p_user_agent,
    p_metadata,
    NOW()
  );
EXCEPTION
  WHEN undefined_table THEN
    -- Table doesn't exist, create it
    CREATE TABLE IF NOT EXISTS wallet_connections (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      wallet_address TEXT NOT NULL,
      action TEXT NOT NULL,
      success BOOLEAN NOT NULL DEFAULT true,
      ip_address TEXT,
      user_agent TEXT,
      metadata JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    
    -- Try the insert again
    INSERT INTO wallet_connections (
      wallet_address,
      action,
      success,
      ip_address,
      user_agent,
      metadata,
      created_at
    ) VALUES (
      p_wallet_address,
      p_action,
      p_success,
      p_ip_address,
      p_user_agent,
      p_metadata,
      NOW()
    );
END;
$$;

-- =========================================
-- 3. CHECK IF USER CAN GO LIVE
-- =========================================

CREATE OR REPLACE FUNCTION can_user_go_live(
  p_wallet_address TEXT,
  p_session_id UUID
)
RETURNS TABLE(
  allowed BOOLEAN,
  reason TEXT,
  role TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user RECORD;
  v_session RECORD;
  v_presenter RECORD;
BEGIN
  -- Get user info
  SELECT * INTO v_user
  FROM users
  WHERE wallet_address = p_wallet_address
  LIMIT 1;

  -- If user doesn't exist, deny
  IF NOT FOUND THEN
    RETURN QUERY SELECT 
      false AS allowed,
      'User not found' AS reason,
      'none' AS role;
    RETURN;
  END IF;

  -- If user is admin, always allow
  IF v_user.is_admin = true THEN
    RETURN QUERY SELECT 
      true AS allowed,
      'Admin access' AS reason,
      'admin' AS role;
    RETURN;
  END IF;

  -- Get session info
  SELECT * INTO v_session
  FROM mentorship_sessions
  WHERE id = p_session_id
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN QUERY SELECT 
      false AS allowed,
      'Session not found' AS reason,
      'none' AS role;
    RETURN;
  END IF;

  -- Check if user is the session creator
  IF v_session.created_by = p_wallet_address THEN
    RETURN QUERY SELECT 
      true AS allowed,
      'Session creator' AS reason,
      'creator' AS role;
    RETURN;
  END IF;

  -- Check if user has presenter permissions
  SELECT * INTO v_presenter
  FROM active_presenters
  WHERE wallet_address = p_wallet_address
    AND can_go_live = true
    AND (expires_at IS NULL OR expires_at > NOW())
  LIMIT 1;

  IF FOUND THEN
    RETURN QUERY SELECT 
      true AS allowed,
      'Has presenter role' AS reason,
      v_presenter.role_name AS role;
    RETURN;
  END IF;

  -- Otherwise deny
  RETURN QUERY SELECT 
    false AS allowed,
    'No permission to go live' AS reason,
    'none' AS role;
END;
$$;

-- =========================================
-- 4. GO LIVE SESSION FUNCTION
-- =========================================

CREATE OR REPLACE FUNCTION go_live_session(
  p_session_id UUID,
  p_wallet_address TEXT
)
RETURNS TABLE(
  success BOOLEAN,
  session_id UUID,
  went_live_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session RECORD;
BEGIN
  -- Get session
  SELECT * INTO v_session
  FROM mentorship_sessions
  WHERE id = p_session_id
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session not found';
  END IF;

  -- Update session to live status
  UPDATE mentorship_sessions
  SET 
    status = 'live',
    went_live_at = NOW(),
    updated_at = NOW()
  WHERE id = p_session_id;

  -- Return result
  RETURN QUERY SELECT 
    true AS success,
    p_session_id AS session_id,
    NOW() AS went_live_at;
END;
$$;

-- =========================================
-- 5. CREATE WALLET_CONNECTIONS TABLE IF NEEDED
-- =========================================

CREATE TABLE IF NOT EXISTS wallet_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  action TEXT NOT NULL,
  success BOOLEAN NOT NULL DEFAULT true,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallet_connections_wallet 
  ON wallet_connections(wallet_address);
CREATE INDEX IF NOT EXISTS idx_wallet_connections_created_at 
  ON wallet_connections(created_at DESC);

-- =========================================
-- 6. GRANT PERMISSIONS
-- =========================================

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION verify_wallet_allowed(TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION log_wallet_connection(TEXT, TEXT, BOOLEAN, TEXT, TEXT, JSONB) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION can_user_go_live(TEXT, UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION go_live_session(UUID, TEXT) TO authenticated, anon;

-- =========================================
-- SETUP COMPLETE!
-- =========================================

-- Test the functions (optional)
SELECT 'All mentorship and wallet verification functions created successfully!' AS status;

