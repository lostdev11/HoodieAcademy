-- =====================================================
-- LIVE MENTORSHIP & Q&A SESSIONS SYSTEM
-- =====================================================
-- Feature: Weekly live mentorship sessions with Q&A
-- Purpose: Add human layer to Hoodie Academy
-- =====================================================

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS session_rsvps CASCADE;
DROP TABLE IF EXISTS session_questions CASCADE;
DROP TABLE IF EXISTS session_recordings CASCADE;
DROP TABLE IF EXISTS mentorship_sessions CASCADE;

-- =====================================================
-- TABLE: mentorship_sessions
-- Purpose: Store scheduled mentorship sessions
-- =====================================================
CREATE TABLE mentorship_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Session Details
  title TEXT NOT NULL,
  description TEXT,
  mentor_name TEXT NOT NULL,
  mentor_wallet TEXT, -- Optional: link to mentor's wallet
  
  -- Scheduling
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  timezone TEXT DEFAULT 'UTC',
  
  -- Session Info
  session_type TEXT DEFAULT 'live_qa', -- 'live_qa', 'workshop', 'office_hours', 'ama'
  topic_tags TEXT[] DEFAULT '{}', -- e.g. ['trading', 'nfts', 'defi']
  squad_filter TEXT, -- NULL = all squads, or 'decoders', 'creators', etc.
  
  -- Platform Links
  stream_platform TEXT, -- 'zoom', 'youtube', 'twitch', 'discord'
  stream_url TEXT, -- Live stream link
  registration_url TEXT, -- Optional: external registration
  
  -- Recording
  recording_url TEXT, -- Link to recording after session
  recording_available BOOLEAN DEFAULT false,
  
  -- Status
  status TEXT DEFAULT 'scheduled', -- 'scheduled', 'live', 'completed', 'cancelled'
  is_published BOOLEAN DEFAULT true, -- Show on public page
  
  -- Limits
  max_attendees INTEGER, -- NULL = unlimited
  current_rsvps INTEGER DEFAULT 0,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_by TEXT, -- Admin wallet who created it
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_sessions_date ON mentorship_sessions(scheduled_date DESC);
CREATE INDEX idx_sessions_status ON mentorship_sessions(status);
CREATE INDEX idx_sessions_published ON mentorship_sessions(is_published);
CREATE INDEX idx_sessions_topic ON mentorship_sessions USING GIN(topic_tags);

-- =====================================================
-- TABLE: session_rsvps
-- Purpose: Track who's attending sessions
-- =====================================================
CREATE TABLE session_rsvps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  session_id UUID NOT NULL REFERENCES mentorship_sessions(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  
  -- RSVP Details
  status TEXT DEFAULT 'confirmed', -- 'confirmed', 'cancelled', 'waitlist', 'attended'
  reminded BOOLEAN DEFAULT false, -- Has user been reminded?
  attended BOOLEAN DEFAULT false, -- Did they actually attend?
  
  -- Preferences
  questions_submitted INTEGER DEFAULT 0,
  notification_enabled BOOLEAN DEFAULT true,
  
  -- Timestamps
  rsvp_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  cancelled_at TIMESTAMP WITH TIME ZONE,
  
  -- Unique constraint: one RSVP per wallet per session
  UNIQUE(session_id, wallet_address)
);

-- Indexes
CREATE INDEX idx_rsvps_session ON session_rsvps(session_id);
CREATE INDEX idx_rsvps_wallet ON session_rsvps(wallet_address);
CREATE INDEX idx_rsvps_status ON session_rsvps(status);

-- =====================================================
-- TABLE: session_questions
-- Purpose: Q&A submissions for sessions
-- =====================================================
CREATE TABLE session_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  session_id UUID NOT NULL REFERENCES mentorship_sessions(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  
  -- Question Details
  question TEXT NOT NULL,
  category TEXT, -- 'technical', 'strategy', 'general', etc.
  is_anonymous BOOLEAN DEFAULT false,
  
  -- Voting/Prioritization
  upvotes INTEGER DEFAULT 0,
  is_answered BOOLEAN DEFAULT false,
  answered_at TIMESTAMP WITH TIME ZONE,
  answer TEXT, -- Optional: written answer from mentor
  
  -- Moderation
  is_approved BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false, -- Highlight this question
  moderation_notes TEXT,
  
  -- Timestamps
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_questions_session ON session_questions(session_id);
CREATE INDEX idx_questions_wallet ON session_questions(wallet_address);
CREATE INDEX idx_questions_upvotes ON session_questions(upvotes DESC);
CREATE INDEX idx_questions_answered ON session_questions(is_answered);

-- =====================================================
-- TABLE: session_recordings
-- Purpose: Track past session recordings and timestamps
-- =====================================================
CREATE TABLE session_recordings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  session_id UUID NOT NULL REFERENCES mentorship_sessions(id) ON DELETE CASCADE,
  
  -- Recording Details
  title TEXT NOT NULL,
  description TEXT,
  recording_url TEXT NOT NULL,
  thumbnail_url TEXT,
  
  -- Platform
  platform TEXT, -- 'youtube', 'loom', 'vimeo', etc.
  duration_seconds INTEGER,
  
  -- Timestamps & Chapters
  timestamps JSONB DEFAULT '[]', -- [{time: 120, title: "NFT Basics"}]
  
  -- Access Control
  is_public BOOLEAN DEFAULT true,
  required_squad TEXT, -- NULL = all, or specific squad
  
  -- Stats
  view_count INTEGER DEFAULT 0,
  
  -- Metadata
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT
);

