# 🔥 Streak System - Complete Implementation

## ✅ What Was Added

Complete streak tracking system for daily login claims with leaderboards and analytics.

---

## 📊 Database Schema

### Updated `daily_logins` Table

```sql
CREATE TABLE daily_logins (
    id BIGSERIAL PRIMARY KEY,
    wallet_address TEXT NOT NULL,
    claim_utc_date DATE NOT NULL,  -- NEW: UTC date of claim
    xp_awarded INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(wallet_address, claim_utc_date)  -- Prevents duplicate claims per day
);
```

### Database Functions

1. **`calculate_user_streak(wallet_address)`**
   - Returns current active streak (consecutive days)
   - Returns 0 if user hasn't claimed today
   - Counts backwards from today until gap found

2. **`get_user_streak_stats(wallet_address)`**
   - Returns comprehensive streak statistics:
     - `current_streak` - Active streak (includes today if claimed)
     - `longest_streak` - All-time best streak
     - `total_claims` - Lifetime claim count
     - `last_claim_date` - Most recent claim date

3. **`user_claimed_yesterday(wallet_address)`**
   - Returns TRUE if user claimed yesterday
   - Used to determine if streak continues or resets

4. **`get_streak_leaderboard(limit)`**
   - Returns top users by current streak
   - Includes display names, stats, and rankings
   - Sorted by current streak DESC, then total claims DESC

---

## 🔌 API Endpoints

### 1. Daily Login with Streak

**POST /api/xp/daily-login**

Request:
```json
{
  "walletAddress": "...",
  "signature": "...",
  "nonce": "..."
}
```

Response (Success):
```json
{
  "success": true,
  "xpAwarded": 5,
  "newTotalXP": 1250,
  "previousXP": 1245,
  "levelUp": false,
  "previousLevel": 2,
  "newLevel": 2,
  "streak": 7,                    // NEW: Current streak
  "streakContinued": true,        // NEW: Did they maintain streak?
  "message": "Daily login bonus: +5 XP!",
  "lastClaimed": "2025-10-22T10:30:00Z",
  "nextAvailable": "2025-10-23T00:00:00Z",
  "refreshLeaderboard": true,
  "targetWallet": "...",
  "reason": "Daily login bonus"
}
```

### 2. Check Daily Login Status

**GET /api/xp/daily-login?wallet={wallet_address}**

Response:
```json
{
  "walletAddress": "...",
  "today": "2025-10-22",
  "alreadyClaimed": true,
  "lastClaimed": "2025-10-22T10:30:00Z",
  "nextAvailable": "2025-10-23T00:00:00Z",
  "dailyBonusXP": 5,
  "streak": {                      // NEW: Streak info
    "current": 7,
    "longest": 15,
    "totalClaims": 42,
    "lastClaimDate": "2025-10-22"
  }
}
```

### 3. Get User Streak

**GET /api/xp/streak?wallet={wallet_address}**

Response:
```json
{
  "walletAddress": "...",
  "currentStreak": 7,
  "longestStreak": 15,
  "totalClaims": 42,
  "lastClaimDate": "2025-10-22",
  "hasActiveStreak": true
}
```

### 4. Streak Leaderboard

**GET /api/xp/streak/leaderboard?limit=10**

Response:
```json
{
  "leaderboard": [
    {
      "walletAddress": "...",
      "displayName": "CryptoGamer",
      "currentStreak": 30,
      "longestStreak": 45,
      "totalClaims": 120,
      "lastClaimDate": "2025-10-22"
    },
    // ... more entries
  ],
  "count": 10,
  "timestamp": "2025-10-22T12:00:00Z"
}
```

---

## 🎮 How Streaks Work

### Streak Rules

1. **Starting a Streak**
   - Claim your first daily bonus → Streak = 1
   
2. **Continuing a Streak**
   - Claim the next day → Streak increases by 1
   - Must claim every consecutive day to maintain streak

