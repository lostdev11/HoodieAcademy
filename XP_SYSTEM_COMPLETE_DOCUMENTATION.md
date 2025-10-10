# 🎯 Complete XP System Documentation

## Overview

The Hoodie Academy XP (Experience Points) system is a comprehensive gamification feature that tracks and rewards user engagement across the platform. This document provides complete documentation on the API endpoints, data flow, and integration with the user dashboard.

## 📊 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ UserDashboard│  │ Course Pages │  │ Admin Panel  │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
│                    ┌───────▼───────┐                        │
│                    │  useUserXP    │                        │
│                    │     Hook      │                        │
│                    └───────┬───────┘                        │
│                            │                                 │
│                    ┌───────▼───────┐                        │
│                    │  XP Service   │                        │
│                    └───────┬───────┘                        │
└────────────────────────────┬─────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────┐
│                         API Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  /api/xp     │  │/api/xp/      │  │/api/xp/      │     │
│  │  (Main API)  │  │course-       │  │daily-login   │     │
│  │              │  │completion    │  │              │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
└────────────────────────────┬─────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────┐
│                       Database Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │    users     │  │ user_activity│  │   course_    │     │
│  │  (XP & Level)│  │ (XP History) │  │ completions  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└──────────────────────────────────────────────────────────────┘
```

## 🔌 API Endpoints

### 1. Main XP API (`/api/xp`)

#### GET - Fetch User XP Data

**Endpoint:** `GET /api/xp?wallet={address}&includeHistory=true&includeCourses=true&includeBounties=true`

**Query Parameters:**
- `wallet` (required): User's wallet address
- `includeHistory` (optional): Include XP history from user_activity table
- `includeCourses` (optional): Include course completion details
- `includeBounties` (optional): Include bounty completion details

**Response:**
```json
{
  "walletAddress": "ABC123...",
  "displayName": "User123",
  "exists": true,
  "totalXP": 2500,
  "level": 3,
  "squad": "Solana Squad",
  "xpInCurrentLevel": 500,
  "xpToNextLevel": 500,
  "progressToNextLevel": 50.0,
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-15T12:30:00Z",
  "breakdown": {
    "courseXP": 1000,
    "bountyXP": 800,
    "dailyLoginXP": 200,
    "adminAwardXP": 500,
    "otherXP": 0
  },
  "xpHistory": [
    {
      "type": "course_completion",
      "xpAmount": 100,
      "reason": "Completed NFT Mastery",
      "date": "2024-01-15T12:00:00Z"
    }
  ],
  "courseCompletions": [
    {
      "course_id": "nft-mastery",
      "completed_at": "2024-01-15T12:00:00Z",
      "xp_earned": 100
    }
  ],
  "totalCoursesCompleted": 10,
  "totalCourseXP": 1000
}
```

#### POST - Award XP to User

**Endpoint:** `POST /api/xp`

**Request Body:**
```json
{
  "targetWallet": "ABC123...",
  "xpAmount": 100,
  "source": "course",
  "reason": "Completed NFT Mastery course",
  "metadata": {
    "courseId": "nft-mastery",
    "customField": "value"
  },
  "awardedBy": "AdminWalletAddress"
}
```

**Parameters:**
- `targetWallet` (required): User's wallet address
- `xpAmount` (required): Amount of XP to award
- `source` (required): One of: `course`, `bounty`, `daily_login`, `admin`, `other`
- `reason` (required): Reason for XP award
- `metadata` (optional): Additional metadata
- `awardedBy` (required if source is `admin`): Admin wallet address

**Response:**
```json
{
  "success": true,
  "user": {...},
  "xpAwarded": 100,
  "previousXP": 2400,
  "newTotalXP": 2500,
  "previousLevel": 2,
  "newLevel": 3,
  "levelUp": true,
  "source": "course",
  "reason": "Completed NFT Mastery course",
  "message": "Successfully awarded 100 XP for Completed NFT Mastery course",
  "refreshLeaderboard": true,
  "targetWallet": "ABC123...",
  "xpInCurrentLevel": 500,
  "xpToNextLevel": 500,
  "progressToNextLevel": 50.0
}
```

### 2. Course Completion API (`/api/xp/course-completion`)

**Endpoint:** `POST /api/xp/course-completion`

**Request Body:**
```json
{
  "walletAddress": "ABC123...",
  "courseId": "nft-mastery",
  "courseTitle": "NFT Mastery",
  "customXP": 150
}
```

**Response:**
```json
{
  "success": true,
  "user": {...},
  "courseId": "nft-mastery",
  "courseTitle": "NFT Mastery",
  "xpAwarded": 150,
  "newTotalXP": 2650,
  "levelUp": false,
  "message": "Course completed! +150 XP earned!",
  "refreshLeaderboard": true
}
```

**Default XP Rewards:**
- Most courses: 100 XP
- Custom XP can be specified per course

### 3. Daily Login Bonus API (`/api/xp/daily-login`)

#### POST - Claim Daily Login Bonus

**Endpoint:** `POST /api/xp/daily-login`

**Request Body:**
```json
{
  "walletAddress": "ABC123..."
}
```

**Response:**
```json
{
  "success": true,
  "user": {...},
  "xpAwarded": 5,
  "newTotalXP": 2505,
  "levelUp": false,
  "message": "Daily login bonus: +5 XP!",
  "nextAvailable": "2024-01-16T00:00:00Z",
  "refreshLeaderboard": true
}
```

**Note:** Daily bonus is 5 XP and can only be claimed once per day.

#### GET - Check Daily Login Status

**Endpoint:** `GET /api/xp/daily-login?wallet={address}`

**Response:**
```json
{
  "walletAddress": "ABC123...",
  "today": "2024-01-15",
  "alreadyClaimed": true,
  "lastClaimed": "2024-01-15T08:30:00Z",
  "nextAvailable": "2024-01-16T00:00:00Z",
  "dailyBonusXP": 5
}
```

### 4. Bounty XP API (`/api/xp/bounty`)

**Endpoint:** `POST /api/xp/bounty`

**Request Body:**
```json
{
  "targetWallet": "ABC123...",
  "xpAmount": 200,
  "reason": "Completed design bounty",
  "bountyType": "design",
  "awardedBy": "AdminWallet"
}
```

**Response:**
```json
{
  "success": true,
  "user": {...},
  "xpAwarded": 200,
  "newTotalXP": 2700,
  "levelUp": false,
  "bountyType": "design",
  "message": "Successfully awarded 200 XP for Completed design bounty",
  "refreshLeaderboard": true
}
```

### 5. Admin XP Award API (`/api/admin/xp/award`)

**Endpoint:** `POST /api/admin/xp/award`

**Request Body:**
```json
{
  "targetWallet": "ABC123...",
  "xpAmount": 500,
  "reason": "Outstanding contribution",
  "awardedBy": "AdminWallet"
}
```

**Response:**
```json
{
  "success": true,
  "user": {...},
  "xpAwarded": 500,
  "newTotalXP": 3200,
  "levelUp": true,
  "message": "Successfully awarded 500 XP to user",
  "refreshLeaderboard": true
}
```

**Note:** Requires admin authentication. The `awardedBy` wallet must have `is_admin: true` in the database.

## 🛠️ XP Service (Utility)

The `XPService` provides a centralized TypeScript/JavaScript interface for all XP operations.

### Import

```typescript
import { xpService } from '@/services/xp-service';
```

### Methods

#### 1. Get User XP

```typescript
const xpData = await xpService.getUserXP(
  walletAddress,
  {
    includeHistory: true,
    includeCourses: true,
    includeBounties: true
  }
);
```

#### 2. Award XP

```typescript
const result = await xpService.awardXP({
  targetWallet: 'ABC123...',
  xpAmount: 100,
  source: 'course',
  reason: 'Completed course',
  metadata: { courseId: 'nft-mastery' }
});
```

#### 3. Award Course XP

```typescript
const result = await xpService.awardCourseXP(
  walletAddress,
  'nft-mastery',
  'NFT Mastery',
  150 // optional custom XP
);
```

#### 4. Award Bounty XP

```typescript
const result = await xpService.awardBountyXP(
  targetWallet,
  200,
  'Completed design bounty',
  'design',
  adminWallet
);
```

#### 5. Claim Daily Login

```typescript
const result = await xpService.claimDailyLoginBonus(walletAddress);
```

#### 6. Check Daily Login Status

```typescript
const status = await xpService.checkDailyLoginStatus(walletAddress);
```

#### 7. Utility Functions

```typescript
// Calculate level from total XP
const level = xpService.calculateLevel(2500); // Returns 3

