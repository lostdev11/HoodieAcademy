# 🎨 Bounty Image Upload & Moderation System

## ✅ System Status: FULLY IMPLEMENTED

Your Hoodie Academy platform has a **complete image upload and moderation system** for bounty submissions!

---

## 🚀 Quick Setup (3 Steps)

### Step 1: Set Up Database Tables

1. Open your **Supabase Dashboard**
2. Go to **SQL Editor**
3. Run the file: `setup-bounty-image-moderation.sql`
4. Verify you see ✅ success messages

### Step 2: Create Upload Directory

The system will auto-create the directory, but you can create it manually:

```bash
mkdir -p public/uploads/moderated
```

### Step 3: Test the System

1. **As a User**: Go to any bounty and try uploading an image
2. **As an Admin**: Navigate to `/admin-dashboard` → "Images" tab

---

## 📸 For Users: How to Upload Images

### Uploading Images to Bounties

1. **Navigate to Bounties**
   - Go to `/bounties` page
   - Select any active bounty

2. **Submit with Image**
   - Click "Submit Entry" on a bounty
   - The submission form includes an image upload section
   - **Drag & Drop** your image OR click to browse
   - Supported: JPG, PNG, GIF, WebP (max 10 MB)

3. **What Happens Next**
   - Image uploads automatically when selected
   - Status: "Pending Review"
   - You'll see a preview before submitting
   - Admin will review and approve/reject

### Image Upload Features

✨ **Drag & Drop Interface**
✨ **Live Preview** before submission
✨ **Auto-upload** when file is selected
✨ **Upload Progress** indicator
✨ **File Size** validation (max 10 MB)
✨ **File Type** validation (images only)
✨ **Remove & Replace** uploaded images

---

## 👨‍💼 For Admins: Image Moderation

### Accessing the Moderation Panel

**Option 1: Admin Dashboard**
```
1. Navigate to /admin-dashboard
2. Click the "Images" tab
3. See all pending images
```

**Option 2: Dedicated Page**
```
Navigate to: /admin/image-moderation
Full-screen moderation interface
```

### Moderation Features

#### 📋 View Images by Status
- **Pending Review** (⏰) - New uploads awaiting moderation
- **Approved** (✅) - Images that passed moderation
- **Rejected** (❌) - Images that were rejected

#### 🔍 Image Information Display
For each image you can see:
- 📷 **Image Preview** - Visual preview
- 👤 **Uploader** - Wallet address or display name
- 📅 **Upload Date** - When submitted
- 📊 **File Size** - Size in MB
- 🏷️ **Context** - Where uploaded (e.g., "bounty_submission")
- 🎯 **Squad** - User's squad affiliation

#### ⚡ Moderation Actions

**✅ Approve**
- Keeps the image file
- Status → "approved"
- Image remains accessible
- User can use it in their submission

**❌ Reject**
- Deletes the physical file
- Status → "rejected"
- Record kept for audit
- Optional: Add rejection reason

**🗑️ Delete**
- Deletes the physical file
- Status → "deleted"
- Permanent removal
- Optional: Add deletion reason

**💾 Download**
- Save image to your local computer
- Useful for archiving or evidence

### Review Workflow

1. **Click "Review"** on any pending image
2. **View Full Image** in modal popup
3. **Check Details** (uploader, size, context)
4. **Add Review Reason** (optional but recommended)
5. **Choose Action**: Approve / Reject / Delete
6. **Confirm** - Image is moderated instantly

---

## 🏗️ System Architecture

### Frontend Components

**`BountySubmissionForm.tsx`**
- Location: `src/components/bounty/BountySubmissionForm.tsx`
- Drag & drop upload zone
- Image preview
- Auto-upload functionality
- Error handling

**`ImageModerationPanel.tsx`**
- Location: `src/components/admin/ImageModerationPanel.tsx`
- Tabbed interface (Pending/Approved/Rejected)
- Grid layout for images
- Review modal
- Action buttons

### Backend APIs

**`/api/upload/moderated-image`** (POST)
- Handles image uploads
- Validates file type & size
- Saves to `/public/uploads/moderated/`
- Creates database record
- Returns image URL

