# 🎁 Social Feed Trial System - Complete

## Overview

Users can now **try the Social Feed with 1 free post** before reaching the 1000 XP requirement! This gives everyone a preview of the feature while maintaining the XP unlock system.

---

## ✨ How It Works

### **Trial Users (< 1000 XP)**

**Get:**
- ✅ Full preview of the social feed
- ✅ Can see all posts from the community
- ✅ **1 FREE trial post** (no XP needed)
- ✅ Can view, but cannot like/comment (view-only after trial)

**Restrictions:**
- ❌ Only 1 post allowed (trial)
- ❌ Cannot post again until reaching 1000 XP
- ❌ Posts limited to 500 characters (vs 5000 for unlocked users)
- ❌ Trial posts don't earn XP

### **Unlocked Users (1000+ XP)**

**Get:**
- ✅ Unlimited posting
- ✅ Up to 5000 characters per post
- ✅ Earn **1 XP per post** (max 10 posts/day)
- ✅ Comment on posts (3 XP per comment)
- ✅ Like posts (creator gets 1 XP)
- ✅ Full social features

---

## 🎯 XP Rewards Updated

| Action | XP | Before | After |
|--------|----|--------|-------|
| Create Post (Unlocked) | **1 XP** | 5 XP | **Changed** |
| Trial Post | **0 XP** | N/A | **New** |
| Comment | 3 XP | 3 XP | Same |
| Post Liked | 1 XP | 1 XP | Same |

**Why the change:**
- 5 XP per post was too high
- 1 XP encourages quality over quantity
- Trial posts don't earn XP (preview only)
- Still get XP from likes on your posts

---

## 🎨 User Experience

### **Trial User Journey (< 1000 XP)**

**Step 1: Dashboard Tab**
```
User clicks "Social Feed" tab
↓
Sees preview posts (blurred)
↓
Lock overlay with "1 Free Post" input
↓
Types message and clicks "Post Trial"
↓
Post created! Message: "🎉 Trial post created! Now earn 1000 XP to unlock full access!"
↓
Trial marked as used
↓
Shows: "Trial Post Used! Earn XP to unlock"
```

**Step 2: Social Feed Page**
```
User navigates to /social
↓
Sees banner: "Trial Access • 237/1,000 XP"
Progress bar showing 23% progress
↓
Can view all posts
↓
Post input shows:
  - If trial unused: "1 free trial post available"
  - If trial used: Lock screen with "Earn XP to unlock"
```

### **Unlocked User Journey (1000+ XP)**

```
User has 1000+ XP
↓
Full access to /social
↓
No restrictions
↓
Can post unlimited (max 10/day)
↓
Earns 1 XP per post
```

---

## 💻 Technical Implementation

### 1. **Trial Post Tracking**

Uses localStorage to track trial usage:

```typescript
// Check if trial used
const trialKey = `trial_post_used_${walletAddress}`;
const hasUsed = localStorage.getItem(trialKey) === 'true';

// Mark trial as used
localStorage.setItem(trialKey, 'true');
```

### 2. **XP Checking**

Fetches user XP on page load:

```typescript
const response = await fetch(`/api/xp?wallet=${walletAddress}`);
const data = await response.json();
const isTrialUser = data.totalXP < 1000;
```

### 3. **Post Creation Logic**

```typescript
// Check if trial user trying to post again
if (isTrialUser && hasUsedTrialPost) {
  alert('Trial post used! Earn 1000 XP to unlock.');
  return;
}

// Tag trial posts
tags: isTrialUser ? ['trial'] : []
```

### 4. **UI States**

**Trial Available:**
- Pink border
- "1 Free Post" badge
- Special placeholder text
- 500 char limit

**Trial Used:**
- Gray/orange border
- "Trial Used" badge
- Lock screen with "Earn XP" CTA
- Can still view posts

**Unlocked:**
- Normal styling
- "Earn 1 XP per post" text
- 5000 char limit
- Full features

---

## 📍 Where Trial Posts Appear

### Dashboard Preview Tab

**Before Trial:**
```
┌────────────────────────────────┐
│ Blurred posts in background    │
│   ╔══════════════════════╗     │
│   ║ 🔒 Unlock at 1,000 XP ║     │
│   ║                      ║     │
│   ║ ✨ Try it! 1 Free Post║     │
│   ║ [Text Input]         ║     │
│   ║ [Post Trial Button]  ║     │
│   ╚══════════════════════╝     │
└────────────────────────────────┘
```

**After Trial:**
```
┌────────────────────────────────┐
│ Blurred posts in background    │
│   ╔══════════════════════╗     │
│   ║ ✅ Trial Post Used!  ║     │
│   ║ Earn 1,000 XP to     ║     │
│   ║ unlock unlimited     ║     │
│   ║ [Progress: 237/1000] ║     │
│   ╚══════════════════════╝     │
└────────────────────────────────┘
```

