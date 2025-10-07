# ✅ Bounty Image Moderation - Setup Checklist

Use this checklist to verify your image moderation system is fully operational.

---

## 📋 Pre-Setup Verification

- [x] **Upload directory created**: `public/uploads/moderated/` ✅
- [ ] **Database tables exist**: `moderated_images`, `moderation_logs`
- [ ] **Admin user configured**: Your wallet has `is_admin = true`
- [ ] **Environment variables set**: Supabase URL and keys in `.env.local`

---

## 🗄️ Database Setup (5 minutes)

### Step 1: Run Setup Script

1. [ ] Open **Supabase Dashboard** (https://supabase.com/dashboard)
2. [ ] Navigate to your project
3. [ ] Click **SQL Editor** in left sidebar
4. [ ] Click **+ New Query**
5. [ ] Copy contents of `setup-bounty-image-moderation.sql`
6. [ ] Paste into SQL Editor
7. [ ] Click **Run** (or press Ctrl+Enter)
8. [ ] Verify you see success messages (no errors)

### Step 2: Verify Tables Created

Run this verification query:

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('moderated_images', 'moderation_logs');
```

**Expected Result:**
```
table_name
-----------------
moderated_images
moderation_logs
```

- [ ] Both tables appear in results

### Step 3: Check RLS Policies

```sql
-- Check RLS policies
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('moderated_images', 'moderation_logs');
```

**Expected Result:** You should see policies like:
- "Users can view their own images"
- "Admins can view all images"
- "Only admins can view moderation logs"

- [ ] Policies exist

---

## 👤 Admin User Setup (2 minutes)

### Step 1: Check Your Admin Status

```sql
-- Replace 'YOUR_WALLET_ADDRESS' with your actual wallet
SELECT wallet_address, is_admin 
FROM users 
WHERE wallet_address = 'YOUR_WALLET_ADDRESS';
```

- [ ] Your user exists
- [ ] `is_admin` is `true`

### Step 2: Set Admin Status (if needed)

If `is_admin` is not true, run:

```sql
UPDATE users 
SET is_admin = true 
WHERE wallet_address = 'YOUR_WALLET_ADDRESS';
```

- [ ] Admin status updated

---

## 🧪 Test User Upload (5 minutes)

### Step 1: Navigate to Bounty Page

1. [ ] Open your app in browser
2. [ ] Go to `/bounties/hoodie-visual` (or any bounty page)
3. [ ] Page loads successfully

### Step 2: Connect Wallet

1. [ ] Click "Connect Wallet" button
2. [ ] Approve wallet connection
3. [ ] Wallet address appears in header
4. [ ] No error messages

### Step 3: Open Submission Form

1. [ ] Click "Submit Entry" button
2. [ ] Modal/form opens
3. [ ] You see the image upload section
4. [ ] Upload area shows: "Click to Upload or Drag & Drop"

### Step 4: Upload Test Image

1. [ ] Prepare a test image (JPG, PNG, GIF, or WebP, under 10 MB)
2. [ ] Drag image into upload zone OR click to browse
3. [ ] See upload progress indicator
4. [ ] See "✓ Uploaded" confirmation
5. [ ] See image preview
6. [ ] No error messages

### Step 5: Complete Submission

1. [ ] Fill in required fields:
   - [ ] Title
   - [ ] Description
   - [ ] (Optional) Squad
   - [ ] (Optional) Course Reference
2. [ ] Click "Submit Bounty Entry" button
3. [ ] See success message
4. [ ] Modal closes

### Step 6: Verify Upload in Database

```sql
-- Check latest uploaded image
SELECT 
  id, 
  original_name, 
  wallet_address, 
  status, 
  uploaded_at 
FROM moderated_images 
ORDER BY uploaded_at DESC 
LIMIT 5;
```

- [ ] Your uploaded image appears in results
- [ ] Status is `pending_review`
- [ ] Wallet address matches yours

### Step 7: Verify File on Disk

Check that file exists:
- [ ] File exists in `public/uploads/moderated/`
- [ ] Filename matches database record

---

## 🛡️ Test Admin Moderation (5 minutes)

### Step 1: Access Admin Dashboard

1. [ ] Go to `/admin-dashboard`
2. [ ] Page loads (verify you're logged in as admin)
3. [ ] See navigation tabs

### Step 2: Navigate to Images Tab

1. [ ] Click "Images" tab
2. [ ] See "Image Moderation Panel" heading
3. [ ] See three tab buttons:
   - [ ] "Pending Review" (with count badge)
   - [ ] "Approved"
   - [ ] "Rejected"

### Step 3: View Pending Images

1. [ ] "Pending Review" tab is active
2. [ ] See your test image from earlier
3. [ ] Image displays correctly
4. [ ] See image details:
   - [ ] Preview thumbnail
   - [ ] Uploader wallet/name
   - [ ] Upload date
   - [ ] File size

### Step 4: Review Image

1. [ ] Click "Review" button on test image
2. [ ] Modal opens showing full-size image
3. [ ] See all image details
4. [ ] See review reason text area
5. [ ] See action buttons: Approve, Reject, Delete, Cancel

### Step 5: Approve Image

1. [ ] (Optional) Add review reason: "Test approval"
2. [ ] Click "Approve" button
3. [ ] See loading indicator
4. [ ] Modal closes
5. [ ] Image disappears from "Pending Review"

### Step 6: Check Approved Tab

1. [ ] Click "Approved" tab
2. [ ] Your test image appears
3. [ ] Badge shows "Approved" status
4. [ ] Image is still in grid

### Step 7: Verify in Database

```sql
-- Check image was approved
SELECT 
  id, 
  status, 
  reviewed_by, 
  reviewed_at, 
  review_reason 
FROM moderated_images 
WHERE status = 'approved' 
ORDER BY reviewed_at DESC 
LIMIT 5;
```

- [ ] Status changed to `approved`
- [ ] `reviewed_by` has admin wallet
- [ ] `reviewed_at` has timestamp
- [ ] `review_reason` has your note (if added)

### Step 8: Check Moderation Log

```sql
-- Check moderation log
SELECT 
  image_id, 
  action, 
  reason, 
  admin_wallet, 
  created_at 
FROM moderation_logs 
ORDER BY created_at DESC 
LIMIT 5;
```

- [ ] Log entry created
- [ ] Action is `approve`
- [ ] Admin wallet matches yours

---

## 🧹 Test Image Rejection (Optional)

### Step 1: Upload Another Test Image

1. [ ] Follow "Test User Upload" steps again
2. [ ] Upload a second test image

### Step 2: Reject the Image

1. [ ] Go to admin "Images" → "Pending Review"
2. [ ] Click "Review" on new image
3. [ ] Add review reason: "Test rejection"
4. [ ] Click "Reject" button
5. [ ] Confirm action
6. [ ] Modal closes

### Step 3: Check Rejected Tab

1. [ ] Click "Rejected" tab
2. [ ] See the rejected image
3. [ ] Badge shows "Rejected" status

### Step 4: Verify File Deleted

- [ ] File is removed from `public/uploads/moderated/`
- [ ] Database record still exists (for audit)

```sql
SELECT status FROM moderated_images WHERE status = 'rejected';
```

- [ ] Record shows `rejected` status

---

## 🎯 Test Download Feature

1. [ ] Go to admin "Images" → "Approved" tab
2. [ ] Click download icon/button on an image
3. [ ] Image downloads to your computer
4. [ ] Downloaded file opens correctly
5. [ ] Filename matches original or generated name

---

## 🔐 Test Security (Important!)

### Test 1: Non-Admin Cannot Access Moderation

1. [ ] Log out or use incognito browser
2. [ ] Connect with non-admin wallet
3. [ ] Try to access `/admin/image-moderation`
4. [ ] Should see "Forbidden" or redirect
5. [ ] Cannot access moderation features

### Test 2: Users See Only Their Images

```sql
-- As a user, you should only see your own images
-- (This is enforced by RLS policies)
```

1. [ ] User can upload images
2. [ ] User can only see their own uploads
3. [ ] User cannot see other users' images

### Test 3: File Validation Works

Try uploading invalid files:

1. [ ] Try PDF file → Should reject
2. [ ] Try file over 10 MB → Should reject
3. [ ] Try non-image file → Should reject
4. [ ] See appropriate error messages

---

## 📊 Performance Check

### Test 1: Multiple Images Load Quickly

```sql
-- Check total images
SELECT COUNT(*) as total_images FROM moderated_images;
```

1. [ ] Admin panel loads quickly (< 2 seconds)
2. [ ] Images display in grid format
3. [ ] Pagination works (if implemented)
4. [ ] No lag when switching tabs

### Test 2: Upload Speed

1. [ ] Upload test image (2-5 MB)
2. [ ] Upload completes in < 5 seconds
3. [ ] Preview appears immediately
4. [ ] No timeout errors

---

## 🚀 Production Readiness Checklist

### Code & Files
- [x] `BountySubmissionForm.tsx` - Upload component exists
- [x] `ImageModerationPanel.tsx` - Admin UI exists
- [x] `/api/upload/moderated-image` - Upload API exists
- [x] `/api/admin/moderate-image` - Moderation API exists
- [x] Upload directory created

### Database
- [ ] `moderated_images` table exists
- [ ] `moderation_logs` table exists
- [ ] Indexes created
- [ ] RLS policies active
- [ ] Triggers working

### Security
- [ ] RLS policies prevent unauthorized access
- [ ] Admin-only moderation enforced
- [ ] File type validation working
- [ ] File size limits enforced
- [ ] Audit logging operational

### Features
- [ ] User can upload images
- [ ] Drag & drop works
- [ ] File preview works
- [ ] Admin can approve images
- [ ] Admin can reject images
- [ ] Admin can delete images
- [ ] Admin can download images
- [ ] Status badges display correctly
- [ ] Review reasons save properly

### Testing
- [ ] Uploaded test image successfully
- [ ] Approved test image successfully
- [ ] Rejected test image successfully
- [ ] Downloaded image successfully
- [ ] Verified database records
- [ ] Verified file storage
- [ ] Tested non-admin restrictions

---

## ✅ Final Verification

Run this comprehensive check:

```sql
-- Comprehensive system check
SELECT 
  'Images Pending Review' as metric, 
  COUNT(*) as count 
FROM moderated_images 
WHERE status = 'pending_review'
UNION ALL
SELECT 
  'Images Approved' as metric, 
  COUNT(*) as count 
FROM moderated_images 
WHERE status = 'approved'
UNION ALL
SELECT 
  'Images Rejected' as metric, 
  COUNT(*) as count 
FROM moderated_images 
WHERE status = 'rejected'
UNION ALL
SELECT 
  'Total Moderation Actions' as metric, 
  COUNT(*) as count 
FROM moderation_logs;
```

**All checks passed?** 🎉

---

## 🎊 You're Done!

If you've checked all the boxes above, your image moderation system is:

✅ **Fully Operational**  
✅ **Secure**  
✅ **Production-Ready**  

### What You Can Do Now:

1. **Let users upload images** to bounty submissions
2. **Moderate submissions** through the admin dashboard
3. **Track all moderation activity** in logs
4. **Download approved images** for archiving
5. **Maintain quality control** across all bounty submissions

---

## 📞 Still Having Issues?

### Common Problems & Solutions

**Problem:** "Table does not exist"  
**Solution:** Run `setup-bounty-image-moderation.sql` in Supabase SQL Editor

**Problem:** "Not authorized" in admin panel  
**Solution:** Set `is_admin = true` for your user in the `users` table

**Problem:** Upload fails with "No file provided"  
**Solution:** Ensure wallet is connected before uploading

**Problem:** Images not displaying  
**Solution:** Check that files exist in `public/uploads/moderated/`

**Problem:** Moderation panel is empty  
**Solution:** Upload a test image first, then check again

---

## 📚 Documentation Reference

- `IMAGE_MODERATION_QUICK_START.md` - Quick overview
- `BOUNTY_IMAGE_MODERATION_SETUP.md` - Detailed technical docs
- `BOUNTY_IMAGE_UPLOAD_GUIDE.md` - User guide
- `setup-bounty-image-moderation.sql` - Database setup

---

**Congratulations! Your bounty image moderation system is ready! 🎉**