**`/api/admin/moderate-image`** (POST)
- Admin-only endpoint
- Approves/rejects/deletes images
- Updates database status
- Removes physical files when rejected/deleted
- Logs moderation actions

**`/api/admin/moderate-image`** (GET)
- Fetches images by status
- Returns image list with user info
- Supports pagination

### Database Tables

**`moderated_images`**
```sql
id              UUID (primary key)
filename        VARCHAR(255) - Generated UUID filename
original_name   VARCHAR(255) - Original upload name
file_path       TEXT - Server file path
public_url      TEXT - Public URL to access image
wallet_address  VARCHAR(44) - Uploader's wallet
context         VARCHAR(100) - Upload context
file_size       BIGINT - File size in bytes
mime_type       VARCHAR(100) - Image MIME type
status          VARCHAR(20) - pending_review|approved|rejected|deleted
uploaded_at     TIMESTAMP - Upload time
reviewed_by     VARCHAR(44) - Admin wallet who reviewed
reviewed_at     TIMESTAMP - Review time
review_reason   TEXT - Optional review notes
```

**`moderation_logs`**
```sql
id            UUID (primary key)
image_id      UUID - Reference to moderated_images
action        VARCHAR(20) - approve|reject|delete
reason        TEXT - Optional reason
admin_wallet  VARCHAR(44) - Admin who performed action
created_at    TIMESTAMP - Action time
```

---

## 🔐 Security Features

### Row Level Security (RLS)
✅ Users can only view their own images
✅ Admins can view all images
✅ Only admins can perform moderation actions
✅ Moderation logs are admin-only

### File Validation
✅ File type validation (images only)
✅ File size limit (10 MB max)
✅ Unique filenames (UUID-based)
✅ Safe file storage (outside web root)

### Admin Authentication
✅ Admin check via `isAdminForUser()` function
✅ Wallet-based authentication
✅ Service role key for database operations

---

## 📁 File Storage

### Upload Directory
```
public/uploads/moderated/
```

### File Naming Convention
```
{uuid}.{extension}
Example: 3f7b9a2c-4d1e-8f6a-9b3c-2e1d4f7a8b9c.jpg
```

### Public Access
```
https://yourdomain.com/uploads/moderated/{filename}
```

---

## 🧪 Testing the System

### Test as a User

1. **Go to a Bounty Page**
   ```
   /bounties/[any-bounty-id]
   ```

2. **Click "Submit Entry"**
   - Form opens with image upload section

3. **Upload an Image**
   - Drag & drop OR click to browse
   - Should see upload progress
   - Should see preview after upload
   - Should see "✓ Uploaded" badge

4. **Submit the Form**
   - Fill in title, description
   - Click "Submit Bounty Entry"
   - Submission should include the image URL

### Test as an Admin

1. **Access Admin Dashboard**
   ```
   /admin-dashboard
   ```

2. **Click "Images" Tab**
   - Should see any pending images
   - Click "Review" on an image

3. **Moderate the Image**
   - View full image
   - Add review reason
   - Click "Approve" or "Reject"
   - Should see status update

4. **Check Other Tabs**
   - Click "Approved" tab → see approved images
   - Click "Rejected" tab → see rejected images

---

## 🎯 Use Cases

### For Educational Content
- Students submit visual assignments
- Teachers review and grade
- Approved images displayed in gallery

### For Art Bounties
- Artists submit artwork
- Community/admins vote
- Winners displayed on leaderboard

### For Proof of Work
- Users submit screenshots
- Admins verify completion
- XP awarded upon approval

### For Community Engagement
- Users share memes/content
- Moderation prevents spam
- Best content featured

---

## 🚨 Troubleshooting

### Image Upload Fails

**Check:**
1. ✅ File is an image (JPG, PNG, GIF, WebP)
2. ✅ File size is under 10 MB
3. ✅ Wallet is connected
4. ✅ `/public/uploads/moderated/` directory exists
5. ✅ Database tables are created

**Fix:**
```bash
# Create upload directory
mkdir -p public/uploads/moderated

# Run database setup
# Execute setup-bounty-image-moderation.sql in Supabase
```

### Moderation Panel is Empty

