-- =====================================================
-- MENTORSHIP PRESENTER PERMISSIONS SYSTEM
-- =====================================================
-- Purpose: Control who can go live and manage sessions
-- =====================================================

-- Drop existing tables if they exist
DROP TABLE IF EXISTS session_presenters CASCADE;
DROP TABLE IF EXISTS presenter_roles CASCADE;

-- =====================================================
-- TABLE: presenter_roles
-- Purpose: Define who can create/manage sessions
-- =====================================================
CREATE TABLE presenter_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  wallet_address TEXT NOT NULL UNIQUE,
  
  -- Permissions
  can_create_sessions BOOLEAN DEFAULT false,
  can_go_live BOOLEAN DEFAULT false,
  can_manage_all_sessions BOOLEAN DEFAULT false, -- Admin: edit any session
  can_manage_own_sessions BOOLEAN DEFAULT true,  -- Edit sessions they created
  can_assign_presenters BOOLEAN DEFAULT false,   -- Add co-presenters to sessions
  
  -- Restrictions
  max_sessions_per_week INTEGER DEFAULT 3,
  allowed_platforms TEXT[] DEFAULT ARRAY['native', 'zoom', 'youtube', 'twitch', 'discord'],
  
  -- Role metadata
  role_name TEXT DEFAULT 'presenter', -- 'admin', 'mentor', 'presenter', 'guest'
  assigned_by TEXT, -- Admin who granted permission
  notes TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE, -- NULL = never expires
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_presenter_roles_wallet ON presenter_roles(wallet_address);
CREATE INDEX idx_presenter_roles_active ON presenter_roles(is_active);

-- =====================================================
-- TABLE: session_presenters
-- Purpose: Map presenters to specific sessions
-- =====================================================
CREATE TABLE session_presenters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  session_id UUID NOT NULL REFERENCES mentorship_sessions(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  
  -- Role in this session
  role TEXT DEFAULT 'co-presenter', -- 'host', 'co-presenter', 'moderator'
  
  -- Permissions for this session
  can_control_session BOOLEAN DEFAULT false, -- Can go live, end session
  can_share_screen BOOLEAN DEFAULT true,
  can_mute_participants BOOLEAN DEFAULT false,
  can_manage_questions BOOLEAN DEFAULT false, -- Approve/delete questions
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  added_by TEXT, -- Who added this presenter
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(session_id, wallet_address)
);

-- Indexes
CREATE INDEX idx_session_presenters_session ON session_presenters(session_id);
CREATE INDEX idx_session_presenters_wallet ON session_presenters(wallet_address);

-- =====================================================
-- Add columns to mentorship_sessions
-- =====================================================
ALTER TABLE mentorship_sessions 
  ADD COLUMN IF NOT EXISTS created_by_wallet TEXT,
  ADD COLUMN IF NOT EXISTS requires_presenter_role BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS went_live_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS ended_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS went_live_by TEXT; -- Who clicked "go live"

-- =====================================================
-- FUNCTION: Check if user can go live
-- =====================================================
CREATE OR REPLACE FUNCTION can_user_go_live(
  p_wallet_address TEXT,
  p_session_id UUID DEFAULT NULL
)
RETURNS TABLE(
  allowed BOOLEAN,
  reason TEXT,
  role TEXT
) AS $$
DECLARE
  v_is_admin BOOLEAN;
  v_has_presenter_role BOOLEAN;
  v_is_session_presenter BOOLEAN;
  v_is_session_creator BOOLEAN;
BEGIN
  -- Check if user is admin
  SELECT COALESCE(u.is_admin, false) INTO v_is_admin
  FROM users u
  WHERE u.wallet_address = p_wallet_address;
  
  -- Admins can always go live
  IF v_is_admin THEN
    RETURN QUERY SELECT true, 'Admin access'::TEXT, 'admin'::TEXT;
    RETURN;
  END IF;
  
  -- Check if user has presenter role
  SELECT EXISTS(
    SELECT 1 FROM presenter_roles pr
    WHERE pr.wallet_address = p_wallet_address
      AND pr.is_active = true
      AND pr.can_go_live = true
      AND (pr.expires_at IS NULL OR pr.expires_at > NOW())
  ) INTO v_has_presenter_role;
  
  -- If checking for specific session
  IF p_session_id IS NOT NULL THEN
    -- Check if user is assigned to this session
    SELECT EXISTS(
      SELECT 1 FROM session_presenters sp
      WHERE sp.session_id = p_session_id
        AND sp.wallet_address = p_wallet_address
        AND sp.is_active = true
        AND sp.can_control_session = true
    ) INTO v_is_session_presenter;
    
    -- Check if user created this session
    SELECT EXISTS(
      SELECT 1 FROM mentorship_sessions ms
      WHERE ms.id = p_session_id
        AND ms.created_by_wallet = p_wallet_address
    ) INTO v_is_session_creator;
    
    IF v_is_session_presenter THEN
      RETURN QUERY SELECT true, 'Session presenter'::TEXT, 'presenter'::TEXT;
      RETURN;
    END IF;
    
    IF v_is_session_creator AND v_has_presenter_role THEN
      RETURN QUERY SELECT true, 'Session creator'::TEXT, 'creator'::TEXT;
      RETURN;
    END IF;
  END IF;
  
  -- General presenter role (can go live on their own sessions)
  IF v_has_presenter_role THEN
    RETURN QUERY SELECT true, 'Has presenter role'::TEXT, 'presenter'::TEXT;
    RETURN;
  END IF;
  
  -- Not allowed
  RETURN QUERY SELECT false, 'No presenter permissions'::TEXT, 'none'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: Grant presenter role
