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
}

// Real data functions - get data from localStorage
export const getRealLeaderboardData = (): LeaderboardUser[] => {
  const userProgress = localStorage.getItem('userProgress');
  const userProfiles = localStorage.getItem('userProfiles');
  
  if (!userProgress) return [];
  
  try {
    const progress = JSON.parse(userProgress);
    const profiles = userProfiles ? JSON.parse(userProfiles) : {};
    
    return Object.entries(progress).map(([walletAddress, userData]: [string, any]) => {
      const profile = profiles[walletAddress] || {};
      const courses = userData.courses || {};
      
      // Calculate stats from real data
      const completedCourses = Object.values(courses).filter((course: any) => 
        course.progress && course.progress.every((p: string) => p === 'completed')
      ).length;
      
      const totalLessons = Object.values(courses).reduce((total: number, course: any) => 
        total + (course.progress?.length || 0), 0
      );
      
      const totalQuizzes = Object.values(courses).filter((course: any) => 
        course.finalExam?.taken
      ).length;
      
      const quizScores = Object.values(courses)
        .filter((course: any) => course.finalExam?.score)
        .map((course: any) => course.finalExam.score);
      
      const averageQuizScore = quizScores.length > 0 
        ? quizScores.reduce((sum, score) => sum + score, 0) / quizScores.length 
        : 0;
      
      const courseProgress = Object.entries(courses).map(([courseId, courseData]: [string, any]) => ({
        courseId,
        courseName: courseId.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        progress: courseData.progress ? (courseData.progress.filter((p: string) => p === 'completed').length / courseData.progress.length) * 100 : 0,
        score: courseData.finalExam?.score || 0,
        completed: courseData.progress ? courseData.progress.every((p: string) => p === 'completed') : false,
        completedDate: courseData.finalExam?.submittedAt,
        lessonsCompleted: courseData.progress ? courseData.progress.filter((p: string) => p === 'completed').length : 0,
        totalLessons: courseData.progress?.length || 0,
        quizzesPassed: courseData.finalExam?.passed ? 1 : 0,
        totalQuizzes: courseData.finalExam?.taken ? 1 : 0
      }));
      
      return {
        walletAddress,
        displayName: profile.displayName || `User ${walletAddress.slice(0, 6)}...`,
        rank: 0, // Will be calculated by sorting
        totalScore: 0, // Will be calculated
        coursesCompleted: completedCourses,
        totalLessons,
        totalQuizzes,
        averageQuizScore,
        badgesEarned: 0, // Would be calculated based on achievements
        joinDate: profile.createdAt || new Date().toISOString(),
        lastActive: profile.lastActive || new Date().toISOString(),
        squad: profile.squad || 'Unassigned',
        achievements: [], // Would be calculated based on user actions
        courseProgress
      };
    });
  } catch (error) {
    console.error('Error parsing leaderboard data:', error);
    return [];
  }
};

// Helper function to calculate user score based on performance
export const calculateUserScore = (user: LeaderboardUser): number => {
  let score = 0;
  
  // Base points for completed courses
  score += user.coursesCompleted * 300;
  
  // Points for lessons completed
  score += user.totalLessons * 50;
  
  // Points for quiz performance
  score += user.totalQuizzes * 100;
  score += Math.round(user.averageQuizScore * 10);
  
  // Points for badges
  score += user.badgesEarned * 150;
  
  // Points for achievements
  score += user.achievements.reduce((acc, achievement) => acc + achievement.points, 0);
  
  // Bonus for consistency (days since joining)
  const daysSinceJoining = Math.floor((Date.now() - new Date(user.joinDate).getTime()) / (1000 * 60 * 60 * 24));
  score += Math.min(daysSinceJoining * 5, 500); // Max 500 points for consistency
  
  return score;
};

// Helper function to get user rank
export const getUserRank = (walletAddress: string): number => {
  const users = getRealLeaderboardData();
  
  // Calculate scores for all users
  const usersWithScores = users.map(user => ({
    ...user,
    totalScore: calculateUserScore(user)
  }));
  
  // Sort by score (descending)
  usersWithScores.sort((a, b) => b.totalScore - a.totalScore);
  
  // Find user and return rank
  const userIndex = usersWithScores.findIndex(u => u.walletAddress === walletAddress);
  return userIndex !== -1 ? userIndex + 1 : -1;
};

// Helper function to get user score
export const getUserScore = (walletAddress: string): number => {
  const users = getRealLeaderboardData();
  const user = users.find(u => u.walletAddress === walletAddress);
  return user ? calculateUserScore(user) : 0;
};

// Helper function to get top 20 users
export const getTop20Users = (): LeaderboardUser[] => {
  const users = getRealLeaderboardData();
  
  // Calculate scores for all users
  const usersWithScores = users.map(user => ({
    ...user,
    totalScore: calculateUserScore(user)
  }));
  
  // Sort by score (descending) and assign ranks
  usersWithScores.sort((a, b) => b.totalScore - a.totalScore);
  
  return usersWithScores.slice(0, 20).map((user, index) => ({
    ...user,
    rank: index + 1
  }));
};

// Helper function to update user progress (for when courses are completed)
export const updateUserProgress = (
  walletAddress: string, 
  courseId: string, 
  progress: number, 
  score: number,
  completed: boolean
): void => {
  const userIndex = getRealLeaderboardData().findIndex(u => u.walletAddress === walletAddress);
  
  if (userIndex !== -1) {
    const user = getRealLeaderboardData()[userIndex];
    const courseIndex = user.courseProgress.findIndex(c => c.courseId === courseId);
    
    if (courseIndex !== -1) {
      user.courseProgress[courseIndex] = {
        ...user.courseProgress[courseIndex],
        progress,
        score,
        completed,
        completedDate: completed ? new Date().toISOString() : undefined
      };
      
      // Recalculate user stats
      user.coursesCompleted = user.courseProgress.filter(c => c.completed).length;
      user.totalLessons = user.courseProgress.reduce((acc, c) => acc + c.lessonsCompleted, 0);
      user.totalQuizzes = user.courseProgress.reduce((acc, c) => acc + c.quizzesPassed, 0);
      user.averageQuizScore = user.courseProgress
        .filter(c => c.score > 0)
        .reduce((acc, c) => acc + c.score, 0) / Math.max(user.courseProgress.filter(c => c.score > 0).length, 1);
      
      // Recalculate total score
      user.totalScore = calculateUserScore(user);
      
      // Update last active
      user.lastActive = new Date().toISOString();
    }
  }
}; 