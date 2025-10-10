# Feedback Tracker Widget - "You Asked, We Fixed"

## Overview

The Feedback Tracker Widget is a transparency feature that displays recent improvements, bug fixes, and new features to users. It demonstrates that the platform is actively responding to user feedback and continuously improving.

## Features

### 🎯 **User-Facing Widget**
- **Real-time Updates**: Auto-refreshes every 5 minutes
- **Category-based Filtering**: Bug fixes, features, improvements, UI/UX, performance
- **Status Indicators**: Fixed, In Progress, Planned
- **Time Stamps**: "2h ago", "1d ago" for quick reference
- **Priority Sorting**: Most important updates shown first
- **Responsive Design**: Works on mobile and desktop
- **Manual Refresh**: Users can refresh to see latest updates

### 🛠️ **Admin Management Interface**
- **Create Updates**: Easy form to add new feedback items
- **Categorization**: 5 categories (bug_fix, feature, improvement, ui_ux, performance)
- **Priority System**: 0-10 priority levels for display ordering
- **Status Tracking**: Track fixes from planned → in progress → fixed
- **User Attribution**: Optional field to credit users who requested the fix
- **Visibility Control**: Show/hide updates from public view
- **Bulk Management**: View all existing updates

## Database Schema

### Table: `feedback_updates`

```sql
- id (UUID, primary key)
- title (TEXT, required) - Short title of the update
- description (TEXT, required) - Detailed description
- category (TEXT, required) - bug_fix | feature | improvement | ui_ux | performance
- status (TEXT, default: 'fixed') - fixed | in_progress | planned
- requested_by (TEXT, optional) - Wallet address or username
- fixed_date (TIMESTAMPTZ, default: NOW()) - When it was fixed
- upvotes (INTEGER, default: 0) - Future feature for user engagement
- is_active (BOOLEAN, default: true) - Show/hide from widget
- priority (INTEGER, default: 0) - Higher = shows first
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

## API Endpoints

### GET `/api/feedback-updates`

Fetch feedback updates for display in the widget.

**Query Parameters:**
- `limit` (number, default: 5) - Number of updates to return
- `category` (string, optional) - Filter by category
- `t` (timestamp) - Cache-busting parameter

**Response:**
```json
{
  "success": true,
  "updates": [
    {
      "id": "uuid",
      "title": "XP System Cache Fix",
      "description": "Fixed issue where XP awards didn't reflect...",
      "category": "bug_fix",
      "status": "fixed",
      "priority": 10,
      "fixed_date": "2025-10-09T12:00:00Z",
      "upvotes": 0
    }
  ],
  "total": 5
}
```

### POST `/api/feedback-updates`

Create a new feedback update (admin only).

**Request Body:**
```json
{
  "title": "New Feature Name",
  "description": "Detailed description...",
  "category": "feature",
  "status": "fixed",
  "requested_by": "user_wallet_address",
  "priority": 8,
  "adminWallet": "admin_wallet_address"
}
```

**Response:**
```json
{
  "success": true,
  "update": { /* created update object */ },
  "message": "Feedback update created successfully"
}
```

## Components

### `FeedbackTrackerWidget.tsx`

The main widget component displayed to users.

**Props:**
- `limit` (number, default: 5) - Number of updates to display
- `showTitle` (boolean, default: true) - Show/hide widget title
- `compact` (boolean, default: false) - Compact mode with less detail
- `className` (string) - Additional CSS classes

**Usage:**
```tsx
import FeedbackTrackerWidget from '@/components/feedback/FeedbackTrackerWidget';

// Full widget
<FeedbackTrackerWidget limit={5} showTitle={true} />

// Compact widget
<FeedbackTrackerWidget limit={3} compact={true} showTitle={false} />
```

### `FeedbackManager.tsx`

Admin interface for managing feedback updates.

**Props:**
- `walletAddress` (string, optional) - Admin wallet address

**Usage:**
```tsx
import FeedbackManager from '@/components/admin/FeedbackManager';

<FeedbackManager walletAddress={adminWallet} />
```

## Integration

### User Dashboard Integration

The widget is integrated into the main user dashboard, displayed between the stats cards and the main content tabs:

```tsx
// src/components/dashboard/UserDashboard.tsx
import FeedbackTrackerWidget from "@/components/feedback/FeedbackTrackerWidget";

// ...inside the dashboard component
<FeedbackTrackerWidget limit={5} showTitle={true} className="mb-6" />
```

### Admin Dashboard Integration

Add the `FeedbackManager` component to your admin dashboard:

```tsx
import FeedbackManager from '@/components/admin/FeedbackManager';

