# ⏰ Daily XP Cap System (300 XP/Day)

## Overview

To prevent XP farming and encourage consistent daily engagement, **users can earn a maximum of 300 XP per day** from all activities. This system promotes healthy, sustainable progression over grinding.

---

## 📊 How It Works

### Daily XP Cap
- **Maximum:** 300 XP per day
- **Resets:** Midnight UTC every day
- **Applies To:** All XP-earning activities
- **Smart Capping:** If an action would exceed the cap, XP is reduced to hit exactly 300

### Example Flow

```
User starts the day: 0/300 XP earned
✅ Complete a course: +100 XP (100/300 earned, 200 remaining)
✅ Submit a bounty: +200 XP (300/300 earned, 0 remaining)
❌ Try to post on social feed: +5 XP → BLOCKED (daily cap reached)
🌙 Next day at midnight: Reset to 0/300
```

---

## 🎯 Benefits

### For Users
✅ **Encourages Daily Visits** - Come back every day to maximize XP
✅ **Prevents Burnout** - Can't grind 10,000 XP in one sitting
✅ **Fair Playing Field** - Everyone limited to same daily amount
✅ **Consistent Progress** - Steady growth over time

### For Platform
✅ **Reduces Farming** - Prevents XP exploitation
✅ **Increases Retention** - Daily engagement metric
✅ **Better Community** - Active daily users vs inactive farmers
✅ **Sustainable Growth** - Predictable XP distribution

---

## 💻 API Integration

### Check Daily Progress

**GET** `/api/xp/auto-reward?wallet={walletAddress}`

**Response:**
```json
{
  "success": true,
  "dailyProgress": {
    "earnedToday": 150,
    "dailyCap": 300,
    "remaining": 150,
    "percentUsed": 50,
    "capReached": false
  },
  "recentActivities": [
    {
      "action": "COURSE_COMPLETED",
      "xpAmount": 100,
      "reason": "Completing a course",
      "timestamp": "2025-01-20T14:30:00Z"
    },
    {
      "action": "SOCIAL_POST_CREATED",
      "xpAmount": 5,
      "reason": "Creating a post on the social feed",
      "timestamp": "2025-01-20T15:45:00Z"
    }
  ]
}
```

### XP Award Response (Includes Daily Progress)

When you award XP, the response now includes daily progress:

```json
{
  "success": true,
  "xpAwarded": 50,
  "previousXP": 1000,
  "newTotalXP": 1050,
  "levelUp": false,
  "dailyProgress": {
    "earnedToday": 250,
    "dailyCap": 300,
    "remaining": 50,
    "percentUsed": 83
  }
}
```

### Daily Cap Reached Response

```json
{
  "success": false,
  "dailyCapReached": true,
  "message": "Daily XP cap reached (300 XP/day). Come back tomorrow!",
  "totalXPToday": 300,
  "dailyCap": 300,
  "xpRemaining": 0
}
```

### XP Automatically Capped

If an action would exceed the cap, it's automatically reduced:

```
User has earned 290 XP today
Tries to earn 50 XP from a bounty
System awards only 10 XP (to hit exactly 300)
User sees: "+10 XP (Daily cap reached)"
```

---

## 🎨 UI Components

### DailyXPProgress Component

Display daily XP progress to users:

```typescript
import DailyXPProgress from '@/components/DailyXPProgress';

// Compact version (for sidebars/headers)
<DailyXPProgress 
  walletAddress={user.wallet}
  compact={true}
/>

// Full version (for dashboard)
<DailyXPProgress 
  walletAddress={user.wallet}
  compact={false}
  showRecent={true}
/>
```

**Features:**
- Real-time progress tracking
- Visual progress bar
- XP remaining today
- Recent activities list
- Warning when cap is reached
- Automatic updates

---

## 📈 XP Earning Strategy

### Optimal Daily Routine (300 XP)

**Option 1: Course-Focused**
- Complete 2 courses: 200 XP (2×100 XP)
- Submit 1 bounty: 100 XP
- **Total:** 300 XP ✅

**Option 2: Engagement-Focused**
- Complete 1 course: 100 XP
- Give 2 feedback submissions: 20 XP (2×10 XP)
- Post 10 times on social feed: 50 XP (10×5 XP)
- Comment 20 times: 60 XP (20×3 XP)
- Daily login: 5 XP
- Get 65 post likes: 65 XP (65×1 XP)
- **Total:** 300 XP ✅

**Option 3: Bounty Hunter**
- Submit 2 bounties: 30 XP (2×15 XP)
- Win 1 bounty: 200 XP
- Post on social feed: 5 XP
- Comments: 60 XP (20×3 XP)
- Daily login: 5 XP
- **Total:** 300 XP ✅

### Time to Unlock Social Feed (1000 XP)

With 300 XP/day maximum:
- **Minimum:** 4 days (if earning full 300 XP daily)
- **Realistic:** 5-7 days (250-200 XP/day)
- **Casual:** 10-14 days (100-150 XP/day)

---

## 🛡️ Implementation Details

### Server-Side Checks

1. **Before awarding XP:**
   - Query all XP earned today
   - Calculate total
   - If >= 300: Reject with error
   - If would exceed 300: Cap to remaining amount

2. **Database Query:**
```sql
SELECT SUM((metadata->>'xp_amount')::int) as total_xp_today
FROM user_activity
WHERE wallet_address = $1
  AND activity_type = 'xp_awarded'
  AND created_at >= CURRENT_DATE;
```

