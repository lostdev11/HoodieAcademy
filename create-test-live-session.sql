-- =========================================
-- CREATE TEST LIVE SESSION
-- =========================================
-- Quick script to create a test mentorship session
-- for testing the Go Live video interface

-- Delete any existing test sessions (optional)
DELETE FROM mentorship_sessions 
WHERE title LIKE '%Test%' OR title LIKE '%🎬%';

-- Create a test session with native streaming
INSERT INTO mentorship_sessions (
  title,
  description,
  mentor_name,
  mentor_wallet,
  scheduled_date,
  duration_minutes,
  max_attendees,
  stream_platform,
  stream_url,
  topic_tags,
  created_by,
  status,
  current_rsvps
) VALUES (
  '🎬 Test Live Video Session',
  'Testing the live video streaming interface with full host controls. This session demonstrates the native in-app video streaming powered by Daily.co.',
  'Admin User',
  'qg7pNNZq7qDQuc6Xkd1x4NvS2VM3aHtCqHEzucZxRGA',  -- Your admin wallet
  NOW() + INTERVAL '5 minutes',  -- Starts in 5 minutes
  60,  -- 60 minute duration
  50,  -- Max 50 attendees
  'native',  -- Use native in-app streaming (IMPORTANT!)
  NULL,  -- Stream URL not needed for native
  ARRAY['test', 'demo', 'video-streaming'],  -- Tags
  'qg7pNNZq7qDQuc6Xkd1x4NvS2VM3aHtCqHEzucZxRGA',  -- Your admin wallet
  'scheduled',  -- Ready to go live!
  0  -- No RSVPs yet
);

-- Verify it was created
SELECT 
  id,
  title,
  status,
  stream_platform,
  scheduled_date,
  created_by
FROM mentorship_sessions
WHERE title LIKE '%Test%'
ORDER BY created_at DESC
LIMIT 1;

-- =========================================
-- SUCCESS!
-- =========================================

-- Now go to Admin Dashboard → Live Sessions → Sessions
-- You should see your test session in the "Ready to Go Live" section!
-- Click "Go Live Now" to start streaming! 🎬

SELECT '✅ Test session created! Go to Live Sessions tab to go live!' AS status;