### Social Feed Page (/social)

**Trial User - Before Post:**
```
┌─────────────────────────────────────┐
│ 🔒 Trial Access • 237/1,000 XP      │
│ 1 free post available               │
│ [Progress Bar] ▓▓░░░░░░░░░ 24%      │
│ [Earn XP Button]                    │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ ✍️ Share Your Thoughts [1 Free Post]│
│ [Text Input - 500 chars]            │
│ 0/500 chars • 1 free trial post     │
│         [Post Trial Button]          │
└─────────────────────────────────────┘
```

**Trial User - After Post:**
```
┌─────────────────────────────────────┐
│ 🔒 Trial Access • 237/1,000 XP      │
│ Trial post used. Earn more XP!      │
│ [Progress Bar] ▓▓░░░░░░░░░ 24%      │
│ [Earn XP Button]                    │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ ✍️ Share Your Thoughts [Trial Used] │
│ 🔒 Trial Post Used                  │
│ Earn 763 more XP to unlock          │
│ [Start Earning XP Button]           │
└─────────────────────────────────────┘
```

**Unlocked User (1000+ XP):**
```
┌─────────────────────────────────────┐
│ ✍️ Share Your Thoughts              │
│ [Text Input - 5000 chars]           │
│ 0/5000 chars • Earn 1 XP per post   │
│              [Post Button]           │
└─────────────────────────────────────┘
```

---

## 🎮 Benefits

### **For Users:**
✅ **Try before unlock** - Experience the feature
✅ **Clear goal** - Know what they're working toward
✅ **Immediate engagement** - Can participate right away
✅ **Motivation** - See the value, want to unlock

### **For Platform:**
✅ **Increased engagement** - More users posting
✅ **Lower barrier** - Users can try without commitment
✅ **Quality control** - Still gated at 1000 XP for unlimited
✅ **Conversion** - Trial users more likely to earn XP

---

## 📊 Trial Post Statistics

Track trial usage to measure conversion:

```sql
-- Get trial post count
SELECT COUNT(*) as trial_posts
FROM social_posts
WHERE 'trial' = ANY(tags);

-- Users who used trial
SELECT COUNT(DISTINCT wallet_address) as trial_users
FROM social_posts
WHERE 'trial' = ANY(tags);

-- Trial users who unlocked (1000+ XP)
SELECT COUNT(DISTINCT p.wallet_address) as converted_users
FROM social_posts p
INNER JOIN users u ON p.wallet_address = u.wallet_address
WHERE 'trial' = ANY(p.tags)
  AND u.total_xp >= 1000;
```

---

## 🚀 Testing

### Test Trial Post (Dashboard)

1. Have < 1000 XP
2. Go to Dashboard
3. Click "Social Feed" tab
4. See blurred preview with "1 Free Post" input
5. Type message and click "Post Trial"
6. Verify post created
7. See "Trial Post Used!" message
8. Verify can't post again

### Test Trial Post (Social Page)

1. Have < 1000 XP
2. Go to `/social`
3. See trial banner at top
4. Post input shows "1 free trial post"
5. Create post
6. See "Trial post used" lock screen
7. Verify still can view posts

### Test Unlocked (1000+ XP)

1. Have 1000+ XP
2. Go to `/social`
3. No trial banner
4. Normal post input (5000 chars)
5. Create post → Get +1 XP
6. Can post up to 10 times/day

---

## 🎉 Summary

### Changes Made

1. ✅ **XP Reduced:** Posts now give **1 XP** (was 5 XP)
2. ✅ **Trial System:** Users can make **1 free post** before unlocking
3. ✅ **Dashboard Preview:** Can post trial directly from preview tab
4. ✅ **Social Feed Page:** Removed hard gate, added trial access
5. ✅ **Trial Tracking:** Uses localStorage to track usage
6. ✅ **Visual Indicators:** Banners, badges, progress bars

### User Flow

**< 1000 XP:**
- Get 1 free trial post (preview)
- Can view all posts
- Cannot post again until 1000 XP
- Clear progress tracking

**1000+ XP:**
- Unlimited posting (10/day max)
- Earn 1 XP per post
- Full social features
- Comment, like, interact

### Conversion Funnel

```
New User (0 XP)
↓
Sees Social Feed tab
↓
Clicks and sees preview
↓
Uses 1 free trial post
↓
Sees other users' conversations
↓
Motivated to earn 1000 XP
↓
Completes courses/bounties
↓
Unlocks full social feed
↓
Active community member!
```

---

**The trial system creates a perfect balance between preview and exclusivity!** 🎯

Made with ❤️ for Hoodie Academy

