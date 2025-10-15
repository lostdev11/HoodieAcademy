# 🎯 XP Auto-Award Integration Guide

## Where to Add Auto-Award XP

This guide shows you exactly where to integrate XP auto-awards in your existing codebase.

---

## 1. 📚 Course Completions

### File: `src/app/api/courses/[slug]/progress/route.ts`

**Add after course completion:**
```typescript
import { awardCourseCompletionXP } from '@/utils/xp-auto-award';

// When user completes a course:
if (allSectionsCompleted) {
  // ... existing completion logic ...
  
  // Auto-award XP
  await awardCourseCompletionXP(
    wallet_address,
    course_slug,
    course_title
  );
}
```

---

## 2. 💰 Bounty Approvals

### File: `src/app/api/admin/submissions/approve/route.ts`

**Add after approval:**
```typescript
import { awardBountyApprovalXP } from '@/utils/xp-auto-award';

// When admin approves bounty submission:
if (status === 'approved') {
  // ... existing approval logic ...
  
  // Auto-award XP
  const isWinner = placement === 1;
  await awardBountyApprovalXP(
    wallet_address,
    bounty_id,
    bounty_title,
    isWinner  // true = 500 XP, false = 200 XP
  );
}
```

---

## 3. 🔗 Daily Login

### File: `src/components/TokenGate.tsx`

**Add after wallet connection:**
```typescript
import { awardDailyLoginXP } from '@/utils/xp-auto-award';

// In connectWallet function:
const walletAddress = provider.publicKey!.toString();
setWalletAddress(walletAddress);

// Auto-award daily login XP
awardDailyLoginXP(walletAddress)
  .then(() => console.log('✅ Daily XP awarded'))
  .catch((err) => console.warn('Daily XP already awarded or failed', err));
```

---

## 4. 🗳️ Governance Voting

### File: `src/app/governance/page.tsx`

**Add after vote cast:**
```typescript
import { awardGovernanceVoteXP } from '@/utils/xp-auto-award';

// In handleVote function:
const handleVote = async (proposalId: string, choice: 'for' | 'against') => {
  // ... existing vote logic ...
  
  if (data.success) {
    // Auto-award XP for voting
    await awardGovernanceVoteXP(
      wallet,
      proposalId,
      proposal.title
    );
    
    alert(`✅ Vote cast and +10 XP earned!`);
  }
};
```

---

## 5. 🎓 Exam Pass

### File: `src/app/api/exams/submit/route.ts`

**Add after exam grading:**
```typescript
import { awardExamPassXP } from '@/utils/xp-auto-award';

// When user passes exam:
if (score >= passingScore) {
  // ... existing pass logic ...
  
  // Auto-award XP
  await awardExamPassXP(
    wallet_address,
    exam_id,
    exam_title,
    score  // Bonus XP for perfect score
  );
}
```

---

## 6. 🎥 Mentorship Attendance

### File: `src/app/mentorship/[id]/page.tsx`

**Add when user joins session:**
```typescript
import { awardMentorshipAttendanceXP } from '@/utils/xp-auto-award';

// When user successfully joins live session:
useEffect(() => {
  if (sessionActive && wallet && !attendanceLogged) {
    // Auto-award XP for attending
    awardMentorshipAttendanceXP(
      wallet,
      session.id,
      session.title
    );
    setAttendanceLogged(true);
  }
}, [sessionActive, wallet]);
```

---

## 7. 📝 Bounty Submission

### File: `src/app/api/bounties/[id]/submit/route.ts`

**Add after submission:**
```typescript
import { awardXP, XP_REWARDS } from '@/utils/xp-auto-award';

// When user submits bounty:
if (submissionCreated) {
  // Auto-award XP for submitting
  await awardXP({
    wallet_address: wallet_address,
    xp_amount: XP_REWARDS.BOUNTY_SUBMISSION,
    activity_type: 'bounty_submission',
    metadata: {
      bounty_id: bounty_id,
      submission_id: submission.id
    }
  });
}
```

---

## 8. 💬 User Feedback

### File: `src/app/api/user-feedback/route.ts`

**Add after feedback submitted:**
```typescript
import { awardXP, XP_REWARDS } from '@/utils/xp-auto-award';

// When user gives feedback:
if (feedbackSaved) {
  // Auto-award XP
  await awardXP({
    wallet_address: wallet_address,
    xp_amount: XP_REWARDS.GIVE_FEEDBACK,
    activity_type: 'give_feedback',
    metadata: {
      feedback_type: type,
      category: category
    }
  });
}
```

---

## 9. 🎨 Content Upload

### File: `src/app/api/upload/moderated-image/route.ts`

**Add after upload approved:**
```typescript
import { awardXP, XP_REWARDS } from '@/utils/xp-auto-award';

// When content passes moderation:
if (moderationStatus === 'approved') {
  // Auto-award XP
  await awardXP({
    wallet_address: uploader_wallet,
    xp_amount: XP_REWARDS.MODERATED_IMAGE_APPROVED,
    activity_type: 'content_approved',
    metadata: {
      image_url: image_url,
      moderation_status: 'approved'
    }
  });
}
```