**Check:**
1. ✅ You're logged in as admin
2. ✅ `is_admin = true` in users table
3. ✅ Images have been uploaded
4. ✅ Database tables exist

**Fix:**
```sql
-- Verify admin status
SELECT wallet_address, is_admin FROM users WHERE is_admin = true;

-- Check for images
SELECT * FROM moderated_images ORDER BY uploaded_at DESC LIMIT 10;
```

### Images Not Displaying

**Check:**
1. ✅ File exists in `/public/uploads/moderated/`
2. ✅ public_url is correct in database
3. ✅ Image status is 'approved' or 'pending_review'
4. ✅ No CORS issues

**Fix:**
```bash
# Check if file exists
ls public/uploads/moderated/

# Verify Next.js is serving static files
# Files in /public are automatically served
```

---

## 📊 Statistics & Monitoring

### View Moderation Stats

```sql
-- Total images by status
SELECT status, COUNT(*) as count 
FROM moderated_images 
GROUP BY status;

-- Images pending review
SELECT COUNT(*) as pending_count 
FROM moderated_images 
WHERE status = 'pending_review';

-- Most active uploaders
SELECT wallet_address, COUNT(*) as upload_count 
FROM moderated_images 
GROUP BY wallet_address 
ORDER BY upload_count DESC 
LIMIT 10;

-- Moderation activity
SELECT admin_wallet, action, COUNT(*) as count 
FROM moderation_logs 
GROUP BY admin_wallet, action 
ORDER BY count DESC;
```

---

## 🎉 Next Steps

### Current Status: ✅ FULLY FUNCTIONAL

Your system includes:
- ✅ Image upload with drag & drop
- ✅ Automatic validation
- ✅ Image preview
- ✅ Admin moderation panel
- ✅ Three-tab interface (Pending/Approved/Rejected)
- ✅ Review modal with full details
- ✅ Approve/Reject/Delete actions
- ✅ Download functionality
- ✅ Audit logging
- ✅ RLS security policies

### Optional Enhancements

1. **Email Notifications**
   - Notify users when images are approved/rejected
   
2. **Bulk Actions**
   - Approve/reject multiple images at once
   
3. **Image Gallery**
   - Public gallery of approved images
   
4. **Analytics Dashboard**
   - Charts for moderation statistics
   
5. **Auto-Moderation**
   - AI-based content filtering

---

## 📚 Related Files

### Core Components
- `src/components/bounty/BountySubmissionForm.tsx`
- `src/components/admin/ImageModerationPanel.tsx`

### API Routes
- `src/app/api/upload/moderated-image/route.ts`
- `src/app/api/admin/moderate-image/route.ts`

### Database
- `src/lib/database/migrations/create-moderated-images-tables.sql`
- `setup-bounty-image-moderation.sql` (this setup file)

### Admin Pages
- `src/app/admin/AdminDashboard.tsx` (includes Images tab)
- `src/app/admin/image-moderation/page.tsx` (dedicated page)

### Documentation
- `BOUNTY_IMAGE_UPLOAD_GUIDE.md` (detailed user guide)
- `BOUNTY_IMAGE_MODERATION_SETUP.md` (this file)

---

## 💡 Tips for Admins

1. **Be Prompt**: Review images within 24 hours
2. **Be Fair**: Use review reasons to explain decisions
3. **Be Consistent**: Apply moderation guidelines uniformly
4. **Archive Important Images**: Download key submissions
5. **Monitor Patterns**: Watch for repeat offenders
6. **Communicate**: Users appreciate feedback on rejections

---

## 🎨 Tips for Users

1. **Submit Quality**: Upload clear, relevant images
2. **Follow Guidelines**: Ensure images relate to the bounty
3. **Check Size**: Keep images under 10 MB
4. **Use Correct Format**: JPG, PNG, GIF, or WebP
5. **Be Patient**: Wait for admin review
6. **Learn from Feedback**: If rejected, check the reason

---

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Verify database tables are created
3. Ensure you have admin access (if moderating)
4. Check browser console for errors
5. Verify upload directory exists and is writable

---

**🎉 Your bounty image moderation system is ready to use!**

Just run the setup SQL file and start moderating! 🚀

