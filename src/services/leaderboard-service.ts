import { LeaderboardUser, Achievement, CourseProgress } from '@/lib/leaderboardData';

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

export interface UserProgress {
  walletAddress: string;
  displayName: string;
  joinDate: string;
  lastActive: string;
  totalScore: number;
  coursesCompleted: number;
  totalLessons: number;
  totalQuizzes: number;
  averageQuizScore: number;
  badgesEarned: number;
  squad?: string;
  achievements: Achievement[];
  courseProgress: CourseProgress[];
  // New fields for completion-based ranking
  coursesStarted: number;
  overallCompletionPercentage: number;
  totalLessonsCompleted: number;
  totalLessonsAvailable: number;
}

export class LeaderboardService {
  private static instance: LeaderboardService;
  private static readonly LEADERBOARD_KEY = 'hoodieAcademyLeaderboard';
  private static readonly USER_PROGRESS_PREFIX = 'userProgress_';
  private static readonly LAST_ACTIVE_PREFIX = 'lastActive_';

  static getInstance(): LeaderboardService {
    if (!LeaderboardService.instance) {
      LeaderboardService.instance = new LeaderboardService();
    }
    return LeaderboardService.instance;
  }

  // Initialize user in leaderboard system
  initializeUser(walletAddress: string, displayName: string, squad?: string): void {
    const existingUser = this.getUserProgress(walletAddress);
    if (!existingUser) {
      const newUser: UserProgress = {
        walletAddress,
        displayName,
        joinDate: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        totalScore: 0,
        coursesCompleted: 0,
        totalLessons: 0,
        totalQuizzes: 0,
        averageQuizScore: 0,
        badgesEarned: 0,
        squad,
        achievements: [],
        courseProgress: [],
        coursesStarted: 0,
        overallCompletionPercentage: 0,
        totalLessonsCompleted: 0,
        totalLessonsAvailable: 0
      };
      
      this.saveUserProgress(walletAddress, newUser);
      this.updateLeaderboard();
      console.log(`Initialized new user: ${displayName} (${walletAddress})`);
    }
  }

