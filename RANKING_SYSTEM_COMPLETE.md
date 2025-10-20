# 🏆 Ranking & XP Gate System - Complete

## Overview

A complete ranking/leaderboard system with XP-based access control. Users are ranked based on their total XP, and certain features (like the Social Feed) require minimum XP thresholds to access.

---

## ✨ Features Built

### 1. **Leaderboard API** (`/api/leaderboard`)
- Rank users by XP
- Filter by squad
- Time-based rankings (all-time, monthly, weekly)
- Get individual user's rank
- Show nearby users
- Pagination support

### 2. **XP Gate Component** (`XPGate.tsx`)
- Block access to features until XP threshold is met
- Beautiful unlock screen with progress tracking
- Shows ways to earn XP
- Motivational messaging
- Progress bar and XP needed

### 3. **Social Feed XP Requirement**
- **1000 XP required** to access `/social`
- Automatic checking on page load
- User-friendly lock screen if insufficient XP
- Clear path to earn required XP

### 4. **Leaderboard Page** (`/leaderboard`)
- Top 50 users display
- Current user's rank highlighted
- Squad filtering
- Timeframe filtering
- Beautiful rank badges for top 3
- Responsive design

---

## 📊 XP Thresholds

### Social Feed Access
- **Required:** 1000 XP
- **Why:** Ensures users engage with courses/bounties first
- **Path to Unlock:**
  - Complete 2-3 courses (50-150 XP each)
  - Submit 2-3 bounties (15-200 XP each)
  - Daily logins for 20 days (5 XP/day)
  - Give feedback (10-100 XP each)

---

## 🎯 API Reference

### GET `/api/leaderboard`

Get ranked list of users by XP.

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `limit` | number | 100 | Users per page (max: 500) |
| `offset` | number | 0 | Pagination offset |
| `squad` | string | null | Filter by squad |
| `wallet` | string | null | Get specific user's rank |
| `timeframe` | string | 'all-time' | 'all-time', 'monthly', or 'weekly' |

**Example Requests:**

```bash
# Get top 50 users
GET /api/leaderboard?limit=50

# Get Decoders squad leaderboard
GET /api/leaderboard?squad=Decoders

# Get specific user's rank
GET /api/leaderboard?wallet=0x1234567890

# Get weekly rankings
GET /api/leaderboard?timeframe=weekly&limit=20
```

**Response (Top Users):**

```json
{
  "success": true,
  "leaderboard": [
    {
      "wallet_address": "0x123...",
      "display_name": "CryptoNinja",
      "total_xp": 5420,
      "level": 6,
      "squad": "Decoders",
      "rank": 1,
      "xpToNextLevel": 580,
      "progressToNextLevel": 42
    },
    // ... more users
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 250,
    "hasMore": true
  },
  "timeframe": "all-time",
  "squad": "all"
}
```

**Response (Specific User):**

```json
{
  "success": true,
  "user": {
    "wallet_address": "0x123...",
    "display_name": "YourName",
    "total_xp": 850,
    "level": 1,
    "squad": "Rangers",
    "rank": 42,
    "xpToNextLevel": 150,
    "progressToNextLevel": 85
  },
  "nearbyUsers": [
    // 5 users above and 5 below
  ],
  "squad": "all"
}
```

**POST `/api/leaderboard` (Stats)**

Get overall leaderboard statistics.

**Response:**

```json
{
  "success": true,
  "stats": {
    "totalUsers": 250,
    "topUser": {
      "name": "CryptoNinja",
      "xp": 5420
    },
    "averageXP": 1250,
    "totalXPAwarded": 312500
  }
}
```

---

## 🛡️ XPGate Component Usage

### Basic Usage

```typescript
import XPGate from '@/components/XPGate';

function MyProtectedFeature() {
  return (
    <XPGate
      requiredXP={1000}
      walletAddress={userWallet}
      featureName="Social Feed"
      description="Earn XP to unlock!"
    >
      {/* Your protected content here */}
      <YourFeatureComponent />
    </XPGate>
  );
}
```

### Props

```typescript
interface XPGateProps {
  children: ReactNode;         // Content to show if user has access
  requiredXP: number;          // XP threshold
  walletAddress: string;       // User's wallet
  featureName?: string;        // Feature name (default: "This Feature")
  description?: string;        // Description shown on lock screen
  redirectUrl?: string;        // Where to go if user clicks back (default: "/dashboard")
}
```

### Example: Gate a Premium Course