3. **Breaking a Streak**
   - Miss a day → Streak resets to 0
   - Next claim starts a new streak at 1

4. **Streak Calculation**
   - Counts backwards from today
   - Stops at first gap in consecutive days
   - Only counts if user claimed today (active streak)

### Example Timeline

```
Day 1: Claim → Streak = 1
Day 2: Claim → Streak = 2
Day 3: Claim → Streak = 3
Day 4: Skip  → Streak = 0 (broken)
Day 5: Claim → Streak = 1 (new streak)
Day 6: Claim → Streak = 2
```

---

## 📈 Analytics Integration

### Streak Data in Analytics

The `daily_claim_analytics` table now tracks `streak_days` for every successful claim:

```sql
SELECT 
    DATE(timestamp) as date,
    AVG(streak_days) as avg_streak,
    MAX(streak_days) as max_streak,
    COUNT(*) as claims
FROM daily_claim_analytics
WHERE event_type = 'claim_success'
    AND timestamp >= NOW() - INTERVAL '7 days'
GROUP BY DATE(timestamp)
ORDER BY date DESC;
```

### Streak Distribution

View how many users have each streak length:

```sql
SELECT * FROM get_streak_distribution_today();
```

Returns:
```
streak_days | user_count | percentage
------------|------------|------------
1           | 50         | 35.21%
2           | 30         | 21.13%
3           | 20         | 14.08%
7           | 15         | 10.56%
...
```

---

## 💻 Client Integration

### Display Current Streak

```tsx
import { useState, useEffect } from 'react';

export function StreakDisplay({ walletAddress }: { walletAddress: string }) {
  const [streak, setStreak] = useState<any>(null);

  useEffect(() => {
    fetchStreak();
  }, [walletAddress]);

  const fetchStreak = async () => {
    const res = await fetch(`/api/xp/streak?wallet=${walletAddress}`);
    const data = await res.json();
    setStreak(data);
  };

  if (!streak) return <div>Loading...</div>;

  return (
    <div className="streak-card">
      <h3>🔥 Your Streak</h3>
      <div className="streak-current">
        <span className="streak-number">{streak.currentStreak}</span>
        <span className="streak-label">days</span>
      </div>
      {streak.currentStreak > 0 && (
        <p className="streak-message">
          Keep it going! Come back tomorrow to continue your streak!
        </p>
      )}
      <div className="streak-stats">
        <div>
          <span className="label">Longest:</span>
          <span className="value">{streak.longestStreak} days</span>
        </div>
        <div>
          <span className="label">Total Claims:</span>
          <span className="value">{streak.totalClaims}</span>
        </div>
      </div>
    </div>
  );
}
```

### Claim Button with Streak Feedback

```tsx
const handleClaim = async () => {
  try {
    // ... (nonce + signature logic)
    
    const response = await fetch('/api/xp/daily-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress, signature, nonce })
    });

    const result = await response.json();

    if (result.success) {
      if (result.streakContinued) {
        showNotification(
          `🔥 ${result.streak} day streak! +${result.xpAwarded} XP`
        );
      } else {
        showNotification(
          `✅ New streak started! +${result.xpAwarded} XP`
        );
      }
      
      // Refresh streak display
      await fetchStreak();
    }
  } catch (error) {
    console.error('Claim failed:', error);
  }
};
```

### Streak Leaderboard Component

