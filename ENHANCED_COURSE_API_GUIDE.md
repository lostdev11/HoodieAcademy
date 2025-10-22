# Enhanced Course API for Admins 🎓
**Date:** October 21, 2025

## Overview

The Course API has been enhanced to provide comprehensive admin functionality for managing courses. Admins can now see ALL courses (including hidden/unpublished ones), toggle visibility, publish/unpublish, and permanently delete courses.

---

## 🚀 New Features

### ✅ Admin-Only Course Visibility
- **See ALL courses** - Admins see published, unpublished, hidden, and visible courses
- **Course statistics** - Real-time stats showing total, published, hidden, and visible counts
- **Enhanced filtering** - Filter by squad, search by title/description

### ✅ Course Management Actions
- **Hide/Show courses** - Toggle course visibility for students
- **Publish/Unpublish** - Control whether courses are live
- **Delete courses** - Permanently remove courses and all related data
- **Order management** - Set course display order

### ✅ Enhanced Security
- **Admin-only access** - All management functions require admin privileges
- **Activity logging** - All changes are logged with admin details
- **Confirmation dialogs** - Safety confirmations for destructive actions

---

## 📊 API Endpoints

### 1. GET /api/courses (Enhanced)

**Purpose:** Fetch courses with admin-specific data

#### Request Parameters
```
GET /api/courses?wallet_address=ADMIN_WALLET&is_admin=true&include_hidden=true
```

#### Response (Admin)
```json
{
  "courses": [
    {
      "id": "uuid",
      "title": "Course Title",
      "description": "Course description",
      "squad_id": "creators",
      "squad_name": "Creators",
      "is_published": true,
      "is_hidden": false,
      "order_index": 1,
      "xp_reward": 100,
      "difficulty_level": "beginner",
      "estimated_duration": 30,
      "created_at": "2025-10-21T...",
      "updated_at": "2025-10-21T...",
      "course_sections": [...]
    }
  ],
  "userSquad": "creators",
  "isAdmin": true,
  "stats": {
    "total": 15,
    "published": 12,
    "unpublished": 3,
    "visible": 10,
    "hidden": 5
  }
}
```

#### Admin vs Regular User
- **Admins:** See ALL courses regardless of status
- **Regular Users:** Only see published, non-hidden courses

---

### 2. PATCH /api/courses (Enhanced)

**Purpose:** Update course properties (visibility, publish status, order)

#### Request
```json
{
  "course_id": "uuid",
  "admin_wallet": "admin_wallet_address",
  "is_hidden": true,        // Optional: hide/show course
  "is_published": false,    // Optional: publish/unpublish
  "order_index": 5          // Optional: set display order
}
```

#### Response
```json
{
  "success": true,
  "message": "Course updated successfully",
  "course": {
    "id": "uuid",
    "title": "Updated Course",
    "is_hidden": true,
    "is_published": false,
    "order_index": 5
  }
}
```

---

### 3. DELETE /api/courses (NEW)

**Purpose:** Permanently delete a course and all related data

#### Request
```json
{
  "course_id": "uuid",
  "admin_wallet": "admin_wallet_address"
}
```

#### Response
```json
{
  "success": true,
  "message": "Course \"Course Title\" has been permanently deleted",
  "deleted_course": {
    "id": "uuid",
    "title": "Course Title",
    "squad_name": "Creators"
  }
}
```

#### What Gets Deleted
- ✅ Course record and all content
- ✅ Course sections and lessons
- ✅ User progress data
- ✅ Course submissions
- ✅ Related activity logs

---

## 🎛️ Admin Dashboard Integration

### Course Management Tab

The admin dashboard now includes a comprehensive course management interface:

#### Statistics Dashboard
- **Total Courses** - Count of all courses
- **Visible** - Courses visible to students
- **Hidden** - Courses hidden from students  
- **Published** - Live courses available to students

#### Course Actions
Each course card includes:

1. **Hide/Show Button**
   - Green "Show" button for hidden courses
   - Gray "Hide" button for visible courses
   - Toggles `is_hidden` field

