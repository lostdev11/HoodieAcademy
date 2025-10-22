-- =====================================================
-- VOICE CHAT SYSTEM FOR SOCIAL FEED
-- =====================================================
-- Real-time voice chat rooms integrated with social feed

-- =====================================================
-- 1. CREATE VOICE_ROOMS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS voice_rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_name TEXT NOT NULL,
  room_description TEXT,
  
  -- Creator & Squad
  created_by TEXT NOT NULL, -- wallet_address of creator
  squad TEXT, -- Optional: restrict to specific squad
  
  -- Room Settings
  max_participants INTEGER DEFAULT 10,
  is_public BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  
  -- Room Type
  room_type TEXT DEFAULT 'casual' CHECK (room_type IN ('casual', 'study', 'gaming', 'meeting', 'qa')),
  
  -- Permissions
  allow_recording BOOLEAN DEFAULT false,
  require_approval BOOLEAN DEFAULT false, -- Need approval to join
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Metadata
  tags TEXT[],
  thumbnail_url TEXT,
  
  CONSTRAINT fk_creator FOREIGN KEY (created_by) 
    REFERENCES users(wallet_address) ON DELETE CASCADE
);

-- =====================================================
-- 2. CREATE VOICE_PARTICIPANTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS voice_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES voice_rooms(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  
  -- Participant Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'left', 'kicked', 'muted')),
  is_speaking BOOLEAN DEFAULT false,
  is_muted BOOLEAN DEFAULT false,
  is_moderator BOOLEAN DEFAULT false,
  
  -- Timing
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  duration_seconds INTEGER DEFAULT 0, -- Total time in room
  
  -- Metadata
  display_name TEXT,
  user_level INTEGER,
  user_squad TEXT,
  
  UNIQUE(room_id, wallet_address), -- User can only be in a room once
  
  CONSTRAINT fk_participant FOREIGN KEY (wallet_address) 
    REFERENCES users(wallet_address) ON DELETE CASCADE
);

-- =====================================================
-- 3. CREATE VOICE_MESSAGES TABLE (TEXT CHAT IN VOICE ROOMS)
-- =====================================================

CREATE TABLE IF NOT EXISTS voice_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES voice_rooms(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  
  -- Message Content
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'system', 'emoji', 'link')),
  content TEXT NOT NULL,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT false,
  
  CONSTRAINT fk_message_user FOREIGN KEY (wallet_address) 
    REFERENCES users(wallet_address) ON DELETE CASCADE
);

-- =====================================================
-- 4. CREATE VOICE_ROOM_INVITES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS voice_room_invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES voice_rooms(id) ON DELETE CASCADE,
  
  -- Invite Details
  invited_by TEXT NOT NULL,
  invited_wallet TEXT NOT NULL,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  
  CONSTRAINT fk_inviter FOREIGN KEY (invited_by) 
    REFERENCES users(wallet_address) ON DELETE CASCADE,
  CONSTRAINT fk_invitee FOREIGN KEY (invited_wallet) 
    REFERENCES users(wallet_address) ON DELETE CASCADE
);

-- =====================================================
-- 5. CREATE INDEXES
-- =====================================================

-- Voice Rooms
CREATE INDEX IF NOT EXISTS idx_voice_rooms_active ON voice_rooms(is_active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_voice_rooms_squad ON voice_rooms(squad, is_active);
CREATE INDEX IF NOT EXISTS idx_voice_rooms_creator ON voice_rooms(created_by);
CREATE INDEX IF NOT EXISTS idx_voice_rooms_type ON voice_rooms(room_type, is_active);

-- Participants
CREATE INDEX IF NOT EXISTS idx_participants_room ON voice_participants(room_id, status);
CREATE INDEX IF NOT EXISTS idx_participants_wallet ON voice_participants(wallet_address, status);
CREATE INDEX IF NOT EXISTS idx_participants_active ON voice_participants(status, joined_at DESC);

-- Messages
CREATE INDEX IF NOT EXISTS idx_messages_room ON voice_messages(room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_user ON voice_messages(wallet_address);

-- Invites
CREATE INDEX IF NOT EXISTS idx_invites_room ON voice_room_invites(room_id, status);
CREATE INDEX IF NOT EXISTS idx_invites_wallet ON voice_room_invites(invited_wallet, status);

-- =====================================================
-- 6. ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE voice_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_room_invites ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 7. CREATE RLS POLICIES - VOICE_ROOMS
-- =====================================================

-- Users can view public active rooms
CREATE POLICY "Users can view public rooms" ON voice_rooms
  FOR SELECT USING (is_active = true AND is_public = true);

-- Users can view rooms they created
CREATE POLICY "Users can view own rooms" ON voice_rooms
  FOR SELECT USING (created_by = current_setting('request.jwt.claims', true)::json->>'wallet_address');

-- Users can create rooms
CREATE POLICY "Users can create rooms" ON voice_rooms
  FOR INSERT WITH CHECK (created_by = current_setting('request.jwt.claims', true)::json->>'wallet_address');

-- Users can update their own rooms
CREATE POLICY "Users can update own rooms" ON voice_rooms
  FOR UPDATE USING (created_by = current_setting('request.jwt.claims', true)::json->>'wallet_address');

-- Admins can see and manage all rooms
CREATE POLICY "Admins can manage all rooms" ON voice_rooms
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'
      AND users.is_admin = true
    )
  );

-- =====================================================
-- 8. CREATE RLS POLICIES - VOICE_PARTICIPANTS
-- =====================================================

-- Users can view participants in rooms they're in or public rooms
CREATE POLICY "Users can view participants" ON voice_participants
  FOR SELECT USING (
    room_id IN (
      SELECT id FROM voice_rooms WHERE is_public = true AND is_active = true
    ) OR
    wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'
  );

