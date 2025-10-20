# Squad Activity API System 📊

Comprehensive API system for tracking squad activity, performance metrics, member engagement, and real-time analytics.

## 🎯 Overview

The Squad Activity API provides detailed insights into squad performance, including:
- Squad XP totals and trends
- Member activity and engagement
- Bounty completions
- Social feed activity
- Top contributors
- Squad rankings
- Activity breakdowns

## 📦 API Endpoints

### 1. `/api/squad/activity` - Squad Activity & Stats

**Method:** GET

**Query Parameters:**
```typescript
{
  squad: string;                    // Required: Squad name
  period?: 'day' | 'week' | 'month' | 'all';  // Default: 'week'
  includeMembers?: boolean;         // Default: false
}
```

**Response:**
```typescript
{
  success: true,
  squad: {
    name: string;
    rank: number;                   // Current squad rank
    totalRanks: number;             // Total number of squads
  },
  stats: {
    // Member Stats
    totalMembers: number;
    activeMembers: number;          // Active in last 7 days
    activeMemberRate: number;       // Percentage active
    
    // XP Stats
    squadTotalXP: number;           // All-time squad XP
    periodXP: number;               // XP earned in period
    averageXPPerMember: number;
    
    // Activity Stats
    completedBounties: number;
    pendingBounties: number;
    socialPosts: number;
    socialComments: number;
    socialReactions: number;
    totalEngagement: number;
    
    // Period Info
    period: string;
    periodStart: string;
    periodEnd: string;
  },
  topContributors: Array<{
    walletAddress: string;
    displayName: string;
    xpEarned: number;               // XP earned in period
    totalXP: number;
    level: number;
  }>,
  activityBreakdown: Record<string, number>,  // Activity by type
  activityTrend: Array<{
    date: string;
    xp: number;
  }>,
  recentActivity: Array<{
    walletAddress: string;
    displayName: string;
    actionType: string;
    xpAmount: number;
    timestamp: string;
  }>,
  squadRankings: Array<{           // Top 5 squads
    squad: string;
    totalXP: number;
    rank: number;
  }>,
  members?: Array<...>              // If includeMembers=true
}
```

**Example:**
```typescript
// Get this week's activity for Creators squad
const response = await fetch('/api/squad/activity?squad=Creators&period=week');
const data = await response.json();

console.log(`Creators earned ${data.stats.periodXP} XP this week!`);
console.log(`Top contributor: ${data.topContributors[0].displayName}`);
```

**Method:** POST

**Body:**
```typescript
{
  squad: string;                    // Required
  walletAddress: string;            // Required
  activityType: string;             // Required
  metadata?: object;                // Optional
}
```

**Response:**
```typescript
{
  success: boolean;
  message: string;
  activity?: object;
  logged: boolean;
}
```

**Example:**
```typescript
// Log a custom squad activity
await fetch('/api/squad/activity', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    squad: 'Creators',
    walletAddress: wallet,
    activityType: 'course_completed',
    metadata: { courseId: 'solana-101' }
  })
});
```

### 2. `/api/squad/leaderboard` - Squad Rankings

**Method:** GET

**Query Parameters:**
```typescript
{
  limit?: number;                   // Default: 10, Max: 100
  includeMembers?: boolean;         // Default: false
}
```

**Response:**
```typescript
{
  success: true,
  squads: Array<{
    name: string;
    totalXP: number;
    memberCount: number;
    activeMembers: number;
    activeMemberRate: number;       // Percentage
    averageXP: number;
    averageLevel: number;
    rank: number;
    topMembers?: Array<{            // If includeMembers=true
      walletAddress: string;
      displayName: string;
      totalXP: number;
      level: number;
      streak: number;
    }>;
  }>,
  totalSquads: number,
  generatedAt: string;
}
```

**Example:**
```typescript
// Get top 5 squads with their top members
const response = await fetch('/api/squad/leaderboard?limit=5&includeMembers=true');
const data = await response.json();

data.squads.forEach(squad => {
  console.log(`${squad.rank}. ${squad.name}: ${squad.totalXP} XP`);
  console.log(`  Top member: ${squad.topMembers[0].displayName}`);
});
```

## 🎨 React Components

### 1. SquadActivityCard

Comprehensive card component for displaying squad activity.

**Props:**
```typescript
interface SquadActivityCardProps {
  squad: string;
  period?: 'day' | 'week' | 'month' | 'all';
}
```

**Usage:**
```tsx
import SquadActivityCard from '@/components/squad/SquadActivityCard';

<SquadActivityCard squad="Creators" period="week" />
```

