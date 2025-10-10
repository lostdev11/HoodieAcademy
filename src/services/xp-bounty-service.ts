// XP Bounty Service - Frontend service for managing XP awards
export interface XPBountyRequest {
  targetWallet: string;
  xpAmount: number;
  reason: string;
  awardedBy?: string;
  bountyType?: 'admin' | 'course' | 'daily' | 'manual';
  metadata?: Record<string, any>;
}

export interface XPBountyResponse {
  success: boolean;
  user?: any;
  xpAwarded?: number;
  newTotalXP?: number;
  levelUp?: boolean;
  message?: string;
  alreadyClaimed?: boolean;
  alreadyCompleted?: boolean;
  refreshLeaderboard?: boolean;
  targetWallet?: string;
  reason?: string;
}

export class XPBountyService {
  private static instance: XPBountyService;

  static getInstance(): XPBountyService {
    if (!XPBountyService.instance) {
      XPBountyService.instance = new XPBountyService();
    }
    return XPBountyService.instance;
  }

  /**
   * Award XP via the bounty system
   */
  async awardXP(request: XPBountyRequest): Promise<XPBountyResponse> {
    try {
      console.log('🎯 [XP Bounty Service] Awarding XP:', request);

      const response = await fetch('/api/xp/bounty', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('❌ [XP Bounty Service] API error:', result);
        return {
          success: false,
          message: result.error || 'Failed to award XP'
        };
      }

      console.log('✅ [XP Bounty Service] XP awarded successfully:', result);

      // Trigger real-time updates
      this.triggerRealTimeUpdates(result);

      return result;
    } catch (error) {
      console.error('❌ [XP Bounty Service] Error awarding XP:', error);
      return {
        success: false,
        message: 'Network error while awarding XP'
      };
    }
  }

  /**
   * Award daily login bonus
   */
  async awardDailyLoginBonus(walletAddress: string): Promise<XPBountyResponse> {
    try {
      console.log('🎯 [XP Bounty Service] Awarding daily login bonus:', walletAddress);

      const response = await fetch('/api/xp/daily-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ walletAddress })
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('❌ [XP Bounty Service] Daily login API error:', result);
        return {
          success: false,
          message: result.error || 'Failed to award daily login bonus'
        };
      }

      console.log('✅ [XP Bounty Service] Daily login bonus awarded:', result);

      // Trigger real-time updates
      this.triggerRealTimeUpdates(result);

      return result;
    } catch (error) {
      console.error('❌ [XP Bounty Service] Error awarding daily login bonus:', error);
      return {
        success: false,
        message: 'Network error while awarding daily login bonus'
      };
    }
  }

  /**
   * Award course completion XP
   */
  async awardCourseCompletion(
    walletAddress: string, 
    courseId: string, 
    courseTitle?: string,
    customXP?: number
  ): Promise<XPBountyResponse> {
    try {
      console.log('🎯 [XP Bounty Service] Awarding course completion XP:', {
        walletAddress,
        courseId,
        courseTitle,
        customXP
      });

      const response = await fetch('/api/xp/course-completion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress,
          courseId,
          courseTitle,
          customXP
        })
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('❌ [XP Bounty Service] Course completion API error:', result);
        return {
          success: false,
          message: result.error || 'Failed to award course completion XP'
        };
      }

      console.log('✅ [XP Bounty Service] Course completion XP awarded:', result);

      // Trigger real-time updates
      this.triggerRealTimeUpdates(result);

      return result;
    } catch (error) {
      console.error('❌ [XP Bounty Service] Error awarding course completion XP:', error);
      return {
        success: false,
        message: 'Network error while awarding course completion XP'
      };
    }
  }

  /**
   * Check daily login status
   */
  async checkDailyLoginStatus(walletAddress: string) {
    try {
      const response = await fetch(`/api/xp/daily-login?wallet=${walletAddress}`);
      const result = await response.json();

      if (!response.ok) {
        console.error('❌ [XP Bounty Service] Error checking daily login status:', result);
        return null;
      }

      return result;
    } catch (error) {
      console.error('❌ [XP Bounty Service] Error checking daily login status:', error);
      return null;
    }
  }

  /**
   * Check course completion status
   */
  async checkCourseCompletionStatus(walletAddress: string, courseId?: string) {
    try {
      const url = courseId 
        ? `/api/xp/course-completion?wallet=${walletAddress}&course=${courseId}`
        : `/api/xp/course-completion?wallet=${walletAddress}`;
      
      const response = await fetch(url);
      const result = await response.json();

      if (!response.ok) {
        console.error('❌ [XP Bounty Service] Error checking course completion status:', result);
        return null;
      }

      return result;
    } catch (error) {
      console.error('❌ [XP Bounty Service] Error checking course completion status:', error);
      return null;
    }
  }

  /**
   * Trigger real-time updates across the application
   */
  private triggerRealTimeUpdates(result: XPBountyResponse) {
    if (!result.success || !result.refreshLeaderboard) return;

    console.log('🔄 [XP Bounty Service] Triggering real-time updates');

    // Trigger leaderboard refresh
    try {
      const { triggerLeaderboardRefresh } = require('@/utils/leaderboardRefresh');
      triggerLeaderboardRefresh();
    } catch (error) {
      console.log('Leaderboard refresh system not available');
    }

    // Trigger global XP refresh
    try {
      const { triggerXpRefresh } = require('@/utils/globalRefresh');
      triggerXpRefresh({
        targetWallet: result.targetWallet,
        newTotalXP: result.newTotalXP,
        xpAwarded: result.xpAwarded,
        reason: result.reason,
        levelUp: result.levelUp
      });
    } catch (error) {
      console.log('Global refresh system not available');
    }

    // Trigger force refresh
    try {
      const { forceRefreshAllXpComponents } = require('@/utils/forceRefresh');
      forceRefreshAllXpComponents();
    } catch (error) {
      console.log('Force refresh system not available');
    }

    // Dispatch custom events for components that listen
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('xpAwarded', {
        detail: {
          targetWallet: result.targetWallet,
          newTotalXP: result.newTotalXP,
          xpAwarded: result.xpAwarded,
          reason: result.reason,
          levelUp: result.levelUp
        }
      }));

      window.dispatchEvent(new CustomEvent('xpUpdated', {
        detail: {
          targetWallet: result.targetWallet,
          newTotalXP: result.newTotalXP,
          xpAwarded: result.xpAwarded,
          reason: result.reason,
          levelUp: result.levelUp
        }
      }));
    }
  }

  /**
   * Get XP bounty history for a user
   */
  async getXPBountyHistory(walletAddress: string) {
    try {
      const response = await fetch(`/api/xp/bounty?wallet=${walletAddress}`);
      const result = await response.json();

      if (!response.ok) {
        console.error('❌ [XP Bounty Service] Error fetching XP bounty history:', result);
        return null;
      }

      return result;
    } catch (error) {
      console.error('❌ [XP Bounty Service] Error fetching XP bounty history:', error);
      return null;
    }
  }
}

// Export singleton instance
export const xpBountyService = XPBountyService.getInstance();
