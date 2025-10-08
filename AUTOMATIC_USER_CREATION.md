# Automatic User Creation System

## Overview
The Hoodie Academy platform automatically creates user records when wallets connect. This ensures all users are properly tracked and can access features without manual setup.

## How It Works

### 1. **Wallet Connection**
When a user connects their wallet:
- The wallet address is stored in localStorage
- The user sync process is triggered automatically

### 2. **User Profile Creation**
The system uses the `SimpleUserSync` class to:
- Check if user already exists in database
- If not, create new user via `/api/users` endpoint
- Set default values:
  - `display_name`: "User {first 6 chars of wallet}..."
  - `squad`: null (assigned later through squad selection)
  - `profile_completed`: false
  - `last_active`: current timestamp

### 3. **XP Initialization**
For new users, the system can optionally:
- Create XP record with default values:
  - `total_xp`: 0
  - `bounty_xp`: 0
  - `course_xp`: 0
  - `streak_xp`: 0
  - `level`: 1

### 4. **Activity Tracking**
User connections are tracked in `user_activity` table:
- Activity type: "wallet_connected"
- Metadata includes connection timestamp and profile status

## Current Database Status

**After Test Data Cleanup:**
- ✅ 4 real users in database
- ✅ Real bounty submissions (4 total)
- ✅ Real user activity records
- ✅ No test data interfering with production

**Real Users:**
1. Kong (7vswdZFp...)
2. User qg7pNN... (qg7pNNZq...)
3. User JCUGre... (JCUGres3...)
4. Kong 1 (63B9jg8i...)

## API Endpoints

### `/api/users` (POST)
Creates or updates user records using `upsert`:
```json
{
  "wallet_address": "qg7pNN...",
  "display_name": "User qg7pNN...",
  "squad": null
}
```

### `/api/user-sync` (POST)
Syncs user data including XP and profile updates:
```json
{
  "walletAddress": "qg7pNN...",
  "updates": {
    "user": { "squad": "rangers", "profile_completed": true },
    "xp": { "total_xp": 100, "level": 2 }
  }
}
```

## User Lifecycle

1. **First Connection**
   - User connects wallet
   - System creates user record automatically
   - User gets default profile
   - Can start completing courses and bounties

2. **Squad Selection**
   - User completes squad placement test
   - Squad assignment is updated
   - `squad_test_completed` = true

3. **Profile Completion**
   - User adds bio, profile picture, etc.
   - `profile_completed` = true

4. **XP Accumulation**
   - Course completions add course_xp
   - Bounty submissions add bounty_xp
   - Daily streaks add streak_xp
   - Level increases automatically

## XP & XP Management

**Now Ready For Real Users:**
- ✅ No test data in XP tables
- ✅ Clean slate for real user XP tracking
- ✅ All new wallet connections will be tracked
- ✅ XP awards will apply to real users only

## Testing

To verify automatic user creation:
1. Connect a new wallet to the platform
2. Check `/api/users?wallet={address}` to see user record
3. User should be automatically created with default values
4. User can immediately start using platform features

## Database Tables

**Users Table:**
- `wallet_address` - Primary identifier
- `display_name` - Auto-generated or user-set
- `squad` - Null until squad selection
- `is_admin` - false by default
- `created_at` - Auto-set on creation
- `last_active` - Updated on activity

**User XP Table:**
- `wallet_address` - Links to users table
- `total_xp` - Sum of all XP types
- `bounty_xp` - XP from bounties
- `course_xp` - XP from courses
- `streak_xp` - XP from streaks
- `level` - Calculated from total_xp

**User Activity Table:**
- `wallet_address` - Links to users table
- `activity_type` - Type of activity (wallet_connected, course_completed, etc.)
- `metadata` - Additional data about activity
- `created_at` - Activity timestamp

## Next Steps

Going forward, every new user who connects their wallet will be:
1. ✅ Automatically added to the database
2. ✅ Given a default user profile
3. ✅ Ready to earn XP and complete courses
4. ✅ Tracked in user activity
5. ✅ Eligible for squad selection

The platform is now fully ready for real users! 🚀
