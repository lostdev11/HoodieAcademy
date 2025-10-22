# 🌟 Student of the Week - Complete System

## ✅ What Was Implemented

A complete Student of the Week system for recognizing outstanding students.

---

## 📦 Features

### Admin Features
- ✅ View current Student of the Week
- ✅ Select new Student of the Week from top performers
- ✅ See top candidates automatically (sorted by XP earned this week)
- ✅ Add custom reason and achievements
- ✅ View history of past students
- ✅ Remove current student

### Public Features
- ✅ Display current Student of the Week on dashboard
- ✅ Show profile picture, level, XP
- ✅ Display reason and achievements
- ✅ Show week dates

---

## 🚀 Setup Instructions

### Step 1: Run Database Migration

Go to Supabase SQL Editor and run:

```sql
setup-student-of-the-week.sql
```

This creates:
- `student_of_the_week` table
- `get_current_student_of_week()` function
- `get_top_students_this_week()` function  
- `set_student_of_week()` function
- `get_student_of_week_history()` function
- `get_user_sotw_count()` function

### Step 2: Add to Admin Dashboard

In your admin dashboard page (e.g., `src/app/admin-dashboard/page.tsx`):

```tsx
import StudentOfWeekManager from '@/components/admin/StudentOfWeekManager';

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      {/* Add the Student of Week Manager */}
      <StudentOfWeekManager />
      
      {/* Your other admin components */}
    </div>
  );
}
```

### Step 3: Add to Public Dashboard (Optional)

In your main dashboard or homepage (e.g., `src/app/page.tsx` or `src/app/dashboard/page.tsx`):

```tsx
import StudentOfWeekBanner from '@/components/StudentOfWeekBanner';

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Add the banner at the top */}
      <StudentOfWeekBanner />
      
      {/* Your other dashboard components */}
    </div>
  );
}
```

---

## 📊 How It Works

### Automatic Candidate Selection

The system automatically identifies top students based on:
- **XP earned this week** (primary)
- Daily login claims this week
- Bounties completed this week
- Current streak (if available)

### Weekly Cycle

- Week runs Monday-Sunday
- Can set student for current week or future weeks
- Only one featured student per week
- History tracks all past selections

### Admin Workflow

1. **View Candidates**: See top 20 students automatically ranked
2. **Select Student**: Click on a candidate
3. **Add Details**: 
   - Write a custom reason (optional)
   - List achievements (one per line, optional)
4. **Set**: Click "Set as Student of the Week"
5. **Banner Appears**: Instantly visible to all users!

---

## 🎯 API Endpoints

### Get Current Student
```bash
GET /api/admin/student-of-week?action=current
```

### Get Top Candidates
```bash
GET /api/admin/student-of-week?action=top-candidates&limit=20
```

### Get History
```bash
GET /api/admin/student-of-week?action=history&limit=12
```

### Set Student
```bash
POST /api/admin/student-of-week
{
  "walletAddress": "...",
  "reason": "Outstanding contributions!",
  "achievements": ["Completed 10 courses", "100 day streak"],
  "selectedBy": "admin_wallet"
}
```

### Remove Current Student
```bash
DELETE /api/admin/student-of-week
```

---

## 📁 Files Created

### Database
- ✅ `setup-student-of-the-week.sql`

### API
- ✅ `src/app/api/admin/student-of-week/route.ts`

### Components
- ✅ `src/components/admin/StudentOfWeekManager.tsx` (Admin interface)
- ✅ `src/components/StudentOfWeekBanner.tsx` (Public display)

### Documentation
- ✅ `STUDENT_OF_THE_WEEK_SETUP.md` (This file)

---

## 🎨 UI Components

### Admin Manager (3 Tabs)

**Current Tab**
- Shows active Student of the Week
- Displays profile, achievements, reason
- Button to remove

**Select New Tab**
- Lists top 20 candidates automatically
- Shows weekly stats (XP, claims, bounties)
- Form to add reason and achievements
- One-click selection

**History Tab**
- Shows past 12 students
- Displays week dates and details

### Public Banner

Beautiful gradient banner showing:
- Profile picture with level badge
- Name, XP, squad
- Reason (if provided)
- Top 3 achievements (if provided)
- Week dates

---

## 🔍 Database Functions

### `get_current_student_of_week()`
Returns the current featured student with full profile.

### `get_top_students_this_week(limit)`
Returns top performers ranked by:
1. XP earned this week
2. Daily claims
3. Bounties completed

### `set_student_of_week(wallet, reason, achievements, selected_by, week_start, week_end)`
Sets a student as featured for the specified week.

### `get_student_of_week_history(limit)`
Returns historical list of past students.

### `get_user_sotw_count(wallet)`
Returns how many times a user has been Student of the Week.

---

## 💡 Usage Tips

### Best Practices

1. **Set Weekly**: Select a new student every Monday
2. **Be Specific**: Add a detailed reason that explains why
3. **List Achievements**: Break down specific accomplishments
4. **Celebrate**: Announce in Discord/social when you select someone!

### Reason Examples

Good:
- "Completed 5 advanced courses this week and helped 10+ students in voice chat!"
- "Achieved a 100-day login streak and contributed valuable feedback on our new features"
- "Led the Phantom Squad to #1 this week with incredible team coordination"

Generic (avoid):
- "Good work"
- "Active student"

### Achievement Examples

- "Completed 10 courses in 7 days"
- "Achieved 100 day login streak"
- "Earned 1,000 XP this week"
- "Helped 50+ community members"
- "Created 5 study guides for the community"

---

## 🎉 Testing

### Test the Admin Interface

1. Go to Admin Dashboard
2. Click on "Student of the Week Manager"
3. Check "Select New" tab - should see top students
4. Select a student, add details, and set
5. Check "Current" tab - should see the selected student

### Test the Public Display

1. Go to main dashboard
2. Should see the banner at the top
3. Verify profile picture, name, level display correctly
4. Check that reason and achievements show

### Database Queries

```sql
-- Check current student
SELECT * FROM get_current_student_of_week();

-- Check top candidates
SELECT * FROM get_top_students_this_week(10);

-- Check history
SELECT * FROM get_student_of_week_history(12);

-- Check how many times a user was featured
SELECT get_user_sotw_count('wallet_address_here');
```

---

## 🐛 Troubleshooting

### "No students showing in candidates"
- Check if you have any user activity this week
- Make sure users have claimed daily bonuses or completed courses
- Try with a broader time range in the SQL

### "Banner not showing"
- Check if a student is currently set
- Verify the API endpoint is accessible
- Check browser console for errors

### "Can't set student"
- Verify admin permissions
- Check that wallet address exists in users table
- Look at server logs for specific error

---

## 🚀 Future Enhancements

Possible improvements:
- [ ] Email notification to selected student
- [ ] Discord webhook announcement
- [ ] Monthly "Students of the Month" archive
- [ ] User profile badge "🌟 Student of Week x N"
- [ ] Auto-select based on algorithm option
- [ ] Push notifications to all users when new student is selected

---

## 🎊 Congratulations!

You now have a complete Student of the Week system! This is a great way to:
- Recognize outstanding community members
- Encourage engagement
- Celebrate achievements
- Build community culture

**Next**: Run the migration and start celebrating your top students! 🌟


