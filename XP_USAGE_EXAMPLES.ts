/**
 * XP Reward System - Quick Usage Examples
 * Copy these examples into your code and customize as needed
 */

import { awardXP, awardXPSilent, XPRewardExamples } from '@/lib/xp-reward-helper';

// ============================================================
// EXAMPLE 1: Award XP when user submits feedback
// ============================================================
async function exampleFeedbackSubmission() {
  const walletAddress = '0x1234567890...';
  const feedbackId = 'feedback-abc-123';

  const result = await awardXP({
    walletAddress,
    action: 'FEEDBACK_SUBMITTED',
    referenceId: feedbackId,
    metadata: {
      category: 'bug_report',
      timestamp: new Date().toISOString()
    }
  });

  if (result.success) {
    console.log(`✅ Awarded ${result.xpAwarded} XP!`);
    
    if (result.levelUp) {
      console.log(`🎉 Level up! Now level ${result.newLevel}`);
      // Show a celebration modal or notification
    }
  }
}

// ============================================================
// EXAMPLE 2: Admin manually awarding XP (custom amount)
// ============================================================
async function exampleAdminBonus() {
  const adminWallet = '0xadmin...';
  const userWallet = '0xuser...';
  const customAmount = 500;

  const result = await awardXP({
    walletAddress: userWallet,
    action: 'ADMIN_BONUS',
    customXPAmount: customAmount,
    metadata: {
      awarded_by: adminWallet,
      reason: 'Exceptional community contribution',
      admin_note: 'Great work on helping new members!'
    }
  });

  if (result.success) {
    alert(`Successfully awarded ${result.xpAwarded} XP to user!`);
  }
}

// ============================================================
// EXAMPLE 3: Daily login bonus (automatic duplicate prevention)
// ============================================================
async function exampleDailyLogin() {
  const walletAddress = '0x1234567890...';
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  // This will only award XP once per day automatically
  const result = await awardXP({
    walletAddress,
    action: 'DAILY_LOGIN',
    referenceId: `login_${today}` // Key for duplicate prevention
  });

  if (result.success) {
    console.log('Daily login bonus claimed!');
  } else if (result.duplicate) {
    console.log('Already claimed today!');
  }
}

// ============================================================
// EXAMPLE 4: Course completion
// ============================================================
async function exampleCourseCompletion() {
  const walletAddress = '0x1234567890...';
  const courseId = 'web3-fundamentals';
  const courseName = 'Web3 Fundamentals';

  const result = await awardXP({
    walletAddress,
    action: 'COURSE_COMPLETED',
    referenceId: courseId,
    metadata: {
      course_name: courseName,
      completed_at: new Date().toISOString(),
      final_score: 95
    }
  });

  if (result.success && result.levelUp) {
    // Trigger confetti or celebration animation
    showCelebration(result.newLevel);
  }
}

// ============================================================
// EXAMPLE 5: Bounty submission and approval flow
// ============================================================
async function exampleBountyFlow() {
  const walletAddress = '0x1234567890...';
  const bountyId = 'bounty-design-001';

  // Step 1: User submits bounty
  await awardXP({
    walletAddress,
    action: 'BOUNTY_SUBMITTED',
    referenceId: `${bountyId}_submit`
  });

  // Step 2: Admin approves bounty (happens later)
  await awardXP({
    walletAddress,
    action: 'BOUNTY_APPROVED',
    referenceId: `${bountyId}_approved`
  });

  // Step 3: If they won the competition
  const isWinner = true;
  if (isWinner) {
    await awardXP({
      walletAddress,
      action: 'BOUNTY_WINNER',
      referenceId: `${bountyId}_winner`,
      metadata: {
        bounty_name: 'Hoodie Design Contest',
        prize: 'Winner!'
      }
    });
  }
}

// ============================================================
// EXAMPLE 6: Silent XP award (non-critical, no error handling needed)
// ============================================================
async function exampleSilentAward() {
  const walletAddress = '0x1234567890...';

  // Award XP silently - returns true/false, doesn't throw errors
  const success = await awardXPSilent({
    walletAddress,
    action: 'CHAT_MESSAGE_SENT',
    referenceId: `msg_${Date.now()}`
  });

  // Don't need to check success for non-critical actions
  // Just log if needed
  if (success) {
    console.log('XP awarded for chat message');
  }
}

