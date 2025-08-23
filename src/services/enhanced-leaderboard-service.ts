import { supabase } from '@/lib/supabase';

export interface LeaderboardUser {
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
  started: boolean;
}

export interface LeaderboardStats {
  totalParticipants: number;
  avgCompletion: number;
  activeLearners: number;
  userRank: number;
}

// Constants for 100-level courses
const TOTAL_100_LEVEL_COURSES = 10; // Adjust based on your actual 100-level courses
const COURSE_LEVELS = {
  'wallet-wizardry': 100,
  'nft-mastery': 100,
  'meme-coin-mania': 100,
  'community-strategy': 100,
  'sns': 100,
  'technical-analysis': 100,
  'cybersecurity-wallet-practices': 100,
  'ai-automation-curriculum': 100,
  'lore-narrative-crafting': 100,
  'nft-trading-psychology': 100
};

export class EnhancedLeaderboardService {
  private static instance: EnhancedLeaderboardService;

  static getInstance(): EnhancedLeaderboardService {
    if (!EnhancedLeaderboardService.instance) {
      EnhancedLeaderboardService.instance = new EnhancedLeaderboardService();
    }
    return EnhancedLeaderboardService.instance;
  }

  // Get real-time leaderboard data from Supabase (optimized RPC version)
  async getLeaderboard(): Promise<LeaderboardUser[]> {
    try {
      console.log('🔄 Fetching leaderboard data from Supabase RPC...');

      // Try to use the optimized RPC function first
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_leaderboard_rankings');

      if (!rpcError && rpcData) {
        console.log(`📊 RPC returned ${rpcData.length} users`);
        
        // Transform RPC data to LeaderboardUser format
        const leaderboardUsers: LeaderboardUser[] = rpcData.map((user: any) => ({
          walletAddress: user.wallet_id,
          displayName: user.display_name || `@${user.wallet_id.slice(0, 6)}...`,
          squad: user.squad || 'Unassigned',
          rank: user.rank,
          level: user.level,
          completion: user.completion,
          courses: user.courses,
          quizzes: user.quizzes,
          badges: user.badges,
          lastActive: user.last_active,
          joinDate: user.created_at,
          achievements: [], // Will be populated from badges table
          courseProgress: [] // Simplified for RPC version
        }));

        console.log(`🏆 Leaderboard generated with ${leaderboardUsers.length} users (RPC)`);
        return leaderboardUsers;
      }

      // Fallback to manual query if RPC is not available
      console.log('🔄 Falling back to manual query...');
      return await this.getLeaderboardManual();
    } catch (error) {
      console.error('❌ Error getting leaderboard:', error);
      return [];
    }
  }

  // Manual query fallback
  private async getLeaderboardManual(): Promise<LeaderboardUser[]> {
    try {
      // Query users with all related data
      const { data: users, error } = await supabase
        .from('users')
        .select(`
          wallet_id,
          display_name,
          squad,
          created_at,
          last_active,
          course_completions:course_completions(wallet_id, course_id, completed_at),
          quiz_results:quiz_results(score, passed),
          badges:badges(badge_id)
        `)
        .not('wallet_id', 'is', null);

      if (error) {
        console.error('❌ Error fetching users:', error);
        return [];
      }

      console.log(`📊 Found ${users?.length || 0} users`);

      // Transform data and compute derived fields
      const leaderboardUsers: LeaderboardUser[] = (users || [])
        .filter((user: any) => user.wallet_id)
        .map((user: any) => {
          // Count completed courses
          const coursesCompleted = user.course_completions?.length || 0;

          // Filter 100-level courses
          const course100s = (user.course_completions || []).filter((c: any) => {
            const courseId = c.course_id as keyof typeof COURSE_LEVELS;
            const courseLevel = COURSE_LEVELS[courseId] || 0;
            return courseLevel >= 100 && courseLevel < 200;
          });

          // Calculate completion percentage
          const completionPct = Math.round((course100s.length / TOTAL_100_LEVEL_COURSES) * 100);

          // Count passed quizzes
          const quizzesPassed = (user.quiz_results || []).filter((q: any) => q.passed).length;

          // Count badges
          const badgeCount = user.badges?.length || 0;

          // Calculate level based on 100-level course completions
          const level = 100 + course100s.length;

          // Create course progress array
          const courseProgress = (user.course_completions || []).map((c: any) => ({
            courseId: c.course_id,
            courseName: this.getCourseName(c.course_id),
            progress: 100, // Completed courses have 100% progress
            score: 0, // Will be updated from quiz results
            completed: true,
            completedDate: c.completed_at,
            lessonsCompleted: 1, // Simplified for now
            totalLessons: 1,
            quizzesPassed: 1,
            totalQuizzes: 1,
            started: true
          }));

          return {
            walletAddress: user.wallet_id,
            displayName: user.display_name || `@${user.wallet_id.slice(0, 6)}...`,
            squad: user.squad || 'Unassigned',
            rank: 0, // Will be calculated after sorting
            level,
            completion: completionPct,
            courses: coursesCompleted,
            quizzes: quizzesPassed,
            badges: badgeCount,
            lastActive: user.last_active || user.created_at,
            joinDate: user.created_at,
            achievements: [], // Will be populated from badges table
            courseProgress
          };
        })
        .filter((user: any) => user.completion > 0) // Only include users with some completion
        .sort((a: any, b: any) => b.completion - a.completion) // Sort by completion percentage
        .map((user: any, index: number) => ({
          ...user,
          rank: index + 1
        }));

      console.log(`🏆 Leaderboard generated with ${leaderboardUsers.length} users (manual)`);
      return leaderboardUsers;
    } catch (error) {
      console.error('❌ Error in manual leaderboard query:', error);
      return [];
    }
  }

