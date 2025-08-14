-- Quick Fix: Add Missing Leaderboard Function
-- Run this script in your Supabase SQL editor to add the missing get_leaderboard_rankings function

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_leaderboard_rankings();

-- Create the leaderboard function
CREATE OR REPLACE FUNCTION get_leaderboard_rankings()
RETURNS TABLE (
  wallet_address TEXT,
  display_name TEXT,
  squad TEXT,
  rank BIGINT,
  level INTEGER,
  completion INTEGER,
  courses BIGINT,
  quizzes BIGINT,
  badges BIGINT,
  last_active TIMESTAMPTZ,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  WITH user_stats AS (
    SELECT 
      u.wallet_address,
      u.display_name,
      u.squad,
      u.created_at,
      u.last_active,
      -- Count total course completions
      COUNT(DISTINCT cc.course_id) as total_courses,
      -- Count 100-level course completions
      COUNT(DISTINCT CASE 
        WHEN cc.course_id IN ('wallet-wizardry', 'nft-mastery', 'meme-coin-mania', 
                             'community-strategy', 'sns', 'technical-analysis',
                             'cybersecurity-wallet-practices', 'ai-automation-curriculum',
                             'lore-narrative-crafting', 'nft-trading-psychology')
        THEN cc.course_id 
      END) as course_100s,
      -- Count passed quizzes
      COUNT(DISTINCT CASE WHEN qr.passed THEN qr.quiz_id END) as quizzes_passed,
      -- Count badges
      COUNT(DISTINCT b.badge_id) as badge_count
    FROM users u
    LEFT JOIN course_completions cc ON u.wallet_address = cc.wallet_address
    LEFT JOIN quiz_results qr ON u.wallet_address = qr.wallet_address
    LEFT JOIN badges b ON u.wallet_address = b.wallet_address
    WHERE u.wallet_address IS NOT NULL
    GROUP BY u.wallet_address, u.display_name, u.squad, u.created_at, u.last_active
  ),
  ranked_users AS (
    SELECT 
      wallet_address,
      display_name,
      squad,
      created_at,
      last_active,
      total_courses as courses,
      quizzes_passed as quizzes,
      badge_count as badges,
      -- Calculate completion percentage (10 total 100-level courses)
      ROUND((course_100s::DECIMAL / 10) * 100) as completion,
      -- Calculate level (100 + number of 100-level courses completed)
      100 + course_100s as level,
      -- Rank by completion percentage
      ROW_NUMBER() OVER (ORDER BY (course_100s::DECIMAL / 10) DESC) as rank
    FROM user_stats
    WHERE course_100s > 0  -- Only include users with some 100-level course completion
  )
  SELECT 
    wallet_address,
    display_name,
    squad,
    rank,
    level,
    completion,
    courses,
    quizzes,
    badges,
    last_active,
    created_at
  FROM ranked_users
  ORDER BY rank;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_leaderboard_rankings() TO authenticated;

-- Test the function
SELECT '✅ Leaderboard function created successfully' as status;
SELECT * FROM get_leaderboard_rankings() LIMIT 5; 