```tsx
export function StreakLeaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    const res = await fetch('/api/xp/streak/leaderboard?limit=10');
    const data = await res.json();
    setLeaderboard(data.leaderboard);
  };

  return (
    <div className="leaderboard">
      <h3>🏆 Streak Leaderboard</h3>
      {leaderboard.map((entry, index) => (
        <div key={entry.walletAddress} className="leaderboard-entry">
          <span className="rank">
            {index === 0 && '🥇'}
            {index === 1 && '🥈'}
            {index === 2 && '🥉'}
            {index > 2 && `#${index + 1}`}
          </span>
          <span className="name">{entry.displayName}</span>
          <span className="streak">
            🔥 {entry.currentStreak} days
          </span>
        </div>
      ))}
    </div>
  );
}
```

---

## 🗄️ Database Migration

### Required Steps

1. **Run the streak migration:**
```bash
psql -d your_database -f setup-daily-logins-streak-support.sql
```

This migration:
- ✅ Adds `claim_utc_date` column to `daily_logins`
- ✅ Populates `claim_utc_date` from existing `created_at` timestamps
- ✅ Updates UNIQUE constraint to use `claim_utc_date`
- ✅ Creates all streak calculation functions
- ✅ Creates streak leaderboard function
- ✅ Adds proper indexes for performance

2. **Verify the migration:**
```sql
-- Check table structure
\d daily_logins

-- Test streak calculation
SELECT calculate_user_streak('test_wallet');

-- Test streak stats
SELECT * FROM get_user_streak_stats('test_wallet');

-- Test leaderboard
SELECT * FROM get_streak_leaderboard(5);
```

---

## 🧪 Testing

### Test Data Generation

```sql
-- Create test user with 7-day streak
DO $$
DECLARE
    test_wallet TEXT := 'TestUser123';
    i INTEGER;
BEGIN
    FOR i IN 0..6 LOOP
        INSERT INTO daily_logins (wallet_address, claim_utc_date, xp_awarded, created_at)
        VALUES (
            test_wallet,
            CURRENT_DATE - i,
            5,
            NOW() - (i || ' days')::INTERVAL
        )
        ON CONFLICT (wallet_address, claim_utc_date) DO NOTHING;
    END LOOP;
END $$;

-- Verify
SELECT * FROM get_user_streak_stats('TestUser123');
-- Should show: current_streak=7, longest_streak=7, total_claims=7
```

### API Testing

```bash
# Test streak endpoint
curl "http://localhost:3000/api/xp/streak?wallet=TestUser123"

# Test leaderboard
curl "http://localhost:3000/api/xp/streak/leaderboard?limit=10"

# Test daily login status with streak
curl "http://localhost:3000/api/xp/daily-login?wallet=TestUser123"
```

---

## 📊 Monitoring Queries

### Active Streaks

```sql
-- Users with active streaks
SELECT 
    wallet_address,
    calculate_user_streak(wallet_address) as streak
FROM (
    SELECT DISTINCT wallet_address 
    FROM daily_logins 
    WHERE claim_utc_date >= CURRENT_DATE - INTERVAL '30 days'
) active_users
WHERE calculate_user_streak(wallet_address) > 0
ORDER BY streak DESC
LIMIT 20;
```

### Streak Retention

```sql
-- How many users maintained their streak today
WITH yesterday_streaks AS (
    SELECT wallet_address, calculate_user_streak(wallet_address) as streak
    FROM daily_logins
    WHERE claim_utc_date = CURRENT_DATE - 1
),
today_claims AS (
    SELECT wallet_address
    FROM daily_logins
    WHERE claim_utc_date = CURRENT_DATE
)
SELECT 
    COUNT(DISTINCT ys.wallet_address) as had_streak_yesterday,
    COUNT(DISTINCT tc.wallet_address) as claimed_today,
    ROUND(100.0 * COUNT(DISTINCT tc.wallet_address) / 
          NULLIF(COUNT(DISTINCT ys.wallet_address), 0), 2) as retention_pct
FROM yesterday_streaks ys
LEFT JOIN today_claims tc ON tc.wallet_address = ys.wallet_address
WHERE ys.streak > 0;
```

### Longest Active Streaks

```sql
SELECT * FROM get_streak_leaderboard(10);
```

---

## 🎯 Gamification Ideas

### Streak Milestones

Add bonus rewards for streak milestones:

```typescript
const STREAK_BONUSES = {
  7: 50,   // 1 week: +50 XP
  14: 100, // 2 weeks: +100 XP
  30: 300, // 1 month: +300 XP
  90: 1000, // 3 months: +1000 XP
  365: 5000 // 1 year: +5000 XP
};

