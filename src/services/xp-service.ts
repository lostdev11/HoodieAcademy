/**
 * XP Service - Centralized XP operations for Hoodie Academy
 * 
 * This service provides a unified interface for all XP-related operations
 * including fetching, awarding, and tracking XP across the application.
 */

export interface XPData {
  walletAddress: string;
  displayName?: string;
  exists: boolean;
  totalXP: number;
  level: number;
  squad?: string;
  xpInCurrentLevel: number;
  xpToNextLevel: number;
  progressToNextLevel: number;
  createdAt?: string;
  updatedAt?: string;
  breakdown?: {
    courseXP: number;
    bountyXP: number;
    dailyLoginXP: number;
    adminAwardXP: number;
    otherXP: number;
  };
  xpHistory?: XPHistoryEntry[];
  courseCompletions?: CourseCompletion[];
  bountyCompletions?: BountyCompletion[];
  totalCoursesCompleted?: number;
  totalCourseXP?: number;
  totalBountyXP?: number;
}

export interface XPHistoryEntry {
  type: string;
  xpAmount: number;
  reason: string;
  date: string;
  metadata?: any;
}

export interface CourseCompletion {
  course_id: string;
  completed_at: string;
  xp_earned: number;
}

export interface BountyCompletion {
  xpEarned: number;
  reason: string;
  bountyType: string;
  completedAt: string;
}

export interface AwardXPParams {
  targetWallet: string;
  xpAmount: number;
  source: 'course' | 'bounty' | 'daily_login' | 'admin' | 'other';
  reason: string;
  metadata?: any;
  awardedBy?: string; // Required if source is 'admin'
}

export interface AwardXPResponse {
  success: boolean;
  user: any;
  xpAwarded: number;
  previousXP: number;
  newTotalXP: number;
  previousLevel: number;
  newLevel: number;
  levelUp: boolean;
  source: string;
  reason: string;
  message: string;
  refreshLeaderboard: boolean;
  targetWallet: string;
  xpInCurrentLevel: number;
  xpToNextLevel: number;
  progressToNextLevel: number;
}

export class XPService {
  private static baseURL = '/api/xp';

  /**
   * Fetch comprehensive XP data for a user
   */
  static async getUserXP(
    walletAddress: string,
    options: {
      includeHistory?: boolean;
      includeCourses?: boolean;
      includeBounties?: boolean;
    } = {}
  ): Promise<XPData> {
    const params = new URLSearchParams({
      wallet: walletAddress,
      ...(options.includeHistory && { includeHistory: 'true' }),
      ...(options.includeCourses && { includeCourses: 'true' }),
      ...(options.includeBounties && { includeBounties: 'true' })
    });

    const timestamp = Date.now();
    const response = await fetch(
      `${this.baseURL}?${params}&t=${timestamp}&refresh=${Math.random()}`,
      {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch XP data');
    }

    return response.json();
  }

  /**
   * Award XP to a user
   */
  static async awardXP(params: AwardXPParams): Promise<AwardXPResponse> {
    const response = await fetch(this.baseURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to award XP');
    }

    const result = await response.json();

    // Dispatch custom event for real-time updates
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('xpAwarded', {
          detail: {
            targetWallet: params.targetWallet,
            xpAwarded: params.xpAmount,
            newTotalXP: result.newTotalXP,
            levelUp: result.levelUp,
            source: params.source,
            reason: params.reason
          }
        })
      );

      // Also dispatch xpUpdated event for backwards compatibility
      window.dispatchEvent(
        new CustomEvent('xpUpdated', {
          detail: {
            targetWallet: params.targetWallet,
            xpAwarded: params.xpAmount,
            newTotalXP: result.newTotalXP,
            reason: params.reason
          }
        })
      );
    }