// Calculate XP to next level
const xpNeeded = xpService.calculateXPToNextLevel(2500); // Returns 500

// Calculate progress percentage
const progress = xpService.calculateProgressToNextLevel(2500); // Returns 50

// Get XP in current level
const currentLevelXP = xpService.getXPInCurrentLevel(2500); // Returns 500

// Force refresh all components
xpService.forceRefresh();

// Check if refresh is required
const needsRefresh = xpService.isRefreshRequired();
```

## 🎣 useUserXP Hook

React hook for managing XP data in components.

### Import

```typescript
import { useUserXP } from '@/hooks/useUserXP';
```

### Usage

```typescript
function MyComponent() {
  const { 
    profile,
    totalXP,
    level,
    xpInCurrentLevel,
    xpToNextLevel,
    progressToNextLevel,
    completedCourses,
    badges,
    loading,
    error,
    refresh,
    forceRefresh,
    completeCourse
  } = useUserXP(walletAddress);

  // Display XP
  return (
    <div>
      <h1>Level {level}</h1>
      <p>Total XP: {totalXP}</p>
      <progress value={progressToNextLevel} max={100} />
      <p>{xpToNextLevel} XP to next level</p>
      
      <button onClick={refresh}>Refresh XP</button>
      
      <button onClick={() => completeCourse('nft-mastery', 'NFT Mastery', 100)}>
        Complete Course
      </button>
    </div>
  );
}
```

### Returned Properties

- `profile`: Complete XP profile object
- `totalXP`: Total XP earned
- `level`: Current level
- `xpInCurrentLevel`: XP earned in current level (0-999)
- `xpToNextLevel`: XP needed for next level
- `progressToNextLevel`: Progress percentage (0-100)
- `completedCourses`: Array of completed course IDs
- `badges`: Array of badge objects with unlock status
- `breakdown`: XP breakdown by source (if available)
- `loading`: Loading state
- `error`: Error message (if any)
- `refresh()`: Manual refresh function
- `forceRefresh()`: Force global refresh
- `completeCourse(slug, title, customXP?)`: Award XP for course completion

### Auto-Refresh

The hook automatically refreshes XP data:
- Every 30 seconds
- When XP is awarded (via events)
- When force refresh is triggered
- On component mount (if refresh flag is set)

## 📱 Dashboard Integration

The user dashboard displays XP data through the `UserDashboard` component.

### XP Display Features

1. **XP Card**: Shows total XP and current level
2. **Progress Bar**: Visual progress to next level
3. **XP Breakdown**: Shows XP from different sources
4. **Recent Activity**: XP history and achievements
5. **Badges**: Unlocked and locked badges
6. **Refresh Button**: Manual refresh option

### Real-Time Updates

The dashboard automatically updates when:
- User earns XP from any source
- Admin awards XP
- Daily login bonus is claimed
- Course is completed
- Bounty is won

### Event System

The system uses custom events for real-time updates:

```typescript
// Listen for XP awards
window.addEventListener('xpAwarded', (event: CustomEvent) => {
  const { targetWallet, xpAwarded, newTotalXP, levelUp, reason } = event.detail;
  // Handle XP award
});

