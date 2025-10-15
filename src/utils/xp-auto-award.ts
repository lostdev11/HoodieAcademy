/**
 * XP Auto-Award Utilities
 * 
 * Automatically awards XP for various platform activities
 */

export interface XPAwardConfig {
  wallet_address: string;
  xp_amount: number;
  activity_type: string;
  metadata?: Record<string, any>;
}

// XP reward amounts by activity type
export const XP_REWARDS = {
  // Course activities
  COURSE_COMPLETION: 100,
  COURSE_SECTION_COMPLETION: 20,
  EXAM_PASS: 150,
  
  // Bounty activities
  BOUNTY_SUBMISSION: 50,
  BOUNTY_APPROVED: 200,
  BOUNTY_WINNER: 500,
  
  // Mentorship activities
  ATTEND_SESSION: 75,
  ASK_QUESTION: 10,
  ANSWER_QUESTION: 25,
  
  // Community activities
  DAILY_LOGIN: 5,
  FIRST_SQUAD_JOIN: 50,
  SQUAD_CHAT_MESSAGE: 1,
  
  // Governance activities
  VOTE_ON_PROPOSAL: 10,
  CREATE_PROPOSAL: 25,
  
  // Content creation
  UPLOAD_MEDIA: 15,
  MODERATED_IMAGE_APPROVED: 30,
  
  // Social activities
  GIVE_FEEDBACK: 20,
  UPVOTE_CONTENT: 5,
  
  // Achievements
  LEVEL_UP: 100,
  STREAK_7_DAYS: 150,
  STREAK_30_DAYS: 500,
};

/**
 * Award XP to a user
 */
export async function awardXP(config: XPAwardConfig): Promise<boolean> {
  try {
    const response = await fetch('/api/xp/award-auto', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });

    const data = await response.json();

    if (data.success) {
      console.log(`✅ Awarded ${config.xp_amount} XP for ${config.activity_type}`);
      
      // Dispatch custom event for UI updates
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('xpAwarded', {
          detail: {
            wallet: config.wallet_address,
            amount: config.xp_amount,
            activity: config.activity_type,
            result: data.result
          }
        }));
      }
      
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error awarding XP:', error);
    return false;
  }
}

/**
 * Award XP for course completion
 */
export async function awardCourseCompletionXP(
  walletAddress: string,
  courseId: string,
  courseName: string
): Promise<boolean> {
  return awardXP({
    wallet_address: walletAddress,
    xp_amount: XP_REWARDS.COURSE_COMPLETION,
    activity_type: 'course_completion',
    metadata: {
      course_id: courseId,
      course_name: courseName,
      xp_type: 'course'
    }
  });
}

/**
 * Award XP for bounty approval
 */
export async function awardBountyApprovalXP(
  walletAddress: string,
  bountyId: string,
  bountyTitle: string,
  isWinner: boolean = false
): Promise<boolean> {
  const xpAmount = isWinner 
    ? XP_REWARDS.BOUNTY_WINNER 
    : XP_REWARDS.BOUNTY_APPROVED;

  return awardXP({
    wallet_address: walletAddress,
    xp_amount: xpAmount,
    activity_type: isWinner ? 'bounty_winner' : 'bounty_approved',
    metadata: {
      bounty_id: bountyId,
      bounty_title: bountyTitle,
      is_winner: isWinner,
      xp_type: 'bounty'
    }
  });
}

/**
 * Award XP for daily login
 */
export async function awardDailyLoginXP(walletAddress: string): Promise<boolean> {
  // Check if already awarded today
  const today = new Date().toISOString().split('T')[0];
  const key = `daily_xp_${walletAddress}_${today}`;
  
  if (typeof window !== 'undefined' && localStorage.getItem(key)) {
    console.log('Daily XP already awarded today');
    return false;
  }

  const result = await awardXP({
    wallet_address: walletAddress,
    xp_amount: XP_REWARDS.DAILY_LOGIN,
    activity_type: 'daily_login',
    metadata: {
      date: today,
      xp_type: 'daily'
    }
  });

  if (result && typeof window !== 'undefined') {
    localStorage.setItem(key, 'true');
  }

  return result;
}

/**
 * Award XP for mentorship attendance
 */
export async function awardMentorshipAttendanceXP(
  walletAddress: string,
  sessionId: string,
  sessionTitle: string
): Promise<boolean> {
  return awardXP({
    wallet_address: walletAddress,
    xp_amount: XP_REWARDS.ATTEND_SESSION,
    activity_type: 'mentorship_attendance',
    metadata: {
      session_id: sessionId,
      session_title: sessionTitle,
      xp_type: 'mentorship'
    }
  });
}

/**
 * Award XP for governance voting
 */
export async function awardGovernanceVoteXP(
  walletAddress: string,
  proposalId: string,
  proposalTitle: string
): Promise<boolean> {
  return awardXP({
    wallet_address: walletAddress,
    xp_amount: XP_REWARDS.VOTE_ON_PROPOSAL,
    activity_type: 'governance_vote',
    metadata: {
      proposal_id: proposalId,
      proposal_title: proposalTitle,
      xp_type: 'governance'
    }
  });
}

/**
 * Award XP for exam pass
 */
export async function awardExamPassXP(
  walletAddress: string,
  examId: string,
  examTitle: string,
  score: number
): Promise<boolean> {
  // Bonus XP for perfect score
  const bonusXP = score === 100 ? 50 : 0;
  
  return awardXP({
    wallet_address: walletAddress,
    xp_amount: XP_REWARDS.EXAM_PASS + bonusXP,
    activity_type: 'exam_pass',
    metadata: {
      exam_id: examId,
      exam_title: examTitle,
      score,
      bonus_xp: bonusXP,
      xp_type: 'exam'
    }
  });
}

/**
 * Get user's current XP data
 */
export async function getUserXP(walletAddress: string): Promise<any | null> {
  try {
    const response = await fetch(`/api/xp/award-auto?wallet=${walletAddress}`);
    const data = await response.json();
    
    if (data.success) {
      return data.xp;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching user XP:', error);
    return null;
  }
}

/**
 * Calculate level from XP
 */
export function calculateLevel(totalXP: number): number {
  return Math.floor(totalXP / 1000) + 1;
}

/**
 * Calculate XP needed for next level
 */
export function xpToNextLevel(totalXP: number): number {
  const currentLevel = calculateLevel(totalXP);
  const xpForNextLevel = currentLevel * 1000;
  return xpForNextLevel - totalXP;
}

/**
 * Calculate progress percentage in current level
 */
export function levelProgress(totalXP: number): number {
  const xpInLevel = totalXP % 1000;
  return (xpInLevel / 1000) * 100;
}

/**
 * Format XP with abbreviation
 */
export function formatXP(xp: number): string {
  if (xp >= 1000000) return `${(xp / 1000000).toFixed(1)}M`;
  if (xp >= 1000) return `${(xp / 1000).toFixed(1)}K`;
  return xp.toString();
}

