# 🎁 Automatic XP Reward System

## Overview

A comprehensive, extensible XP reward system that automatically awards users experience points for various actions throughout the Hoodie Academy platform. The system includes duplicate prevention, daily limits, cooldown management, and easy integration.

---

## ✨ Features

- ✅ **Automatic XP Awards** - Award XP for 20+ different actions
- ✅ **Duplicate Prevention** - Never award XP twice for the same action
- ✅ **Daily Limits** - Prevent XP farming with configurable daily caps
- ✅ **Cooldown Management** - Time-based restrictions for certain actions
- ✅ **Level Up Detection** - Automatically detect when users level up
- ✅ **Activity Logging** - Complete history of all XP transactions
- ✅ **Easy Integration** - Simple helper functions for any part of your app
- ✅ **Extensible Config** - Add new XP rewards without touching the API

---

## 📦 What Was Built

### 1. **XP Configuration System** (`src/lib/xp-rewards-config.ts`)

Centralized configuration for all XP reward types:

```typescript
export const XP_REWARDS = {
  FEEDBACK_APPROVED: {
    action: 'feedback_approved',
    xpAmount: 50,
    category: 'contribution',
    description: 'Your feedback was approved',
    enabled: true
  },
  // ... 20+ more reward types
}
```

### 2. **Auto-Reward API** (`src/app/api/xp/auto-reward/route.ts`)

RESTful API endpoint that handles:
- XP award processing
- Duplicate checking
- Daily limit enforcement
- Cooldown management
- User creation/updates
- Activity logging

### 3. **Helper Utilities** (`src/lib/xp-reward-helper.ts`)

Easy-to-use functions for awarding XP:

```typescript
await awardXP({
  walletAddress: user.wallet,
  action: 'FEEDBACK_APPROVED',
  referenceId: feedbackId
});
```

### 4. **Feedback Integration** (Updated `src/app/api/user-feedback/route.ts`)

Automatically awards XP when feedback is approved or implemented.

---

## 🚀 Quick Start

### Award XP in Your Code

```typescript
import { awardXP } from '@/lib/xp-reward-helper';

// Simple XP award
await awardXP({
  walletAddress: '0x1234...',
  action: 'COURSE_COMPLETED',
  referenceId: 'course-123'
});

// Custom XP amount (admin bonus)
await awardXP({
  walletAddress: '0x1234...',
  action: 'ADMIN_BONUS',
  customXPAmount: 500,
  metadata: { reason: 'Outstanding contribution' }
});

// Silent award (doesn't throw errors)
const success = await awardXPSilent({
  walletAddress: '0x1234...',
  action: 'DAILY_LOGIN',
  referenceId: `login_${Date.now()}`
});
```

---

## 📋 Available XP Actions

### 🤝 Feedback & Contributions

| Action | XP | Description |
|--------|-------|-------------|
| `FEEDBACK_SUBMITTED` | 10 | Submitting feedback (max 5/day) |
| `FEEDBACK_APPROVED` | 50 | Admin approves your feedback |
| `FEEDBACK_IMPLEMENTED` | 100 | Your feedback was implemented |
| `FEEDBACK_UPVOTED` | 2 | Someone upvoted your feedback (max 20/day) |

### 📚 Learning & Courses

| Action | XP | Description |
|--------|-------|-------------|
| `COURSE_STARTED` | 5 | Starting a new course |
| `COURSE_COMPLETED` | 100 | Completing a course |
| `EXAM_PASSED` | 150 | Passing an exam |
| `EXAM_PERFECT_SCORE` | 50 | Getting 100% on an exam (bonus) |

### 🎯 Bounties

| Action | XP | Description |
|--------|-------|-------------|
| `BOUNTY_SUBMITTED` | 15 | Submitting a bounty |
| `BOUNTY_APPROVED` | 200 | Bounty submission approved |
| `BOUNTY_WINNER` | 500 | Winning a bounty competition |

### 🔥 Engagement

| Action | XP | Description |
|--------|-------|-------------|
| `DAILY_LOGIN` | 5 | Logging in daily (once per day) |
| `FIRST_LOGIN` | 25 | First time logging in |
| `STREAK_7_DAYS` | 50 | 7-day login streak |
| `STREAK_30_DAYS` | 200 | 30-day login streak |
| `PROFILE_COMPLETED` | 20 | Completing your profile |

### 👥 Social

| Action | XP | Description |
|--------|-------|-------------|
| `REFERRAL_SIGNUP` | 100 | Someone signed up with your referral |
| `SQUAD_JOINED` | 30 | Joining a squad |
| `CHAT_MESSAGE_SENT` | 1 | Sending a chat message (max 50/day) |
| `HELPFUL_VOTE` | 3 | Your message was marked helpful (max 10/day) |

### 🎉 Special

