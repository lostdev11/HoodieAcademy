# Hoodie Academy Leaderboard System

## Overview

The Hoodie Academy Leaderboard System tracks user performance based on wallet addresses and ranks them according to their achievements in the academy. The system automatically updates when users complete courses, lessons, and quizzes.

## Features

### 🏆 Top 20 Leaderboard
- Real-time ranking based on user performance
- Detailed user profiles with progress tracking
- Achievement system with points
- Search and filter functionality
- Responsive design with beautiful UI

### 📊 Performance Tracking
- **Course Completion**: 300 points per completed course
- **Lesson Progress**: 50 points per completed lesson
- **Quiz Performance**: 100 points per passed quiz + score multiplier
- **Badge System**: 150 points per earned NFT badge
- **Achievements**: Variable points based on achievement type
- **Consistency Bonus**: Up to 500 points for consistent participation

### 🎯 Achievement System
- **First Steps**: Complete your first course (100 points)
- **Perfect Score**: Achieve 100% on any quiz (200 points)
- **Speed Learner**: Complete 3 courses in one week (300 points)
- **Consistency King**: Log in for 30 consecutive days (250 points)

## File Structure

```
src/
├── lib/
│   └── leaderboardData.ts          # Data structures and mock data
├── components/
│   └── leaderboard/
│       ├── LeaderboardCard.tsx     # Individual user card component
│       └── LeaderboardPage.tsx     # Main leaderboard page
├── services/
│   └── leaderboard-service.ts      # Business logic and data management
├── hooks/
│   └── use-leaderboard.ts          # React hook for leaderboard integration
└── app/
    └── leaderboard/
        └── page.tsx                # Leaderboard route
```

## Data Models

### LeaderboardUser
```typescript
interface LeaderboardUser {
  walletAddress: string;
  displayName: string;
  rank: number;
  totalScore: number;
  coursesCompleted: number;
  totalLessons: number;
  totalQuizzes: number;
  averageQuizScore: number;
  badgesEarned: number;
  joinDate: string;
  lastActive: string;
  profileImage?: string;
  squad?: string;
  achievements: Achievement[];
  courseProgress: CourseProgress[];
}
```

### CourseProgress
```typescript
interface CourseProgress {
  courseId: string;
  courseName: string;
  progress: number;
  score: number;
  completed: boolean;
  completedDate?: string;
  lessonsCompleted: number;
  totalLessons: number;
  quizzesPassed: number;
  totalQuizzes: number;
}
```

## Usage

### 1. Accessing the Leaderboard
- Navigate to `/leaderboard` in the application
- Accessible from the sidebar navigation
- Preview available on the main dashboard

### 2. Integration with Course Completion
```typescript
import { useLeaderboard } from '@/hooks/use-leaderboard';

const { updateProgress } = useLeaderboard(walletAddress);

// When a user completes a course
updateProgress({
  walletAddress: 'user-wallet-address',
  courseId: 'wallet-wizardry',
  progress: 100,
  score: 95,
  completed: true,
  lessonsCompleted: 4,
  totalLessons: 4,
  quizzesPassed: 1,
  totalQuizzes: 1
});
```

### 3. User Initialization
```typescript
const { initializeUser } = useLeaderboard(walletAddress);

// Initialize new user
initializeUser('HoodieScholar');
```

## Scoring System

### Base Points
- **Course Completion**: 300 points
- **Lesson Completion**: 50 points per lesson
- **Quiz Pass**: 100 points + (score × 2)
- **Badge Earned**: 150 points
- **Achievement**: Variable (100-300 points)

### Bonus Points
- **Consistency**: Up to 500 points for daily participation
- **Perfect Scores**: Additional multipliers for 100% quiz scores
- **Speed Learning**: Bonus for rapid course completion

## Features

### Search & Filter
- Search by display name, wallet address, or squad
- Filter by rank range (Top 10, Top 50)
- Filter by recent activity
- Filter by achievement status

### User Profiles
- Detailed progress breakdown
- Achievement history
- Course completion status
- Performance statistics

### Real-time Updates
- Automatic score recalculation
- Rank updates based on performance
- Achievement unlocking
- Last active tracking

## Technical Implementation

### Data Persistence
- Local storage for user progress
- Mock data for demonstration
- Ready for database integration

### Performance Optimization
- Efficient score calculation
- Cached user data
- Optimized re-renders

### Error Handling
- Graceful fallbacks for missing data
- Error logging and recovery
- User-friendly error messages

## Future Enhancements

### Planned Features
- [ ] Real-time WebSocket updates
- [ ] Database integration (PostgreSQL/MongoDB)
- [ ] Social features (following, sharing)
- [ ] Seasonal competitions
- [ ] NFT rewards for top performers
- [ ] Team/Clan leaderboards
- [ ] API endpoints for external integration

### Scalability Considerations
- Database indexing for fast queries
- Caching layer for frequently accessed data
- Pagination for large leaderboards
- CDN for static assets

## API Integration

### Endpoints (Future Implementation)
```typescript
// GET /api/leaderboard
// Returns top 20 users

// GET /api/leaderboard/user/:walletAddress
// Returns specific user data

// POST /api/leaderboard/progress
// Updates user progress

// GET /api/leaderboard/achievements/:walletAddress
// Returns user achievements
```

## Contributing

1. Follow the existing code structure
2. Add TypeScript types for new features
3. Include error handling
4. Test with different wallet addresses
5. Update documentation for new features

## Support

For questions or issues with the leaderboard system:
1. Check the console for error messages
2. Verify wallet connection status
3. Ensure proper data initialization
4. Review the scoring algorithm

---

**Note**: This is a demonstration implementation using mock data. In production, integrate with a real database and implement proper authentication and authorization. 