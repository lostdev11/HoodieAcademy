# 🌟 Social Feed System - Complete Documentation

## Overview

A fully-featured social feed system for Hoodie Academy where users can create posts, comment, reply, and react with likes/dislikes. The system includes automatic XP rewards for engagement and is integrated with the user system.

---

## ✨ Features

- ✅ **Post Creation** - Users can create text posts (up to 5000 characters)
- ✅ **Comments & Replies** - Nested comments with unlimited depth
- ✅ **Reactions** - Like/Dislike posts and comments
- ✅ **Real-time Counters** - Automatic likes, dislikes, and comment counts
- ✅ **Filtering & Sorting** - Sort by newest, popular, or trending
- ✅ **Squad Integration** - Filter by squad
- ✅ **Tags** - Tag posts with topics
- ✅ **XP Rewards** - Automatic XP for posts, comments, and likes
- ✅ **Moderation** - Built-in moderation system
- ✅ **User Profiles** - Display names, levels, and squads
- ✅ **Delete Own Content** - Users can delete their own posts/comments

---

## 📦 What Was Built

### 1. **Database Schema** (`setup-social-feed.sql`)

#### Tables Created:

**`social_posts`** - Main posts table
- Content, post type (text/image/link/poll)
- Engagement metrics (likes, dislikes, comments count)
- Moderation status
- Tags and squad filtering
- Author info

**`social_comments`** - Comments and replies
- Nested comments support (parent_comment_id)
- Likes/dislikes
- Threaded conversations

**`social_reactions`** - Likes/dislikes tracking
- Multiple reaction types (like, dislike, love, fire, rocket)
- One reaction per user per target
- Automatic counter updates via triggers

**`social_post_views`** - View tracking (optional)
- Track who viewed what posts
- Analytics and recommendations

#### Features:
- ✅ **Automatic counters** via database triggers
- ✅ **Row Level Security (RLS)** for data protection
- ✅ **Cascade deletes** - deleting a post deletes all comments/reactions
- ✅ **Indexes** for fast queries

### 2. **API Routes**

#### Posts API (`/api/social/posts`)

**GET** - Fetch posts
```typescript
GET /api/social/posts?limit=20&offset=0&sort=newest&squad=Decoders
```

Query params:
- `limit` - Posts per page (default: 20, max: 50)
- `offset` - Pagination offset
- `squad` - Filter by squad
- `wallet` - Filter by wallet address
- `tags` - Filter by tags (comma-separated)
- `sort` - Sort order ('newest', 'popular', 'trending')

**POST** - Create post
```typescript
POST /api/social/posts
{
  "walletAddress": "0x123...",
  "content": "My first post!",
  "postType": "text",
  "tags": ["web3", "learning"],
  "squad": "Decoders"
}
```
Awards 5 XP automatically ✨

**DELETE** - Delete post
```typescript
DELETE /api/social/posts?id=post-id&wallet=0x123...
```
Only the author can delete their posts.

#### Comments API (`/api/social/comments`)

**GET** - Fetch comments
```typescript
GET /api/social/comments?postId=post-id
```
Returns nested comments with author info.

**POST** - Create comment
```typescript
POST /api/social/comments
{
  "walletAddress": "0x123...",
  "postId": "post-id",
  "content": "Great post!",
  "parentCommentId": "comment-id" // Optional for replies
}
```
Awards 3 XP automatically ✨

**DELETE** - Delete comment
```typescript
DELETE /api/social/comments?id=comment-id&wallet=0x123...
```

#### Reactions API (`/api/social/reactions`)

**GET** - Get user's reactions
```typescript
GET /api/social/reactions?wallet=0x123...&targetType=post&targetId=post-id
```

**POST** - Add/update reaction
```typescript
POST /api/social/reactions
{
  "walletAddress": "0x123...",
  "targetType": "post",
  "targetId": "post-id",
  "reactionType": "like"
}
```

Reaction types:
- `like` - Standard like
- `dislike` - Dislike
- `love` - Heart reaction
- `fire` - Fire emoji 🔥
- `rocket` - Rocket emoji 🚀