    return result;
  }

  /**
   * Award XP for course completion
   */
  static async awardCourseXP(
    walletAddress: string,
    courseId: string,
    courseTitle: string,
    customXP?: number
  ): Promise<AwardXPResponse> {
    // Use the existing course completion endpoint
    const response = await fetch('/api/xp/course-completion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        walletAddress,
        courseId,
        courseTitle,
        customXP
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to award course XP');
    }

    const result = await response.json();

    // Dispatch events
    if (typeof window !== 'undefined' && result.success) {
      window.dispatchEvent(
        new CustomEvent('xpAwarded', {
          detail: {
            targetWallet: walletAddress,
            xpAwarded: result.xpAwarded,
            newTotalXP: result.newTotalXP,
            levelUp: result.levelUp,
            source: 'course',
            reason: `Course completion: ${courseTitle}`
          }
        })
      );
    }

    return result;
  }

  /**
   * Award XP for bounty completion
   */
  static async awardBountyXP(
    targetWallet: string,
    xpAmount: number,
    reason: string,
    bountyType: string = 'manual',
    awardedBy?: string
  ): Promise<AwardXPResponse> {
    // Use the existing bounty endpoint
    const response = await fetch('/api/xp/bounty', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        targetWallet,
        xpAmount,
        reason,
        bountyType,
        awardedBy
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to award bounty XP');
    }

    const result = await response.json();

    // Dispatch events
    if (typeof window !== 'undefined' && result.success) {
      window.dispatchEvent(
        new CustomEvent('xpAwarded', {
          detail: {
            targetWallet,
            xpAwarded: xpAmount,
            newTotalXP: result.newTotalXP,
            levelUp: result.levelUp,
            source: 'bounty',
            reason
          }
        })
      );
    }

    return result;
  }

  /**
   * Claim daily login bonus
   */
  static async claimDailyLoginBonus(walletAddress: string): Promise<AwardXPResponse> {
    const response = await fetch('/api/xp/daily-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ walletAddress })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to claim daily login bonus');
    }

    const result = await response.json();

    // Dispatch events
    if (typeof window !== 'undefined' && result.success) {
      window.dispatchEvent(
        new CustomEvent('xpAwarded', {
          detail: {
            targetWallet: walletAddress,
            xpAwarded: result.xpAwarded,
            newTotalXP: result.newTotalXP,
            levelUp: result.levelUp,
            source: 'daily_login',
            reason: 'Daily login bonus'
          }
        })
      );
    }

    return result;
  }

  /**
   * Check daily login status
   */
  static async checkDailyLoginStatus(walletAddress: string): Promise<{
    walletAddress: string;
    today: string;
    alreadyClaimed: boolean;
    lastClaimed: string | null;
    nextAvailable: string;
    dailyBonusXP: number;
  }> {
    const response = await fetch(`/api/xp/daily-login?wallet=${walletAddress}`, {
      cache: 'no-store'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to check daily login status');
    }

    return response.json();
  }

  /**
   * Calculate level from XP
   */
  static calculateLevel(totalXP: number): number {
    return Math.floor(totalXP / 1000) + 1;
  }

  /**
   * Calculate XP needed for next level
   */
  static calculateXPToNextLevel(totalXP: number): number {
    return 1000 - (totalXP % 1000);
  }

  /**
   * Calculate progress to next level (0-100%)
   */
  static calculateProgressToNextLevel(totalXP: number): number {
    return ((totalXP % 1000) / 1000) * 100;
  }

  /**
   * Get XP in current level
   */
  static getXPInCurrentLevel(totalXP: number): number {
    return totalXP % 1000;
  }

  /**
   * Force refresh XP data (triggers global refresh)
   */
  static forceRefresh(): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('forceXPRefresh', {
        detail: {} // Empty detail object to prevent undefined errors
      }));
      
      // Set flag in sessionStorage for components to check
      try {
        sessionStorage.setItem('xp_refresh_required', 'true');
      } catch (error) {
        console.warn('Failed to set XP refresh flag:', error);
      }
    }
  }

  /**
   * Check if XP refresh is required
   */
  static isRefreshRequired(): boolean {
    if (typeof window === 'undefined') return false;
    
    try {
      const refreshRequired = sessionStorage.getItem('xp_refresh_required');
      if (refreshRequired === 'true') {
        sessionStorage.removeItem('xp_refresh_required');
        return true;
      }
    } catch (error) {
      console.warn('Failed to check XP refresh flag:', error);
    }
    
    return false;
  }
}

// Export singleton instance
export const xpService = XPService;

