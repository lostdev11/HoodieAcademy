# 🚀 Robust XP System - Quick Start

## 3-Step Setup

---

## Step 1: Fix Database (2 minutes) ⚡

### Run This SQL Script in Supabase:
```
fix-xp-governance-integration.sql
```

**This fixes:**
- ✅ Governance voting power (now uses `total_xp`)
- ✅ XP column consistency
- ✅ Auto-award functions
- ✅ XP sync capabilities

---

## Step 2: Test Governance (30 seconds) 🗳️

```
1. Go to: http://localhost:3001/governance
2. Look for "Your Voting Power" card
3. Should now show:
   - HOOD Balance: X
   - XP Amount: Y  ✅ (No more error!)
   - Voting Power: Z
```

**Expected Result:**
```
⚡ Your Voting Power
Total: 5,025
- HOOD: 5,000 (50%)
- XP: 25 (50%)
```

---

## Step 3: Add XP Displays (1 minute per page) 📊

### Quick Copy-Paste Examples:

**Dashboard:**
```typescript
import { XPCard } from '@/components/xp/XPDisplay';

<XPCard walletAddress={wallet} />
```

**Profile:**
```typescript
import { XPDisplay } from '@/components/xp/XPDisplay';

<XPDisplay walletAddress={wallet} variant="full" />
```

**Header:**
```typescript
import { XPBadge } from '@/components/xp/XPDisplay';

<XPBadge walletAddress={wallet} />
```

---

## 🎯 What You Get

### 1. Unified XP System
```
users.total_xp
      ↓
Single source of truth
      ↓
Displays consistently everywhere
```

### 2. Governance Integration
```
Voting Power = (HOOD × 0.5) + (XP × 0.001 × 0.5)
```

**Example:** 10,000 HOOD + 50,000 XP = 5,025 power

### 3. Auto-Award Functions
```typescript
// Course completion
awardCourseCompletionXP(wallet, courseId, title)

// Bounty approval
awardBountyApprovalXP(wallet, bountyId, title, isWinner)

// Daily login
awardDailyLoginXP(wallet)

// Governance vote
awardGovernanceVoteXP(wallet, proposalId, title)

// Exam pass
awardExamPassXP(wallet, examId, title, score)
```

### 4. Display Components
```typescript
<XPDisplay variant="full" />     // Full card with progress
<XPCard />                        // Compact version
<XPMinimal />                     // Inline with icon
<XPBadge />                       // Just badge
```

---

## 💰 XP Rewards

| Activity | XP |
|----------|-----|
| Complete Course | 100 |
| Bounty Approved | 200 |
| Bounty Winner | 500 |
| Daily Login | 5 |
| Vote on Proposal | 10 |
| Attend Mentorship | 75 |
| Pass Exam | 150 |

---

## 🧪 Quick Test

### Test 1: Fix Governance Power
```
1. Run: fix-xp-governance-integration.sql
2. Go to: /governance
3. Check voting power card
4. ✅ Should show XP contribution!
```

### Test 2: Display XP
```typescript
// Add to any page:
import { XPCard } from '@/components/xp/XPDisplay';

<XPCard walletAddress={wallet} />
```

### Test 3: Award XP
```typescript
// Test in browser console:
fetch('/api/xp/award-auto', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    wallet_address: 'your-wallet',
    xp_amount: 100,
    activity_type: 'test',
    metadata: { test: true }
  })
}).then(r => r.json()).then(console.log);

// Should return: { success: true, result: {...} }
```

---

## 🎨 Visual Variants

### Full Card
```
┌──────────────────────────────┐
│ ⚡ Total Experience           │
│ 5,025 XP          Lvl 6      │
│ ━━━━━━━━━━━━━━━━░░░░ 50%    │
│ 475 XP to next level         │
└──────────────────────────────┘
```

### Compact Card
```
┌──────────────────────────────┐
│ ⚡ 5,025 XP       [Lvl 6]    │
│ ━━━━━━━━━━░░░░░░ 50%        │
└──────────────────────────────┘
```

### Minimal
```
⚡ 5,025 XP  [Lvl 6]
```

### Badge
```
[⚡ 5,025 XP]
```

---

## 🚨 Troubleshooting

### Governance still shows error?
```bash
# Run this in Supabase SQL Editor:
fix-xp-governance-integration.sql
```

### XP not updating?
```typescript
// Force refresh:
<XPDisplay autoRefresh={true} refreshInterval={10000} />
```

### XP displays wrong value?
```sql
-- Check database:
SELECT wallet_address, total_xp, level FROM users
WHERE wallet_address = 'YOUR_WALLET';
```

---

## ✅ Success Checklist

After running `fix-xp-governance-integration.sql`:

- [ ] Governance voting power shows XP (no error)
- [ ] XP displays show consistent values
- [ ] Can award XP via API
- [ ] XP auto-refreshes
- [ ] Level calculation correct
- [ ] Progress bar works

---

## 🎉 Done!

Your XP system is now:
- ✅ **Unified** - Single `total_xp` column
- ✅ **Governance-integrated** - Works in voting power
- ✅ **Auto-awarding** - Functions for all activities
- ✅ **Consistently displayed** - 4 component variants
- ✅ **Real-time** - Auto-refresh support

**Just run `fix-xp-governance-integration.sql` and you're live!** 🚀

