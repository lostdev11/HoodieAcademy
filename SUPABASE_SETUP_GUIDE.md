# 🗄️ Supabase Database Setup Guide

## Overview

This guide will help you set up the required Supabase tables and functions for the enhanced leaderboard system.

## 📋 Required Tables

### 1. Users Table

```sql
-- Create users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_id TEXT UNIQUE NOT NULL,
  display_name TEXT,
  squad TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_active TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for wallet_id
CREATE INDEX idx_users_wallet_id ON users(wallet_id);

-- Enable RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
CREATE POLICY "Users can view all users" ON users
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE USING (auth.jwt() ->> 'wallet_address' = wallet_id);
```

### 2. Course Completions Table

```sql
-- Create course_completions table
CREATE TABLE course_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_id TEXT REFERENCES users(wallet_id) ON DELETE CASCADE,
  course_id TEXT NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(wallet_id, course_id)
);

-- Create indexes
CREATE INDEX idx_course_completions_wallet_id ON course_completions(wallet_id);
CREATE INDEX idx_course_completions_course_id ON course_completions(course_id);

-- Enable RLS
ALTER TABLE course_completions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all course completions" ON course_completions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert their own course completions" ON course_completions
  FOR INSERT WITH CHECK (auth.jwt() ->> 'wallet_address' = wallet_id);
```

### 3. Quiz Results Table

```sql
-- Create quiz_results table
CREATE TABLE quiz_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_id TEXT REFERENCES users(wallet_id) ON DELETE CASCADE,
  quiz_id TEXT NOT NULL,
  score INTEGER NOT NULL,
  passed BOOLEAN NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(wallet_id, quiz_id)
);

-- Create indexes
CREATE INDEX idx_quiz_results_wallet_id ON quiz_results(wallet_id);
CREATE INDEX idx_quiz_results_quiz_id ON quiz_results(quiz_id);

-- Enable RLS
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all quiz results" ON quiz_results
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert their own quiz results" ON quiz_results
  FOR INSERT WITH CHECK (auth.jwt() ->> 'wallet_address' = wallet_id);
```

### 4. Badges Table

```sql
-- Create badges table
CREATE TABLE badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_id TEXT REFERENCES users(wallet_id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(wallet_id, badge_id)
);

-- Create indexes
CREATE INDEX idx_badges_wallet_id ON badges(wallet_id);
CREATE INDEX idx_badges_badge_id ON badges(badge_id);

-- Enable RLS
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all badges" ON badges
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert their own badges" ON badges
  FOR INSERT WITH CHECK (auth.jwt() ->> 'wallet_address' = wallet_id);
```

## 🚀 Optimized Leaderboard Function

### Install the SQL Function

Run this SQL in your Supabase SQL editor:

```sql
-- Create the optimized leaderboard function
CREATE OR REPLACE FUNCTION get_leaderboard_rankings()
RETURNS TABLE (
  wallet_id TEXT,
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
      u.wallet_id,
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
    LEFT JOIN course_completions cc ON u.wallet_id = cc.wallet_id
    LEFT JOIN quiz_results qr ON u.wallet_id = qr.wallet_id
    LEFT JOIN badges b ON u.wallet_id = b.wallet_id
    WHERE u.wallet_id IS NOT NULL
    GROUP BY u.wallet_id, u.display_name, u.squad, u.created_at, u.last_active
  ),
  ranked_users AS (
    SELECT 
      wallet_id,
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
    wallet_id,
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
```

## 🧪 Test Data Setup

### Insert Sample Users

```sql
-- Insert sample users
INSERT INTO users (wallet_id, display_name, squad) VALUES
('0x1234567890abcdef', '@ChainWitch', 'Decoder'),
('0xabcdef1234567890', '@Blob.eth', 'Speaker'),
('0x7890abcdef123456', '@RhinoRunz', 'Raider'),
('0x4567890abcdef123', '@CryptoQueen', 'Creator'),
('0xdef1234567890abc', '@SatoshiFan', 'Ranger');
```

### Insert Sample Course Completions