  // Update user progress for a specific course
  async updateProgress(update: UserProgressUpdate): Promise<void> {
    try {
      const user = await this.getUserProgress(update.walletAddress);
      if (!user) {
        console.warn(`User ${update.walletAddress} not found in leaderboard system`);
        return;
      }

      // Update course progress
      const courseIndex = user.courseProgress.findIndex(c => c.courseId === update.courseId);
      const courseProgress: CourseProgress = {
        courseId: update.courseId,
        courseName: this.getCourseName(update.courseId),
        progress: update.progress,
        score: update.score,
        completed: update.completed,
        completedDate: update.completed ? new Date().toISOString() : undefined,
        lessonsCompleted: update.lessonsCompleted || 0,
        totalLessons: update.totalLessons || 0,
        quizzesPassed: update.quizzesPassed || 0,
        totalQuizzes: update.totalQuizzes || 0,
        started: true // User has started if they're updating progress
      };

      if (courseIndex !== -1) {
        user.courseProgress[courseIndex] = courseProgress;
      } else {
        user.courseProgress.push(courseProgress);
      }

      // Recalculate user stats
      this.recalculateUserStats(user);
      
      // Check for new achievements
      const newAchievements = this.checkAchievements(user);
      user.achievements = [...user.achievements, ...newAchievements];

      // Update last active
      user.lastActive = new Date().toISOString();

      // Save updated user data
      this.saveUserProgress(update.walletAddress, user);
      this.updateLeaderboard();

      console.log(`Progress updated for ${update.walletAddress} in course ${update.courseId}`);
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  }

  // Update user score for specific actions
  async updateUserScore(walletAddress: string, scoreUpdate: {
    courseCompleted?: boolean;
    lessonCompleted?: boolean;
    quizScore?: number;
    badgeEarned?: boolean;
    achievement?: AchievementEarned;
  }): Promise<void> {
    const user = await this.getUserProgress(walletAddress);
    if (!user) return;

    let scoreChange = 0;

    if (scoreUpdate.courseCompleted) {
      scoreChange += 300; // Course completion: 300 points
    }
    
    if (scoreUpdate.lessonCompleted) {
      scoreChange += 50; // Lesson progress: 50 points
    }
    
    if (scoreUpdate.quizScore !== undefined) {
      scoreChange += 100 + (scoreUpdate.quizScore * 2); // Quiz performance: 100 + (score × 2)
    }
    
    if (scoreUpdate.badgeEarned) {
      scoreChange += 150; // Badge system: 150 points per NFT badge
    }
    
    if (scoreUpdate.achievement) {
      scoreChange += scoreUpdate.achievement.points; // Achievement points
    }

    user.totalScore += scoreChange;
    user.lastActive = new Date().toISOString();

    this.saveUserProgress(walletAddress, user);
    this.updateLeaderboard();
  }

  // Get real-time leaderboard data
  async getLeaderboard(): Promise<LeaderboardUser[]> {
    try {
      // TODO: Fetch from database instead of localStorage
      // This should fetch leaderboard data from your database
      console.log('Fetching leaderboard from database...');
      
      // For now, return empty array as we're removing localStorage
      return [];
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      return [];
    }
  }

  // Calculate completion percentage for a user
  private calculateCompletionPercentage(user: UserProgress): number {
    if (user.courseProgress.length === 0) return 0;
    
    const totalLessonsCompleted = user.courseProgress.reduce((total, course) => total + course.lessonsCompleted, 0);
    const totalLessonsAvailable = user.courseProgress.reduce((total, course) => total + course.totalLessons, 0);
    
    return totalLessonsAvailable > 0 ? (totalLessonsCompleted / totalLessonsAvailable) * 100 : 0;
  }

  // Get user's current rank based on completion percentage
  async getUserRank(walletAddress: string): Promise<number> {
    try {
      const leaderboard = await this.getLeaderboard();
      const userIndex = leaderboard.findIndex(user => user.walletAddress === walletAddress);
      return userIndex !== -1 ? userIndex + 1 : -1;
    } catch (error) {
      console.error('Error getting user rank:', error);
      return -1;
    }
  }

  // Get user's total score
  async getUserScore(walletAddress: string): Promise<number> {
    try {
      const user = await this.getUserProgress(walletAddress);
      return user ? user.totalScore : 0;
    } catch (error) {
      console.error('Error getting user score:', error);
      return 0;
    }
  }

  // Get user's current progress
  async getUserProgress(walletAddress: string): Promise<UserProgress | null> {
    try {
      // TODO: Fetch from database instead of localStorage
      // This should fetch user progress from your database
      console.log('Fetching user progress from database for:', walletAddress);
      
      // For now, return null as we're removing localStorage
      return null;
    } catch (error) {
      console.error('Error fetching user progress:', error);
      return null;
    }
  }

  // Check if user earned any achievements
  checkAchievements(user: UserProgress): Achievement[] {
    const newAchievements: Achievement[] = [];
    const existingAchievementIds = user.achievements.map(a => a.id);

    // Check for first course completion
    if (user.coursesCompleted === 1 && !existingAchievementIds.includes('first-course')) {
      newAchievements.push({
        id: 'first-course',
        name: 'First Steps',
        description: 'Completed your first course',
        icon: '🎯',
        earnedDate: new Date().toISOString(),
        points: 100
      });
    }

    // Check for perfect score
    const perfectScores = user.courseProgress.filter(c => c.score === 100);
    if (perfectScores.length > 0 && !existingAchievementIds.includes('perfect-score')) {
      newAchievements.push({
        id: 'perfect-score',
        name: 'Perfect Score',
        description: 'Achieved 100% on a quiz',
        icon: '⭐',
        earnedDate: new Date().toISOString(),
        points: 200
      });
    }

    // Check for speed learner (3 courses in a week)
    const recentCompletions = user.courseProgress.filter(c => {
      if (!c.completedDate) return false;
      const completionDate = new Date(c.completedDate);
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return completionDate > oneWeekAgo;
    });
    if (recentCompletions.length >= 3 && !existingAchievementIds.includes('speed-learner')) {
      newAchievements.push({
        id: 'speed-learner',
        name: 'Speed Learner',
        description: 'Completed 3 courses in one week',
        icon: '⚡',
        earnedDate: new Date().toISOString(),
        points: 300
      });
    }

    // Check for consistency (30 consecutive days)
    const lastActive = new Date(user.lastActive);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    if (lastActive > thirtyDaysAgo && !existingAchievementIds.includes('consistency')) {
      newAchievements.push({
        id: 'consistency',
        name: 'Consistency King',
        description: 'Logged in for 30 consecutive days',
        icon: '🔥',
        earnedDate: new Date().toISOString(),
        points: 250
      });
    }

    return newAchievements;
  }

  // Recalculate user statistics
  private recalculateUserStats(user: UserProgress): void {
    user.coursesCompleted = user.courseProgress.filter(c => c.completed).length;
    user.coursesStarted = user.courseProgress.filter(c => c.started).length;
    user.totalLessons = user.courseProgress.reduce((acc, c) => acc + c.lessonsCompleted, 0);
    user.totalLessonsCompleted = user.courseProgress.reduce((acc, c) => acc + c.lessonsCompleted, 0);
    user.totalLessonsAvailable = user.courseProgress.reduce((acc, c) => acc + c.totalLessons, 0);
    user.totalQuizzes = user.courseProgress.reduce((acc, c) => acc + c.quizzesPassed, 0);
    
    // Calculate overall completion percentage
    user.overallCompletionPercentage = user.totalLessonsAvailable > 0 
      ? (user.totalLessonsCompleted / user.totalLessonsAvailable) * 100 
      : 0;
    
    const quizScores = user.courseProgress.filter(c => c.score > 0).map(c => c.score);
    user.averageQuizScore = quizScores.length > 0 
      ? Math.round(quizScores.reduce((acc, score) => acc + score, 0) / quizScores.length)
      : 0;

    // Calculate total score based on completion percentage (primary factor)
    let totalScore = 0;
    
    // Base points for completion percentage (primary ranking factor)
    totalScore += Math.round(user.overallCompletionPercentage * 10); // 10 points per 1% completion
    
    // Bonus points for completed courses
    totalScore += user.coursesCompleted * 100;
    
    // Points for lessons completed
    totalScore += user.totalLessonsCompleted * 20;
    
    // Points for quiz performance
    user.courseProgress.forEach(course => {
      if (course.score > 0) {
        totalScore += 50 + (course.score * 5);
      }
    });
    
    // Badge points
    totalScore += user.badgesEarned * 150;
    
    // Achievement points
    totalScore += user.achievements.reduce((acc, achievement) => acc + achievement.points, 0);
    
    // Consistency bonus (up to 200 points for daily participation)
    const lastActive = new Date(user.lastActive);
    const daysSinceJoin = Math.floor((Date.now() - new Date(user.joinDate).getTime()) / (24 * 60 * 60 * 1000));
    const consistencyBonus = Math.min(daysSinceJoin * 2, 200);
    totalScore += consistencyBonus;

    user.totalScore = totalScore;
  }

  // Save user progress to localStorage
  private saveUserProgress(walletAddress: string, user: UserProgress): void {
    // This method is no longer needed as localStorage is removed
    // The actual saving logic would need to be implemented in a database context
    console.warn('saveUserProgress is deprecated as localStorage is removed.');
  }

  // Update the leaderboard rankings
  private updateLeaderboard(): void {
    // This method is no longer needed as localStorage is removed
    // The actual leaderboard update logic would need to be implemented in a database context
    console.warn('updateLeaderboard is deprecated as localStorage is removed.');
  }

  // Get course name by ID
  private getCourseName(courseId: string): string {
    const courseNames: Record<string, string> = {
      'wallet-wizardry': 'Wallet Wizardry',
      'nft-mastery': 'NFT Mastery',
      'meme-coin-mania': 'Meme Coin Mania',
      'community-strategy': 'Community Strategy',
      'sns': 'SNS Simplified',
      'technical-analysis': 'Technical Analysis Tactics'
    };
    return courseNames[courseId] || courseId;
  }

  // Export user data for backup
  exportUserData(walletAddress: string): any {
    // This method is no longer needed as localStorage is removed
    // The actual export logic would need to be implemented in a database context
    console.warn('exportUserData is deprecated as localStorage is removed.');
    return null;
  }

  // Import user data from backup
  importUserData(data: any): void {
    // This method is no longer needed as localStorage is removed
    // The actual import logic would need to be implemented in a database context
    console.warn('importUserData is deprecated as localStorage is removed.');
  }

  // Reset all leaderboard data (admin function)
  resetLeaderboard(): void {
    // This method is no longer needed as localStorage is removed
    // The actual reset logic would need to be implemented in a database context
    console.warn('resetLeaderboard is deprecated as localStorage is removed.');
  }

  // Badge reset methods
  resetUserBadges(walletAddress: string): void {
    // This method is no longer needed as localStorage is removed
    // The actual reset logic would need to be implemented in a database context
    console.warn('resetUserBadges is deprecated as localStorage is removed.');
  }

  resetAllBadges(): void {
    // This method is no longer needed as localStorage is removed
    // The actual reset logic would need to be implemented in a database context
    console.warn('resetAllBadges is deprecated as localStorage is removed.');
  }

  resetUserCourse(walletAddress: string, courseId: string): void {
    // This method is no longer needed as localStorage is removed
    // The actual reset logic would need to be implemented in a database context
    console.warn('resetUserCourse is deprecated as localStorage is removed.');
  }
}

// Export singleton instance
export const leaderboardService = LeaderboardService.getInstance(); 