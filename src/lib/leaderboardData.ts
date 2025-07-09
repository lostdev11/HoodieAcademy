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

// Real data functions - get data from localStorage
export const getRealLeaderboardData = (): LeaderboardUser[] => {
  const userProgress = localStorage.getItem('userProgress');
  const userProfiles = localStorage.getItem('userProfiles');
  
  if (!userProgress) return [];
  
  try {
    const progress = JSON.parse(userProgress);
    const profiles = userProfiles ? JSON.parse(userProfiles) : {};
    
    const users = Object.entries(progress).map(([walletAddress, userData]: [string, any]) => {
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
        totalQuizzes: courseData.finalExam?.taken ? 1 : 0,
        started: courseData.progress && courseData.progress.length > 0 // User has started if they have any progress
      }));
      
      // Calculate completion-based metrics
      const coursesStarted = courseProgress.filter(course => course.started).length;
      const totalLessonsCompleted = courseProgress.reduce((total, course) => total + course.lessonsCompleted, 0);
      const totalLessonsAvailable = courseProgress.reduce((total, course) => total + course.totalLessons, 0);
      
      // Calculate overall completion percentage
      const overallCompletionPercentage = totalLessonsAvailable > 0 
        ? (totalLessonsCompleted / totalLessonsAvailable) * 100 
        : 0;
      
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
        courseProgress,
        coursesStarted,
        overallCompletionPercentage,
        totalLessonsCompleted,
        totalLessonsAvailable
      };
    });
    
    // Filter to only include users who have started at least one course
    return users.filter(user => user.coursesStarted > 0);
  } catch (error) {
    console.error('Error parsing leaderboard data:', error);
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
export const getUserRank = (walletAddress: string): number => {
  const users = getRealLeaderboardData();
  
  // Sort by completion percentage (descending)
  users.sort((a, b) => b.overallCompletionPercentage - a.overallCompletionPercentage);
  
  // Find user and return rank
  const userIndex = users.findIndex(u => u.walletAddress === walletAddress);
  return userIndex !== -1 ? userIndex + 1 : -1;
};

// Helper function to get user score
export const getUserScore = (walletAddress: string): number => {
  const users = getRealLeaderboardData();
  const user = users.find(u => u.walletAddress === walletAddress);
  return user ? calculateUserScore(user) : 0;
};

// Helper function to get top 20 users based on completion percentage
export const getTop20Users = (): LeaderboardUser[] => {
  const users = getRealLeaderboardData();
  
  // Sort by completion percentage (descending) and assign ranks
  users.sort((a, b) => b.overallCompletionPercentage - a.overallCompletionPercentage);
  
  return users.slice(0, 20).map((user, index) => ({
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