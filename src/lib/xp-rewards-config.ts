/**
 * XP Rewards Configuration System
 * Centralized configuration for automatic XP awards across the platform
 * 
 * IMPORTANT: The bounty-xp-service.ts implementation is the active XP system.
 * This config file mirrors those values to maintain consistency across the codebase.
 * 
 * Bounty XP System (source of truth: src/services/bounty-xp-service.ts):
 * - Participation: 10 XP per submission (max 3 submissions = 30 XP per bounty)
 * - Winner bonuses: 1st = 250 XP, 2nd = 100 XP, 3rd = 50 XP
 * - Level threshold: 1000 XP per level
 */

export interface XPRewardConfig {
  action: string;
  xpAmount: number;
  category: 'engagement' | 'contribution' | 'achievement' | 'social' | 'learning';
  description: string;
  enabled: boolean;
  maxPerDay?: number; // Optional: limit how many times per day this can be earned
  cooldown?: number; // Optional: cooldown period in hours before earning again
}

/**
 * XP Reward Action Types
 * Add new action types here as you expand the system
 */
/**
 * Bounty XP Constants (matching bounty-xp-service.ts)
 * These constants are exported for reference but the service is the source of truth
 */
export const BOUNTY_XP_CONSTANTS = {
  PARTICIPATION_XP: 10,
  MAX_SUBMISSIONS_PER_BOUNTY: 3,
  MAX_PARTICIPATION_XP: 30, // 10 XP × 3 submissions
  WINNER_FIRST: 250,
  WINNER_SECOND: 100,
  WINNER_THIRD: 50,
  LEVEL_THRESHOLD: 1000 // XP per level
} as const;

