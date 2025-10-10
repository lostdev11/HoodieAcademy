# Feedback Tracker Widget - Quick Start Guide

## 🚀 Quick Setup (5 minutes)

### Step 1: Setup Database (2 minutes)

1. Open your Supabase dashboard
2. Go to the SQL Editor
3. Copy and paste the contents of `setup-feedback-tracker.sql`
4. Click "Run"
5. You should see 5 sample updates created

**Verify:**
```sql
SELECT COUNT(*) FROM feedback_updates;
-- Should return 5
```

### Step 2: Test the Widget (1 minute)

1. Ensure your dev server is running:
   ```bash
   npm run dev
   ```

2. Navigate to your user dashboard at `http://localhost:3000`

3. Look for the "You Asked, We Fixed" widget between your stats cards and the main tabs

4. You should see 5 recent updates displayed

### Step 3: Test Admin Interface (2 minutes)

1. Navigate to your admin dashboard

2. Add the Feedback Manager component to your admin page:
   ```tsx
   import FeedbackManager from '@/components/admin/FeedbackManager';
   
   // In your admin dashboard
   <FeedbackManager walletAddress={yourAdminWallet} />
   ```

3. Try creating a new feedback update

4. Check that it appears in the user-facing widget

## ✅ What You Get

### User Dashboard Widget
- ✨ Automatic display of recent fixes and improvements
- 🔄 Auto-refreshes every 5 minutes
- 📱 Responsive design (mobile-friendly)
- 🎨 Beautiful UI with category icons and colors
- ⏰ Time-based sorting ("2h ago", "1d ago")

### Admin Management
- ➕ Easy form to create new updates
- 📊 View all existing updates
- 🏷️ 5 categories: Bug Fix, Feature, Improvement, UI/UX, Performance
- 🚦 3 status levels: Fixed, In Progress, Planned
- 🔢 Priority system (0-10)
- 👤 User attribution support

## 📋 Sample Updates Included

The setup automatically creates 5 real updates from recent XP system fixes:

1. **XP System Cache Fix** - Bug fix that solved the XP display issue
2. **Admin XP Award Interface** - New admin feature for managing XP
3. **Dashboard Auto-Refresh** - Improvement to keep data fresh
4. **Activity Logging Schema Fix** - Bug fix for activity tracking
5. **React Hooks Stability** - Bug fix for dashboard rendering

## 🎯 Quick Usage Examples

### Display Widget in Any Component

```tsx
import FeedbackTrackerWidget from '@/components/feedback/FeedbackTrackerWidget';

// Full widget
<FeedbackTrackerWidget limit={5} showTitle={true} />

// Compact version
<FeedbackTrackerWidget limit={3} compact={true} showTitle={false} />

// With custom styling
<FeedbackTrackerWidget 
  limit={5} 
  showTitle={true} 
  className="my-custom-class" 
/>
```

### Create New Update (Admin)

```tsx
import FeedbackManager from '@/components/admin/FeedbackManager';

<FeedbackManager walletAddress={adminWalletAddress} />
```

## 🎨 Categories and Their Use

| Category | When to Use | Example |
|----------|-------------|---------|
| **Bug Fix** | Something was broken and now it's fixed | "Fixed XP not reflecting in dashboard" |
| **Feature** | Brand new functionality | "Added NFT profile picture support" |
| **Improvement** | Enhancement to existing feature | "Improved dashboard load speed by 50%" |
| **UI/UX** | Visual or experience changes | "Redesigned mobile navigation menu" |
| **Performance** | Speed or efficiency improvements | "Optimized database queries for faster loading" |

## 📝 Creating Your First Update

1. **Title**: Keep it short and clear (max 60 characters)
   - ✅ "Dashboard Load Time Reduced"
   - ❌ "Made some changes to the dashboard to make it faster and better"

2. **Description**: Explain what changed and why it matters
   - ✅ "Optimized data fetching to make your dashboard load twice as fast. You'll notice pages loading almost instantly now."
   - ❌ "Fixed stuff"

3. **Category**: Choose the most appropriate category

4. **Status**: 
   - Use "Fixed" for completed work
   - Use "In Progress" for ongoing work (shows users you're working on it)
   - Use "Planned" for announced future features

5. **Priority**: 
   - **8-10**: Major features or critical bug fixes
   - **5-7**: Medium improvements or common requests
   - **1-4**: Minor tweaks or niche features

## 🔧 Common Customizations

### Change Number of Displayed Updates

```tsx
// Show more updates
<FeedbackTrackerWidget limit={10} showTitle={true} />
```

### Change Auto-Refresh Interval

Edit `src/components/feedback/FeedbackTrackerWidget.tsx`:

```tsx
// Line ~75, change 300000 (5 min) to your preferred interval
const interval = setInterval(() => {
  fetchUpdates();
}, 600000); // 10 minutes
```

### Hide Older Updates

In Supabase, update the `is_active` field:

```sql
UPDATE feedback_updates 
SET is_active = false 
WHERE fixed_date < NOW() - INTERVAL '30 days';
```

## 🐛 Troubleshooting

### Widget Not Showing?

1. **Check database**:
   ```sql
   SELECT * FROM feedback_updates WHERE is_active = true;
   ```

2. **Check browser console** for errors

3. **Verify dev server is running** on port 3000

### Can't Create Updates as Admin?

1. **Verify admin status**:
   ```sql
   SELECT wallet_address, is_admin FROM users 
   WHERE wallet_address = 'YOUR_WALLET';
   ```

2. **Update admin status if needed**:
   ```sql
   UPDATE users SET is_admin = true 
   WHERE wallet_address = 'YOUR_WALLET';
   ```

## 📈 Best Practices

1. **Post regularly**: Add 1-3 updates per week to show active development
2. **Be specific**: Users appreciate knowing exactly what improved
3. **Use varied categories**: Show you're improving all aspects
4. **Archive old updates**: Keep the widget fresh by hiding updates older than 30 days
5. **Credit users**: When someone requests a feature, mention them!

## 🎉 You're Done!

Your Feedback Tracker Widget is now live and ready to use. Users will see your improvements and know that their feedback matters!

### Next Steps:
- Add your own feedback updates
- Customize the styling to match your brand
- Set up a feedback submission form (future enhancement)
- Monitor which updates get the most engagement

---

**Need Help?** Check the full documentation in `FEEDBACK_TRACKER_WIDGET.md`

