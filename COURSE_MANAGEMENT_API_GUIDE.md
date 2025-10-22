# Course Management API Guide
**Created:** October 21, 2025  
**Purpose:** Admin API endpoints for managing courses, including visibility control and exam approvals

## Table of Contents
1. [Course Visibility Management](#course-visibility-management)
2. [Course Updates (PATCH)](#course-updates-patch)
3. [Exam Approval System](#exam-approval-system)
4. [Testing Examples](#testing-examples)

---

## Course Visibility Management

### Toggle Course Visibility
**Endpoint:** `POST /api/courses/[id]/visibility`  
**Purpose:** Show or hide a course from students (admin only)

#### Request
```typescript
POST /api/courses/{course_id}/visibility
Content-Type: application/json

{
  "admin_wallet": "string",    // Admin's wallet address (required)
  "is_hidden": boolean          // true = hide, false = show (required)
}
```

#### Response (Success - 200)
```json
{
  "success": true,
  "message": "Course hidden successfully",
  "course": {
    "id": "uuid",
    "title": "Course Title",
    "is_hidden": true
  }
}
```

#### Response (Error - 403)
```json
{
  "error": "Admin access required"
}
```

#### Example Usage
```javascript
// Hide a course
const response = await fetch('/api/courses/abc-123/visibility', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    admin_wallet: 'YourAdminWalletAddress',
    is_hidden: true  // Hide the course
  })
});

// Show a course
const response2 = await fetch('/api/courses/abc-123/visibility', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    admin_wallet: 'YourAdminWalletAddress',
    is_hidden: false  // Show the course
  })
});
```

### Get Course Visibility Status
**Endpoint:** `GET /api/courses/[id]/visibility`  
**Purpose:** Check if a course is currently hidden or visible

#### Request
```
GET /api/courses/{course_id}/visibility
```

#### Response (Success - 200)
```json
{
  "success": true,
  "course": {
    "id": "uuid",
    "title": "Course Title",
    "is_hidden": false,
    "is_published": true
  }
}
```

---

## Course Updates (PATCH)

### Update Course Properties
**Endpoint:** `PATCH /api/courses`  
**Purpose:** Update multiple course properties at once (admin only)

#### Request
```typescript
PATCH /api/courses
Content-Type: application/json

{
  "course_id": "string",        // Course ID (required)
  "admin_wallet": "string",     // Admin's wallet address (required)
  "is_hidden": boolean,         // Optional: hide/show course
  "is_published": boolean,      // Optional: publish/unpublish course
  "order_index": number         // Optional: change course order
}
```

#### Response (Success - 200)
```json
{
  "success": true,
  "message": "Course updated successfully",
  "course": {
    "id": "uuid",
    "title": "Course Title",
    "is_hidden": false,
    "is_published": true,
    "order_index": 5,
    "updated_at": "2025-10-21T..."
  }
}
```

#### Example Usage
```javascript
// Update multiple properties at once
const response = await fetch('/api/courses', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    course_id: 'abc-123',
    admin_wallet: 'YourAdminWalletAddress',
    is_hidden: false,
    is_published: true,
    order_index: 10
  })
});
```

---

## Exam Approval System

### Approve or Reject Exam Submission
**Endpoint:** `POST /api/admin/exams/approve`  
**Purpose:** Approve or reject a student's exam submission and award XP

#### Request
```typescript
POST /api/admin/exams/approve
Content-Type: application/json

{
  "submission_id": "string",    // Exam submission ID (required)
  "admin_wallet": "string",     // Admin's wallet address (required)
  "action": "approve" | "reject",  // Action to take (required)
  "admin_notes": "string"       // Optional: feedback for student
}
```

#### Response (Approve - 200)
```json
{
  "success": true,
  "message": "Exam approved! 250 XP awarded.",
  "xp_awarded": 250,
  "submission_id": "uuid"
}
```

#### Response (Reject - 200)
```json
{
  "success": true,
  "message": "Exam submission rejected",
  "submission_id": "uuid"
}
```

#### What Happens on Approval?
1. ✅ Submission status updated to `approved`
2. ✅ XP calculated (base XP + bonus for perfect score)
3. ✅ XP added to user's total
4. ✅ Course marked as completed (if passed)
5. ✅ Activity logged in user_activity table

#### Example Usage
```javascript
// Approve an exam submission
const response = await fetch('/api/admin/exams/approve', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    submission_id: 'exam-sub-123',
    admin_wallet: 'YourAdminWalletAddress',
    action: 'approve',
    admin_notes: 'Great work! Well done.'
  })
});

// Reject an exam submission
const response2 = await fetch('/api/admin/exams/approve', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    submission_id: 'exam-sub-124',
    admin_wallet: 'YourAdminWalletAddress',
    action: 'reject',
    admin_notes: 'Please review the material and try again.'
  })
});
```

---

## Testing Examples

### Test 1: Hide a Course
```bash
curl -X POST https://hoodieacademy.com/api/courses/YOUR_COURSE_ID/visibility \
  -H "Content-Type: application/json" \
  -d '{
    "admin_wallet": "YOUR_ADMIN_WALLET",
    "is_hidden": true
  }'
```

**Expected Result:**
- Course becomes hidden from students
- Only admins with `include_hidden=true` can see it
- Response confirms the course is hidden

### Test 2: Show a Course
```bash
curl -X POST https://hoodieacademy.com/api/courses/YOUR_COURSE_ID/visibility \
  -H "Content-Type: application/json" \
  -d '{
    "admin_wallet": "YOUR_ADMIN_WALLET",
    "is_hidden": false
  }'
```

**Expected Result:**
- Course becomes visible to students (if published)
- Appears in course list for squad members
- Response confirms the course is visible

### Test 3: Check Course Visibility
```bash
curl https://hoodieacademy.com/api/courses/YOUR_COURSE_ID/visibility
```

**Expected Result:**
- Returns current visibility status
- Shows if published and hidden flags

### Test 4: Update Multiple Course Properties
```bash
curl -X PATCH https://hoodieacademy.com/api/courses \
  -H "Content-Type: application/json" \
  -d '{
    "course_id": "YOUR_COURSE_ID",
    "admin_wallet": "YOUR_ADMIN_WALLET",
    "is_hidden": false,
    "is_published": true,
    "order_index": 5
  }'
```

**Expected Result:**
- Course visibility, publish status, and order updated
- Returns updated course object
- Activity logged for admin

### Test 5: Approve an Exam
```bash
curl -X POST https://hoodieacademy.com/api/admin/exams/approve \
  -H "Content-Type: application/json" \
  -d '{
    "submission_id": "SUBMISSION_ID",
    "admin_wallet": "YOUR_ADMIN_WALLET",
    "action": "approve",
    "admin_notes": "Excellent work!"
  }'
```

**Expected Result:**
- Exam marked as approved
- XP awarded to student
- Course completion recorded
- Activity logged

---

## Error Codes

| Code | Meaning | Common Cause |
|------|---------|--------------|
| 400 | Bad Request | Missing required fields |
| 403 | Forbidden | User is not an admin |
| 404 | Not Found | Course or submission doesn't exist |
| 500 | Server Error | Database or internal error |

---

## Admin Authentication

All admin endpoints require:
1. **admin_wallet** parameter in request body
2. User must have `is_admin = true` in the database
3. Wallet address must match a valid admin account

### Check Admin Status
```sql
-- Run in Supabase SQL Editor
SELECT wallet_address, is_admin, username 
FROM users 
WHERE is_admin = true;
```

### Grant Admin Access
```sql
-- Run in Supabase SQL Editor
UPDATE users 
SET is_admin = true 
WHERE wallet_address = 'YOUR_WALLET_ADDRESS';
```

---

## Activity Logging

All admin actions are automatically logged in the `user_activity` table:

| Action | Activity Type | Logged Data |
|--------|--------------|-------------|
| Hide course | `course_hidden` | Course ID, title, previous/new state |
| Show course | `course_shown` | Course ID, title, previous/new state |
| Update course | `course_updated` | Course ID, title, changes made |
| Approve exam | `exam_approved` | Exam ID, submission ID, XP awarded |
| Reject exam | `exam_rejected` | Exam ID, submission ID, reason |

---

## Security Notes

1. **Admin-Only Access:** All endpoints require admin authentication
2. **Audit Trail:** All actions are logged for accountability
3. **Validation:** All inputs are validated before processing
4. **RLS Policies:** Database-level security enforced
5. **Service Role Key:** Server-side operations use service role key

---

## Frontend Integration Examples

### React Component Example
```tsx
import { useState } from 'react';

function CourseVisibilityToggle({ courseId, adminWallet }) {
  const [isHidden, setIsHidden] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggleVisibility = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/courses/${courseId}/visibility`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admin_wallet: adminWallet,
          is_hidden: !isHidden
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setIsHidden(!isHidden);
        alert(data.message);
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('Error toggling visibility:', error);
      alert('Failed to update course visibility');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={toggleVisibility} 
      disabled={loading}
      className="px-4 py-2 bg-blue-500 text-white rounded"
    >
      {loading ? 'Updating...' : (isHidden ? 'Show Course' : 'Hide Course')}
    </button>
  );
}
```

### Exam Approval Example
```tsx
function ExamApprovalButton({ submissionId, adminWallet, onApproved }) {
  const [loading, setLoading] = useState(false);

  const approveExam = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/exams/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submission_id: submissionId,
          admin_wallet: adminWallet,
          action: 'approve',
          admin_notes: 'Approved by admin'
        })
      });

      const data = await response.json();
      
      if (data.success) {
        alert(`Exam approved! ${data.xp_awarded} XP awarded.`);
        onApproved?.();
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('Error approving exam:', error);
      alert('Failed to approve exam');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={approveExam} 
      disabled={loading}
      className="px-4 py-2 bg-green-500 text-white rounded"
    >
      {loading ? 'Approving...' : 'Approve Exam'}
    </button>
  );
}
```

---

## Summary

You now have three powerful admin endpoints:

1. **`POST /api/courses/[id]/visibility`** - Quick toggle for hiding/showing courses
2. **`PATCH /api/courses`** - Update multiple course properties at once
3. **`POST /api/admin/exams/approve`** - Approve/reject exam submissions

All endpoints:
- ✅ Require admin authentication
- ✅ Log all activities
- ✅ Return clear success/error messages
- ✅ Include proper error handling
- ✅ Are production-ready

For questions or issues, check the console logs or database activity tables.

