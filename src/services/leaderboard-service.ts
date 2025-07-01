import { LeaderboardUser, updateUserProgress, calculateUserScore } from '@/lib/leaderboardData';

export interface UserProgressUpdate {
  walletAddress: string;
  courseId: string;
  progress: number;
  score: number;
  completed: boolean;
  lessonsCompleted?: number;
  totalLessons?: number;
  quizzesPassed?: number;
  totalQuizzes?: number;
}

export interface AchievementEarned {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
}

export class LeaderboardService {
  private static instance: LeaderboardService;
  private userProgress: Map<string, any> = new Map();

  static getInstance(): LeaderboardService {
    if (!LeaderboardService.instance) {
      LeaderboardService.instance = new LeaderboardService();
    }
    return LeaderboardService.instance;
  }

  // Update user progress when they complete lessons or quizzes
  updateProgress(update: UserProgressUpdate): void {
    try {
      // Update the leaderboard data
      updateUserProgress(
        update.walletAddress,
        update.courseId,
        update.progress,
        update.score,
        update.completed
      );

      // Store in local storage for persistence
      this.storeUserProgress(update.walletAddress, update);

      // Trigger any real-time updates (in a real app, this would emit to other clients)
      this.notifyProgressUpdate(update);

      console.log(`Progress updated for ${update.walletAddress} in course ${update.courseId}`);
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  }

  // Check if user earned any achievements
  checkAchievements(walletAddress: string): AchievementEarned[] {
    const userProgress = this.getUserProgress(walletAddress);
    const achievements: AchievementEarned[] = [];

    // Check for first course completion
    const completedCourses = userProgress.filter((p: any) => p.completed);
    if (completedCourses.length === 1) {
      achievements.push({
        id: 'first-course',
        name: 'First Steps',
        description: 'Completed your first course',
        icon: '🎯',
        points: 100
      });
    }

    // Check for perfect score
    const perfectScores = userProgress.filter((p: any) => p.score === 100);
    if (perfectScores.length > 0) {
      achievements.push({
        id: 'perfect-score',
        name: 'Perfect Score',
        description: 'Achieved 100% on a quiz',
        icon: '⭐',
        points: 200
      });
    }

    // Check for speed learner (3 courses in a week)
    const recentCompletions = completedCourses.filter((p: any) => {
      const completionDate = new Date(p.completedDate);
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return completionDate > oneWeekAgo;
    });
    if (recentCompletions.length >= 3) {
      achievements.push({
        id: 'speed-learner',
        name: 'Speed Learner',
        description: 'Completed 3 courses in one week',
        icon: '⚡',
        points: 300
      });
    }

    // Check for consistency (30 consecutive days)
    const lastActive = localStorage.getItem(`lastActive_${walletAddress}`);
    if (lastActive) {
      const lastActiveDate = new Date(lastActive);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      if (lastActiveDate > thirtyDaysAgo) {
        achievements.push({
          id: 'consistency',
          name: 'Consistency King',
          description: 'Logged in for 30 consecutive days',
          icon: '🔥',
          points: 250
        });
      }
    }

    return achievements;
  }

  // Get user's current progress
  getUserProgress(walletAddress: string): any[] {
    const stored = localStorage.getItem(`userProgress_${walletAddress}`);
    return stored ? JSON.parse(stored) : [];
  }

  // Store user progress in localStorage
  private storeUserProgress(walletAddress: string, update: UserProgressUpdate): void {
    const existing = this.getUserProgress(walletAddress);
    const updated = existing.map((p: any) => 
      p.courseId === update.courseId ? { ...p, ...update } : p
    );
    
    // Add new course if it doesn't exist
    if (!existing.find((p: any) => p.courseId === update.courseId)) {
      updated.push(update);
    }

    localStorage.setItem(`userProgress_${walletAddress}`, JSON.stringify(updated));
    
    // Update last active timestamp
    localStorage.setItem(`lastActive_${walletAddress}`, new Date().toISOString());
  }

  // Get user's current rank
  getUserRank(walletAddress: string): number {
    // In a real app, this would query the database
    // For now, we'll use the mock data
    const { getUserRank } = require('@/lib/leaderboardData');
    return getUserRank(walletAddress);
  }

  // Get user's total score
  getUserScore(walletAddress: string): number {
    const userProgress = this.getUserProgress(walletAddress);
    let score = 0;

    // Calculate score based on progress
    userProgress.forEach((course: any) => {
      if (course.completed) {
        score += 300; // Base points for completion
        score += course.score * 2; // Points based on quiz score
      }
      score += course.lessonsCompleted * 50; // Points for lessons
      score += course.quizzesPassed * 100; // Points for quizzes
    });

    // Add achievement points
    const achievements = this.checkAchievements(walletAddress);
    score += achievements.reduce((acc, achievement) => acc + achievement.points, 0);

    return score;
  }

  // Initialize user in leaderboard if they don't exist
  initializeUser(walletAddress: string, displayName: string): void {
    const existingProgress = this.getUserProgress(walletAddress);
    if (existingProgress.length === 0) {
      // Create initial user record
      const initialProgress = {
        walletAddress,
        displayName,
        joinDate: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        courses: []
      };
      
      localStorage.setItem(`userProgress_${walletAddress}`, JSON.stringify([]));
      localStorage.setItem(`lastActive_${walletAddress}`, new Date().toISOString());
      
      console.log(`Initialized new user: ${displayName} (${walletAddress})`);
    }
  }

  // Notify other parts of the app about progress updates
  private notifyProgressUpdate(update: UserProgressUpdate): void {
    // In a real app, this would emit events or update real-time data
    // For now, we'll just log it
    console.log('Progress update notification:', update);
    
    // You could also dispatch a custom event here
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('leaderboardUpdate', {
        detail: update
      }));
    }
  }

  // Get leaderboard data for display
  getLeaderboardData(): LeaderboardUser[] {
    // In a real app, this would fetch from a database
    // For now, we'll use the mock data
    const { getTop20Users } = require('@/lib/leaderboardData');
    return getTop20Users();
  }

  // Export user data for backup
  exportUserData(walletAddress: string): any {
    const progress = this.getUserProgress(walletAddress);
    const lastActive = localStorage.getItem(`lastActive_${walletAddress}`);
    const score = this.getUserScore(walletAddress);
    const rank = this.getUserRank(walletAddress);
    const achievements = this.checkAchievements(walletAddress);

    return {
      walletAddress,
      progress,
      lastActive,
      score,
      rank,
      achievements,
      exportDate: new Date().toISOString()
    };
  }

  // Import user data from backup
  importUserData(data: any): void {
    if (data.walletAddress && data.progress) {
      localStorage.setItem(`userProgress_${data.walletAddress}`, JSON.stringify(data.progress));
      if (data.lastActive) {
        localStorage.setItem(`lastActive_${data.walletAddress}`, data.lastActive);
      }
      console.log(`Imported data for user: ${data.walletAddress}`);
    }
  }
}

// Export singleton instance
export const leaderboardService = LeaderboardService.getInstance(); 