if (STREAK_BONUSES[newStreak]) {
  const bonus = STREAK_BONUSES[newStreak];
  // Award bonus XP
  await awardBonusXP(walletAddress, bonus, `Streak milestone: ${newStreak} days`);
}
```

### Streak Titles/Badges

```typescript
function getStreakTitle(streak: number): string {
  if (streak >= 365) return '🔥 Eternal Flame';
  if (streak >= 180) return '⚡ Unstoppable';
  if (streak >= 90) return '💪 Dedicated';
  if (streak >= 30) return '🎯 Committed';
  if (streak >= 14) return '✨ Consistent';
  if (streak >= 7) return '🌟 On Fire';
  return '🔰 Building Momentum';
}
```

### Streak Recovery

Offer a "Freeze Streak" feature (once per month):

```sql
CREATE TABLE streak_freezes (
    id BIGSERIAL PRIMARY KEY,
    wallet_address TEXT NOT NULL,
    used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    freeze_date DATE NOT NULL
);

-- Allow one freeze per 30 days
CREATE UNIQUE INDEX idx_streak_freezes_monthly
ON streak_freezes(wallet_address, DATE_TRUNC('month', used_at));
```

---

## 🚀 Performance Considerations

### Caching Strategy

Cache streak data for active users:

```typescript
// Cache streak for 5 minutes
const streakCacheKey = `streak:${walletAddress}`;
const cached = await redis.get(streakCacheKey);
if (cached) return JSON.parse(cached);

const streak = await fetchStreak(walletAddress);
await redis.setex(streakCacheKey, 300, JSON.stringify(streak));
return streak;
```

### Index Performance

The migration includes optimized indexes:

```sql
-- Fast streak calculation
CREATE INDEX idx_daily_logins_wallet_date 
ON daily_logins(wallet_address, claim_utc_date DESC);

-- Fast leaderboard queries
CREATE INDEX idx_daily_logins_recent 
ON daily_logins(claim_utc_date DESC, wallet_address);
```

---

## ✅ Implementation Checklist

- [x] Database migration (claim_utc_date column)
- [x] Streak calculation function
- [x] Streak stats function
- [x] Leaderboard function
- [x] Updated daily login API to calculate streaks
- [x] Created `/api/xp/streak` endpoint
- [x] Created `/api/xp/streak/leaderboard` endpoint
- [x] Updated GET status to include streak info
- [x] Analytics integration (streak_days tracked)
- [x] Documentation complete

---

## 📚 Files Modified/Created

### Created:
- ✅ `setup-daily-logins-streak-support.sql` - Database migration
- ✅ `src/app/api/xp/streak/route.ts` - Streak query API
- ✅ `src/app/api/xp/streak/leaderboard/route.ts` - Leaderboard API
- ✅ `STREAK_SYSTEM_COMPLETE.md` - This documentation

### Modified:
- ✅ `src/app/api/xp/daily-login/route.ts` - Added streak calculation and tracking
- ✅ `setup-daily-claim-analytics.sql` - Already tracked streak_days

---

## 🎉 Result

You now have a complete streak system with:

- ✅ Automatic streak calculation
- ✅ Streak continuation detection
- ✅ Leaderboards
- ✅ Analytics integration
- ✅ API endpoints for clients
- ✅ Performance-optimized queries
- ✅ Ready for gamification

**Users can now:**
- Build daily login streaks
- See their current and longest streaks
- Compete on leaderboards
- Get feedback on streak continuation
- View detailed streak statistics

**Admins can:**
- Monitor streak retention
- Analyze streak distribution
- Identify most dedicated users
- Tune economy based on streak data

---

**Implementation Date**: October 22, 2025  
**Status**: ✅ Complete and Production Ready  
**Next**: Deploy migration and enjoy the streaks! 🔥

