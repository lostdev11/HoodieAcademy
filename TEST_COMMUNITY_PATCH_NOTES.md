# 🧪 Testing Guide: Community Patch Notes System

## ✅ Database Check Complete

Your migration ran successfully! All fields are present:
- ✅ `completion_status` calculated (10%, 30%, 60%)
- ✅ `upvotes` initialized to 0
- ✅ `patch_note_id` and `patch_note_title` ready for linking

---

## 🎯 Test Scenario 1: Create a Patch Note from Existing Submission

### You Have These Approved Submissions Ready:
- **"Test"** (approved, 60% complete)
- **"Daily claim"** (approved, 60% complete)  
- **"Squad placement message"** (approved, 60% complete)
- **"Loading times"** (approved, 60% complete)

### Steps:

1. **Go to Admin Dashboard**
   - Navigate to `/admin-dashboard`
   - Find the "User Feedback Submissions" section

2. **Select a Submission**
   - Click "View" on one of the approved items
   - Example: "Daily claim" or "Loading times"

3. **Create Patch Note**
   - Click the **"Create Patch Note"** button
   - Watch for success message

4. **Verify in Patch Notes**
   - Go to `/feedback` page
   - Look for the new entry in "You Asked, We Fixed"
   - Should have **"Community" badge** with cyan border
   - Should show wallet address of original submitter

5. **Check Database**
   ```sql
   SELECT 
     ufs.title as original_title,
     fu.title as patch_note_title,
     fu.original_submission_id,
     fu.requested_by
   FROM feedback_updates fu
   JOIN user_feedback_submissions ufs 
     ON fu.original_submission_id = ufs.id
   WHERE fu.original_submission_id IS NOT NULL;
   ```

---

## 🎯 Test Scenario 2: Test Upvote System

### Setup:
1. Make sure you have a wallet connected
2. Go to `/feedback` page
3. Scroll to "Community Bug Reports & Suggestions" section

### Steps:

1. **Submit New Feedback** (Optional)
   - Use the "Request or Suggest a Fix" form
   - Category: "Improvement"
   - Title: "Test upvote feature"
   - Description: "Testing the upvote system"
   - Submit

2. **Upvote a Submission**
   - Find any submission in the community list
   - Click the upvote button (↑)
   - Count should increment immediately
   - Button should turn green

3. **Toggle Upvote**
   - Click again to remove upvote
   - Count should decrement
   - Button should return to gray

4. **Check Database**
   ```sql
   SELECT 
     ufs.title,
     ufs.upvotes,
     ufu.wallet_address,
     ufu.created_at
   FROM user_feedback_submissions ufs
   LEFT JOIN user_feedback_upvotes ufu ON ufs.id = ufu.feedback_id
   ORDER BY ufs.upvotes DESC
   LIMIT 10;
   ```

---

## 🎯 Test Scenario 3: Progress Bar Tracking

### Watch Progress Change:

1. **Select a "reviewing" submission**
   - Example: "XP not updating"
   - Should show 30% progress bar

2. **Change Status to "approved"**
   - Admin dashboard → View submission
   - Click "Approved" button
   - Progress bar should update to 60%

3. **Create Patch Note**
   - Click "Create Patch Note"
   - Should automatically set to 100% (implemented)

---

## 🎯 Test Scenario 4: Community Badge Display

### Verify Highlighting:

1. **Create a patch note** from a community submission (Test Scenario 1)

2. **Check Home Page**
   - Navigate to home page
   - Find "You Asked, We Fixed" widget
   - Look for cyan border on community items
   - Verify "Community" badge is visible

3. **Compare with Non-Community**
   - Regular admin updates should have green border
   - Community updates should have cyan border

---

## 🔍 Quick Verification Queries

### Check Upvote Table
```sql
SELECT * FROM user_feedback_upvotes ORDER BY created_at DESC LIMIT 5;
```

### Check Linked Patch Notes
```sql
SELECT 
  fu.*,
  ufs.title as original_submission_title
FROM feedback_updates fu
LEFT JOIN user_feedback_submissions ufs 
  ON fu.original_submission_id = ufs.id
WHERE fu.original_submission_id IS NOT NULL
ORDER BY fu.created_at DESC;
```

### Check Completion Status
```sql
SELECT 
  status,
  COUNT(*) as count,
  AVG(completion_status) as avg_completion
FROM user_feedback_submissions
GROUP BY status
ORDER BY avg_completion;
```

### Verify Triggers Are Working
```sql
-- This should match COUNT(*) from user_feedback_upvotes
SELECT 
  ufs.id,
  ufs.title,
  ufs.upvotes as stored_count,
  COUNT(ufu.id) as actual_votes
FROM user_feedback_submissions ufs
LEFT JOIN user_feedback_upvotes ufu ON ufs.id = ufu.feedback_id
GROUP BY ufs.id, ufs.title, ufs.upvotes
HAVING ufs.upvotes != COUNT(ufu.id);
-- Should return no rows if triggers working correctly
```

---

## 📊 Expected Results

### Patch Notes
- ✅ Appear in "You Asked, We Fixed" widget
- ✅ Show cyan "Community" badge
- ✅ Link back to original submission
- ✅ Credit original submitter in `requested_by` field

### Upvotes
- ✅ Real-time count updates
- ✅ Prevent self-voting
- ✅ Toggle on/off works
- ✅ Database triggers auto-update counts

### Progress Bars
- ✅ Show correct percentage based on status
- ✅ Auto-update when status changes
- ✅ Color-coded appropriately

### UI/UX
- ✅ Loading states work
- ✅ Error messages clear
- ✅ Responsive on mobile
- ✅ Colors match Hoodie Academy theme

---

## 🐛 Troubleshooting

### Issue: "Cannot upvote your own feedback"
- **Expected behavior** - Security feature working
- Try with a different wallet or different submission

### Issue: "Wallet not connected"
- Make sure wallet is connected before testing
- Check browser console for connection errors

### Issue: Upvote count not updating
- Check database triggers were created
- Verify `update_feedback_upvote_count()` function exists
- Check Supabase logs for trigger errors

### Issue: Progress bar stuck at 10%
- Check if completion status trigger is working
- Manually update status to trigger recalculation
- Verify `update_feedback_completion_status()` function exists

### Issue: Patch note not showing "Community" badge
- Verify `original_submission_id` is set in `feedback_updates`
- Check that `FeedbackTrackerWidget` has latest code
- Hard refresh browser (Ctrl+F5)

---

## ✅ Success Criteria

All working if:
1. ✅ Can create patch notes from submissions
2. ✅ Patch notes show "Community" badge
3. ✅ Upvotes increment/decrement correctly
4. ✅ Progress bars match status
5. ✅ No console errors
6. ✅ Database triggers auto-update counts

---

## 🎉 Ready to Go Live!

Once all tests pass, your community patch notes system is ready for users!

**Next Steps:**
1. Create some patch notes from approved submissions
2. Test upvoting from multiple wallets
3. Monitor database for performance
4. Collect user feedback on the new system

