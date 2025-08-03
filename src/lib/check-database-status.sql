-- Database Status Check for Hoodie Academy
-- Run this to see which tables exist and which are missing

-- Check which tables exist
SELECT 
  table_name,
  CASE 
    WHEN table_name IN ('users', 'course_completions', 'quiz_results', 'badges', 'submissions', 'bounty_submissions', 'user_xp', 'xp_transactions', 'retailstar_rewards', 'user_retailstar_rewards', 'retailstar_tasks', 'user_task_completions') 
    THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('users', 'course_completions', 'quiz_results', 'badges', 'submissions', 'bounty_submissions', 'user_xp', 'xp_transactions', 'retailstar_rewards', 'user_retailstar_rewards', 'retailstar_tasks', 'user_task_completions')
ORDER BY table_name;

-- Check if leaderboard function exists
SELECT 
  routine_name,
  CASE 
    WHEN routine_name = 'get_leaderboard_rankings' THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name = 'get_leaderboard_rankings';

-- Check if leaderboard view exists
SELECT 
  table_name,
  CASE 
    WHEN table_name = 'leaderboard_view' THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
FROM information_schema.views 
WHERE table_schema = 'public' 
  AND table_name = 'leaderboard_view'; 