---

## 10. 🏆 Squad Join

### File: `src/app/api/user-squad/route.ts`

**Add on first squad selection:**
```typescript
import { awardXP, XP_REWARDS } from '@/utils/xp-auto-award';

// When user joins squad for first time:
if (isFirstSquad) {
  // Auto-award XP
  await awardXP({
    wallet_address: wallet_address,
    xp_amount: XP_REWARDS.FIRST_SQUAD_JOIN,
    activity_type: 'squad_join',
    metadata: {
      squad: squad_name
    }
  });
}
```

---

## 📊 XP Display Integration

### Dashboard Page

**File:** `src/app/dashboard/page.tsx`

```typescript
import { XPCard } from '@/components/xp/XPDisplay';

// Add to dashboard:
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  <XPCard walletAddress={walletAddress} />
  {/* ... other stats cards ... */}
</div>
```

### Profile Page

**File:** `src/app/profile/page.tsx`

```typescript
import { XPDisplay } from '@/components/xp/XPDisplay';

// Add to profile:
<XPDisplay 
  walletAddress={walletAddress}
  variant="full"
  showLevel={true}
  showProgress={true}
  showNextLevel={true}
/>
```

### Navigation Header

**File:** `src/components/Header.tsx` or wherever you have user info

```typescript
import { XPBadge } from '@/components/xp/XPDisplay';

// Add to header:
<div className="flex items-center space-x-4">
  <XPBadge walletAddress={walletAddress} />
  <span>{wallet.slice(0,8)}...</span>
</div>
```

### Leaderboard

**File:** `src/app/leaderboard/page.tsx`

```typescript
import { XPMinimal } from '@/components/xp/XPDisplay';

// In user row:
<tr>
  <td>{rank}</td>
  <td>{username}</td>
  <td><XPMinimal walletAddress={userWallet} /></td>
</tr>
```

---

## 🔄 Event-Based Updates

### Listen for XP Changes

**Any component can listen:**
```typescript
useEffect(() => {
  const handleXPAward = (event: CustomEvent) => {
    console.log('XP awarded:', event.detail);
    // Refresh XP display, show toast, etc.
  };

  window.addEventListener('xpAwarded', handleXPAward as EventListener);
  
  return () => {
    window.removeEventListener('xpAwarded', handleXPAward as EventListener);
  };
}, []);
```

### Dispatch Custom XP Events

```typescript
// When manually updating XP:
window.dispatchEvent(new CustomEvent('xpAwarded', {
  detail: {
    wallet: walletAddress,
    amount: xpAmount,
    activity: 'custom_activity'
  }
}));
```

---

## 🎯 Best Practices

### 1. Award Immediately
```typescript
// ✅ GOOD: Award right after activity
await completeCourse(...)
await awardCourseCompletionXP(...)

// ❌ BAD: Award later or separately
await completeCourse(...)
// ... other code ...
// Award might be forgotten
```

### 2. Include Metadata
```typescript
// ✅ GOOD: Rich metadata for tracking
await awardXP({
  wallet_address: wallet,
  xp_amount: 100,
  activity_type: 'course_completion',
  metadata: {
    course_id: 'sol-101',
    course_name: 'Solana Basics',
    timestamp: new Date().toISOString()
  }
});
```

### 3. Handle Errors
```typescript
// ✅ GOOD: Silent fail for XP (don't block main flow)
try {
  await awardCourseCompletionXP(...);
} catch (err) {
  console.warn('XP award failed, but course still completed', err);
}
```

### 4. Prevent Duplicates
```typescript
// ✅ GOOD: Check before awarding
const alreadyAwarded = await checkIfXPAwarded(wallet, 'course_123');
if (!alreadyAwarded) {
  await awardCourseCompletionXP(...);
}
```

---

## 🚨 Common Issues & Fixes

### Issue: XP not updating in UI
**Solution:** Component needs `autoRefresh={true}` or manual refresh

### Issue: Duplicate XP awards
**Solution:** Use unique constraints in database or check before awarding

### Issue: Governance power still not working
**Solution:** Run `fix-xp-governance-integration.sql` in Supabase

### Issue: XP displays different values
**Solution:** All should read from `users.total_xp` - check your queries

---

## ✅ Verification

After integration, verify:
```sql
-- Check user's XP
SELECT wallet_address, total_xp, level FROM users
WHERE wallet_address = 'YOUR_WALLET';

-- Check XP activities
SELECT * FROM user_activity
WHERE wallet_address = 'YOUR_WALLET'
ORDER BY created_at DESC
LIMIT 10;

-- Test voting power
SELECT get_user_voting_power('YOUR_WALLET');
```

---

## 🎊 You're Ready!

With this integration:
- ✅ XP auto-awards on all activities
- ✅ XP displays consistently everywhere
- ✅ Governance voting power uses XP correctly
- ✅ Real-time updates work
- ✅ Performance is optimized

**Time to integrate XP auto-awards throughout your app!** 🚀