```sql
-- Insert sample course completions
INSERT INTO course_completions (wallet_id, course_id) VALUES
('0x1234567890abcdef', 'wallet-wizardry'),
('0x1234567890abcdef', 'nft-mastery'),
('0x1234567890abcdef', 'meme-coin-mania'),
('0xabcdef1234567890', 'wallet-wizardry'),
('0xabcdef1234567890', 'nft-mastery'),
('0x7890abcdef123456', 'wallet-wizardry'),
('0x4567890abcdef123', 'wallet-wizardry'),
('0xdef1234567890abc', 'wallet-wizardry');
```

### Insert Sample Quiz Results

```sql
-- Insert sample quiz results
INSERT INTO quiz_results (wallet_id, quiz_id, score, passed) VALUES
('0x1234567890abcdef', 'wallet-wizardry-final', 95, true),
('0x1234567890abcdef', 'nft-mastery-final', 88, true),
('0xabcdef1234567890', 'wallet-wizardry-final', 92, true),
('0x7890abcdef123456', 'wallet-wizardry-final', 85, true),
('0x4567890abcdef123', 'wallet-wizardry-final', 78, true);
```

### Insert Sample Badges

```sql
-- Insert sample badges
INSERT INTO badges (wallet_id, badge_id) VALUES
('0x1234567890abcdef', 'first-course'),
('0x1234567890abcdef', 'perfect-score'),
('0xabcdef1234567890', 'first-course'),
('0x7890abcdef123456', 'first-course');
```

## 🔧 Environment Variables

Make sure your `.env.local` file has the correct Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🧪 Testing the Setup

### 1. Test the RPC Function

```sql
-- Test the leaderboard function
SELECT * FROM get_leaderboard_rankings();
```

### 2. Test the View

```sql
-- Test the leaderboard view
SELECT *, ROW_NUMBER() OVER (ORDER BY completion_percentage DESC) as rank 
FROM leaderboard_view;
```

### 3. Test from JavaScript

```javascript
// Test from your Next.js app
const { data, error } = await supabase.rpc('get_leaderboard_rankings');
console.log('Leaderboard data:', data);
```

## 🚨 Troubleshooting

### Common Issues

1. **Function not found**
   - Make sure you ran the SQL function creation script
   - Check that the function name matches exactly

2. **Permission denied**
   - Ensure RLS policies are set up correctly
   - Check that the user is authenticated

3. **No data showing**
   - Verify that test data was inserted
   - Check that users have course completions

4. **Performance issues**
   - Ensure indexes are created
   - Consider using the RPC function instead of manual queries

### Debug Queries

```sql
-- Check if users exist
SELECT COUNT(*) FROM users;

-- Check course completions
SELECT COUNT(*) FROM course_completions;

-- Check quiz results
SELECT COUNT(*) FROM quiz_results;

-- Check badges
SELECT COUNT(*) FROM badges;

-- Test the function
SELECT * FROM get_leaderboard_rankings() LIMIT 5;
```

## 📊 Monitoring

### Useful Queries for Monitoring

```sql
-- Get leaderboard stats
SELECT 
  COUNT(*) as total_users,
  AVG(completion) as avg_completion,
  COUNT(CASE WHEN last_active > NOW() - INTERVAL '7 days' THEN 1 END) as active_users
FROM get_leaderboard_rankings();

-- Get squad distribution
SELECT 
  squad,
  COUNT(*) as count,
  AVG(completion) as avg_completion
FROM get_leaderboard_rankings()
GROUP BY squad
ORDER BY count DESC;
```

## ✅ Verification Checklist

- [ ] All tables created with correct schema
- [ ] Indexes created for performance
- [ ] RLS policies configured
- [ ] SQL function installed
- [ ] Test data inserted
- [ ] Environment variables set
- [ ] RPC function working
- [ ] Leaderboard displaying data
- [ ] Course completion tracking working
- [ ] Quiz result tracking working
- [ ] Badge tracking working

Once you've completed this setup, your enhanced leaderboard should be fully functional with real-time data from Supabase! 🎉 