-- =====================================================
CREATE OR REPLACE FUNCTION grant_presenter_role(
  p_wallet_address TEXT,
  p_role_name TEXT DEFAULT 'presenter',
  p_can_create_sessions BOOLEAN DEFAULT true,
  p_can_go_live BOOLEAN DEFAULT true,
  p_assigned_by TEXT DEFAULT NULL,
  p_expires_days INTEGER DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_role_id UUID;
  v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Calculate expiration if specified
  IF p_expires_days IS NOT NULL THEN
    v_expires_at := NOW() + (p_expires_days || ' days')::INTERVAL;
  END IF;
  
  -- Insert or update presenter role
  INSERT INTO presenter_roles (
    wallet_address,
    can_create_sessions,
    can_go_live,
    can_manage_own_sessions,
    role_name,
    assigned_by,
    expires_at
  ) VALUES (
    p_wallet_address,
    p_can_create_sessions,
    p_can_go_live,
    true,
    p_role_name,
    p_assigned_by,
    v_expires_at
  )
  ON CONFLICT (wallet_address) 
  DO UPDATE SET
    can_create_sessions = EXCLUDED.can_create_sessions,
    can_go_live = EXCLUDED.can_go_live,
    role_name = EXCLUDED.role_name,
    is_active = true,
    updated_at = NOW()
  RETURNING id INTO v_role_id;
  
  RETURN v_role_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: Revoke presenter role
-- =====================================================
CREATE OR REPLACE FUNCTION revoke_presenter_role(
  p_wallet_address TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE presenter_roles
  SET 
    is_active = false,
    can_go_live = false,
    updated_at = NOW()
  WHERE wallet_address = p_wallet_address;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: Add presenter to session
-- =====================================================
CREATE OR REPLACE FUNCTION add_session_presenter(
  p_session_id UUID,
  p_wallet_address TEXT,
  p_role TEXT DEFAULT 'co-presenter',
  p_can_control_session BOOLEAN DEFAULT false,
  p_added_by TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_presenter_id UUID;
BEGIN
  INSERT INTO session_presenters (
    session_id,
    wallet_address,
    role,
    can_control_session,
    can_share_screen,
    can_mute_participants,
    can_manage_questions,
    added_by
  ) VALUES (
    p_session_id,
    p_wallet_address,
    p_role,
    p_can_control_session,
    CASE WHEN p_role IN ('host', 'co-presenter') THEN true ELSE false END,
    CASE WHEN p_role = 'host' THEN true ELSE false END,
    CASE WHEN p_role IN ('host', 'moderator') THEN true ELSE false END,
    p_added_by
  )
  ON CONFLICT (session_id, wallet_address)
  DO UPDATE SET
    role = EXCLUDED.role,
    can_control_session = EXCLUDED.can_control_session,
    is_active = true
  RETURNING id INTO v_presenter_id;
  
  RETURN v_presenter_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: Go live with permission check
-- =====================================================
CREATE OR REPLACE FUNCTION go_live_session(
  p_session_id UUID,
  p_wallet_address TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_can_go_live BOOLEAN;
  v_reason TEXT;
  v_session RECORD;
BEGIN
  -- Check permissions
  SELECT allowed, reason INTO v_can_go_live, v_reason
  FROM can_user_go_live(p_wallet_address, p_session_id)
  LIMIT 1;
  
  IF NOT v_can_go_live THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Permission denied: ' || v_reason
    );
  END IF;
  
  -- Get session details
  SELECT * INTO v_session
  FROM mentorship_sessions
  WHERE id = p_session_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Session not found'
    );
  END IF;
  
  -- Check if session is in the future or already live
  IF v_session.status = 'live' THEN
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Session is already live',
      'already_live', true
    );
  END IF;
  
  -- Mark session as live
  UPDATE mentorship_sessions
  SET 
    status = 'live',
    went_live_at = NOW(),
    went_live_by = p_wallet_address,
    updated_at = NOW()
  WHERE id = p_session_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Session is now live!',
    'session_id', p_session_id,
    'went_live_at', NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: End session
-- =====================================================
CREATE OR REPLACE FUNCTION end_session(
  p_session_id UUID,
  p_wallet_address TEXT,
  p_recording_url TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_can_control BOOLEAN;
  v_reason TEXT;
BEGIN
  -- Check permissions
  SELECT allowed, reason INTO v_can_control, v_reason
  FROM can_user_go_live(p_wallet_address, p_session_id)
  LIMIT 1;
  
  IF NOT v_can_control THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Permission denied: ' || v_reason
    );
  END IF;
  
  -- End the session
  UPDATE mentorship_sessions
  SET 
    status = 'completed',
    ended_at = NOW(),
    recording_url = COALESCE(p_recording_url, recording_url),
    recording_available = CASE WHEN p_recording_url IS NOT NULL THEN true ELSE recording_available END,
    updated_at = NOW()
  WHERE id = p_session_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Session ended',
    'ended_at', NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE presenter_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_presenters ENABLE ROW LEVEL SECURITY;

-- Presenter roles: Admins can view/manage all
CREATE POLICY "Admins can manage presenter roles"
  ON presenter_roles
  FOR ALL
  USING (true);

-- Presenter roles: Users can view their own
CREATE POLICY "Users can view their own presenter role"
  ON presenter_roles
  FOR SELECT
  USING (true);

-- Session presenters: Anyone can view
CREATE POLICY "Anyone can view session presenters"
  ON session_presenters
  FOR SELECT
  USING (true);

-- Session presenters: Admins can manage
CREATE POLICY "Admins can manage session presenters"
  ON session_presenters
  FOR ALL
  USING (true);

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION can_user_go_live TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION grant_presenter_role TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION revoke_presenter_role TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION add_session_presenter TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION go_live_session TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION end_session TO anon, authenticated, service_role;

-- =====================================================
-- SAMPLE DATA - Grant Admin Access
-- =====================================================

-- Grant yourself presenter access (replace with your wallet)
-- Example: Uncomment and update with your admin wallet addresses
/*
INSERT INTO presenter_roles (
  wallet_address,
  can_create_sessions,
  can_go_live,
  can_manage_all_sessions,
  can_assign_presenters,
  role_name,
  max_sessions_per_week
) VALUES 
(
  'YOUR_ADMIN_WALLET_ADDRESS_HERE',
  true,
  true,
  true,
  true,
  'admin',
  999
),
(
  'ANOTHER_PRESENTER_WALLET_HERE',
  true,
  true,
  false,
  false,
  'mentor',
  5
);
*/

-- =====================================================
-- EXAMPLE QUERIES
-- =====================================================

-- Grant presenter role to a user
-- SELECT grant_presenter_role(
--   'wallet_address_here',
--   'mentor',
--   true,  -- can_create_sessions
--   true,  -- can_go_live
--   'admin_wallet',
--   365    -- expires in 365 days
-- );

-- Check if user can go live
-- SELECT * FROM can_user_go_live('wallet_address_here');

-- Check for specific session
-- SELECT * FROM can_user_go_live('wallet_address_here', 'session_id_here');

-- Add co-presenter to a session
-- SELECT add_session_presenter(
--   'session_id',
--   'presenter_wallet',
--   'co-presenter',
--   true,  -- can_control_session
--   'admin_wallet'
-- );

-- Go live (with permission check)
-- SELECT go_live_session('session_id', 'your_wallet');

-- End session
-- SELECT end_session('session_id', 'your_wallet', 'recording_url');

-- =====================================================
-- VIEW: Active presenters
-- =====================================================
CREATE OR REPLACE VIEW active_presenters AS
SELECT 
  pr.wallet_address,
  pr.role_name,
  pr.can_create_sessions,
  pr.can_go_live,
  pr.can_manage_all_sessions,
  pr.granted_at,
  pr.expires_at,
  u.display_name,
  COUNT(ms.id) as sessions_created
FROM presenter_roles pr
LEFT JOIN users u ON u.wallet_address = pr.wallet_address
LEFT JOIN mentorship_sessions ms ON ms.created_by_wallet = pr.wallet_address
WHERE pr.is_active = true
  AND (pr.expires_at IS NULL OR pr.expires_at > NOW())
GROUP BY pr.wallet_address, pr.role_name, pr.can_create_sessions, 
         pr.can_go_live, pr.can_manage_all_sessions, pr.granted_at, 
         pr.expires_at, u.display_name;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Show tables created
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as columns
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND (table_name LIKE '%presenter%' OR table_name LIKE '%mentorship%')
ORDER BY table_name;

-- Show functions created
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND (routine_name LIKE '%presenter%' OR routine_name LIKE '%live%')
ORDER BY routine_name;

COMMENT ON TABLE presenter_roles IS 'Controls who can create sessions and go live';
COMMENT ON TABLE session_presenters IS 'Maps presenters to specific sessions with granular permissions';
COMMENT ON FUNCTION can_user_go_live IS 'Checks if a user has permission to go live';
COMMENT ON FUNCTION grant_presenter_role IS 'Grants presenter permissions to a user';
COMMENT ON FUNCTION go_live_session IS 'Makes a session live with permission check';