**Features:**
- 📊 Real-time stats display
- 📈 7-day activity trend chart
- 🏆 Top contributors list
- ⚡ Activity breakdown
- 🔄 Auto-refresh capability

### 2. Squad Analytics Page

Full-page squad analytics dashboard at `/squads/analytics`.

**Features:**
- View all squad rankings
- Detailed per-squad analytics
- Tabbed interface for each squad
- Top contributors
- Activity trends
- Member engagement stats

## 📊 Tracked Metrics

### Member Metrics
- **Total Members**: Count of all squad members
- **Active Members**: Members active in last 7 days
- **Active Member Rate**: Percentage of active members

### XP Metrics
- **Squad Total XP**: Sum of all member XP
- **Period XP**: XP earned in selected period
- **Average XP per Member**: Total XP / Member count
- **XP Trend**: Daily XP earned over last 7 days

### Activity Metrics
- **Completed Bounties**: Approved bounty submissions
- **Pending Bounties**: Bounties awaiting approval
- **Social Posts**: Posts created by squad members
- **Social Comments**: Comments posted
- **Social Reactions**: Likes/dislikes given
- **Total Engagement**: Posts + Comments + Reactions

### Rankings
- **Squad Rank**: Position among all squads
- **Top Contributors**: Members who earned most XP in period

## 🚀 Usage Examples

### Example 1: Display Squad Stats in Dashboard
```tsx
'use client';

import { useState, useEffect } from 'react';

export default function MySquadStats({ squad }: { squad: string }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const loadStats = async () => {
      const response = await fetch(`/api/squad/activity?squad=${squad}&period=week`);
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
      }
    };
    
    loadStats();
  }, [squad]);

  if (!stats) return <div>Loading...</div>;

  return (
    <div>
      <h3>{squad} Squad</h3>
      <p>Members: {stats.activeMembers}/{stats.totalMembers}</p>
      <p>Weekly XP: {stats.periodXP}</p>
      <p>Bounties Completed: {stats.completedBounties}</p>
    </div>
  );
}
```

### Example 2: Get Squad Rankings
```tsx
const response = await fetch('/api/squad/leaderboard?limit=5');
const data = await response.json();

data.squads.forEach((squad, index) => {
  console.log(`#${index + 1}: ${squad.name} - ${squad.totalXP} XP`);
});
```

### Example 3: Track Top Contributors
```tsx
const response = await fetch('/api/squad/activity?squad=Creators&period=week');
const data = await response.json();

console.log('This Week\'s Top Contributors:');
data.topContributors.forEach((contributor, index) => {
  console.log(`${index + 1}. ${contributor.displayName}: +${contributor.xpEarned} XP`);
});
```

### Example 4: Monitor Activity Trend
```tsx
const response = await fetch('/api/squad/activity?squad=Decoders&period=week');
const data = await response.json();

data.activityTrend.forEach(day => {
  console.log(`${day.date}: ${day.xp} XP`);
});
```

## 🔧 Database Schema

### Required Tables

**users table** (already exists):
```sql
- squad (text)
- total_xp (integer)
- level (integer)
- last_active (timestamp)
```

**xp_transactions table** (already exists):
```sql
- wallet_address (text)
- xp_amount (integer)
- action_type (text)
- created_at (timestamp)
```

**submissions table** (already exists):
```sql
- wallet_address (text)
- status (text)
- created_at (timestamp)
```

**social_posts, social_comments, social_reactions** (optional):
```sql
- wallet_address (text)
- created_at (timestamp)
```

### Optional Table

**squad_activity_log** (for detailed tracking):
```sql
CREATE TABLE squad_activity_log (
  id UUID PRIMARY KEY,
  squad TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  activity_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW()
);
```

Run `setup-squad-activity-log.sql` to create this table.

## 📈 Performance Optimizations

### 1. Caching
The API aggregates data from multiple tables. Consider caching results:

```typescript
// Cache for 5 minutes
const cacheKey = `squad_activity_${squad}_${period}`;
const cached = cache.get(cacheKey);
if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
  return cached.data;
}
```

### 2. Indexes
Ensure indexes exist on:
- `users.squad`
- `users.last_active`
- `xp_transactions.wallet_address`
- `xp_transactions.created_at`
- `submissions.wallet_address`

### 3. Pagination
For large squads, use pagination:
```typescript
const response = await fetch(
  `/api/squad/activity?squad=Creators&period=week&limit=50&offset=0`
);
```

## 🎯 Integration with Existing Systems

### XP System Integration
Squad activity automatically tracks XP earned through the existing XP system:
- Daily login bonuses
- Bounty completions
- Course completions
- Social feed activity

### Social Feed Integration
If social feed tables exist, the API tracks:
- Posts created by squad members
- Comments posted
- Reactions given
- Total engagement score

### Bounty System Integration
Tracks bounty submissions and approvals for squad members.

## 📱 UI Components Usage

### In User Dashboard
```tsx
// Squad Section now uses live data
<SquadSection 
  userSquad={userSquad}
  stats={stats}
  walletAddress={walletAddress}