// ============================================================
// EXAMPLE 7: Using pre-built helper functions
// ============================================================
async function exampleHelperFunctions() {
  const walletAddress = '0x1234567890...';

  // Use pre-built helpers from XPRewardExamples
  await XPRewardExamples.onFeedbackSubmit(walletAddress, 'feedback-123');
  await XPRewardExamples.onDailyLogin(walletAddress);
  await XPRewardExamples.onCourseComplete(walletAddress, 'course-123', 'Web3 101');
  await XPRewardExamples.adminAward(walletAddress, 250, 'Great contribution!');
}

// ============================================================
// EXAMPLE 8: React component with XP notifications
// ============================================================
/*
import { useEffect } from 'react';
import { toast } from 'react-hot-toast';

function YourComponent() {
  useEffect(() => {
    // Listen for XP awards
    const handleXPAward = (event: CustomEvent) => {
      const { xpAmount, reason, levelUp, newLevel } = event.detail;
      
      // Show XP gain notification
      toast.success(`+${xpAmount} XP - ${reason}`, {
        icon: '🎁',
        duration: 3000
      });
      
      // Show level up notification
      if (levelUp) {
        toast.success(`🎉 Level Up! You're now level ${newLevel}!`, {
          duration: 5000,
          style: {
            background: '#10b981',
            color: '#fff'
          }
        });
      }
    };

    window.addEventListener('xpAwarded', handleXPAward as EventListener);
    
    return () => {
      window.removeEventListener('xpAwarded', handleXPAward as EventListener);
    };
  }, []);

  // Your component JSX
  return <div>Your content</div>;
}
*/

// ============================================================
// EXAMPLE 9: Check if user has already received XP
// ============================================================
import { hasReceivedXP } from '@/lib/xp-reward-helper';

async function exampleCheckDuplicate() {
  const walletAddress = '0x1234567890...';
  const feedbackId = 'feedback-123';

  // Check if XP was already awarded
  const alreadyReceived = await hasReceivedXP(
    walletAddress,
    'FEEDBACK_APPROVED',
    feedbackId
  );

  if (alreadyReceived) {
    console.log('User already received XP for this feedback');
  } else {
    console.log('Ready to award XP!');
  }
}

// ============================================================
// EXAMPLE 10: Award multiple XP actions at once
// ============================================================
import { awardMultipleXP } from '@/lib/xp-reward-helper';

async function exampleBatchAward() {
  const walletAddress = '0x1234567890...';

  // Award multiple XP actions simultaneously
  const results = await awardMultipleXP([
    {
      walletAddress,
      action: 'PROFILE_COMPLETED',
      referenceId: 'profile'
    },
    {
      walletAddress,
      action: 'SQUAD_JOINED',
      referenceId: 'squad_raiders'
    },
    {
      walletAddress,
      action: 'FIRST_LOGIN',
      referenceId: 'first_login'
    }
  ]);

  // Check results
  const totalXP = results
    .filter(r => r.success)
    .reduce((sum, r) => sum + r.xpAwarded, 0);

  console.log(`Awarded ${totalXP} total XP across ${results.length} actions`);
}

// ============================================================
// EXAMPLE 11: Real-world integration in your API route
// ============================================================
/*
// In your API route (e.g., /api/submissions/approve)
import { NextRequest, NextResponse } from 'next/server';
import { awardXP } from '@/lib/xp-reward-helper';

export async function POST(request: NextRequest) {
  const { submissionId, walletAddress } = await request.json();

  // Your business logic here
  // ... approve submission ...

  // Award XP automatically
  const xpResult = await awardXP({
    walletAddress,
    action: 'BOUNTY_APPROVED',
    referenceId: submissionId,
    metadata: {
      submission_id: submissionId,
      approved_at: new Date().toISOString()
    }
  });

  return NextResponse.json({
    success: true,
    submission: { ... },
    xp: {
      awarded: xpResult.xpAwarded,
      levelUp: xpResult.levelUp,
      newLevel: xpResult.newLevel
    }
  });
}
*/

export {
  exampleFeedbackSubmission,
  exampleAdminBonus,
  exampleDailyLogin,
  exampleCourseCompletion,
  exampleBountyFlow,
  exampleSilentAward,
  exampleHelperFunctions,
  exampleCheckDuplicate,
  exampleBatchAward
};