| Action | XP | Description |
|--------|-------|-------------|
| `EVENT_PARTICIPATION` | 75 | Participating in special events |
| `SPECIAL_ACHIEVEMENT` | 250 | Earning special achievements |
| `ADMIN_BONUS` | Variable | Admin discretionary award |

---

## 💡 Integration Examples

### Example 1: Award XP on Course Completion

```typescript
// In your course completion handler
import { awardXP } from '@/lib/xp-reward-helper';

async function handleCourseCompletion(walletAddress: string, courseId: string) {
  // ... your course completion logic ...
  
  // Award XP automatically
  const result = await awardXP({
    walletAddress,
    action: 'COURSE_COMPLETED',
    referenceId: courseId, // Prevents duplicate awards
    metadata: {
      course_name: 'Web3 Fundamentals',
      completed_at: new Date().toISOString()
    }
  });

  if (result.success) {
    console.log(`Awarded ${result.xpAwarded} XP!`);
    
    if (result.levelUp) {
      // Show level up notification
      console.log(`🎉 Level up! Now level ${result.newLevel}`);
    }
  }
}
```

### Example 2: Daily Login Bonus

```typescript
// In your authentication handler
import { awardXP } from '@/lib/xp-reward-helper';

async function handleUserLogin(walletAddress: string) {
  const today = new Date().toISOString().split('T')[0];
  
  // Award daily login XP (automatically prevented if already awarded today)
  await awardXP({
    walletAddress,
    action: 'DAILY_LOGIN',
    referenceId: `login_${today}` // One per day
  });
}
```

### Example 3: Bounty Submission Flow

```typescript
import { awardXP } from '@/lib/xp-reward-helper';

// When user submits bounty
async function onBountySubmit(walletAddress: string, bountyId: string) {
  await awardXP({
    walletAddress,
    action: 'BOUNTY_SUBMITTED',
    referenceId: bountyId
  });
}

// When admin approves bounty
async function onBountyApprove(walletAddress: string, bountyId: string) {
  const result = await awardXP({
    walletAddress,
    action: 'BOUNTY_APPROVED',
    referenceId: `${bountyId}_approved`
  });
  
  // Winner gets extra XP
  if (isWinner) {
    await awardXP({
      walletAddress,
      action: 'BOUNTY_WINNER',
      referenceId: `${bountyId}_winner`,
      metadata: { bounty_name: 'Hoodie Design Contest' }
    });
  }
}
```

### Example 4: Admin Custom Award

```typescript
import { awardXP } from '@/lib/xp-reward-helper';

async function giveAdminBonus(
  adminWallet: string,
  targetWallet: string,
  amount: number,
  reason: string
) {
  const result = await awardXP({
    walletAddress: targetWallet,
    action: 'ADMIN_BONUS',
    customXPAmount: amount,
    metadata: {
      awarded_by: adminWallet,
      reason: reason,
      timestamp: new Date().toISOString()
    }
  });

  return result.success;
}
```

---

## 🔧 API Reference

### POST `/api/xp/auto-reward`

Award XP automatically with duplicate prevention.

**Request Body:**
```typescript
{
  walletAddress: string;      // Required
  action: string;              // Required (e.g., 'FEEDBACK_APPROVED')
  referenceId?: string;        // Optional: for duplicate prevention
  customXPAmount?: number;     // Optional: override default amount
  metadata?: object;           // Optional: additional data
  skipDuplicateCheck?: boolean;// Optional: force award even if duplicate
}
```

**Response:**
```typescript
{
  success: boolean;
  xpAwarded: number;
  action: string;
  reason: string;
  previousXP: number;
  newTotalXP: number;
  previousLevel: number;
  newLevel: number;
  levelUp: boolean;
  referenceId?: string;
  message: string;
}
```

**Error Responses:**
- `409 Conflict` - Duplicate award prevented
- `429 Too Many Requests` - Daily limit or cooldown active
- `400 Bad Request` - Invalid parameters
- `500 Internal Server Error` - Server error

### GET `/api/xp/auto-reward`

Get available XP reward configurations.

**Query Parameters:**
- `action` (optional) - Get specific action config

**Response:**
```typescript
{
  actions: Array<{
    action: string;
    xpAmount: number;
    category: string;
    description: string;
    enabled: boolean;
    maxPerDay?: number;
    cooldown?: number;
  }>
}
```

---

## 🛡️ Duplicate Prevention

The system automatically prevents duplicate XP awards using `referenceId`:

```typescript
// First call - awards XP
await awardXP({
  walletAddress: '0x123...',
  action: 'FEEDBACK_APPROVED',
  referenceId: 'feedback-abc-123'
}); // ✅ Success: 50 XP awarded

// Second call - prevented
await awardXP({
  walletAddress: '0x123...',
  action: 'FEEDBACK_APPROVED',
  referenceId: 'feedback-abc-123'
}); // ❌ 409 Conflict: Already awarded
```