export const XP_REWARDS: Record<string, XPRewardConfig> = {
  // ===== FEEDBACK & CONTRIBUTIONS =====
  FEEDBACK_SUBMITTED: {
    action: 'feedback_submitted',
    xpAmount: 10,
    category: 'contribution',
    description: 'Submitting valuable feedback',
    enabled: true,
    maxPerDay: 5 // Max 5 feedback submissions per day
  },
  
  FEEDBACK_APPROVED: {
    action: 'feedback_approved',
    xpAmount: 50,
    category: 'contribution',
    description: 'Your feedback was approved by admins',
    enabled: true
  },
  
  FEEDBACK_IMPLEMENTED: {
    action: 'feedback_implemented',
    xpAmount: 100,
    category: 'contribution',
    description: 'Your feedback was implemented',
    enabled: true
  },
  
  FEEDBACK_UPVOTED: {
    action: 'feedback_upvoted',
    xpAmount: 2,
    category: 'engagement',
    description: 'Someone upvoted your feedback',
    enabled: true,
    maxPerDay: 20 // Max 20 upvotes per day count toward XP
  },

  // ===== COURSES & LEARNING =====
  COURSE_STARTED: {
    action: 'course_started',
    xpAmount: 5,
    category: 'learning',
    description: 'Starting a new course',
    enabled: true
  },
  
  COURSE_COMPLETED: {
    action: 'course_completed',
    xpAmount: 100,
    category: 'learning',
    description: 'Completing a course',
    enabled: true
  },
  
  EXAM_PASSED: {
    action: 'exam_passed',
    xpAmount: 150,
    category: 'achievement',
    description: 'Passing an exam',
    enabled: true
  },
  
  EXAM_PERFECT_SCORE: {
    action: 'exam_perfect_score',
    xpAmount: 50, // Bonus on top of exam pass
    category: 'achievement',
    description: 'Getting 100% on an exam',
    enabled: true
  },

  // ===== BOUNTIES =====
  // NOTE: Bounty XP values match bounty-xp-service.ts (source of truth)
  BOUNTY_SUBMITTED: {
    action: 'bounty_submitted',
    xpAmount: 10, // Participation XP per submission
    category: 'contribution',
    description: 'Submitting a bounty submission',
    enabled: true
  },
  
  BOUNTY_WINNER_FIRST: {
    action: 'bounty_winner_first',
    xpAmount: 250,
    category: 'achievement',
    description: 'Winning 1st place in a bounty competition',
    enabled: true
  },
  
  BOUNTY_WINNER_SECOND: {
    action: 'bounty_winner_second',
    xpAmount: 100,
    category: 'achievement',
    description: 'Winning 2nd place in a bounty competition',
    enabled: true
  },
  
  BOUNTY_WINNER_THIRD: {
    action: 'bounty_winner_third',
    xpAmount: 50,
    category: 'achievement',
    description: 'Winning 3rd place in a bounty competition',
    enabled: true
  },

  // ===== SOCIAL & ENGAGEMENT =====
  DAILY_LOGIN: {
    action: 'daily_login',
    xpAmount: 5,
    category: 'engagement',
    description: 'Logging in daily',
    enabled: true,
    maxPerDay: 1
  },
  
  FIRST_LOGIN: {
    action: 'first_login',
    xpAmount: 25,
    category: 'engagement',
    description: 'First time logging in',
    enabled: true
  },
  
  STREAK_7_DAYS: {
    action: 'streak_7_days',
    xpAmount: 50,
    category: 'engagement',
    description: '7-day login streak',
    enabled: true
  },
  
  STREAK_30_DAYS: {
    action: 'streak_30_days',
    xpAmount: 200,
    category: 'engagement',
    description: '30-day login streak',
    enabled: true
  },
  
  PROFILE_COMPLETED: {
    action: 'profile_completed',
    xpAmount: 20,
    category: 'engagement',
    description: 'Completing your profile',
    enabled: true
  },
  
  REFERRAL_SIGNUP: {
    action: 'referral_signup',
    xpAmount: 100,
    category: 'social',
    description: 'Someone signed up using your referral',
    enabled: true
  },
  
  SQUAD_JOINED: {
    action: 'squad_joined',
    xpAmount: 30,
    category: 'social',
    description: 'Joining a squad',
    enabled: true
  },

  // ===== COMMUNITY =====
  CHAT_MESSAGE_SENT: {
    action: 'chat_message_sent',
    xpAmount: 1,
    category: 'engagement',
    description: 'Sending a message in squad chat',
    enabled: true,
    maxPerDay: 50 // Max 50 XP per day from chat
  },
  
  HELPFUL_VOTE: {
    action: 'helpful_vote',
    xpAmount: 3,
    category: 'social',
    description: 'Your message was marked as helpful',
    enabled: true,
    maxPerDay: 10
  },

  // ===== SOCIAL FEED =====
  SOCIAL_POST_CREATED: {
    action: 'social_post_created',
    xpAmount: 1,
    category: 'engagement',
    description: 'Creating a post on the social feed',
    enabled: true,
    maxPerDay: 10 // Max 10 posts per day
  },
  
  SOCIAL_COMMENT_POSTED: {
    action: 'social_comment_posted',
    xpAmount: 3,
    category: 'engagement',
    description: 'Commenting on a post',
    enabled: true,
    maxPerDay: 20 // Max 20 comments per day
  },
  
  SOCIAL_POST_LIKED: {
    action: 'social_post_liked',
    xpAmount: 1,
    category: 'social',
    description: 'Someone liked your post or comment',
    enabled: true,
    maxPerDay: 50 // Max 50 likes per day count toward XP
  },

  // ===== SPECIAL EVENTS =====
  EVENT_PARTICIPATION: {
    action: 'event_participation',
    xpAmount: 75,
    category: 'engagement',
    description: 'Participating in a special event',
    enabled: true
  },
  
  SPECIAL_ACHIEVEMENT: {
    action: 'special_achievement',
    xpAmount: 250,
    category: 'achievement',
    description: 'Earning a special achievement',
    enabled: true
  },

  // ===== ADMIN AWARDS =====
  ADMIN_BONUS: {
    action: 'admin_bonus',
    xpAmount: 0, // Variable amount set by admin
    category: 'achievement',
    description: 'Admin discretionary award',
    enabled: true
  }
};

/**
 * Get XP reward configuration for an action
 */
export function getXPReward(action: string): XPRewardConfig | null {
  return XP_REWARDS[action.toUpperCase()] || null;
}

/**
 * Check if an action is eligible for XP reward
 */
export function isXPRewardEnabled(action: string): boolean {
  const config = getXPReward(action);
  return config ? config.enabled : false;
}

/**
 * Get XP amount for an action
 */
export function getXPAmount(action: string): number {
  const config = getXPReward(action);
  return config ? config.xpAmount : 0;
}

/**
 * Get all enabled XP rewards grouped by category
 */
export function getXPRewardsByCategory() {
  const rewards: Record<string, XPRewardConfig[]> = {
    engagement: [],
    contribution: [],
    achievement: [],
    social: [],
    learning: []
  };

  Object.values(XP_REWARDS).forEach(reward => {
    if (reward.enabled) {
      rewards[reward.category].push(reward);
    }
  });

  return rewards;
}

/**
 * Calculate total possible daily XP from all sources
 */
export function calculateMaxDailyXP(): number {
  let total = 0;
  
  Object.values(XP_REWARDS).forEach(reward => {
    if (reward.enabled && reward.maxPerDay) {
      total += reward.xpAmount * reward.maxPerDay;
    }
  });
  
  return total;
}

