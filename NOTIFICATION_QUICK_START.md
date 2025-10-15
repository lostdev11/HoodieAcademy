# 🚀 Notification System - Quick Start

## 3-Minute Setup Guide

### Step 1: Run Database Script (1 minute)

1. Open **Supabase Dashboard** → **SQL Editor**
2. Copy & paste `setup-notification-tracking.sql`
3. Click **Run**
4. ✅ Done!

---

### Step 2: Build App (1 minute)

```bash
npm run build
```

Wait for build to complete...

---

### Step 3: Test It (1 minute)

1. Refresh your app (`Ctrl + Shift + R`)
2. Connect your wallet
3. ✅ **See red badges on navigation items!**

---

## 🎯 What You'll See

### As a User
```
📚 Courses        [12] ← Red badge = 12 new courses
💰 Bounties       [5]  ← 5 new bounties
```

### As an Admin
```
📝 Submissions    [7]  ← 7 pending submissions
👥 Users          [15] ← 15 new users (last 7 days)
✋ Live Sessions   [3]  ← 3 students waiting permission
```

---

## 🔔 How It Works

1. **Auto-detects** new content (last 7 days)
2. **Shows red badges** with counts
3. **Auto-refreshes** every 30-60 seconds
4. **Clears badges** when you visit section

---

## 🧪 Quick Test

### Create New Content
```sql
-- In Supabase SQL Editor
INSERT INTO bounties (title, short_desc, reward, reward_type, status, hidden)
VALUES ('Test Bounty', 'Test description', '100', 'XP', 'active', false);
```

### See the Badge
1. Refresh app
2. Look at Bounties in sidebar
3. ✅ Red badge appears!

---

## 🎨 What It Looks Like

### Desktop Sidebar
```
┌──────────────────────────┐
│ 🏠 Home                  │
│ 📊 Dashboard             │
│ 📚 Courses          [12] │ ← Red badge
│ 💰 Bounties         [5]  │ ← Red badge
│ ⭐ Leaderboard           │
└──────────────────────────┘
```

### Admin Dashboard
```
┌────────────────────────────────┐
│ Overview | Submissions [7] | ... │ ← Badges on tabs
└────────────────────────────────┘
```

---

## ⚙️ Customization

### Change Time Window (Default: 7 days)

Edit `setup-notification-tracking.sql`:
```sql
-- Change from 7 to 14 days
WHERE created_at > NOW() - INTERVAL '14 days'
```

### Change Refresh Rate

**Admin Dashboard** (`admin-dashboard/page.tsx`):
```typescript
setInterval(refreshCounts, 30000); // 30 seconds
```

**User Sidebar** (`DashboardSidebar.tsx`):
```typescript
setInterval(fetchNotifications, 60000); // 60 seconds
```

### Change Badge Color

Edit `NotificationBadge.tsx`:
```typescript
// Red (default)
bg-gradient-to-br from-red-500 to-red-600

// Blue
bg-gradient-to-br from-blue-500 to-blue-600

// Purple
bg-gradient-to-br from-purple-500 to-pink-600
```

---

## 🚨 Troubleshooting

### No Badges Showing?

**Check wallet connected:**
```javascript
console.log(localStorage.getItem('walletAddress'));
```

**Test API:**
```
http://localhost:3000/api/notifications/counts?wallet=YOUR_WALLET&is_admin=false
```

**Check database:**
```sql
SELECT COUNT(*) FROM bounties 
WHERE created_at > NOW() - INTERVAL '7 days';
```

---

## 📊 Badge Types

| Icon | Meaning | Who Sees It |
|------|---------|-------------|
| 🔴 [5] | 5 new items | Everyone |
| 🔴 [99+] | 99+ items | Everyone |
| 🔴 • | New (no count) | Everyone |

---

## ✅ Testing Checklist

- [ ] Badges appear on items with new content
- [ ] Counts are correct
- [ ] Clicking item clears badge
- [ ] Auto-refresh works (wait 60 sec)
- [ ] Admin sees admin-only badges
- [ ] Mobile responsive

---

## 💡 Pro Tips

1. **Clear All Badges**: Visit each section once
2. **Test Admin**: Use your admin wallet
3. **Force Refresh**: `Ctrl + Shift + R`
4. **Check Console**: Look for API errors
5. **Monitor Network**: See refresh calls

---

## 🎬 Done!

Your notification system is **live**! 

Badges will automatically appear when:
- ✅ New courses are published
- ✅ New bounties are created
- ✅ New events are added
- ✅ Submissions need approval (admin)
- ✅ Students request permission (admin)

**No more work needed!** 🎉