/>
```

### Standalone Analytics Page
```tsx
// Access at /squads/analytics
<SquadActivityCard squad="Creators" period="week" />
```

## 🔐 Security & Permissions

### Public Access
- ✅ Anyone can view squad statistics
- ✅ Squad rankings are public
- ✅ Activity trends are public

### Private Data
- ❌ Individual wallet addresses are anonymized in public views
- ❌ Admin-only features require authentication
- ✅ RLS policies protect sensitive data

## 📊 Analytics Features

### 1. Activity Trend (7-day chart)
Shows XP earned each day for the last week

### 2. Top Contributors
Lists top 10 members who earned most XP in the period

### 3. Activity Breakdown
Shows XP earned by action type:
- `BOUNTY_COMPLETED`
- `COURSE_COMPLETED`
- `DAILY_LOGIN`
- `SOCIAL_POST_CREATED`
- etc.

### 4. Squad Comparison
View your squad's rank vs other squads

### 5. Real-time Stats
- Total members
- Active member count
- Weekly XP goal progress
- Bounty completion rate
- Social engagement

## 🚨 Error Handling

### Squad Not Found
```json
{
  "error": "Squad name is required"
}
```

### No Members
If a squad has no members, returns zeros:
```json
{
  "stats": {
    "totalMembers": 0,
    "squadTotalXP": 0,
    ...
  }
}
```

### Social Tables Not Found
API gracefully handles missing social tables:
```typescript
socialPosts: 0,
socialComments: 0,
socialReactions: 0
```

## 🎉 Features Summary

✅ **Real-time squad statistics**  
✅ **Member activity tracking**  
✅ **XP trend analysis**  
✅ **Top contributors leaderboard**  
✅ **Squad vs squad rankings**  
✅ **Bounty completion tracking**  
✅ **Social engagement metrics**  
✅ **7-day activity charts**  
✅ **Automatic data aggregation**  
✅ **Multiple time periods**  
✅ **Optional detailed member lists**  
✅ **Activity breakdown by type**  

## 📝 Squad Activity Dashboard

### Navigation
Access squad analytics at:
- `/squads/analytics` - Full analytics dashboard
- User Dashboard → Squad tab - Personal squad stats

### Features
1. **Squad Rankings** - See all 5 squads ranked by total XP
2. **Per-Squad View** - Detailed analytics for each squad
3. **Activity Trends** - Visual charts of XP earned
4. **Top Contributors** - Recognize high performers
5. **Engagement Metrics** - Track social and bounty activity

## 🔄 Data Updates

### Real-time Updates
Squad stats are calculated in real-time from:
- `users` table (members, XP, levels)
- `xp_transactions` table (XP activity)
- `submissions` table (bounty completions)
- `social_*` tables (posts, comments, reactions)

### Refresh
Use the refresh button to get latest data:
```typescript
const response = await fetch(`/api/squad/activity?squad=${squad}&_t=${Date.now()}`);
```

## 🎯 Use Cases

### 1. Squad Competitions
Track weekly XP to determine winning squad

### 2. Member Motivation
Show top contributors to encourage participation

### 3. Squad Health
Monitor active member rate to identify inactive squads

### 4. Activity Analytics
Understand what activities drive the most engagement

### 5. Squad Recruiting
Show squad stats to attract new members

## 🛠️ Setup Instructions

### 1. Required (Already exists):
- ✅ `users` table with squad field
- ✅ `xp_transactions` table
- ✅ `submissions` table

### 2. Optional (Enhanced tracking):
Run `setup-squad-activity-log.sql` to create activity log table.

### 3. Navigation Links
Squad analytics is accessible from:
- Dashboard sidebar → "Squad Analytics" (if added)
- Direct URL: `/squads/analytics`
- Squad tab in user dashboard shows live stats

## 📈 Future Enhancements

Potential additions:
- Squad challenges and competitions
- Squad achievement badges
- Weekly squad reports
- Squad activity notifications
- Cross-squad comparisons
- Historical trend analysis
- Predictive analytics
- Squad growth tracking

---

**Ready to use!** The squad activity API provides comprehensive insights into squad performance and member engagement! 🚀

