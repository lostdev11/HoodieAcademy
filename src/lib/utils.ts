import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { LeaderboardService } from "@/services/leaderboard-service"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Leaderboard integration utilities
export const leaderboardService = LeaderboardService.getInstance();

// Initialize user in leaderboard system
export const initializeUserInLeaderboard = (walletAddress: string, displayName: string, squad?: string) => {
  leaderboardService.initializeUser(walletAddress, displayName, squad);
};

// Update score when lesson is completed
export const updateScoreForLessonCompletion = (walletAddress: string, courseId: string, lessonIndex: number, totalLessons: number) => {
  leaderboardService.updateUserScore(walletAddress, {
    lessonCompleted: true
  });
  
  // Update course progress
  const progress = Math.round(((lessonIndex + 1) / totalLessons) * 100);
  const isCompleted = progress === 100;
  
  leaderboardService.updateProgress({
    walletAddress,
    courseId,
    progress,
    score: 0, // Will be updated when quiz is completed
    completed: isCompleted,
    lessonsCompleted: lessonIndex + 1,
    totalLessons,
    quizzesPassed: 0,
    totalQuizzes: 0
  });
};

// Update score when quiz is completed
export const updateScoreForQuizCompletion = (walletAddress: string, courseId: string, quizScore: number, totalQuestions: number, lessonsCompleted: number, totalLessons: number) => {
  const percentage = Math.round((quizScore / totalQuestions) * 100);
  
  leaderboardService.updateUserScore(walletAddress, {
    quizScore: percentage
  });
  
  // Update course progress
  const progress = Math.round((lessonsCompleted / totalLessons) * 100);
  const isCompleted = progress === 100;
  
  leaderboardService.updateProgress({
    walletAddress,
    courseId,
    progress,
    score: percentage,
    completed: isCompleted,
    lessonsCompleted,
    totalLessons,
    quizzesPassed: 1,
    totalQuizzes: 1
  });
};

// Update score when course is completed
export const updateScoreForCourseCompletion = (walletAddress: string, courseId: string, finalScore: number) => {
  leaderboardService.updateUserScore(walletAddress, {
    courseCompleted: true
  });
  
  leaderboardService.updateProgress({
    walletAddress,
    courseId,
    progress: 100,
    score: finalScore,
    completed: true,
    lessonsCompleted: 0, // Will be calculated from course data
    totalLessons: 0,
    quizzesPassed: 0,
    totalQuizzes: 0
  });
};

// Update score when badge is earned
export const updateScoreForBadgeEarned = (walletAddress: string) => {
  leaderboardService.updateUserScore(walletAddress, {
    badgeEarned: true
  });
};

// Get user's current rank
export const getUserRank = (walletAddress: string): number => {
  return leaderboardService.getUserRank(walletAddress);
};

// Get user's current score
export const getUserScore = (walletAddress: string): number => {
  return leaderboardService.getUserScore(walletAddress);
};

// Admin password - in production, this would be stored securely and hashed
export const ADMIN_PASSWORD = "darkhoodie2024";

// Check if a password is correct for admin access
export function isAdminPassword(password: string): boolean {
  return password === ADMIN_PASSWORD;
}

// Check if current user is admin (using session storage)
export function isCurrentUserAdmin(): boolean {
  if (typeof window === 'undefined') return false;
  
  const adminSession = sessionStorage.getItem('adminAuthenticated');
  return adminSession === 'true';
}

// Set admin authentication in session
export function setAdminAuthenticated(authenticated: boolean): void {
  if (typeof window === 'undefined') return;
  
  if (authenticated) {
    sessionStorage.setItem('adminAuthenticated', 'true');
  } else {
    sessionStorage.removeItem('adminAuthenticated');
  }
}

// Get connected wallet address from localStorage (for other features)
export function getConnectedWallet(): string | null {
  if (typeof window === 'undefined') return null;
  
  return localStorage.getItem('walletAddress') || localStorage.getItem('connectedWallet');
}
