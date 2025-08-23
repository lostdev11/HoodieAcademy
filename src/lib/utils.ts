import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { LeaderboardService } from "@/services/leaderboard-service"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Local helper — avoids extra imports and satisfies TS
export const formatWalletAddress = (
  addr?: string | null,
  opts: { prefix?: number; suffix?: number } = {}
): string => {
  if (!addr) return '';
  const { prefix = 4, suffix = 4 } = opts;
  return addr.length <= prefix + suffix
    ? addr
    : `${addr.slice(0, prefix)}…${addr.slice(-suffix)}`;
};

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
export const getUserRank = async (walletAddress: string): Promise<number> => {
  return await leaderboardService.getUserRank(walletAddress);
};

// Get user's current score
export const getUserScore = async (walletAddress: string): Promise<number> => {
  return await leaderboardService.getUserScore(walletAddress);
};

// Check if current user is admin (using database check)
export async function isCurrentUserAdmin(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  
  try {
    const connectedWallet = getConnectedWallet();
    if (!connectedWallet) return false;
    
    // Import here to avoid circular dependencies
    const { fetchUserByWallet } = await import('@/lib/supabase');
    const user = await fetchUserByWallet(connectedWallet);
    
    return user?.is_admin === true;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

// Check if current user is admin (synchronous version for components that need it)
export function isCurrentUserAdminSync(): boolean {
  if (typeof window === 'undefined') return false;
  
  const adminSession = sessionStorage.getItem('adminAuthenticated');
  return adminSession === 'true';
}

// Set admin authentication in session
export function setAdminAuthenticated(authenticated: boolean): void {
  if (typeof window === 'undefined') return;
  
  const connectedWallet = getConnectedWallet();
  
  if (authenticated) {
    sessionStorage.setItem('adminAuthenticated', 'true');
  } else {
    sessionStorage.removeItem('adminAuthenticated');
  }
}

// Force remove admin access for demo wallet
export function removeDemoWalletAdminAccess(): void {
  if (typeof window === 'undefined') return;
  
  const connectedWallet = getConnectedWallet();
  // Removed DEMO_WALLET logic as it is no longer used
}

// Get connected wallet address from database (for other features)
export function getConnectedWallet(): string | null {
  if (typeof window === 'undefined') return null;
  
  // Get wallet from localStorage (this is the current implementation)
  const walletAddress = localStorage.getItem('walletAddress');
  return walletAddress;
}

// Events and Announcements utilities - now database-driven
export const EVENTS_KEY = 'events';
export const ANNOUNCEMENTS_KEY = 'announcements';

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time?: string;
  type: string;
  location?: string;
  maxParticipants?: number;
  currentParticipants?: number;
  isActive: boolean;
  createdBy: string;
  created_at: string;
  updated_at?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type?: string;
  priority?: string;
  starts_at?: string;
  ends_at?: string;
  is_published?: boolean;
  isActive?: boolean;
  createdBy?: string;
  created_at: string;
  updated_at?: string;
}

// Get all events - now database-driven
export const getEvents = async (): Promise<Event[]> => {
  try {
    // This should fetch from your database instead of localStorage
    // For now, return empty array as we're removing localStorage
    return [];
  } catch (error) {
    console.error('Error loading events:', error);
    return [];
  }
};

// Get upcoming events (within next 30 days)
export const getUpcomingEvents = async (): Promise<Event[]> => {
  const events = await getEvents();
  const today = new Date();
  const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
  
  return events.filter((event) => {
    const eventDate = new Date(event.date);
    return eventDate >= today && eventDate <= thirtyDaysFromNow;
  });
};

// Course completion utilities - now database-driven
export const getCompletedCoursesCount = async (): Promise<number> => {
  // This should fetch from your database instead of localStorage
  // For now, return 0 as we're removing localStorage
  return 0;
};

export const getTotalCoursesCount = (): number => {
  return 6; // Total number of courses
};

export async function getUserSquad(): Promise<{ squad: string | null; lockExpired: boolean; lockEndDate?: string }> {
  // This should fetch from your database instead of localStorage
  // For now, return default values as we're removing localStorage
  return { squad: null, lockExpired: false };
}

export function isSquadAssignmentRequired(): boolean {
  // This should check the database instead of localStorage
  // For now, return true as we're removing localStorage
  return true;
}

export async function getSquadLockStatus(): Promise<{ isLocked: boolean; daysRemaining: number; lockEndDate?: string }> {
  // This should fetch from your database instead of localStorage
  // For now, return default values as we're removing localStorage
  return { isLocked: false, daysRemaining: 0 };
}
