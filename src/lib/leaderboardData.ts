export interface LeaderboardUser {
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
  // New fields for completion-based ranking
  coursesStarted: number;
  overallCompletionPercentage: number;
  totalLessonsCompleted: number;
  totalLessonsAvailable: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedDate: string;
  points: number;
}

export interface CourseProgress {
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
  started: boolean; // New field to track if user has started the course
}

// API-based data functions - get data from API endpoints
export const getRealLeaderboardData = async (): Promise<LeaderboardUser[]> => {
  try {
    const response = await fetch('/api/leaderboard');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch leaderboard data: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Transform API data to match the expected interface
    return data.map((user: any) => ({
      walletAddress: user.walletAddress,
      displayName: user.displayName,
      rank: user.rank,
      totalScore: user.totalScore,
      coursesCompleted: user.coursesCompleted,
      totalLessons: user.totalLessons,
      totalLessonsAvailable: user.totalLessonsAvailable,
      totalQuizzes: user.coursesCompleted, // Assuming each completed course has a quiz
      averageQuizScore: user.averageQuizScore,
      badgesEarned: 0, // Would be calculated based on achievements
      joinDate: user.joinDate,
      lastActive: user.lastActive,
      profileImage: user.profileImage,
      squad: user.squad,
      achievements: [], // Would be calculated based on user actions
      courseProgress: user.courseProgress,
      coursesStarted: user.coursesCompleted, // Assuming started = completed for now
      overallCompletionPercentage: user.completionPercentage,
      totalLessonsCompleted: user.totalLessons
    }));
  } catch (error) {
    console.error('Error fetching leaderboard data from API:', error);
    return [];
  }
};

// Helper function to calculate user score based on completion percentage
export const calculateUserScore = (user: LeaderboardUser): number => {
  let score = 0;
  
  // Base points for completion percentage (primary ranking factor)
  score += Math.round(user.overallCompletionPercentage * 10); // 10 points per 1% completion
  
  // Bonus points for completed courses
  score += user.coursesCompleted * 100;
  
  // Points for lessons completed
  score += user.totalLessonsCompleted * 20;
  
  // Points for quiz performance
  score += user.totalQuizzes * 50;
  score += Math.round(user.averageQuizScore * 5);
  
  // Points for badges
  score += user.badgesEarned * 150;
  
  // Points for achievements
  score += user.achievements.reduce((acc, achievement) => acc + achievement.points, 0);
  
  // Bonus for consistency (days since joining)
  const daysSinceJoining = Math.floor((Date.now() - new Date(user.joinDate).getTime()) / (1000 * 60 * 60 * 24));
  score += Math.min(daysSinceJoining * 2, 200); // Max 200 points for consistency
  
  return score;
};

// Helper function to get user rank based on completion percentage
export const getUserRank = async (walletAddress: string): Promise<number> => {
  const users = await getRealLeaderboardData();
  
  // Sort by completion percentage (descending)
  users.sort((a, b) => b.overallCompletionPercentage - a.overallCompletionPercentage);
  
  // Find user and return rank
  const userIndex = users.findIndex(u => u.walletAddress === walletAddress);
  return userIndex !== -1 ? userIndex + 1 : -1;
};

// Helper function to get user score
export const getUserScore = async (walletAddress: string): Promise<number> => {
  const users = await getRealLeaderboardData();
  const user = users.find(u => u.walletAddress === walletAddress);
  return user ? calculateUserScore(user) : 0;
};

// Helper function to get top 20 users based on completion percentage
export const getTop20Users = async (): Promise<LeaderboardUser[]> => {
  try {
    const response = await fetch('/api/leaderboard?limit=20');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch top 20 users: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Transform API data to match the expected interface
    return data.map((user: any) => ({
      walletAddress: user.walletAddress,
      displayName: user.displayName,
      rank: user.rank,
      totalScore: user.totalScore,
      coursesCompleted: user.coursesCompleted,
      totalLessons: user.totalLessons,
      totalLessonsAvailable: user.totalLessonsAvailable,
      totalQuizzes: user.coursesCompleted,
      averageQuizScore: user.averageQuizScore,
      badgesEarned: 0,
      joinDate: user.joinDate,
      lastActive: user.lastActive,
      profileImage: user.profileImage,
      squad: user.squad,
      achievements: [],
      courseProgress: user.courseProgress,
      coursesStarted: user.coursesCompleted,
      overallCompletionPercentage: user.completionPercentage,
      totalLessonsCompleted: user.totalLessons
    }));
  } catch (error) {
    console.error('Error fetching top 20 users:', error);
    return [];
  }
};

// Helper function to update user progress (for when courses are completed)
// This function now triggers a refresh of leaderboard data rather than updating local state
export const updateUserProgress = async (
  walletAddress: string, 
  courseId: string, 
  progress: number, 
  score: number,
  completed: boolean
): Promise<void> => {
  // The leaderboard data is now managed by the API, so we don't need to update local state
  // The API will automatically reflect the updated data on the next fetch
  console.log(`User progress updated: ${walletAddress} - ${courseId} - ${progress}% - Score: ${score} - Completed: ${completed}`);
  
  // Optionally, we could trigger a cache invalidation or refresh here
  // For now, the data will be fresh on the next API call
}; 