```typescript
<XPGate
  requiredXP={500}
  walletAddress={user.wallet}
  featureName="Advanced Trading Course"
  description="This advanced course requires 500 XP. Complete beginner courses first!"
  redirectUrl="/courses"
>
  <AdvancedTradingCourse />
</XPGate>
```

### Example: Gate Admin Features

```typescript
<XPGate
  requiredXP={5000}
  walletAddress={user.wallet}
  featureName="Elite Community"
  description="Join the elite 5000+ XP club!"
>
  <EliteCommunityFeatures />
</XPGate>
```

---

## 🎨 Leaderboard Page

### Access

Visit: **`/leaderboard`**

### Features

**Current User Rank Card:**
- Shows your current rank
- Total XP and level
- Progress to next level
- Visual progress bar

**Top Users List:**
- Top 50 users by default
- Special badges for top 3:
  - 🥇 #1: Gold crown
  - 🥈 #2: Silver medal
  - 🥉 #3: Bronze medal
- Highlight current user
- Show squad and level

**Filters:**
- **Timeframe:** All-time, monthly, weekly
- **Squad:** All squads, Decoders, Creators, Speakers, Raiders, Rangers
- Refresh button

### Responsive Design
- Mobile-friendly
- Touch-optimized
- Collapsible sidebar
- Adaptive layout

---

## 💡 Usage Examples

### Check if User Has Enough XP (Frontend)

```typescript
const checkUserXP = async (walletAddress: string, requiredXP: number) => {
  const response = await fetch(`/api/xp?wallet=${walletAddress}`);
  const data = await response.json();
  
  if (data.exists && data.totalXP >= requiredXP) {
    return true; // User has access
  }
  return false; // User needs more XP
};

// Usage
const canAccessSocialFeed = await checkUserXP(user.wallet, 1000);
if (canAccessSocialFeed) {
  // Show social feed
} else {
  // Show lock screen
}
```

### Get User's Rank

```typescript
const getUserRank = async (walletAddress: string) => {
  const response = await fetch(`/api/leaderboard?wallet=${walletAddress}`);
  const data = await response.json();
  
  if (data.success) {
    console.log(`You are rank #${data.user.rank}`);
    console.log(`Total XP: ${data.user.total_xp}`);
  }
};
```

### Display Rank Badge

```typescript
const RankBadge = ({ rank }: { rank: number }) => {
  if (rank === 1) return <span>🥇 #1</span>;
  if (rank === 2) return <span>🥈 #2</span>;
  if (rank === 3) return <span>🥉 #3</span>;
  if (rank <= 10) return <span>⭐ Top 10</span>;
  if (rank <= 100) return <span>💎 Top 100</span>;
  return <span>#{rank}</span>;
};
```

---

## 🎮 Gamification Strategy

### XP Requirements for Features

| Feature | Required XP | Reasoning |
|---------|-------------|-----------|
| **Social Feed** | 1,000 XP | Ensures basic platform engagement |
| **Advanced Courses** | 500 XP | Requires completing beginner content |
| **Elite Community** | 5,000 XP | Top tier exclusive features |
| **Course Creation** | 3,000 XP | High contributor status |
| **Governance Voting** | 2,000 XP | Established community members |

### Benefits of XP Gating

✅ **Increases Engagement** - Users complete courses/bounties first
✅ **Quality Control** - Social feed has educated users
✅ **Progression System** - Clear goals and milestones
✅ **Community Building** - Shared achievement unlocks
✅ **Reduces Spam** - Barrier to entry for low-effort users
✅ **Motivates Learning** - XP becomes valuable currency

---

## 📈 Rank Tiers & Badges

### Suggested Rank Tiers

| Rank | Tier | Badge | XP Range |
|------|------|-------|----------|
| 1-3 | 🏆 Elite Champions | Gold/Silver/Bronze | 5000+ |
| 4-10 | ⭐ Masters | Diamond Star | 3000-4999 |
| 11-50 | 💎 Experts | Purple Diamond | 2000-2999 |
| 51-100 | 🎯 Veterans | Blue Target | 1000-1999 |
| 101+ | 🌟 Members | Green Star | 0-999 |

### Implementation Example

```typescript
const getRankTier = (rank: number) => {
  if (rank <= 3) return { name: 'Elite Champion', icon: '🏆', color: 'text-yellow-400' };
  if (rank <= 10) return { name: 'Master', icon: '⭐', color: 'text-purple-400' };
  if (rank <= 50) return { name: 'Expert', icon: '💎', color: 'text-blue-400' };
  if (rank <= 100) return { name: 'Veteran', icon: '🎯', color: 'text-cyan-400' };
  return { name: 'Member', icon: '🌟', color: 'text-green-400' };
};
```

---

## 🚀 Future Enhancements

### Phase 2 (Coming Soon)

- [ ] **Rank Badges** - Visual badges for profiles
- [ ] **Rank Perks** - Special features per tier
- [ ] **Squad Rankings** - Separate leaderboards per squad
- [ ] **XP Streaks** - Bonus XP for consistency
- [ ] **Rank Decay** - Encourage ongoing engagement
- [ ] **Rank Rewards** - NFTs or tokens for top ranks
- [ ] **Historical Rankings** - Track rank changes over time

### Phase 3 (Advanced)

- [ ] **Seasonal Rankings** - Reset every quarter
- [ ] **Rank Tournaments** - Compete for prizes
- [ ] **Dynamic XP Requirements** - Adjust based on active users
- [ ] **Rank Predictions** - "X XP to reach top 10"
- [ ] **Squad Competitions** - Squad vs squad rankings
- [ ] **Rank Notifications** - Alert when you rank up/down

---

## 🧪 Testing

### Test Leaderboard API

```bash
# Get top users
curl http://localhost:3000/api/leaderboard?limit=10

