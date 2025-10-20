# Social Feed Admin Moderation System 🛡️

Complete admin moderation system for managing social feed posts, comments, and user-generated content in Hoodie Academy.

## 🎯 Overview

The Social Feed Admin System provides comprehensive moderation tools to:
- View all posts (including hidden, flagged, and rejected posts)
- Moderate content with one-click actions
- Track engagement analytics
- Monitor community activity
- Enforce community guidelines

## 📦 Components

### 1. Admin API (`/api/admin/social`)

#### GET - Fetch Posts for Moderation
Retrieve all social posts with advanced filtering.

**Query Parameters:**
```typescript
{
  adminWallet: string;      // Required: Admin's wallet address
  limit?: number;           // Optional: Max posts (default: 50, max: 200)
  offset?: number;          // Optional: Pagination offset (default: 0)
  status?: string;          // Optional: Filter by moderation_status
  flagged?: boolean;        // Optional: Show only flagged posts
}
```

**Response:**
```typescript
{
  success: true,
  posts: Post[],
  stats: {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
    flagged: number;
    hidden: number;
  },
  pagination: {
    limit: number;
    offset: number;
    total: number;
  }
}
```

#### POST - Moderate a Post
Perform moderation actions on a specific post.

**Body:**
```typescript
{
  adminWallet: string;     // Required: Admin's wallet
  postId: string;          // Required: Post ID to moderate
  action: string;          // Required: 'approve' | 'reject' | 'hide' | 'unhide' | 'pin' | 'unpin' | 'delete'
  reason?: string;         // Optional: Moderation reason
}
```

**Actions:**
- `approve`: Approve post and make it visible
- `reject`: Reject post and hide it
- `hide`: Hide post from public view
- `unhide`: Make hidden post visible again
- `pin`: Pin post to top of feed
- `unpin`: Remove pin from post
- `delete`: Permanently delete post (cannot be undone)

**Response:**
```typescript
{
  success: true,
  message: string;
  post?: Post;             // Updated post (except for delete)
  action: string;          // Action performed
}
```

#### PATCH - Get Analytics
Retrieve social feed analytics and statistics.

**Body:**
```typescript
{
  adminWallet: string;     // Required: Admin's wallet
}
```

**Response:**
```typescript
{
  success: true,
  analytics: {
    totalPosts: number;
    totalComments: number;
    totalReactions: number;
    topPosters: Array<{
      wallet: string;
      postCount: number;
    }>;
  }
}
```

### 2. SocialFeedManager Component

React component for admin dashboard that provides a comprehensive moderation interface.

**Features:**
- 📊 Real-time statistics dashboard
- 🔍 Advanced filtering by status (all, approved, pending, rejected, flagged)
- 👤 User information display
- 📈 Engagement metrics (likes, dislikes, comments)
- ⚡ One-click moderation actions
- 📝 Moderation reason tracking
- 🔄 Auto-refresh capability

**Props:**
```typescript
interface SocialFeedManagerProps {
  adminWallet: string;     // Admin's wallet address
}
```

## 🚀 Usage

### Setting Up Admin Dashboard

The Social Feed Manager is already integrated into your admin dashboard at `/admin-dashboard`.

Navigate to the **Social Feed** tab to access moderation tools.

### Moderating Content

#### 1. View All Posts
```typescript
// Posts are automatically fetched when you open the Social Feed tab
// Use filter buttons to view specific categories:
- All Posts
- Approved
- Pending
- Rejected
- Flagged
```

#### 2. Approve a Post
```typescript
// Click the "Approve" button on any post
// This will:
// - Set moderation_status to 'approved'
// - Make the post visible to all users
// - Remove any hidden flags
```

#### 3. Reject a Post
```typescript
// Click the "Reject" button on any post
// This will:
// - Set moderation_status to 'rejected'
// - Hide the post from public view
// - Add a default rejection reason
```

#### 4. Hide/Unhide a Post
```typescript
// Click the "Hide" or "Unhide" button
// Useful for temporarily removing content without rejecting it
```

#### 5. Pin/Unpin a Post
```typescript
// Click the "Pin" or "Unpin" button
// Pinned posts appear at the top of the feed
```

#### 6. Delete a Post
```typescript
// Click the "Delete" button
// ⚠️ WARNING: This permanently deletes the post and cannot be undone
// Confirmation dialog will appear
```

## 📊 Statistics Dashboard

The admin panel displays real-time statistics:

```typescript
📈 Stats Overview:
- Total Posts: All posts in the system
- Approved Posts: Posts that passed moderation
- Pending Posts: Posts awaiting moderation
- Rejected Posts: Posts that were rejected
- Flagged Posts: Posts reported by users
- Hidden Posts: Posts temporarily hidden

📊 Analytics:
- Total Comments: Engagement metric
- Total Reactions: Likes + Dislikes
- Active Posters: Number of users posting
```