// Listen for XP updates
window.addEventListener('xpUpdated', (event: CustomEvent) => {
  const { targetWallet, xpAwarded, newTotalXP, reason } = event.detail;
  // Handle XP update
});

// Listen for force refresh
window.addEventListener('forceXPRefresh', () => {
  // Refresh XP data
});
```

## 💾 Database Schema

### users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  wallet_address TEXT UNIQUE NOT NULL,
  display_name TEXT,
  total_xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  squad TEXT,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### user_activity Table

```sql
CREATE TABLE user_activity (
  id UUID PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  activity_type TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Activity Types:**
- `xp_awarded` - Admin XP award
- `xp_bounty` - Bounty XP
- `course_completion` - Course XP
- `daily_login_bonus` - Daily login XP

### course_completions Table

```sql
CREATE TABLE course_completions (
  id UUID PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  course_id TEXT NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  xp_earned INTEGER DEFAULT 0,
  UNIQUE(wallet_address, course_id)
);
```

## 🎮 XP Mechanics

### Level Calculation

**Formula:** `level = floor(total_xp / 1000) + 1`

**Examples:**
- 0-999 XP: Level 1
- 1000-1999 XP: Level 2
- 2000-2999 XP: Level 3
- 5000-5999 XP: Level 6

### XP Sources & Amounts

| Source | Amount | Frequency |
|--------|--------|-----------|
| Course Completion | 50-150 XP | Once per course |
| Daily Login | 5 XP | Once per day |
| Bounty Completion | Varies | Per bounty |
| Admin Award | Custom | As needed |
| Special Events | Varies | Event-specific |

### Badges & Achievements

| Badge | Requirement | XP Required |
|-------|-------------|-------------|
| First Steps | Complete 1 course | 100 XP |
| Dedicated Learner | Complete 5 courses | 500 XP |
| XP Collector | Earn 1000 XP | 1000 XP |
| Course Master | Complete 10 courses | 1000 XP |
| Elite Hoodie | Earn 5000 XP | 5000 XP |
| Streak Master | 7-day login streak | N/A |

## 🔄 Data Flow Examples

### Example 1: User Completes a Course

```
1. User clicks "Complete Course" button
   ↓
2. Frontend calls xpService.awardCourseXP()
   ↓
3. POST /api/xp/course-completion
   ↓
4. API checks if course already completed
   ↓
5. API calculates new XP and level
   ↓
6. Database updates:
   - users.total_xp
   - users.level
   - course_completions (insert)
   - user_activity (insert)
   ↓
7. API returns success response
   ↓
8. XP Service dispatches 'xpAwarded' event
   ↓
9. useUserXP hook listens and refreshes
   ↓
10. Dashboard updates with new XP
```

### Example 2: Admin Awards XP

```
1. Admin enters XP amount and reason
   ↓
2. Frontend calls POST /api/admin/xp/award
   ↓
3. API verifies admin access
   ↓
4. API updates user XP and level
   ↓
5. API logs activity
   ↓
6. Frontend dispatches event
   ↓
7. All dashboards refresh automatically
```

### Example 3: Daily Login Bonus

```
1. User visits platform
   ↓
2. DailyLoginBonus component auto-triggers
   ↓
3. POST /api/xp/daily-login
   ↓
4. API checks if already claimed today
   ↓
5. If not claimed:
   - Award 5 XP
   - Log activity
   - Return success
   ↓
6. Dashboard shows notification
   ↓
7. XP updates automatically
```

## 🧪 Testing

### Manual Testing Checklist

- [ ] Fetch user XP data
- [ ] Award XP for course completion
- [ ] Claim daily login bonus
- [ ] Prevent duplicate daily login claims
- [ ] Award bounty XP
- [ ] Admin XP award with verification
- [ ] Level up notification
- [ ] Dashboard XP display
- [ ] Real-time XP updates
- [ ] Badge unlock notifications
- [ ] Progress bar accuracy
- [ ] XP breakdown display
- [ ] Course completion tracking
- [ ] Prevent duplicate course completions

### API Testing with cURL

```bash
# Get user XP
curl -X GET "http://localhost:3000/api/xp?wallet=ABC123&includeCourses=true"

# Award XP
curl -X POST "http://localhost:3000/api/xp" \
  -H "Content-Type: application/json" \
  -d '{
    "targetWallet": "ABC123",
    "xpAmount": 100,
    "source": "course",
    "reason": "Test XP award"
  }'

# Claim daily login
curl -X POST "http://localhost:3000/api/xp/daily-login" \
  -H "Content-Type: application/json" \
  -d '{"walletAddress": "ABC123"}'
```

## 🐛 Troubleshooting

### XP Not Updating in Dashboard

1. Check browser console for errors
2. Verify wallet address is correct
3. Check if API requests are succeeding
4. Try manual refresh button
5. Clear browser cache and reload
6. Check if event listeners are properly attached

### Daily Login Bonus Not Working

1. Check if already claimed today
2. Verify date/time on server
3. Check user_activity table for today's entry
4. Ensure timezone is correct

### Level Not Updating

1. Verify XP calculation: `level = floor(total_xp / 1000) + 1`
2. Check if database value updated
3. Verify frontend is using latest data
4. Check for caching issues

### Admin XP Award Fails

1. Verify admin status in database (`is_admin: true`)
2. Check wallet address matches
3. Verify service role key is set
4. Check API logs for errors

## 🚀 Best Practices

### For Developers

1. **Always use XP Service**: Don't call APIs directly, use `xpService` methods
2. **Handle errors**: Always wrap XP operations in try-catch
3. **Use events**: Dispatch events for real-time updates
4. **Cache wisely**: Use cache-busting for XP data
5. **Validate inputs**: Check wallet addresses and amounts
6. **Log activity**: Always log XP operations for audit trail

### For Admins

1. **Document awards**: Always provide clear reasons for XP awards
2. **Be consistent**: Use similar XP amounts for similar achievements
3. **Monitor abuse**: Check for unusual XP patterns
4. **Review regularly**: Audit XP awards and leaderboards
5. **Communicate**: Announce XP changes to users

## 📈 Future Enhancements

### Planned Features

- [ ] Streak tracking system
- [ ] XP multipliers for events
- [ ] Squad-based XP bonuses
- [ ] Leaderboard integration
- [ ] Achievement notifications
- [ ] XP history timeline
- [ ] Export XP data
- [ ] XP analytics dashboard
- [ ] Custom badge system
- [ ] XP decay for inactive users
- [ ] Referral XP bonuses
- [ ] Quest system with XP rewards

## 📞 Support

For issues or questions:
- Check troubleshooting section
- Review API responses and logs
- Contact development team
- Submit bug reports with detailed information

---

**Last Updated:** October 2024  
**Version:** 1.0.0  
**Status:** ✅ Production Ready