-- Users can join rooms
CREATE POLICY "Users can join rooms" ON voice_participants
  FOR INSERT WITH CHECK (wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

-- Users can update their own participation
CREATE POLICY "Users can update own participation" ON voice_participants
  FOR UPDATE USING (wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

-- =====================================================
-- 9. CREATE RLS POLICIES - VOICE_MESSAGES
-- =====================================================

-- Users can view messages in rooms they're in
CREATE POLICY "Users can view room messages" ON voice_messages
  FOR SELECT USING (
    room_id IN (
      SELECT room_id FROM voice_participants 
      WHERE wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'
      AND status = 'active'
    )
  );

-- Users can send messages
CREATE POLICY "Users can send messages" ON voice_messages
  FOR INSERT WITH CHECK (
    wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'
    AND room_id IN (
      SELECT room_id FROM voice_participants 
      WHERE wallet_address = wallet_address AND status = 'active'
    )
  );

-- =====================================================
-- 10. CREATE HELPER FUNCTIONS
-- =====================================================

-- Get active voice rooms with participant counts
CREATE OR REPLACE FUNCTION get_active_voice_rooms(p_squad TEXT DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  room_name TEXT,
  room_description TEXT,
  created_by TEXT,
  creator_name TEXT,
  squad TEXT,
  room_type TEXT,
  max_participants INTEGER,
  current_participants BIGINT,
  is_full BOOLEAN,
  created_at TIMESTAMPTZ,
  tags TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    vr.id,
    vr.room_name,
    vr.room_description,
    vr.created_by,
    u.display_name as creator_name,
    vr.squad,
    vr.room_type,
    vr.max_participants,
    COUNT(vp.id) as current_participants,
    (COUNT(vp.id) >= vr.max_participants) as is_full,
    vr.created_at,
    vr.tags
  FROM voice_rooms vr
  LEFT JOIN users u ON vr.created_by = u.wallet_address
  LEFT JOIN voice_participants vp ON vr.id = vp.room_id AND vp.status = 'active'
  WHERE vr.is_active = true
    AND vr.is_public = true
    AND (p_squad IS NULL OR vr.squad = p_squad OR vr.squad IS NULL)
  GROUP BY vr.id, u.display_name
  ORDER BY vr.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Join a voice room
CREATE OR REPLACE FUNCTION join_voice_room(
  p_room_id UUID,
  p_wallet_address TEXT
) RETURNS JSONB AS $$
DECLARE
  v_room RECORD;
  v_participant_count INTEGER;
  v_user RECORD;
BEGIN
  -- Get room details
  SELECT * INTO v_room FROM voice_rooms WHERE id = p_room_id AND is_active = true;
  
  IF v_room IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Room not found or inactive');
  END IF;
  
  -- Check participant count
  SELECT COUNT(*) INTO v_participant_count 
  FROM voice_participants 
  WHERE room_id = p_room_id AND status = 'active';
  
  IF v_participant_count >= v_room.max_participants THEN
    RETURN jsonb_build_object('success', false, 'error', 'Room is full');
  END IF;
  
  -- Get user info
  SELECT * INTO v_user FROM users WHERE wallet_address = p_wallet_address;
  
  -- Insert or update participant
  INSERT INTO voice_participants (
    room_id,
    wallet_address,
    display_name,
    user_level,
    user_squad,
    status
  ) VALUES (
    p_room_id,
    p_wallet_address,
    v_user.display_name,
    v_user.level,
    v_user.squad,
    'active'
  )
  ON CONFLICT (room_id, wallet_address)
  DO UPDATE SET
    status = 'active',
    joined_at = NOW(),
    left_at = NULL;
  
  -- Update room activity
  UPDATE voice_rooms SET last_activity_at = NOW() WHERE id = p_room_id;
  
  RETURN jsonb_build_object('success', true, 'room_id', p_room_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Leave a voice room
CREATE OR REPLACE FUNCTION leave_voice_room(
  p_room_id UUID,
  p_wallet_address TEXT
) RETURNS JSONB AS $$
DECLARE
  v_participant RECORD;
BEGIN
  -- Get participant
  SELECT * INTO v_participant 
  FROM voice_participants 
  WHERE room_id = p_room_id AND wallet_address = p_wallet_address;
  
  IF v_participant IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not in room');
  END IF;
  
  -- Calculate duration
  UPDATE voice_participants SET
    status = 'left',
    left_at = NOW(),
    duration_seconds = EXTRACT(EPOCH FROM (NOW() - joined_at))::INTEGER
  WHERE room_id = p_room_id AND wallet_address = p_wallet_address;
  
  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 11. CREATE TRIGGERS
-- =====================================================

-- Update last_activity_at on new participant
CREATE OR REPLACE FUNCTION update_room_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE voice_rooms SET last_activity_at = NOW() WHERE id = NEW.room_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER voice_participant_activity
  AFTER INSERT OR UPDATE ON voice_participants
  FOR EACH ROW
  EXECUTE FUNCTION update_room_activity();

-- =====================================================
-- 12. SAMPLE DATA (OPTIONAL)
-- =====================================================

-- Example: Create a default community voice room
-- INSERT INTO voice_rooms (
--   room_name,
--   room_description,
--   created_by,
--   room_type,
--   max_participants,
--   is_public,
--   tags
-- ) VALUES (
--   'Community Lounge',
--   'Open voice chat for all academy members',
--   'ADMIN_WALLET_HERE',
--   'casual',
--   20,
--   true,
--   ARRAY['community', 'general', 'hangout']
-- );

-- =====================================================
-- SETUP COMPLETE!
-- =====================================================
SELECT 'Voice Chat System Setup Complete! ✅' as status;