3. **Capping Logic:**
```typescript
const DAILY_XP_CAP = 300;
const totalXPToday = getTotalXPToday(wallet);

if (totalXPToday >= DAILY_XP_CAP) {
  return { error: 'Daily cap reached' };
}

if (totalXPToday + xpAmount > DAILY_XP_CAP) {
  xpAmount = DAILY_XP_CAP - totalXPToday; // Cap it
}
```

---

## 🎮 Gamification Tips

### UI Messages

**When user is close to cap (80%+):**
> "You've earned 240/300 XP today! 60 XP remaining. 🔥"

**When cap is reached:**
> "Daily XP cap reached! You've maxed out at 300 XP today. Come back tomorrow for more! 🌙"

**When capped XP is awarded:**
> "+10 XP (capped to daily limit)"

### Progress Indicators

```typescript
// Color coding based on progress
const getProgressColor = (percentUsed: number) => {
  if (percentUsed >= 100) return 'text-red-400';
  if (percentUsed >= 75) return 'text-orange-400';
  if (percentUsed >= 50) return 'text-yellow-400';
  return 'text-green-400';
};
```

### Notifications

- **75% reached:** "You've earned 225 XP today! 75 XP left."
- **90% reached:** "Almost at your daily cap! 30 XP remaining."
- **100% reached:** "🎉 Daily cap reached! You've earned 300 XP today!"

---

## 📊 Analytics Queries

### Average Daily XP Per User

```sql
SELECT 
  wallet_address,
  DATE(created_at) as day,
  SUM((metadata->>'xp_amount')::int) as daily_xp
FROM user_activity
WHERE activity_type = 'xp_awarded'
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY wallet_address, DATE(created_at)
ORDER BY daily_xp DESC;
```

### Users Hitting Daily Cap

```sql
WITH daily_totals AS (
  SELECT 
    wallet_address,
    DATE(created_at) as day,
    SUM((metadata->>'xp_amount')::int) as daily_xp
  FROM user_activity
  WHERE activity_type = 'xp_awarded'
    AND created_at >= CURRENT_DATE - INTERVAL '7 days'
  GROUP BY wallet_address, DATE(created_at)
)
SELECT 
  COUNT(DISTINCT wallet_address) as users_hitting_cap,
  COUNT(*) as total_cap_days
FROM daily_totals
WHERE daily_xp >= 300;
```

### XP Distribution

```sql
SELECT 
  CASE
    WHEN daily_xp >= 300 THEN '300 (Maxed)'
    WHEN daily_xp >= 200 THEN '200-299'
    WHEN daily_xp >= 100 THEN '100-199'
    WHEN daily_xp >= 50 THEN '50-99'
    ELSE '0-49'
  END as xp_range,
  COUNT(*) as user_days
FROM (
  SELECT 
    wallet_address,
    DATE(created_at) as day,
    SUM((metadata->>'xp_amount')::int) as daily_xp
  FROM user_activity
  WHERE activity_type = 'xp_awarded'
    AND created_at >= CURRENT_DATE - INTERVAL '7 days'
  GROUP BY wallet_address, DATE(created_at)
) daily_totals
GROUP BY xp_range
ORDER BY MIN(daily_xp) DESC;
```

---

## ⚙️ Configuration

### Adjusting the Daily Cap

To change the daily XP cap, update in **one place**:

**File:** `src/app/api/xp/auto-reward/route.ts`

```typescript
// Change this constant
const DAILY_XP_CAP = 300; // Change to 500, 1000, etc.
```

That's it! The system will automatically use the new cap.

### Per-Action Limits Still Apply

Daily cap is **separate** from per-action limits:

| Action | Per-Action Limit | Daily Cap |
|--------|------------------|-----------|
| Post on social feed | 10 posts/day | Contributes to 300 |
| Comments | 20 comments/day | Contributes to 300 |
| Feedback submissions | 5 submissions/day | Contributes to 300 |
| Daily login | 1 login/day | Contributes to 300 |

**Example:**
- User can post max 10 times (50 XP)
- But if they've already earned 295 XP, they can only earn 5 more
- So effectively only 1 post counts today

---

## 🚀 Future Enhancements

### Premium Features (Coming Soon)

- [ ] **Premium Users:** 500 XP/day cap instead of 300
- [ ] **Weekend Bonus:** 400 XP/day on weekends
- [ ] **Streak Multiplier:** 350 XP/day if 7-day streak
- [ ] **Squad Bonus:** +50 XP/day for top squad
- [ ] **Dynamic Caps:** Adjust based on user level

### Seasonal Events

- [ ] **2X XP Days:** 600 XP cap on special events
- [ ] **XP Hour:** 1 hour per day with no cap
- [ ] **Challenges:** Complete challenge for +100 bonus XP

---

## 🎉 Summary

### Daily XP Cap System

✅ **300 XP maximum per day**
✅ **Resets at midnight UTC**
✅ **Smart capping** - won't waste XP
✅ **Real-time progress tracking**
✅ **Beautiful UI components**
✅ **Encourages daily engagement**
✅ **Prevents farming**

### Key Endpoints

- **Check Progress:** `GET /api/xp/auto-reward?wallet={address}`
- **Award XP:** `POST /api/xp/auto-reward` (automatically checks cap)

### Integration

```typescript
// Check if user can earn more XP today
const { dailyProgress } = await fetch(
  `/api/xp/auto-reward?wallet=${wallet}`
).then(r => r.json());

if (dailyProgress.capReached) {
  alert('Daily cap reached! Come back tomorrow.');
} else {
  alert(`${dailyProgress.remaining} XP remaining today!`);
}
```

---

**Result:** A sustainable, engaging XP system that rewards consistency over grinding! 🏆

Made with ❤️ for Hoodie Academy

