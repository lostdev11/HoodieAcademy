-- Fix Leaderboard RPC Function to Sort by Completion % (Not XP)
-- Run this in your Supabase SQL editor

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS get_leaderboard_rankings();

-- Create or replace the leaderboard RPC function that ranks by completion %
-- This version only uses tables that exist (users, course_completions)
CREATE OR REPLACE FUNCTION get_leaderboard_rankings()
RETURNS TABLE (
  wallet_id TEXT,
  display_name TEXT,
  squad TEXT,
  rank BIGINT,
  level INTEGER,
  completion INTEGER,
  courses INTEGER,
  quizzes INTEGER,
  badges INTEGER,
  last_active TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  total_xp INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH user_stats AS (
    SELECT
      u.wallet_address as wallet_id,
      u.display_name,
      u.squad,
      u.level,
      u.last_active,
      u.created_at,
      u.total_xp,
      -- Count completed courses
      COALESCE(COUNT(DISTINCT cc.course_id), 0)::INTEGER as courses,
      -- Calculate completion percentage based on 100-level courses (10 total courses)
      ROUND((COALESCE(COUNT(DISTINCT cc.course_id), 0)::NUMERIC / 10.0) * 100)::INTEGER as completion,
      -- Set quizzes to 0 (quiz_results table doesn't exist yet)
      0::INTEGER as quizzes,
      -- Set badges to 0 (badges table doesn't exist yet)
      0::INTEGER as badges
    FROM users u
    LEFT JOIN course_completions cc ON cc.wallet_address = u.wallet_address
    WHERE u.wallet_address IS NOT NULL
    GROUP BY u.wallet_address, u.display_name, u.squad, u.level, u.last_active, u.created_at, u.total_xp
  )
  SELECT
    us.wallet_id,
    us.display_name,
    COALESCE(us.squad, 'Unassigned') as squad,
    ROW_NUMBER() OVER (ORDER BY us.total_xp DESC, us.completion DESC, us.courses DESC) as rank,
    COALESCE(us.level, 1) as level,
    us.completion,
    us.courses,
    us.quizzes,
    us.badges,
    us.last_active,
    us.created_at,
    COALESCE(us.total_xp, 0) as total_xp
  FROM user_stats us
  -- Show ALL users, not just those with course completions
  ORDER BY us.total_xp DESC, us.completion DESC, us.courses DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_leaderboard_rankings() TO anon, authenticated;

-- Test the function
SELECT * FROM get_leaderboard_rankings() LIMIT 10;