Awards 1 XP to the content creator (not the person reacting) ✨

**DELETE** - Remove reaction
```typescript
DELETE /api/social/reactions?wallet=0x123...&targetType=post&targetId=post-id
```

### 3. **UI Components**

#### Social Feed Page (`/social`)

**Features:**
- Create new posts with character counter
- View all posts in a feed
- Sort by newest, popular, or trending
- Filter by squad
- Refresh button
- Responsive design

**URL:** `https://yourdomain.com/social`

#### PostCard Component

**Features:**
- Author info with avatar, name, level, squad
- Post content with formatting
- Tags display
- Like/dislike buttons (with counts)
- Comment button (shows count)
- Expandable comments section
- Reply to comments
- Delete own posts
- Real-time counter updates

---

## 🎁 XP Rewards Integration

The social feed automatically awards XP for engagement:

| Action | XP | Max Per Day | When Awarded |
|--------|----|-----------  |--------------|
| Create Post | 5 XP | 10 posts | Immediately on post creation |
| Post Comment | 3 XP | 20 comments | Immediately on comment |
| Post Gets Liked | 1 XP | 50 likes | When someone likes your post |
| Comment Gets Liked | 1 XP | 50 likes | When someone likes your comment |

**XP is awarded to:**
- Post/comment creators get XP when their content is liked
- Users get XP for creating posts and comments
- All XP awards have duplicate prevention
- Daily limits prevent farming

---

## 🚀 Usage Examples

### Create a Post (Frontend)

```typescript
const createPost = async () => {
  const response = await fetch('/api/social/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      walletAddress: user.wallet,
      content: 'Just completed my first Web3 course! 🚀',
      postType: 'text',
      tags: ['web3', 'learning', 'milestone'],
      squad: user.squad
    })
  });

  const data = await response.json();
  if (data.success) {
    console.log('Post created!', data.post);
    // User automatically gets 5 XP
  }
};
```

### Like a Post

```typescript
const likePost = async (postId: string) => {
  const response = await fetch('/api/social/reactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      walletAddress: user.wallet,
      targetType: 'post',
      targetId: postId,
      reactionType: 'like'
    })
  });

  const data = await response.json();
  if (data.success) {
    // Post creator gets 1 XP
    // Reaction is toggled (clicking again removes it)
  }
};
```

### Add a Comment

```typescript
const addComment = async (postId: string, content: string) => {
  const response = await fetch('/api/social/comments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      walletAddress: user.wallet,
      postId,
      content
    })
  });

  const data = await response.json();
  if (data.success) {
    console.log('Comment posted!', data.comment);
    // User automatically gets 3 XP
  }
};
```

### Reply to a Comment

```typescript
const replyToComment = async (postId: string, parentCommentId: string, content: string) => {
  const response = await fetch('/api/social/comments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      walletAddress: user.wallet,
      postId,
      parentCommentId, // This makes it a reply
      content
    })
  });

  const data = await response.json();
  if (data.success) {
    // Nested reply created + 3 XP
  }
};
```

---

## 📊 Database Schema Details

### social_posts Table