2. **Delete Button**
   - Red "Delete" button with trash icon
   - Shows confirmation dialog
   - Permanently removes course

#### Filters & Search
- **Search by title/description**
- **Filter by squad**
- **Real-time filtering**

---

## 🔒 Security Features

### Admin Verification
All admin endpoints verify:
```typescript
// Check if user is admin
const { data: user, error: userError } = await supabase
  .from('users')
  .select('is_admin')
  .eq('wallet_address', admin_wallet)
  .single();

if (userError || !user?.is_admin) {
  return NextResponse.json(
    { error: 'Admin access required' },
    { status: 403 }
  );
}
```

### Activity Logging
All admin actions are logged:
```json
{
  "wallet_address": "admin_wallet",
  "activity_type": "course_deleted",
  "activity_data": {
    "course_id": "uuid",
    "course_title": "Course Title",
    "course_squad": "Creators",
    "deleted_by": "admin_wallet",
    "deleted_at": "2025-10-21T..."
  }
}
```

---

## 🧪 Testing Examples

### Test Course Visibility Toggle
```javascript
// Hide a course
const response = await fetch('/api/courses', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    course_id: 'course-uuid',
    admin_wallet: 'your-admin-wallet',
    is_hidden: true
  })
});

const data = await response.json();
console.log(data.message); // "Course updated successfully"
```

### Test Course Deletion
```javascript
// Delete a course
const response = await fetch('/api/courses', {
  method: 'DELETE',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    course_id: 'course-uuid',
    admin_wallet: 'your-admin-wallet'
  })
});

const data = await response.json();
console.log(data.message); // "Course \"Title\" has been permanently deleted"
```

### Test Admin Course Fetch
```javascript
// Fetch all courses as admin
const response = await fetch('/api/courses?wallet_address=your-admin-wallet&is_admin=true&include_hidden=true');
const data = await response.json();

console.log('Total courses:', data.stats.total);
console.log('Hidden courses:', data.stats.hidden);
console.log('Published courses:', data.stats.published);
```

---

## 📋 Usage Guide

### For Admins

1. **Access Course Management**
   - Go to `/admin-dashboard`
   - Click "Courses" tab
   - View all courses with statistics

2. **Hide/Show Courses**
   - Click "Hide" button to hide from students
   - Click "Show" button to make visible to students
   - Changes take effect immediately

3. **Delete Courses**
   - Click red "Delete" button
   - Confirm deletion in dialog
   - Course and all data permanently removed

4. **Monitor Activity**
   - Check user_activity table for admin actions
   - All changes are logged with timestamps

### For Regular Users

- **No changes** - Regular users continue to see only published, visible courses
- **Same experience** - Course visibility and access unchanged
- **Filtered results** - API automatically filters based on user permissions

---

## 🔧 Database Schema

### Courses Table
```sql
CREATE TABLE courses (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  squad_id TEXT,
  squad_name TEXT,
  is_published BOOLEAN DEFAULT true,
  is_hidden BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  xp_reward INTEGER DEFAULT 0,
  difficulty_level TEXT DEFAULT 'beginner',
  estimated_duration INTEGER DEFAULT 0,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### User Activity Table
```sql
CREATE TABLE user_activity (
  id UUID PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  activity_type TEXT NOT NULL,
  activity_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🚨 Important Notes

### Safety Features
- **Confirmation dialogs** for all destructive actions
- **Admin-only access** to management functions
- **Activity logging** for audit trails
- **Cascade deletion** handles related data

### Performance
- **Efficient queries** with proper indexing
- **Real-time stats** calculated on-demand
- **Optimized filtering** for large course lists

### Error Handling
- **Comprehensive error messages** for debugging
- **Graceful fallbacks** for missing data
- **Input validation** for all parameters

---

## 🎉 Success!

The enhanced course API now provides:

✅ **Complete admin control** over course visibility and management  
✅ **Real-time statistics** showing course status breakdown  
✅ **Safe deletion** with confirmation dialogs and logging  
✅ **Enhanced security** with admin verification  
✅ **Comprehensive logging** for audit trails  

**Admins now have full control over the course system!** 🎓✨