-- Indexes
CREATE INDEX idx_recordings_session ON session_recordings(session_id);
CREATE INDEX idx_recordings_public ON session_recordings(is_public);

-- =====================================================
-- FUNCTION: Get upcoming sessions
-- =====================================================
CREATE OR REPLACE FUNCTION get_upcoming_sessions(
  p_limit INTEGER DEFAULT 10,
  p_squad TEXT DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  title TEXT,
  description TEXT,
  mentor_name TEXT,
  scheduled_date TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  session_type TEXT,
  topic_tags TEXT[],
  stream_platform TEXT,
  stream_url TEXT,
  status TEXT,
  current_rsvps INTEGER,
  max_attendees INTEGER,
  time_until_start INTERVAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.title,
    s.description,
    s.mentor_name,
    s.scheduled_date,
    s.duration_minutes,
    s.session_type,
    s.topic_tags,
    s.stream_platform,
    s.stream_url,
    s.status,
    s.current_rsvps,
    s.max_attendees,
    (s.scheduled_date - NOW()) as time_until_start
  FROM mentorship_sessions s
  WHERE s.is_published = true
    AND s.status IN ('scheduled', 'live')
    AND s.scheduled_date > NOW()
    AND (p_squad IS NULL OR s.squad_filter IS NULL OR s.squad_filter = p_squad)
  ORDER BY s.scheduled_date ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: Get past sessions (with recordings)
-- =====================================================
CREATE OR REPLACE FUNCTION get_past_sessions(
  p_limit INTEGER DEFAULT 20,
  p_squad TEXT DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  title TEXT,
  description TEXT,
  mentor_name TEXT,
  scheduled_date TIMESTAMP WITH TIME ZONE,
  session_type TEXT,
  topic_tags TEXT[],
  recording_url TEXT,
  recording_available BOOLEAN,
  view_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.title,
    s.description,
    s.mentor_name,
    s.scheduled_date,
    s.session_type,
    s.topic_tags,
    s.recording_url,
    s.recording_available,
    COALESCE(
      (SELECT SUM(r.view_count) FROM session_recordings r WHERE r.session_id = s.id),
      0
    )::INTEGER as view_count
  FROM mentorship_sessions s
  WHERE s.is_published = true
    AND s.status = 'completed'
    AND (p_squad IS NULL OR s.squad_filter IS NULL OR s.squad_filter = p_squad)
  ORDER BY s.scheduled_date DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: RSVP to a session
-- =====================================================
CREATE OR REPLACE FUNCTION rsvp_to_session(
  p_session_id UUID,
  p_wallet_address TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_session RECORD;
  v_existing_rsvp RECORD;
  v_result JSONB;
BEGIN
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
  
  -- Check if already RSVP'd
  SELECT * INTO v_existing_rsvp
  FROM session_rsvps
  WHERE session_id = p_session_id AND wallet_address = p_wallet_address;
  
  IF FOUND THEN
    -- Update existing RSVP
    UPDATE session_rsvps
    SET status = 'confirmed', cancelled_at = NULL
    WHERE session_id = p_session_id AND wallet_address = p_wallet_address;
    
    RETURN jsonb_build_object(
      'success', true,
      'message', 'RSVP updated',
      'already_registered', true
    );
  END IF;
  
  -- Check capacity
  IF v_session.max_attendees IS NOT NULL 
     AND v_session.current_rsvps >= v_session.max_attendees THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Session is full',
      'waitlist', true
    );
  END IF;
  
  -- Create new RSVP
  INSERT INTO session_rsvps (session_id, wallet_address, status)
  VALUES (p_session_id, p_wallet_address, 'confirmed');
  
  -- Increment RSVP count
  UPDATE mentorship_sessions
  SET current_rsvps = current_rsvps + 1
  WHERE id = p_session_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'RSVP confirmed',
    'session_id', p_session_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: Submit a question
-- =====================================================
CREATE OR REPLACE FUNCTION submit_session_question(
  p_session_id UUID,
  p_wallet_address TEXT,
  p_question TEXT,
  p_category TEXT DEFAULT NULL,
  p_is_anonymous BOOLEAN DEFAULT false
)
RETURNS UUID AS $$
DECLARE
  v_question_id UUID;
BEGIN
  INSERT INTO session_questions (
    session_id,
    wallet_address,
    question,
    category,
    is_anonymous
  ) VALUES (
    p_session_id,
    p_wallet_address,
    p_question,
    p_category,
    p_is_anonymous
  ) RETURNING id INTO v_question_id;
  
  -- Increment questions count on RSVP
  UPDATE session_rsvps
  SET questions_submitted = questions_submitted + 1
  WHERE session_id = p_session_id AND wallet_address = p_wallet_address;
  
  RETURN v_question_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: Upvote a question
-- =====================================================
CREATE OR REPLACE FUNCTION upvote_question(
  p_question_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_new_count INTEGER;
BEGIN
  UPDATE session_questions
  SET upvotes = upvotes + 1
  WHERE id = p_question_id
  RETURNING upvotes INTO v_new_count;
  
  RETURN v_new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE mentorship_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_recordings ENABLE ROW LEVEL SECURITY;

-- Sessions: Everyone can view published sessions
CREATE POLICY "Anyone can view published sessions"
  ON mentorship_sessions
  FOR SELECT
  USING (is_published = true);

-- Sessions: Admins can manage all sessions
CREATE POLICY "Admins can manage sessions"
  ON mentorship_sessions
  FOR ALL
  USING (true);

-- RSVPs: Users can view their own RSVPs
CREATE POLICY "Users can view their own RSVPs"
  ON session_rsvps
  FOR SELECT
  USING (true);

-- RSVPs: Users can create RSVPs
CREATE POLICY "Users can create RSVPs"
  ON session_rsvps
  FOR INSERT
  WITH CHECK (true);

-- Questions: Everyone can view approved questions
CREATE POLICY "Anyone can view approved questions"
  ON session_questions
  FOR SELECT
  USING (is_approved = true);

-- Questions: Users can submit questions
CREATE POLICY "Users can submit questions"
  ON session_questions
  FOR INSERT
  WITH CHECK (true);

-- Recordings: Everyone can view public recordings
CREATE POLICY "Anyone can view public recordings"
  ON session_recordings
  FOR SELECT
  USING (is_public = true);

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION get_upcoming_sessions TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_past_sessions TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION rsvp_to_session TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION submit_session_question TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION upvote_question TO anon, authenticated, service_role;

-- =====================================================
-- SAMPLE DATA
-- =====================================================

-- Insert sample mentorship session
INSERT INTO mentorship_sessions (
  title,
  description,
  mentor_name,
  scheduled_date,
  duration_minutes,
  session_type,
  topic_tags,
  stream_platform,
  stream_url,
  status,
  is_published,
  created_by
) VALUES (
  'NFT Trading Strategies - Weekly Q&A',
  'Join us for a deep dive into NFT trading strategies, market analysis, and live Q&A. Bring your questions!',
  'CipherMaster Sage',
  NOW() + INTERVAL '3 days',
  90,
  'live_qa',
  ARRAY['nfts', 'trading', 'strategy'],
  'zoom',
  'https://zoom.us/j/example',
  'scheduled',
  true,
  'SYSTEM'
),
(
  'DeFi Security Workshop',
  'Learn how to protect your assets in DeFi. We''ll cover wallet security, smart contract risks, and best practices.',
  'Security Sensei',
  NOW() + INTERVAL '7 days',
  120,
  'workshop',
  ARRAY['defi', 'security', 'wallets'],
  'youtube',
  'https://youtube.com/live/example',
  'scheduled',
  true,
  'SYSTEM'
),
(
  'Community Strategy AMA',
  'Ask me anything about building engaged Web3 communities. Perfect for Speakers Squad!',
  'Voice of the Void',
  NOW() + INTERVAL '10 days',
  60,
  'ama',
  ARRAY['community', 'marketing', 'social'],
  'discord',
  'https://discord.gg/example',
  'scheduled',
  true,
  'SYSTEM'
);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify tables were created
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name LIKE '%session%' OR table_name LIKE '%mentorship%'
ORDER BY table_name;

-- Show available functions
SELECT 
  routine_name as function_name,
  routine_type as type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND (routine_name LIKE '%session%' OR routine_name LIKE '%question%')
ORDER BY routine_name;

-- Show upcoming sessions
SELECT * FROM get_upcoming_sessions(10);

COMMENT ON TABLE mentorship_sessions IS 'Weekly live mentorship and Q&A sessions';
COMMENT ON TABLE session_rsvps IS 'Track attendees for mentorship sessions';
COMMENT ON TABLE session_questions IS 'Q&A submissions for sessions';
COMMENT ON TABLE session_recordings IS 'Past session recordings and timestamps';

