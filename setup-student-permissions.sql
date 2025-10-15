-- =========================================
-- STUDENT PERMISSIONS SYSTEM
-- =========================================
-- Tracks which students can speak/show video in live sessions
-- Students must "raise hand" and get host approval

-- Create table for student permissions in live sessions
CREATE TABLE IF NOT EXISTS session_student_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  student_wallet TEXT NOT NULL,
  student_name TEXT,
  
  -- Permission status
  can_speak BOOLEAN DEFAULT FALSE,
  can_show_video BOOLEAN DEFAULT FALSE,
  
  -- Request tracking
  requested_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  approved_by TEXT, -- Host wallet who approved
  
  -- Status: 'waiting', 'approved', 'denied', 'revoked'
  status TEXT DEFAULT 'waiting',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate requests
  UNIQUE(session_id, student_wallet)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_session_permissions_session 
ON session_student_permissions(session_id);

CREATE INDEX IF NOT EXISTS idx_session_permissions_status 
ON session_student_permissions(status);

-- Enable RLS
ALTER TABLE session_student_permissions ENABLE ROW LEVEL SECURITY;

-- Policy: Students can see their own permissions
CREATE POLICY "Students can view own permissions"
ON session_student_permissions FOR SELECT
USING (student_wallet = current_setting('request.jwt.claim.wallet_address', true));

-- Policy: Students can request permissions (insert)
CREATE POLICY "Students can request permissions"
ON session_student_permissions FOR INSERT
WITH CHECK (student_wallet = current_setting('request.jwt.claim.wallet_address', true));

-- Policy: Hosts can view all permissions for their sessions
CREATE POLICY "Hosts can view session permissions"
ON session_student_permissions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM mentorship_sessions ms
    WHERE ms.id = session_id
    AND (
      ms.mentor_wallet = current_setting('request.jwt.claim.wallet_address', true)
      OR EXISTS (
        SELECT 1 FROM users u
        WHERE u.wallet_address = current_setting('request.jwt.claim.wallet_address', true)
        AND u.is_admin = true
      )
    )
  )
);

-- Policy: Hosts can update permissions (approve/deny)
CREATE POLICY "Hosts can update permissions"
ON session_student_permissions FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM mentorship_sessions ms
    WHERE ms.id = session_id
    AND (
      ms.mentor_wallet = current_setting('request.jwt.claim.wallet_address', true)
      OR EXISTS (
        SELECT 1 FROM users u
        WHERE u.wallet_address = current_setting('request.jwt.claim.wallet_address', true)
        AND u.is_admin = true
      )
    )
  )
);

-- Function to request permission to speak
CREATE OR REPLACE FUNCTION request_to_speak(
  p_session_id UUID,
  p_student_wallet TEXT,
  p_student_name TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_permission_id UUID;
  v_existing_permission RECORD;
BEGIN
  -- Check if already requested
  SELECT * INTO v_existing_permission
  FROM session_student_permissions
  WHERE session_id = p_session_id
  AND student_wallet = p_student_wallet;
  
  IF v_existing_permission.id IS NOT NULL THEN
    -- Update existing request
    UPDATE session_student_permissions
    SET 
      requested_at = NOW(),
      status = 'waiting',
      updated_at = NOW()
    WHERE id = v_existing_permission.id
    RETURNING id INTO v_permission_id;
    
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Request updated',
      'permission_id', v_permission_id,
      'status', 'waiting'
    );
  ELSE
    -- Create new request
    INSERT INTO session_student_permissions (
      session_id,
      student_wallet,
      student_name,
      requested_at,
      status
    ) VALUES (
      p_session_id,
      p_student_wallet,
      p_student_name,
      NOW(),
      'waiting'
    )
    RETURNING id INTO v_permission_id;
    
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Permission requested',
      'permission_id', v_permission_id,
      'status', 'waiting'
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to approve/deny permission
CREATE OR REPLACE FUNCTION manage_student_permission(
  p_permission_id UUID,
  p_host_wallet TEXT,
  p_action TEXT, -- 'approve' or 'deny' or 'revoke'
  p_can_speak BOOLEAN DEFAULT TRUE,
  p_can_show_video BOOLEAN DEFAULT TRUE
)
RETURNS JSONB AS $$
DECLARE
  v_permission RECORD;
  v_is_host BOOLEAN;
BEGIN
  -- Get permission record
  SELECT * INTO v_permission
  FROM session_student_permissions
  WHERE id = p_permission_id;
  
  IF v_permission.id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Permission not found'
    );
  END IF;
  
  -- Verify user is host or admin
  SELECT EXISTS (
    SELECT 1 FROM mentorship_sessions ms
    WHERE ms.id = v_permission.session_id
    AND (
      ms.mentor_wallet = p_host_wallet
      OR EXISTS (
        SELECT 1 FROM users u
        WHERE u.wallet_address = p_host_wallet
        AND u.is_admin = true
      )
    )
  ) INTO v_is_host;
  
  IF NOT v_is_host THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Not authorized'
    );
  END IF;
  
  -- Update based on action
  IF p_action = 'approve' THEN
    UPDATE session_student_permissions
    SET 
      status = 'approved',
      can_speak = p_can_speak,
      can_show_video = p_can_show_video,
      approved_at = NOW(),
      approved_by = p_host_wallet,
      updated_at = NOW()
    WHERE id = p_permission_id;
    
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Permission approved',
      'status', 'approved'
    );
    
  ELSIF p_action = 'deny' THEN
    UPDATE session_student_permissions
    SET 
      status = 'denied',
      can_speak = FALSE,
      can_show_video = FALSE,
      updated_at = NOW()
    WHERE id = p_permission_id;
    
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Permission denied',
      'status', 'denied'
    );
    
  ELSIF p_action = 'revoke' THEN
    UPDATE session_student_permissions
    SET 
      status = 'revoked',
      can_speak = FALSE,
      can_show_video = FALSE,
      updated_at = NOW()
    WHERE id = p_permission_id;
    
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Permission revoked',
      'status', 'revoked'
    );
    
  ELSE
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid action'
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get pending requests for a session
CREATE OR REPLACE FUNCTION get_pending_requests(p_session_id UUID)
RETURNS TABLE (
  id UUID,
  student_wallet TEXT,
  student_name TEXT,
  requested_at TIMESTAMPTZ,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ssp.id,
    ssp.student_wallet,
    ssp.student_name,
    ssp.requested_at,
    ssp.status
  FROM session_student_permissions ssp
  WHERE ssp.session_id = p_session_id
  AND ssp.status = 'waiting'
  ORDER BY ssp.requested_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if student has permission
CREATE OR REPLACE FUNCTION check_student_permission(
  p_session_id UUID,
  p_student_wallet TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_permission RECORD;
BEGIN
  SELECT * INTO v_permission
  FROM session_student_permissions
  WHERE session_id = p_session_id
  AND student_wallet = p_student_wallet;
  
  IF v_permission.id IS NULL THEN
    RETURN jsonb_build_object(
      'has_permission', false,
      'can_speak', false,
      'can_show_video', false,
      'status', 'none'
    );
  END IF;
  
  RETURN jsonb_build_object(
    'has_permission', (v_permission.status = 'approved'),
    'can_speak', COALESCE(v_permission.can_speak, false),
    'can_show_video', COALESCE(v_permission.can_show_video, false),
    'status', v_permission.status
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Success message
SELECT '✅ Student permissions system created!' AS status;

-- Show structure
SELECT 
  'session_student_permissions' AS table_name,
  COUNT(*) AS row_count
FROM session_student_permissions;

