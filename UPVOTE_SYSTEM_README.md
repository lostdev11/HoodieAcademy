# 🎖️ Community Review & Upvote System

## Overview

The Community Review & Upvote System allows squadmates to upvote each other's bounty submissions using emoji reactions. This creates emotional currency and community engagement even for submissions that don't win SOL prizes.

## Features

### 🎯 Core Functionality

- **Emoji Reactions**: 6 different emoji reactions (🔥, 💎, 🚀, ⭐, ❤️, 👑)
- **Squad Favorites**: ⭐ Star reactions count as "Squad Favorites" (3+ stars = Squad Favorite badge)
- **Squad Breakdown**: See which squads are reacting to each submission
- **Toggle Functionality**: Click to upvote, click again to remove upvote
- **Real-time Updates**: Optimistic UI updates with server synchronization

### 📊 Analytics & Filtering

- **Stats Dashboard**: Total submissions, reactions, squad favorites, trending
- **Advanced Filtering**: Filter by squad, status, or search terms
- **Sorting Options**: Newest, oldest, most upvoted, squad favorites, trending
- **Trending Algorithm**: Submissions with 5+ recent reactions (24h) are "trending"

### 🏆 Emotional Currency

- **Squad Favorite Badges**: Special recognition for community favorites
- **Reaction Counts**: Visual feedback on submission popularity
- **Squad Pride**: See which squads are supporting each other
- **Community Engagement**: Lightweight interaction that builds community

## Technical Implementation

### API Endpoints

#### `POST /api/submissions/upvote`
Handles upvoting submissions with emoji reactions.

**Request Body:**
```json
{
  "submissionId": "sub_123",
  "emoji": "🔥",
  "userId": "user_456",
  "squad": "Creators"
}
```

**Response:**
```json
{
  "success": true,
  "upvotes": {
    "🔥": [
      { "userId": "user_456", "squad": "Creators", "timestamp": "2024-01-15T10:30:00.000Z" }
    ]
  },
  "totalUpvotes": 1,
  "isUpvoted": true
}
```

#### `GET /api/submissions/upvote?submissionId=sub_123`
Retrieves upvote data for a specific submission.

### Data Structure

**Submission Object:**
```json
{
  "id": "sub_1703123456789_abc123def",
  "title": "Cyber Hoodie Academy Student",
  "description": "Created a pixel art character...",
  "squad": "Creators",
  "courseRef": "v100-pixel-art-basics",
  "bountyId": "hoodie-visual",
  "author": "PixelArtist123",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "status": "approved",
  "upvotes": {
    "🔥": [
      { "userId": "user456", "squad": "Raiders", "timestamp": "2024-01-15T11:00:00.000Z" }
    ],
    "⭐": [
      { "userId": "user123", "squad": "Creators", "timestamp": "2024-01-15T11:15:00.000Z" }
    ]
  },
  "totalUpvotes": 2,
  "imageUrl": "/uploads/cyber-hoodie-student.png"
}
```

### Components

#### `SubmissionCard`
- Displays individual submission with upvote buttons
- Shows squad badges and status
- Handles upvote interactions
- Displays squad breakdown of reactions

#### `SubmissionsGallery`
- Grid layout of all submissions
- Filtering and sorting controls
- Stats dashboard
- Real-time updates

#### `UpvoteDemo`
- Demo component for testing the system
- User authentication simulation
- Squad switching functionality

### Authentication

Uses a simple `useAuth` hook for demo purposes:
- Local storage-based user session
- Squad assignment
- User ID management

## Usage

### For Users

1. **Login**: Use the demo login button to authenticate
2. **Change Squad**: Switch between Creators, Speakers, Raiders, Decoders
3. **React**: Click emoji buttons to upvote submissions
4. **Filter**: Use search and filter options to find submissions
5. **Sort**: Choose sorting method (newest, most upvoted, etc.)

### For Developers

1. **Add to Bounty Page**: Import and use `SubmissionsGallery`
2. **Customize Emojis**: Modify `EMOJI_REACTIONS` array in `SubmissionCard`
3. **Extend Analytics**: Add new stats to the dashboard
4. **Integrate Auth**: Replace demo auth with real authentication system

## Emoji Meanings

- **🔥 Fire**: General approval, good work
- **💎 Diamond**: High quality, premium content
- **🚀 Rocket**: Innovative, creative, forward-thinking
- **⭐ Star**: Squad favorite (counts toward Squad Favorite badge)
- **❤️ Heart**: Love it, emotional connection
- **👑 Crown**: Best of the best, exceptional quality

## Squad Favorite System

- Submissions with 3+ ⭐ star reactions get "Squad Favorite" badge
- Badge appears on submission card
- Counts toward overall stats
- Creates community recognition beyond SOL prizes

## Future Enhancements

- **Real-time Updates**: WebSocket integration for live reactions
- **Notification System**: Alert users when their submissions get upvoted
- **Leaderboards**: Top reactors and most upvoted creators
- **Squad Challenges**: Squad vs squad upvote competitions
- **Analytics Dashboard**: Detailed reaction analytics for admins
- **Custom Emojis**: Squad-specific emoji reactions
- **Reaction History**: Timeline of reactions on submissions

## Benefits

1. **Community Building**: Lightweight interaction that builds engagement
2. **Emotional Currency**: Recognition beyond financial rewards
3. **Squad Pride**: Cross-squad support and recognition
4. **Quality Signal**: Community-driven quality indicators
5. **Retention**: Keeps users engaged between bounty submissions
6. **Feedback Loop**: Immediate community feedback on submissions

The upvote system transforms bounty submissions from isolated entries into a vibrant community conversation, creating emotional investment and social proof that enhances the overall Hoodie Academy experience. 