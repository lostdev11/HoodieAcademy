/**
 * XP Reward Helper Functions
 * Easy-to-use utilities for awarding XP throughout the application
 */

import { getXPReward } from './xp-rewards-config';

export interface XPRewardResult {
  success: boolean;
  xpAwarded: number;
  reason?: string;
  levelUp?: boolean;
  newTotalXP?: number;
  newLevel?: number;
  error?: string;
  duplicate?: boolean;
  limitReached?: boolean;
  cooldownActive?: boolean;
}

/**
 * Award XP to a user for a specific action
 * 
 * @example
 * ```ts
 * // Award XP when user submits feedback
 * await awardXP({
 *   walletAddress: user.walletAddress,
 *   action: 'FEEDBACK_SUBMITTED',
 *   referenceId: feedbackId
 * });
 * 
 * // Award XP with custom amount
 * await awardXP({
 *   walletAddress: user.walletAddress,
 *   action: 'ADMIN_BONUS',
 *   customXPAmount: 250,
 *   metadata: { reason: 'Exceptional contribution' }
 * });
 * ```
 */
export async function awardXP(params: {
  walletAddress: string;
  action: string;
  referenceId?: string;
  customXPAmount?: number;
  metadata?: Record<string, any>;
  skipDuplicateCheck?: boolean;
}): Promise<XPRewardResult> {
  try {
    const response = await fetch('/api/xp/auto-reward', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle known error types
      if (data.duplicate) {
        return {
          success: false,
          duplicate: true,
          xpAwarded: 0,
          error: data.message
        };
      }
      
      if (data.limitReached) {
        return {
          success: false,
          limitReached: true,
          xpAwarded: 0,
          error: data.message
        };
      }
      
      if (data.cooldownActive) {
        return {
          success: false,
          cooldownActive: true,
          xpAwarded: 0,
          error: data.message
        };
      }

      return {
        success: false,
        xpAwarded: 0,
        error: data.error || 'Failed to award XP'
      };
    }

    return {
      success: true,
      xpAwarded: data.xpAwarded,
      reason: data.reason,
      levelUp: data.levelUp,
      newTotalXP: data.newTotalXP,
      newLevel: data.newLevel
    };

  } catch (error) {
    console.error('[XP HELPER] Error awarding XP:', error);
    return {
      success: false,
      xpAwarded: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Award XP silently (doesn't throw errors, good for non-critical XP awards)
 * Returns true if successful, false otherwise
 */
export async function awardXPSilent(params: {
  walletAddress: string;
  action: string;
  referenceId?: string;
  customXPAmount?: number;
  metadata?: Record<string, any>;
}): Promise<boolean> {
  const result = await awardXP(params);
  return result.success;
}

/**
 * Check if an action has already been rewarded (duplicate check)
 */
export async function hasReceivedXP(
  walletAddress: string,
  action: string,
  referenceId: string
): Promise<boolean> {
  try {
    // Attempt to award with duplicate check
    const result = await awardXP({
      walletAddress,
      action,
      referenceId,
      customXPAmount: 1, // Minimal amount for check
      skipDuplicateCheck: false
    });

    // If duplicate, means they already received it
    return result.duplicate === true;
  } catch (error) {
    console.error('[XP HELPER] Error checking duplicate:', error);
    return false;
  }
}

/**
 * Get XP amount for an action without awarding it
 */
export function getXPAmountForAction(action: string): number {
  const config = getXPReward(action);
  return config?.xpAmount || 0;
}

/**
 * Show XP notification (trigger browser event for UI components to catch)
 */
export function showXPNotification(params: {
  xpAmount: number;
  reason: string;
  levelUp?: boolean;
  newLevel?: number;
}) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('xpAwarded', { 
      detail: params 
    }));
  }
}

/**
 * Award multiple XP actions at once (batch operation)
 * Useful when a user completes multiple achievements simultaneously
 */
export async function awardMultipleXP(
  awards: Array<{
    walletAddress: string;
    action: string;
    referenceId?: string;
    customXPAmount?: number;
    metadata?: Record<string, any>;
  }>
): Promise<XPRewardResult[]> {
  const results = await Promise.allSettled(
    awards.map(award => awardXP(award))
  );

  return results.map(result => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return {
        success: false,
        xpAwarded: 0,
        error: result.reason?.message || 'Failed to award XP'
      };
    }
  });
}

/**
 * Example usage patterns for common scenarios
 */
export const XPRewardExamples = {
  // When user submits feedback
  onFeedbackSubmit: (walletAddress: string, feedbackId: string) => 
    awardXP({
      walletAddress,
      action: 'FEEDBACK_SUBMITTED',
      referenceId: feedbackId,
      metadata: { source: 'feedback_form' }
    }),

  // When admin approves feedback
  onFeedbackApprove: (walletAddress: string, feedbackId: string) =>
    awardXP({
      walletAddress,
      action: 'FEEDBACK_APPROVED',
      referenceId: feedbackId
    }),

  // When user completes a course
  onCourseComplete: (walletAddress: string, courseId: string, courseName: string) =>
    awardXP({
      walletAddress,
      action: 'COURSE_COMPLETED',
      referenceId: courseId,
      metadata: { course_name: courseName }
    }),

  // Daily login bonus
  onDailyLogin: (walletAddress: string) =>
    awardXP({
      walletAddress,
      action: 'DAILY_LOGIN',
      referenceId: `login_${new Date().toISOString().split('T')[0]}` // One per day
    }),

  // Admin discretionary award
  adminAward: (walletAddress: string, amount: number, reason: string) =>
    awardXP({
      walletAddress,
      action: 'ADMIN_BONUS',
      customXPAmount: amount,
      metadata: { reason }
    })
};