  // Get leaderboard statistics
  async getLeaderboardStats(currentUserWallet?: string): Promise<LeaderboardStats> {
    try {
      const users = await this.getLeaderboard();
      
      const totalParticipants = users.length;
      const avgCompletion = users.length > 0 
        ? Math.round(users.reduce((sum, user) => sum + user.completion, 0) / users.length)
        : 0;
      
      // Count active learners (logged in within last 7 days)
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const activeLearners = users.filter(user => 
        new Date(user.lastActive) > oneWeekAgo
      ).length;
      
      // Get current user's rank
      let userRank = -1;
      if (currentUserWallet) {
        const userIndex = users.findIndex(user => user.walletAddress === currentUserWallet);
        userRank = userIndex !== -1 ? userIndex + 1 : -1;
      }
      
      return {
        totalParticipants,
        avgCompletion,
        activeLearners,
        userRank
      };
    } catch (error) {
      console.error('❌ Error getting leaderboard stats:', error);
      return {
        totalParticipants: 0,
        avgCompletion: 0,
        activeLearners: 0,
        userRank: -1
      };
    }
  }

  // Get user's current rank
  async getUserRank(walletAddress: string): Promise<number> {
    try {
      const users = await this.getLeaderboard();
      const userIndex = users.findIndex(user => user.walletAddress === walletAddress);
      return userIndex !== -1 ? userIndex + 1 : -1;
    } catch (error) {
      console.error('❌ Error getting user rank:', error);
      return -1;
    }
  }

  // Get user's detailed stats
  async getUserStats(walletAddress: string): Promise<LeaderboardUser | null> {
    try {
      const users = await this.getLeaderboard();
      return users.find(user => user.walletAddress === walletAddress) || null;
    } catch (error) {
      console.error('❌ Error getting user stats:', error);
      return null;
    }
  }

  // Filter leaderboard by squad
  async getLeaderboardBySquad(squad: string): Promise<LeaderboardUser[]> {
    try {
      const users = await this.getLeaderboard();
      return squad === 'all' 
        ? users 
        : users.filter(user => user.squad.toLowerCase() === squad.toLowerCase());
    } catch (error) {
      console.error('❌ Error filtering by squad:', error);
      return [];
    }
  }

  // Search leaderboard by name, wallet, or squad
  async searchLeaderboard(searchTerm: string): Promise<LeaderboardUser[]> {
    try {
      const users = await this.getLeaderboard();
      const term = searchTerm.toLowerCase();
      
      return users.filter(user => 
        user.displayName.toLowerCase().includes(term) ||
        user.walletAddress.toLowerCase().includes(term) ||
        user.squad.toLowerCase().includes(term)
      );
    } catch (error) {
      console.error('❌ Error searching leaderboard:', error);
      return [];
    }
  }