## 🔐 Security & Permissions

### Admin Verification
All admin endpoints verify admin status before allowing actions:

```typescript
async function verifyAdmin(adminWallet: string): Promise<boolean> {
  // Checks users.is_admin = true in database
  // Returns false if not admin
}
```

### RLS Policies
The system respects Supabase RLS policies for:
- Read access (admins can see hidden posts)
- Write access (only post owners and admins can modify)
- Delete access (only admins can delete)

## 🎨 UI Features

### Post Card Display
Each post shows:
- 👤 Author information (display name, level, squad)
- 🏷️ Status badges (Approved, Pending, Rejected, Flagged, etc.)
- 📝 Post content
- 🏷️ Tags
- 💬 Engagement stats (likes, dislikes, comments)
- 🕒 Timestamp (relative time)
- 📋 Moderation reason (if any)

### Color Coding
- 🟢 Green: Approved posts
- 🟡 Yellow: Pending posts / Pinned posts
- 🔴 Red: Rejected posts
- 🟠 Orange: Flagged posts
- ⚪ Gray: Hidden posts

## 🔄 Workflow Example

### Typical Moderation Flow:

1. **Review Pending Posts**
   - Filter by "Pending" status
   - Review content for policy violations

2. **Handle Flagged Content**
   - Filter by "Flagged" status
   - Review user reports
   - Approve legitimate content
   - Reject violations

3. **Pin Important Content**
   - Find high-quality posts
   - Pin to feature at top of feed
   - Unpin after relevance expires

4. **Clean Up Spam**
   - Identify spam or low-quality posts
   - Reject or hide as needed
   - Delete persistent spam

## 📱 Mobile Responsive

The admin interface is fully responsive:
- Dropdown selector on mobile (<640px)
- Button tabs on desktop (≥640px)
- Cards stack on mobile
- Actions wrap to multiple rows

## 🔧 Database Schema

Posts are stored with moderation metadata:

```sql
social_posts (
  id,
  wallet_address,
  content,
  moderation_status ('pending' | 'approved' | 'rejected'),
  is_hidden boolean,
  is_reported boolean,
  is_pinned boolean,
  moderated_by text,
  moderated_at timestamp,
  moderation_reason text,
  ...
)
```

## 🛠️ API Integration Examples

### Fetch All Flagged Posts
```typescript
const response = await fetch(
  `/api/admin/social?adminWallet=${wallet}&flagged=true`
);
const data = await response.json();
```

### Approve a Post
```typescript
const response = await fetch('/api/admin/social', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    adminWallet: wallet,
    postId: 'post-id-here',
    action: 'approve'
  })
});
```

### Get Analytics
```typescript
const response = await fetch('/api/admin/social', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ adminWallet: wallet })
});
const data = await response.json();
```

## 🎯 Best Practices

### Moderation Guidelines
1. **Be Consistent**: Apply rules fairly to all users
2. **Document Reasons**: Always provide moderation reasons
3. **Review Regularly**: Check pending posts daily
4. **Handle Reports Quickly**: Address flagged content within 24 hours
5. **Communicate**: Use moderation reasons to educate users

### Performance Tips
1. **Use Filters**: Don't load all posts at once
2. **Paginate**: Use offset/limit for large datasets
3. **Refresh Strategically**: Only refresh when needed
4. **Cache Results**: Browser caches recent views

## 🚨 Common Issues & Solutions

### Issue: Can't see moderation actions
**Solution:** Ensure your wallet has `is_admin = true` in the database.

### Issue: Posts not loading
**Solution:** Check that the `social_posts` table exists and RLS policies are properly configured.

### Issue: Moderation action fails
**Solution:** Verify admin permissions and check browser console for errors.

### Issue: Stats not updating
**Solution:** Click the "Refresh" button to fetch latest data.

## 🎉 Features Summary

✅ **Complete moderation workflow**
✅ **Real-time statistics**
✅ **Advanced filtering**
✅ **One-click actions**
✅ **Analytics dashboard**
✅ **Mobile responsive**
✅ **Secure admin-only access**
✅ **Audit trail (moderated_by, moderated_at)**
✅ **User information display**
✅ **Engagement metrics**

## 📝 Next Steps

1. Monitor the feed regularly
2. Establish community guidelines
3. Train additional moderators if needed
4. Set up alerts for flagged content
5. Review analytics to identify trends

---

**Need Help?** The system is fully integrated and ready to use. Access it from your admin dashboard under the "Social Feed" tab!