**Best Practices:**
- Always include `referenceId` for actions that should only happen once
- Use unique IDs like database record IDs
- For time-based actions (daily login), use date-based IDs: `login_${YYYY-MM-DD}`

---

## 📊 Activity Tracking

All XP awards are logged in the `user_activity` table:

```sql
SELECT 
  wallet_address,
  activity_type,
  metadata->>'xp_amount' as xp,
  metadata->>'action' as action,
  metadata->>'reason' as reason,
  created_at
FROM user_activity
WHERE activity_type = 'xp_awarded'
ORDER BY created_at DESC;
```

---

## 🎨 Adding New XP Rewards

### Step 1: Add to Configuration

Edit `src/lib/xp-rewards-config.ts`:

```typescript
export const XP_REWARDS = {
  // ... existing rewards ...
  
  YOUR_NEW_ACTION: {
    action: 'your_new_action',
    xpAmount: 75,
    category: 'achievement',
    description: 'Description of the action',
    enabled: true,
    maxPerDay: 3,  // Optional
    cooldown: 24   // Optional (hours)
  }
}
```

### Step 2: Use in Your Code

```typescript
await awardXP({
  walletAddress: user.wallet,
  action: 'YOUR_NEW_ACTION',
  referenceId: 'unique-id'
});
```

That's it! No API changes needed.

---

## 📈 Level System

XP translates to levels automatically:
- **Formula**: `level = floor(totalXP / 1000) + 1`
- **Examples**:
  - 0-999 XP → Level 1
  - 1000-1999 XP → Level 2
  - 5000-5999 XP → Level 6

The system automatically detects level-ups and includes them in the response.

---

## ✅ Testing

### Test XP Award

```bash
curl -X POST http://localhost:3000/api/xp/auto-reward \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0x1234567890",
    "action": "FEEDBACK_APPROVED",
    "referenceId": "test-feedback-123"
  }'
```

### Test Duplicate Prevention

Run the same request twice - second one should return 409 Conflict.

### View XP Config

```bash
curl http://localhost:3000/api/xp/auto-reward
```

---

## 🎯 Current Status

✅ **Completed:**
- XP configuration system with 20+ actions
- Auto-reward API with duplicate prevention
- Daily limits and cooldown management
- Helper utilities for easy integration
- Feedback approval XP integration
- Activity logging and history
- Level up detection
- Comprehensive documentation

✅ **Integrated:**
- Feedback approval system (awards 50 XP)
- Feedback implementation (awards 100 XP)

🔜 **Ready to Integrate:**
- Course completion XP
- Bounty submission/approval XP
- Daily login bonuses
- Streak rewards
- Chat engagement XP
- Profile completion XP
- Referral system XP

---

## 💬 Example Real-World Usage

```typescript
// ===== In Your Feedback Component =====
import { awardXP, showXPNotification } from '@/lib/xp-reward-helper';

async function submitFeedback(feedback: string, category: string) {
  // Submit feedback to database
  const feedbackId = await saveFeedbackToDB(feedback, category);
  
  // Award XP for submission
  const result = await awardXP({
    walletAddress: currentUser.wallet,
    action: 'FEEDBACK_SUBMITTED',
    referenceId: feedbackId,
    metadata: { category }
  });

  if (result.success) {
    // Show notification to user
    showXPNotification({
      xpAmount: result.xpAwarded,
      reason: result.reason!,
      levelUp: result.levelUp,
      newLevel: result.newLevel
    });
  }
}

// ===== Listen for XP Awards (in your UI component) =====
useEffect(() => {
  const handleXPAward = (event: CustomEvent) => {
    const { xpAmount, reason, levelUp, newLevel } = event.detail;
    
    toast.success(`+${xpAmount} XP - ${reason}`);
    
    if (levelUp) {
      toast.success(`🎉 Level Up! You're now level ${newLevel}!`, {
        duration: 5000
      });
    }
  };

  window.addEventListener('xpAwarded', handleXPAward as EventListener);
  return () => {
    window.removeEventListener('xpAwarded', handleXPAward as EventListener);
  };
}, []);
```

---

## 🎉 Summary

You now have a **production-ready, automatic XP reward system** that:

1. ✅ Awards XP automatically when users perform actions
2. ✅ Prevents duplicate rewards
3. ✅ Enforces daily limits and cooldowns
4. ✅ Tracks complete XP history
5. ✅ Detects level-ups
6. ✅ Is easy to integrate anywhere in your app
7. ✅ Is fully extensible with new reward types

**To award XP for any new action:**
1. Add it to `XP_REWARDS` config
2. Call `awardXP()` with the action name
3. Done! ✨

---

Made with ❤️ for Hoodie Academy