```sql
CREATE TABLE social_posts (
  id UUID PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  content TEXT NOT NULL, -- 1-5000 chars
  post_type TEXT DEFAULT 'text',
  
  -- Media
  image_url TEXT,
  link_url TEXT,
  
  -- Counters (auto-updated by triggers)
  likes_count INTEGER DEFAULT 0,
  dislikes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  
  -- Moderation
  is_pinned BOOLEAN DEFAULT false,
  is_hidden BOOLEAN DEFAULT false,
  moderation_status TEXT DEFAULT 'approved',
  
  -- Metadata
  squad TEXT,
  tags TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### social_comments Table

```sql
CREATE TABLE social_comments (
  id UUID PRIMARY KEY,
  post_id UUID REFERENCES social_posts(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES social_comments(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  content TEXT NOT NULL, -- 1-2000 chars
  
  likes_count INTEGER DEFAULT 0,
  dislikes_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### social_reactions Table

```sql
CREATE TABLE social_reactions (
  id UUID PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  target_type TEXT NOT NULL, -- 'post' or 'comment'
  target_id UUID NOT NULL,
  reaction_type TEXT NOT NULL, -- 'like', 'dislike', etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- One reaction per user per target
  UNIQUE(wallet_address, target_type, target_id)
);
```

---

## 🎨 UI Components Structure

```
/social
├── page.tsx                    # Main social feed page
└── /components/social
    └── PostCard.tsx           # Individual post card
```

### PostCard Props

```typescript
interface PostCardProps {
  post: Post;                  // Post data
  currentWallet: string;       // Current user's wallet
  onDelete: (postId: string) => void; // Delete callback
}
```

---

## 🔒 Security & Moderation

### Row Level Security (RLS)

- Users can only **edit/delete** their own posts and comments
- Anyone can **view** approved posts
- Reactions are tied to wallet addresses
- Automatic SQL injection protection

### Moderation Features

Built-in moderation system:
- `moderation_status`: pending, approved, rejected, flagged
- `is_hidden`: Hide posts without deleting
- `is_pinned`: Pin important posts to top
- `is_reported`: Flag for admin review

### Admin Features (Coming Soon)

- Moderate posts/comments
- Ban users
- Pin/unpin posts
- View analytics

---

## 🎯 Testing

### 1. Setup Database

Run the SQL script:
```bash
psql your_database < setup-social-feed.sql
```

### 2. Test API Endpoints

**Create a post:**
```bash
curl -X POST http://localhost:3000/api/social/posts \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0x1234567890",
    "content": "My first post!",
    "postType": "text",
    "tags": ["test"]
  }'
```

**Get posts:**
```bash
curl http://localhost:3000/api/social/posts?limit=10&sort=newest
```

**Like a post:**
```bash
curl -X POST http://localhost:3000/api/social/reactions \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0x1234567890",
    "targetType": "post",
    "targetId": "post-uuid",
    "reactionType": "like"
  }'
```

### 3. Visit the Feed

Navigate to: `http://localhost:3000/social`

---

## 🚀 Future Enhancements

### Phase 2 (Easy to Add)

- [ ] Image uploads
- [ ] Link previews
- [ ] Edit posts/comments
- [ ] Polls
- [ ] @mentions
- [ ] Hashtag search

### Phase 3 (Advanced)

- [ ] Real-time updates (WebSockets)
- [ ] Notifications
- [ ] Direct messages
- [ ] Groups/communities
- [ ] Rich media embeds
- [ ] Trending topics algorithm

---

## 📈 Performance Optimization

### Already Optimized:

✅ **Database indexes** on frequently queried columns
✅ **Denormalized counters** (likes, comments) for fast display
✅ **Pagination** to limit query size
✅ **Triggers** for automatic counter updates
✅ **Cascade deletes** to maintain data integrity

### Recommended:

- Add caching for frequently accessed posts
- Implement infinite scroll for better UX
- Add CDN for image hosting
- Use Redis for real-time features

---

## 💡 Tips & Best Practices

### For Users:

- Keep posts under 1000 characters for better engagement
- Use relevant tags to help others find your content
- Be respectful - moderation is active
- Earn XP by engaging with the community

### For Developers:

- Always validate wallet ownership before mutations
- Use transactions for operations that affect multiple tables
- Implement rate limiting to prevent spam
- Monitor XP rewards to prevent farming
- Use optimistic UI updates for better UX

---

## 🎉 Summary

You now have a **complete social feed system** with:

✅ Posts, comments, and reactions
✅ Automatic XP rewards for engagement
✅ Beautiful, responsive UI
✅ Secure API with RLS
✅ Nested comments (Reddit-style)
✅ Real-time counter updates
✅ Squad and tag filtering
✅ Moderation system ready for admins
✅ Full TypeScript type safety

**Access the feed at:** `/social`

**Start posting and earning XP!** 🚀

---

Made with ❤️ for Hoodie Academy

