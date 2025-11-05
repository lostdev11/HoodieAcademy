# Friends/Following System for Hoodie Academy

## Overview
This system allows Hoodie Academy users to follow each other, creating a social network where users can see their friends' profiles and activities.

## Features

### 1. **Follow/Unfollow Users**
- Users can follow any other user on the platform
- Unfollow anytime
- Cannot follow yourself

### 2. **Public Profiles**
- Every profile is viewable by anyone
- Access profiles via `/profile/[wallet]`
- See user's stats, achievements, and top friends

### 3. **Top Friends List**
- View the top 6 people following you on your profile
- Click on any friend to view their public profile
- Shows friend stats (followers and following counts)

## Database Schema

### Friends Table
```sql
friends (
  id UUID PRIMARY KEY,
  follower_wallet TEXT (references users),
  following_wallet TEXT (references users),
  created_at TIMESTAMPTZ
)
```

**Constraints:**
- Unique pair: One follow relationship per user pair
- Self-follow prevention
- Cascading deletes when users are deleted

**Indexes:**
- `follower_wallet` - Quick lookup of who you follow
- `following_wallet` - Quick lookup of your followers
- `created_at` - Sort by most recent
- Composite index on both wallets

## API Endpoints

### `GET /api/friends`
Get friends list for a user

**Query Parameters:**
- `wallet` (required): Wallet address
- `type` (optional): `'followers'` or `'following'` (default: `'followers'`)

**Response:**
```json
{
  "success": true,
  "friends": [...],
  "count": 6
}
```

### `POST /api/friends`
Add a follow relationship

**Body:**
```json
{
  "followerWallet": "wallet_address",
  "followingWallet": "wallet_address"
}
```

### `DELETE /api/friends`
Remove a follow relationship

**Query Parameters:**
- `follower` (required)
- `following` (required)

### `GET /api/friends/check`
Check if user A is following user B

**Query Parameters:**
- `follower` (required)
- `following` (required)

**Response:**
```json
{
  "success": true,
  "isFollowing": false
}
```

### `GET /api/friends/stats`
Get friend statistics

**Query Parameters:**
- `wallet` (required)

**Response:**
```json
{
  "success": true,
  "stats": {
    "followers": 25,
    "following": 10
  }
}
```

## UI Components

### Public Profile View (`PublicProfileView.tsx`)
- Shows user information, stats, and achievements
- Follow/Unfollow button
- Top friends list
- Clickable cards linking to other profiles

### Friends Card (`ProfileView.tsx`)
- Integrated into user's own profile
- Shows followers and following counts
- Top 6 followers displayed in grid
- Click to view any friend's public profile

## Row Level Security (RLS)

The friends table has these policies:
1. **Anyone can view** friendships
2. **Anyone can create** friendships
3. **Anyone can delete** friendships (prevents abuse by allowing users to unfollow)

## Setup Instructions

### 1. Run Database Migration
Execute the SQL file in your Supabase SQL Editor:

```bash
# In Supabase SQL Editor
-- Run setup-friends-system.sql
```

This will:
- Create the `friends` table
- Set up indexes and constraints
- Configure RLS policies
- Create helper functions

### 2. Test the System

1. Connect two different wallets
2. Go to one user's profile
3. Click "Follow" 
4. Verify the friend appears in the "Top Friends" list
5. Click on the friend card to view their public profile

## Helper Functions

### `get_friend_count(wallet)`
Returns the number of followers for a user.

### `get_following_count(wallet)`
Returns the number of people a user is following.

### `is_following(follower, following)`
Returns `true` if the first wallet is following the second.

## Future Enhancements

Potential additions:
- Friend activity feed
- Friend recommendations
- Mutual friends display
- Block users functionality
- Friend notifications
- Most popular users leaderboard

