-- =========================================
-- NOTIFICATION TRACKING SYSTEM
-- =========================================
-- This script sets up the notification tracking system
-- Tracks when users last viewed different types of content
-- =========================================

-- =========================================
-- 1. CREATE NOTIFICATION TRACKING TABLE
-- =========================================

CREATE TABLE IF NOT EXISTS notification_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  notification_type TEXT NOT NULL, -- 'announcements', 'events', 'bounties', etc.
  last_viewed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(wallet_address, notification_type)
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_notification_views_wallet 
  ON notification_views(wallet_address);

CREATE INDEX IF NOT EXISTS idx_notification_views_type 
  ON notification_views(notification_type);

-- =========================================
-- 2. CREATE FUNCTION TO UPDATE LAST VIEWED
-- =========================================

CREATE OR REPLACE FUNCTION update_notification_view(
  p_wallet_address TEXT,
  p_notification_type TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert or update the last viewed timestamp
  INSERT INTO notification_views (wallet_address, notification_type, last_viewed_at, updated_at)
  VALUES (p_wallet_address, p_notification_type, NOW(), NOW())
  ON CONFLICT (wallet_address, notification_type)
  DO UPDATE SET 
    last_viewed_at = NOW(),
    updated_at = NOW();

  RETURN jsonb_build_object(
    'success', true,
    'wallet_address', p_wallet_address,
    'notification_type', p_notification_type,
    'last_viewed_at', NOW()
  );
END;
$$;

-- =========================================
-- 3. CREATE FUNCTION TO GET NOTIFICATION COUNTS
-- =========================================

CREATE OR REPLACE FUNCTION get_notification_counts(
  p_wallet_address TEXT,
  p_is_admin BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_last_viewed_announcements TIMESTAMPTZ;
  v_last_viewed_events TIMESTAMPTZ;
  v_last_viewed_bounties TIMESTAMPTZ;
  v_last_viewed_courses TIMESTAMPTZ;
  v_last_viewed_submissions TIMESTAMPTZ;
  v_last_viewed_feedback TIMESTAMPTZ;
  v_last_viewed_permissions TIMESTAMPTZ;
  v_counts JSONB;
BEGIN
  -- Get last viewed timestamps (or 7 days ago as default)
  SELECT COALESCE(last_viewed_at, NOW() - INTERVAL '7 days') INTO v_last_viewed_announcements
  FROM notification_views
  WHERE wallet_address = p_wallet_address AND notification_type = 'announcements';

  SELECT COALESCE(last_viewed_at, NOW() - INTERVAL '7 days') INTO v_last_viewed_events
  FROM notification_views
  WHERE wallet_address = p_wallet_address AND notification_type = 'events';

  SELECT COALESCE(last_viewed_at, NOW() - INTERVAL '7 days') INTO v_last_viewed_bounties
  FROM notification_views
  WHERE wallet_address = p_wallet_address AND notification_type = 'bounties';

  SELECT COALESCE(last_viewed_at, NOW() - INTERVAL '7 days') INTO v_last_viewed_courses
  FROM notification_views
  WHERE wallet_address = p_wallet_address AND notification_type = 'courses';

  SELECT COALESCE(last_viewed_at, NOW() - INTERVAL '7 days') INTO v_last_viewed_submissions
  FROM notification_views
  WHERE wallet_address = p_wallet_address AND notification_type = 'submissions';

  SELECT COALESCE(last_viewed_at, NOW() - INTERVAL '7 days') INTO v_last_viewed_feedback
  FROM notification_views
  WHERE wallet_address = p_wallet_address AND notification_type = 'feedback';

  SELECT COALESCE(last_viewed_at, NOW() - INTERVAL '7 days') INTO v_last_viewed_permissions
  FROM notification_views
  WHERE wallet_address = p_wallet_address AND notification_type = 'permissions';

  -- Build counts object
  v_counts := jsonb_build_object(
    'newAnnouncements', (
      SELECT COUNT(*) FROM council_notices 
      WHERE created_at > COALESCE(v_last_viewed_announcements, NOW() - INTERVAL '7 days')
    ),
    'newEvents', (
      SELECT COUNT(*) FROM events 
      WHERE created_at > COALESCE(v_last_viewed_events, NOW() - INTERVAL '7 days')
    ),
    'newBounties', (
      SELECT COUNT(*) FROM bounties 
      WHERE created_at > COALESCE(v_last_viewed_bounties, NOW() - INTERVAL '7 days')
        AND hidden = false
    ),
    'newCourses', (
      SELECT COUNT(*) FROM courses 
      WHERE created_at > COALESCE(v_last_viewed_courses, NOW() - INTERVAL '7 days')
        AND status = 'published'
        AND is_visible = true
    )
  );

  -- Add admin-specific counts if user is admin
  IF p_is_admin THEN
    v_counts := v_counts || jsonb_build_object(
      'newSubmissions', (
        SELECT COUNT(*) FROM bounty_submissions 
        WHERE created_at > COALESCE(v_last_viewed_submissions, NOW() - INTERVAL '7 days')
          AND status = 'pending'
      ),
      'newFeedback', (
        SELECT COUNT(*) FROM user_feedback 
        WHERE created_at > COALESCE(v_last_viewed_feedback, NOW() - INTERVAL '7 days')
          AND status = 'pending'
      ),
      'pendingMentorships', (
        SELECT COUNT(*) FROM mentorship_presenters 
        WHERE created_at > COALESCE(v_last_viewed_permissions, NOW() - INTERVAL '7 days')
          AND is_approved = false
      ),
      'newUsers', (
        SELECT COUNT(*) FROM users 
        WHERE created_at > NOW() - INTERVAL '7 days'
      ),
      'pendingPermissions', (
        SELECT COUNT(*) FROM session_student_permissions 
        WHERE status = 'waiting'
      )
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'counts', v_counts,
    'wallet_address', p_wallet_address,
    'is_admin', p_is_admin
  );
END;
$$;

-- =========================================
-- 4. CREATE FUNCTION TO CLEAR OLD VIEWS
-- =========================================

CREATE OR REPLACE FUNCTION cleanup_old_notification_views()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  -- Delete views older than 90 days
  DELETE FROM notification_views
  WHERE updated_at < NOW() - INTERVAL '90 days';
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  RETURN v_deleted_count;
END;
$$;

-- =========================================
-- 5. GRANT PERMISSIONS
-- =========================================

-- Grant access to authenticated users
GRANT SELECT, INSERT, UPDATE ON notification_views TO authenticated;
GRANT SELECT, INSERT, UPDATE ON notification_views TO anon;

-- =========================================
-- 6. VERIFICATION QUERIES
-- =========================================

-- Check table exists
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'notification_views'
ORDER BY ordinal_position;

-- Check functions exist
SELECT 
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'update_notification_view',
    'get_notification_counts',
    'cleanup_old_notification_views'
  );

-- Test the count function (replace with your wallet address)
-- SELECT get_notification_counts('YOUR_WALLET_ADDRESS_HERE', false);

-- =========================================
-- ✅ COMPLETE!
-- =========================================
-- Notification tracking system is now set up
-- Tables, functions, and indexes are ready
-- =========================================