# Get your rank
curl http://localhost:3000/api/leaderboard?wallet=YOUR_WALLET

# Get squad leaderboard
curl http://localhost:3000/api/leaderboard?squad=Decoders&limit=20
```

### Test XP Gate

1. Create a test user with < 1000 XP
2. Navigate to `/social`
3. Should see lock screen
4. Award yourself 1000 XP using admin tools
5. Refresh page - should now have access

### Test Leaderboard Page

1. Navigate to `/leaderboard`
2. Check your rank is displayed
3. Try different filters (squad, timeframe)
4. Verify top 3 have special badges
5. Check responsiveness on mobile

---

## 📊 SQL Queries for Analysis

### Get Top 10 Users

```sql
SELECT 
  wallet_address,
  display_name,
  total_xp,
  level,
  squad,
  RANK() OVER (ORDER BY total_xp DESC) as rank
FROM users
ORDER BY total_xp DESC
LIMIT 10;
```

### Get User's Rank

```sql
WITH ranked_users AS (
  SELECT 
    wallet_address,
    total_xp,
    RANK() OVER (ORDER BY total_xp DESC) as rank
  FROM users
)
SELECT rank
FROM ranked_users
WHERE wallet_address = 'YOUR_WALLET';
```

### Squad Leaderboard

```sql
SELECT 
  squad,
  COUNT(*) as member_count,
  AVG(total_xp) as avg_xp,
  SUM(total_xp) as total_squad_xp
FROM users
GROUP BY squad
ORDER BY total_squad_xp DESC;
```

### Users by XP Tier

```sql
SELECT 
  CASE
    WHEN total_xp >= 5000 THEN '5000+ (Elite)'
    WHEN total_xp >= 3000 THEN '3000-4999 (Master)'
    WHEN total_xp >= 2000 THEN '2000-2999 (Expert)'
    WHEN total_xp >= 1000 THEN '1000-1999 (Veteran)'
    ELSE '0-999 (Member)'
  END as tier,
  COUNT(*) as user_count
FROM users
GROUP BY tier
ORDER BY MIN(total_xp) DESC;
```

---

## 🎉 Summary

You now have a **complete ranking and XP gate system** with:

✅ **Leaderboard API** - Rank users by XP with filters
✅ **XP Gate Component** - Block features until XP threshold
✅ **Social Feed** - Requires 1000 XP to access
✅ **Leaderboard Page** - Beautiful UI showing rankings
✅ **User Rank Display** - Show individual ranks
✅ **Squad Filtering** - Separate leaderboards per squad
✅ **Time-based Rankings** - All-time, monthly, weekly
✅ **Progress Tracking** - Show XP needed to unlock
✅ **Motivational UI** - Clear path to earn XP

### Access Points

- **Leaderboard:** `/leaderboard`
- **Social Feed (1000 XP req):** `/social`
- **API:** `/api/leaderboard`

### Key Stats

- **Social Feed XP Requirement:** 1000 XP
- **Avg Time to Unlock:** 2-3 courses or 5-7 bounties
- **Top 10 Special Badges:** Gold, silver, bronze medals
- **Leaderboard Capacity:** Up to 500 users per page

---

Made with ❤️ for Hoodie Academy 🏆

