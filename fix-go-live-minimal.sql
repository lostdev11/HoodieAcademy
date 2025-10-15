-- =========================================
-- MINIMAL GO-LIVE FIX
-- =========================================
-- Only the essential functions needed for Go Live button

-- Drop existing functions
DROP FUNCTION IF EXISTS can_user_go_live(TEXT, UUID);
DROP FUNCTION IF EXISTS go_live_session(UUID, TEXT);

-- =========================================
-- 1. CHECK IF USER CAN GO LIVE
-- =========================================

CREATE FUNCTION can_user_go_live(
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
-- 2. GO LIVE SESSION FUNCTION
-- =========================================

CREATE FUNCTION go_live_session(
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
-- 3. GRANT PERMISSIONS
-- =========================================

GRANT EXECUTE ON FUNCTION can_user_go_live(TEXT, UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION go_live_session(UUID, TEXT) TO authenticated, anon;

-- =========================================
-- DONE!
-- =========================================

SELECT 'Go-Live functions created successfully! ✅' AS status;

