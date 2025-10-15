-- =========================================
-- CHECK AND FIX MENTORSHIP SESSIONS
-- =========================================

-- 1. Check what sessions exist
SELECT 
  id,
  title,
  stream_platform,
  status,
  created_at
FROM mentorship_sessions
ORDER BY created_at DESC
LIMIT 10;

-- 2. Update all sessions to use native streaming
UPDATE mentorship_sessions
SET stream_platform = 'native'
WHERE stream_platform != 'native';

-- 3. Verify the update
SELECT 
  id,
  title,
  stream_platform,
  status
FROM mentorship_sessions
ORDER BY created_at DESC;

-- 4. Create a fresh test session with native streaming
INSERT INTO mentorship_sessions (
  title,
  description,
  mentor_name,
  mentor_wallet,
  scheduled_date,
  duration_minutes,
  max_attendees,
  stream_platform,
  created_by,
  status
) VALUES (
  '🎥 Native Video Test Session',
  'Testing native in-app video streaming with live video feed',
  'Admin User',
  'qg7pNNZq7qDQuc6Xkd1x4NvS2VM3aHtCqHEzucZxRGA',
  NOW(),
  60,
  50,
  'native',  -- ✅ Native in-app video
  'qg7pNNZq7qDQuc6Xkd1x4NvS2VM3aHtCqHEzucZxRGA',
  'scheduled'
);

SELECT '✅ Sessions updated to use native streaming!' AS result;