  // Sort leaderboard by different criteria
  async sortLeaderboard(sortBy: 'completion' | 'courses' | 'quizzes' | 'badges' | 'level'): Promise<LeaderboardUser[]> {
    try {
      const users = await this.getLeaderboard();
      
      const sortedUsers = [...users].sort((a, b) => {
        switch (sortBy) {
          case 'completion':
            return b.completion - a.completion;
          case 'courses':
            return b.courses - a.courses;
          case 'quizzes':
            return b.quizzes - a.quizzes;
          case 'badges':
            return b.badges - a.badges;
          case 'level':
            return b.level - a.level;
          default:
            return b.completion - a.completion;
        }
      });
      
      // Reassign ranks after sorting
      return sortedUsers.map((user, index) => ({
        ...user,
        rank: index + 1
      }));
    } catch (error) {
      console.error('❌ Error sorting leaderboard:', error);
      return [];
    }
  }

  // Get this week's top climber (user with highest % increase)
  async getWeeklyTopClimber(): Promise<LeaderboardUser | null> {
    try {
      // This would require tracking historical data
      // For now, return the user with highest completion
      const users = await this.getLeaderboard();
      return users.length > 0 ? users[0] : null;
    } catch (error) {
      console.error('❌ Error getting weekly top climber:', error);
      return null;
    }
  }

  // Get course name by ID
  private getCourseName(courseId: string): string {
    const courseNames: Record<string, string> = {
      'wallet-wizardry': 'Wallet Wizardry',
      'nft-mastery': 'NFT Mastery',
      'meme-coin-mania': 'Meme Coin Mania',
      'community-strategy': 'Community Strategy',
      'sns': 'SNS Simplified',
      'technical-analysis': 'Technical Analysis Tactics',
      'cybersecurity-wallet-practices': 'Cybersecurity & Wallet Practices',
      'ai-automation-curriculum': 'AI Automation Curriculum',
      'lore-narrative-crafting': 'Lore & Narrative Crafting',
      'nft-trading-psychology': 'NFT Trading Psychology'
    };
    return courseNames[courseId] || courseId.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  // Record course completion
  async recordCourseCompletion(walletAddress: string, courseId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('course_completions')
        .upsert({
          wallet_id: walletAddress,
          course_id: courseId,
          completed_at: new Date().toISOString()
        }, {
          onConflict: 'wallet_id,course_id'
        });

      if (error) {
        console.error('❌ Error recording course completion:', error);
        throw error;
      }

      console.log(`✅ Course completion recorded for ${walletAddress} - ${courseId}`);
    } catch (error) {
      console.error('❌ Error recording course completion:', error);
      throw error;
    }
  }

  // Record quiz result
  async recordQuizResult(walletAddress: string, quizId: string, score: number, passed: boolean): Promise<void> {
    try {
      const { error } = await supabase
        .from('quiz_results')
        .upsert({
          wallet_id: walletAddress,
          quiz_id: quizId,
          score,
          passed,
          completed_at: new Date().toISOString()
        }, {
          onConflict: 'wallet_id,quiz_id'
        });

      if (error) {
        console.error('❌ Error recording quiz result:', error);
        throw error;
      }

      console.log(`✅ Quiz result recorded for ${walletAddress} - ${quizId}`);
    } catch (error) {
      console.error('❌ Error recording quiz result:', error);
      throw error;
    }
  }

  // Record badge earned
  async recordBadge(walletAddress: string, badgeId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('badges')
        .upsert({
          wallet_id: walletAddress,
          badge_id: badgeId,
          earned_at: new Date().toISOString()
        }, {
          onConflict: 'wallet_id,badge_id'
        });

      if (error) {
        console.error('❌ Error recording badge:', error);
        throw error;
      }

      console.log(`✅ Badge recorded for ${walletAddress} - ${badgeId}`);
    } catch (error) {
      console.error('❌ Error recording badge:', error);
      throw error;
    }
  }

  // Update user's last active
  async updateUserActivity(walletAddress: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('users')
        .update({ last_active: new Date().toISOString() })
        .eq('wallet_id', walletAddress);

      if (error) {
        console.error('❌ Error updating user activity:', error);
        throw error;
      }

      console.log(`✅ User activity updated for ${walletAddress}`);
    } catch (error) {
      console.error('❌ Error updating user activity:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const enhancedLeaderboardService = EnhancedLeaderboardService.getInstance(); 