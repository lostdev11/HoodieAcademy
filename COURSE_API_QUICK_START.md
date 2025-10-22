# Course Management API - Quick Start Guide
**Created:** October 21, 2025

## What's New? 🎉

You now have three powerful admin API endpoints for managing courses:

### 1. **Toggle Course Visibility** (NEW!)
```bash
POST /api/courses/[id]/visibility
```
Quickly hide or show courses from students

### 2. **Update Course Properties** (NEW!)
```bash
PATCH /api/courses
```
Update multiple course properties at once (visibility, publish status, order)

### 3. **Approve Exams** (ALREADY EXISTS)
```bash
POST /api/admin/exams/approve
```
Approve or reject student exam submissions

---

## Quick Examples

### Hide a Course
```javascript
await fetch('/api/courses/YOUR_COURSE_ID/visibility', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    admin_wallet: 'YOUR_ADMIN_WALLET',
    is_hidden: true  // true = hide, false = show
  })
});
```

### Show a Course
```javascript
await fetch('/api/courses/YOUR_COURSE_ID/visibility', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    admin_wallet: 'YOUR_ADMIN_WALLET',
    is_hidden: false
  })
});
```

### Approve an Exam
```javascript
await fetch('/api/admin/exams/approve', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    submission_id: 'SUBMISSION_ID',
    admin_wallet: 'YOUR_ADMIN_WALLET',
    action: 'approve',
    admin_notes: 'Great work!'
  })
});
```

---

## Testing Your Setup

### Step 1: Get Your Admin Wallet
Your admin wallet is the Solana wallet address you use to log in.

### Step 2: Verify Admin Access
Run this in Supabase SQL Editor:
```sql
SELECT wallet_address, is_admin, username 
FROM users 
WHERE wallet_address = 'YOUR_WALLET_ADDRESS';
```

If `is_admin` is not `true`, run:
```sql
UPDATE users 
SET is_admin = true 
WHERE wallet_address = 'YOUR_WALLET_ADDRESS';
```

### Step 3: Get a Course ID
```sql
SELECT id, title, is_hidden, is_published 
FROM courses 
LIMIT 5;
```

### Step 4: Test the API
Open browser console on your dashboard and run:
```javascript
// Test hiding a course
const response = await fetch('/api/courses/YOUR_COURSE_ID/visibility', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    admin_wallet: 'YOUR_ADMIN_WALLET',
    is_hidden: true
  })
});

const data = await response.json();
console.log(data);
```

---

## Using the Test Suite

### Load the test file:
1. Copy `test-course-management-api.js` to your browser
2. Update the configuration:
```javascript
const testConfig = {
  baseUrl: 'https://hoodieacademy.com',
  adminWallet: 'YOUR_ADMIN_WALLET',
  testCourseId: 'YOUR_COURSE_ID',
  testSubmissionId: 'OPTIONAL_SUBMISSION_ID'
};
```

3. Run all tests:
```javascript
courseApiTests.runAllTests();
```

4. Or run individual tests:
```javascript
courseApiTests.test1_getCourseVisibility();
courseApiTests.test2_hideCourse();
courseApiTests.test3_showCourse();
```

---

## Common Use Cases

### Hide Multiple Courses
```javascript
const courseIds = ['id1', 'id2', 'id3'];

for (const courseId of courseIds) {
  await fetch(`/api/courses/${courseId}/visibility`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      admin_wallet: 'YOUR_ADMIN_WALLET',
      is_hidden: true
    })
  });
}
```

### Batch Approve Exams
```javascript
const submissionIds = ['sub1', 'sub2', 'sub3'];

for (const submissionId of submissionIds) {
  await fetch('/api/admin/exams/approve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      submission_id: submissionId,
      admin_wallet: 'YOUR_ADMIN_WALLET',
      action: 'approve'
    })
  });
}
```

---

## What Gets Logged?

All admin actions are logged in `user_activity` table:

| Action | Logged As |
|--------|-----------|
| Hide course | `course_hidden` |
| Show course | `course_shown` |
| Update course | `course_updated` |
| Approve exam | `exam_approved` |
| Reject exam | `exam_rejected` |

### View Activity Log
```sql
SELECT 
  activity_type,
  wallet_address,
  activity_data,
  created_at
FROM user_activity
WHERE activity_type IN ('course_hidden', 'course_shown', 'exam_approved')
ORDER BY created_at DESC
LIMIT 20;
```

---

## Troubleshooting

### "Admin access required"
- Verify `is_admin = true` in database
- Check you're using the correct admin wallet address

### "Course not found"
- Verify course ID exists
- Check you're using the course's UUID, not slug

### "Failed to update course"
- Check Supabase connection
- Verify database permissions
- Check console logs for details

### Network Errors
- Verify API endpoint URLs are correct
- Check CORS settings if calling from external domain
- Ensure Supabase environment variables are set

---

## Next Steps

1. ✅ **Read Full Documentation:** See `COURSE_MANAGEMENT_API_GUIDE.md`
2. ✅ **Test Endpoints:** Use `test-course-management-api.js`
3. ✅ **Build Admin UI:** Create components for your admin dashboard
4. ✅ **Monitor Activity:** Check `user_activity` table for logs

---

## Files Created

1. **`src/app/api/courses/route.ts`** - Added PATCH endpoint
2. **`src/app/api/courses/[id]/visibility/route.ts`** - NEW visibility toggle endpoint
3. **`COURSE_MANAGEMENT_API_GUIDE.md`** - Full documentation
4. **`COURSE_API_QUICK_START.md`** - This file
5. **`test-course-management-api.js`** - Test suite

---

## Support

For issues or questions:
1. Check console logs (browser and server)
2. Review `user_activity` table for logged actions
3. Verify admin permissions in database
4. Check Supabase RLS policies

Happy course managing! 🚀

