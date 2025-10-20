# 🚀 Social Feed - Quick Setup Guide

## 📋 Prerequisites

Before you start, make sure you have:
- ✅ Supabase project set up
- ✅ User authentication working
- ✅ XP system installed

---

## ⚡ Quick Setup (5 Minutes)

### Step 1: Run Database Setup

Run the SQL script in your Supabase SQL Editor:

```bash
# Copy the contents of setup-social-feed.sql
# Paste into Supabase SQL Editor
# Click "Run"
```

This creates:
- `social_posts` table
- `social_comments` table
- `social_reactions` table
- `social_post_views` table
- All triggers and indexes

### Step 2: Install Dependencies

The social feed uses `date-fns` for time formatting. Install it:

```bash
npm install date-fns
```

### Step 3: Verify API Routes

The following API routes should now work:
- `/api/social/posts` - Posts management
- `/api/social/comments` - Comments management
- `/api/social/reactions` - Likes/dislikes

### Step 4: Access the Feed

Navigate to: **`/social`**

That's it! Your social feed is live! 🎉

---

## 🧪 Test It Out

### 1. Create Your First Post

1. Go to `/social`
2. Type something in the text box
3. Click "Post"
4. You'll get **+5 XP**!

### 2. Like a Post

1. Click the heart icon on any post
2. The post creator gets **+1 XP**
3. Click again to unlike

### 3. Comment on a Post

1. Click the comment icon to expand
2. Write a comment
3. Click send
4. You get **+3 XP**!

---

## 🎨 Customization Options

### Change XP Rewards

Edit `src/lib/xp-rewards-config.ts`:

```typescript
SOCIAL_POST_CREATED: {
  action: 'social_post_created',
  xpAmount: 5,        // Change this
  maxPerDay: 10       // Change daily limit
}
```

### Change Post Character Limit

Edit `src/app/api/social/posts/route.ts`:

```typescript
if (content.length < 1 || content.length > 5000) {
  // Change 5000 to your preferred limit
}
```

### Add to Navigation

Edit your navigation component to add a link to `/social`:

```typescript
<Link href="/social">
  <Button>🌟 Social Feed</Button>
</Link>
```

---

## 📊 Monitor Your Feed

### View All Posts

```sql
SELECT 
  p.*,
  u.display_name as author_name
FROM social_posts p
LEFT JOIN users u ON p.wallet_address = u.wallet_address
ORDER BY created_at DESC
LIMIT 50;
```

### Get Engagement Stats

```sql
SELECT 
  COUNT(*) as total_posts,
  SUM(likes_count) as total_likes,
  SUM(comments_count) as total_comments
FROM social_posts;
```

### Find Top Posts

```sql
SELECT 
  content,
  likes_count,
  comments_count,
  wallet_address
FROM social_posts
ORDER BY likes_count DESC
LIMIT 10;
```

---

## 🎯 XP Rewards Summary

| Action | XP | Max Per Day |
|--------|-----|------------|
| Create Post | 5 XP | 10 posts |
| Comment on Post | 3 XP | 20 comments |
| Your Post Gets Liked | 1 XP | 50 likes |
| Your Comment Gets Liked | 1 XP | 50 likes |

All XP rewards have **duplicate prevention** and **daily limits** to prevent farming.

---

## 🚨 Troubleshooting

### "Failed to create post"

**Solution:** Check that the wallet address exists in the `users` table.

### "Comments not loading"

**Solution:** Check that the post ID is valid and the post exists.

### "XP not being awarded"

**Solution:** 
1. Check the XP API is running at `/api/xp/auto-reward`
2. Check the console for XP award errors
3. Verify the action exists in `xp-rewards-config.ts`

### "Reactions not updating"

**Solution:** Check database triggers are created correctly:
```sql
SELECT * FROM pg_trigger 
WHERE tgname LIKE '%reaction%' OR tgname LIKE '%comment%';
```

---

## 🎉 You're All Set!

Your social feed is now live with:

✅ Posts, comments, and replies
✅ Like/dislike functionality
✅ Automatic XP rewards
✅ Beautiful UI
✅ Mobile responsive

**Next Steps:**
1. Customize the UI colors to match your brand
2. Add image upload functionality
3. Implement notifications
4. Add moderation tools for admins

---

## 📚 Learn More

- [Full Documentation](./SOCIAL_FEED_SYSTEM.md)
- [XP System Docs](./AUTOMATIC_XP_REWARD_SYSTEM.md)
- [Usage Examples](./XP_USAGE_EXAMPLES.ts)

---

Need help? Check the documentation or reach out to the team! 🚀

