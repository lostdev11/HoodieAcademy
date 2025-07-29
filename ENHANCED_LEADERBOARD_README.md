# 🏆 Enhanced Hoodie Academy Leaderboard

## Overview

The Enhanced Leaderboard is a real-time ranking system that tracks student progress through Hoodie Academy's 100-level courses. It provides meaningful insights into course completion, engagement, and achievement across all squads.

## 🎯 Key Features

### 📊 Live Statistics
- **Total Participants**: Count of users with at least 1 course completion
- **Average Completion**: Average % of completed 100-level tracks across all users
- **Active Learners**: Users logged in within last 7 days
- **Your Rank**: Current user's position on the leaderboard

### 🔍 Advanced Filtering & Search
- **Search by**: Name, wallet address, or squad
- **Squad Filter**: Filter by Decoder, Creator, Speaker, Raider, Ranger
- **Sort by**: Completion %, Courses, Quizzes, Badges, Level

### 📈 Real-time Rankings
- **Completion-based ranking**: Primary metric is course completion percentage
- **Level system**: Base level 100 + 1 level per 10% completion
- **Achievement tracking**: Badges and achievements earned
- **Course progress**: Detailed tracking of lessons and quizzes completed

## 🏗️ Architecture

### Enhanced Leaderboard Service (`src/services/enhanced-leaderboard-service.ts`)

```typescript
// Core interfaces
interface LeaderboardUser {
  walletAddress: string;
  displayName: string;
  squad: string;
  rank: number;
  level: number;
  completion: number;
  courses: number;
  quizzes: number;
  badges: number;
  lastActive: string;
  joinDate: string;
  achievements: Achievement[];
  courseProgress: CourseProgress[];
}

interface LeaderboardStats {
  totalParticipants: number;
  avgCompletion: number;
  activeLearners: number;
  userRank: number;
}
```

### Key Methods

```typescript
// Get real-time leaderboard data
async getLeaderboard(): Promise<LeaderboardUser[]>

// Get leaderboard statistics
async getLeaderboardStats(currentUserWallet?: string): Promise<LeaderboardStats>

// Update user progress
async updateUserProgress(walletAddress: string, courseId: string, progress: ProgressData): Promise<void>

// Record course completion
async recordCourseCompletion(walletAddress: string, courseId: string): Promise<void>
```

### Progress Tracking Hook (`src/hooks/use-leaderboard-tracking.ts`)

```typescript
// Track lesson completion
const trackLessonCompletion = async (
  walletAddress: string,
  courseId: string,
  lessonIndex: number,
  totalLessons: number
)

// Track quiz completion
const trackQuizCompletion = async (
  walletAddress: string,
  courseId: string,
  quizScore: number,
  passed: boolean
)

// Track course completion
const trackCourseCompletion = async (
  walletAddress: string,
  courseId: string,
  finalScore: number
)
```

## 🎨 UI Components

### Enhanced Leaderboard Page (`src/components/leaderboard/EnhancedLeaderboardPage.tsx`)

Features:
- **Responsive design**: Works on desktop and mobile
- **Real-time updates**: Auto-refreshes every 30 seconds
- **Interactive filters**: Search, squad filter, sort options
- **Visual indicators**: Progress bars, rank icons, squad colors
- **Current user highlighting**: Shows user's stats and rank

### Demo Component (`src/components/leaderboard/LeaderboardDemo.tsx`)

For testing and demonstration with mock data.

## 📊 Database Schema

### Required Supabase Tables

```sql
-- Users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT UNIQUE NOT NULL,
  display_name TEXT,
  squad TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Course progress table
CREATE TABLE course_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT REFERENCES users(wallet_address),
  course_id TEXT NOT NULL,
  lessons_completed INTEGER DEFAULT 0,
  total_lessons INTEGER DEFAULT 0,
  quizzes_passed INTEGER DEFAULT 0,
  total_quizzes INTEGER DEFAULT 0,
  score INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  started BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(wallet_address, course_id)
);

-- Course completions table
CREATE TABLE course_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT REFERENCES users(wallet_address),
  course_id TEXT NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved BOOLEAN DEFAULT FALSE,
  UNIQUE(wallet_address, course_id)
);

-- Achievements table
CREATE TABLE achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT REFERENCES users(wallet_address),
  achievement_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  points INTEGER DEFAULT 0,
  earned_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🚀 Integration Guide

### 1. Initialize User

```typescript
import { enhancedLeaderboardService } from '@/services/enhanced-leaderboard-service';