<FeedbackManager walletAddress={adminWalletAddress} />
```

## Setup Instructions

### 1. Run the Database Setup

Execute the SQL file to create the necessary table and initial data:

```bash
# In Supabase SQL Editor, run:
setup-feedback-tracker.sql
```

This will:
- Create the `feedback_updates` table
- Set up RLS policies (public read, admin write)
- Add indexes for performance
- Insert sample data (recent XP system fixes)

### 2. Verify Database Setup

Check that the table was created successfully:

```sql
SELECT COUNT(*) FROM feedback_updates;
SELECT * FROM feedback_updates WHERE is_active = true ORDER BY priority DESC;
```

### 3. Test the Widget

1. Start your development server: `npm run dev`
2. Navigate to the user dashboard
3. You should see the "You Asked, We Fixed" widget with sample data
4. Test the refresh button

### 4. Test Admin Interface

1. Navigate to the admin dashboard
2. Access the Feedback Manager
3. Create a new feedback update
4. Verify it appears in the widget

## Category Icons and Colors

The widget uses visual indicators for different categories:

| Category | Icon | Color |
|----------|------|-------|
| Bug Fix | 🐛 Bug | Red |
| New Feature | ✨ Sparkles | Purple |
| Improvement | 📈 TrendingUp | Blue |
| UI/UX | 🎨 Palette | Pink |
| Performance | ⚡ Zap | Yellow |

## Best Practices

### For Admins

1. **Be Specific**: Use clear, descriptive titles
2. **User-Focused Language**: Write descriptions from the user's perspective
3. **Regular Updates**: Add new updates weekly to show active development
4. **Priority Wisely**: Higher priority (8-10) for major fixes, lower (1-3) for minor tweaks
5. **Credit Users**: When applicable, mention who requested the feature
6. **Keep Active**: Archive old updates by setting `is_active = false`

### Example Update Entries

**Good:**
- Title: "Dashboard Load Time Reduced by 50%"
- Description: "Optimized data fetching to make your dashboard load twice as fast"
- Category: performance
- Priority: 9

**Bad:**
- Title: "Fixed bug"
- Description: "Made some changes"
- Category: improvement
- Priority: 5

## Customization

### Adjust Auto-Refresh Interval

In `FeedbackTrackerWidget.tsx`, modify the interval:

```tsx
// Current: 5 minutes (300000ms)
const interval = setInterval(() => {
  fetchUpdates();
}, 300000);

// Change to 10 minutes
const interval = setInterval(() => {
  fetchUpdates();
}, 600000);
```

### Change Display Limit

Modify the default limit in the widget:

```tsx
<FeedbackTrackerWidget limit={10} showTitle={true} />
```

### Customize Colors

Edit the `CATEGORY_CONFIG` in `FeedbackTrackerWidget.tsx`:

```tsx
const CATEGORY_CONFIG = {
  bug_fix: {
    icon: Bug,
    label: 'Bug Fix',
    color: 'bg-red-500/20 text-red-400 border-red-500/50' // Customize here
  },
  // ...
};
```

## Future Enhancements

- [ ] Upvote system for users to show appreciation
- [ ] Comment system for users to provide feedback on fixes
- [ ] Filter by category in the widget UI
- [ ] "View All" page with full history
- [ ] Notifications when a user's requested feature is fixed
- [ ] Integration with feedback submission form
- [ ] Analytics on most appreciated updates

## Troubleshooting

### Widget Not Showing

1. **Check Database**: Ensure the table exists and has data
   ```sql
   SELECT * FROM feedback_updates WHERE is_active = true;
   ```

2. **Check RLS Policies**: Ensure public read access is enabled
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'feedback_updates';
   ```

3. **Check API**: Test the endpoint directly
   ```bash
   curl http://localhost:3000/api/feedback-updates?limit=5
   ```

4. **Check Console**: Look for errors in browser console

### Admin Can't Create Updates

1. **Verify Admin Status**: Check that the admin user has `is_admin = true`
   ```sql
   SELECT wallet_address, is_admin FROM users WHERE wallet_address = 'YOUR_WALLET';
   ```

2. **Check API Response**: Look for error messages in the network tab

3. **Verify Environment Variables**: Ensure `SUPABASE_SERVICE_ROLE_KEY` is set

### Updates Not Refreshing

1. **Check Cache-Busting**: Ensure timestamp parameter is being added
2. **Verify Auto-Refresh**: Check that the interval is running
3. **Manual Refresh**: Use the refresh button to test

## Sample Data

The setup script includes 5 sample updates based on recent XP system fixes:

1. XP System Cache Fix (Priority: 10)
2. Admin XP Award Interface (Priority: 9)
3. Dashboard Auto-Refresh (Priority: 8)
4. Activity Logging Schema Fix (Priority: 7)
5. React Hooks Stability (Priority: 6)

These demonstrate real improvements made to the platform.

## Impact

This feature provides several benefits:

1. **Transparency**: Users see that their feedback matters
2. **Trust Building**: Demonstrates active platform development
3. **User Engagement**: Shows responsiveness to community needs
4. **Documentation**: Creates a living changelog of improvements
5. **Marketing**: Highlights new features and improvements

---

**Created**: October 9, 2025  
**Last Updated**: October 9, 2025  
**Status**: ✅ Production Ready