// When user completes onboarding
await enhancedLeaderboardService.initializeUser(
  walletAddress,
  displayName,
  squad
);
```

### 2. Track Course Progress

```typescript
import { useCourseProgressTracking } from '@/hooks/use-leaderboard-tracking';

// In your course component
const { onLessonComplete, onQuizComplete, onCourseComplete } = useCourseProgressTracking(
  walletAddress,
  courseId
);

// When lesson is completed
onLessonComplete(lessonIndex, totalLessons);

// When quiz is completed
onQuizComplete(score, passed);

// When course is completed
onCourseComplete(finalScore);
```

### 3. Display Leaderboard

```typescript
import EnhancedLeaderboardPage from '@/components/leaderboard/EnhancedLeaderboardPage';

// In your page component
export default function LeaderboardPage() {
  return <EnhancedLeaderboardPage />;
}
```

## 🎯 Ranking Algorithm

### Primary Ranking Factors

1. **Completion Percentage** (Primary)
   - Calculated as: `(totalLessonsCompleted / totalLessonsAvailable) * 100`
   - Base level: 100 + (completion / 10)

2. **Course Completions** (Secondary)
   - Number of approved course completions
   - Bonus points for each completed course

3. **Quiz Performance** (Tertiary)
   - Average quiz scores
   - Number of quizzes passed

4. **Achievements & Badges** (Bonus)
   - Achievement points
   - Badge count

### Level Calculation

```typescript
const level = Math.floor(completion / 10) + 100;
// Example: 93% completion = Level 109
```

## 🔧 Configuration

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Course Configuration

Update course names in `enhanced-leaderboard-service.ts`:

```typescript
private getCourseName(courseId: string): string {
  const courseNames: Record<string, string> = {
    'wallet-wizardry': 'Wallet Wizardry',
    'nft-mastery': 'NFT Mastery',
    // Add your courses here
  };
  return courseNames[courseId] || courseId;
}
```

## 🧪 Testing

### Demo Mode

Use the demo component for testing:

```typescript
import LeaderboardDemo from '@/components/leaderboard/LeaderboardDemo';

// Shows mock data for testing
<LeaderboardDemo />
```

### Mock Data

The demo includes realistic mock data showing:
- Top 5 users with varying completion percentages
- Different squads and achievement levels
- Realistic wallet addresses and display names

## 🚀 Deployment

1. **Database Setup**: Ensure all required Supabase tables are created
2. **Environment Variables**: Set up Supabase credentials
3. **Course Integration**: Update course tracking in your course components
4. **Testing**: Verify leaderboard updates with real course completions

## 📈 Future Enhancements

### Planned Features

1. **Historical Tracking**
   - Weekly/monthly progress graphs
   - Progress over time visualization

2. **Advanced Analytics**
   - Squad-specific leaderboards
   - Course-specific rankings
   - Achievement leaderboards

3. **Social Features**
   - User profiles with detailed stats
   - Achievement sharing
   - Squad challenges

4. **Real-time Features**
   - Live notifications for rank changes
   - Achievement unlock notifications
   - Squad milestone celebrations

## 🐛 Troubleshooting

### Common Issues

1. **No data showing**
   - Check Supabase connection
   - Verify table permissions
   - Ensure users have course progress

2. **Ranks not updating**
   - Check course completion tracking
   - Verify progress update calls
   - Check for errors in console

3. **Performance issues**
   - Optimize database queries
   - Implement caching
   - Reduce refresh frequency

### Debug Mode

Enable debug logging:

```typescript
// In enhanced-leaderboard-service.ts
console.log('Leaderboard data:', users);
console.log('User stats:', userStats);
```

## 📝 Contributing

1. Follow the existing code structure
2. Add TypeScript types for new features
3. Update documentation for new functionality
4. Test with both mock and real data
5. Ensure responsive design for mobile

## 🎉 Success Metrics

The enhanced leaderboard tracks:

- **Engagement**: Active learners, completion rates
- **Progress**: Course completions, quiz performance
- **Achievement**: Badges earned, milestones reached
- **Community**: Squad participation, social features

This creates a comprehensive view of student success and engagement across Hoodie Academy's 100-level curriculum. 