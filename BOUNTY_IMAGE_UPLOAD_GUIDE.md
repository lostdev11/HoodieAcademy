# Bounty Image Upload & Admin Moderation System

## 🎯 Overview

Your Hoodie Academy platform has a complete **image upload and moderation system** for bounties! Users can upload images when submitting bounties, and admins can review, approve, reject, or delete those images.

---

## 📤 For Users: How to Upload Images

### Step 1: Navigate to Bounties Page
Go to `/bounties` to see all available bounties.

### Step 2: Select a Bounty
Click on a bounty to submit your work.

### Step 3: Upload Your Image
In the bounty submission form, you'll find an image upload section with:
- **Drag & Drop** zone
- **File picker** button
- **Image preview** before submission

### Upload Requirements:
- ✅ **File Type**: Images only (JPG, PNG, GIF, WebP)
- ✅ **Max Size**: 10 MB
- ✅ **Status**: Images go to "Pending Review" automatically

### What Happens After Upload:
1. Image is saved to `/public/uploads/moderated/`
2. Record is created in `moderated_images` database table
3. Status is set to `pending_review`
4. Admin is notified to review the image
5. You'll receive feedback once reviewed

---

## 👨‍💼 For Admins: Image Moderation Dashboard

### Accessing the Moderation Panel

**Option 1: Main Admin Dashboard**
1. Navigate to `/admin-dashboard`
2. Click on the **"Images"** tab
3. See all uploaded images requiring review

**Option 2: Dedicated Page**
1. Navigate directly to `/admin/image-moderation`
2. Full-screen moderation interface

---

## 🛠️ Admin Features

### 1. **View Images by Status**

Three tabs available:
- **Pending Review** (⏰) - New uploads awaiting moderation
- **Approved** (✅) - Images that passed moderation
- **Rejected** (❌) - Images that were rejected

### 2. **Image Information Display**

For each image, you can see:
- 📷 **Image Preview** - Visual preview of the upload
- 👤 **Uploader Info** - Wallet address or display name
- 📅 **Upload Date** - When the image was submitted
- 📊 **File Size** - Size in MB
- 🏷️ **Context** - Where the image was uploaded (e.g., "bounty_submission")
- 🎯 **Squad** - User's squad affiliation

### 3. **Moderation Actions**

#### ✅ Approve Image
```
Action: Keeps the image file
Status: Changes to "approved"
Result: Image remains accessible, user can use it
```

#### ❌ Reject Image
```
Action: Deletes the physical file from server
Status: Changes to "rejected"
Result: File is removed, record kept for audit
Reason: Optional - add why it was rejected
```

#### 🗑️ Delete Image
```
Action: Deletes the physical file from server
Status: Changes to "deleted"
Result: File is removed permanently
Reason: Optional - add deletion reason
```

#### 💾 Download Image
```
Action: Save image to your local computer
Use Case: Archive, evidence, backup
```

### 4. **Review Workflow**

1. **Click "Review"** on a pending image
2. **Modal Opens** with:
   - Large image preview
   - User details
   - Upload information
   - Review reason text area
   - Action buttons

3. **Take Action**:
   - Add optional review reason/notes
   - Click **Approve**, **Reject**, or **Delete**
   - Click **Download** to save locally

4. **Confirmation**:
   - Status updates immediately
   - Image moves to appropriate tab
   - Action is logged in `moderation_logs` table

---

## 🗂️ Database Structure

### `moderated_images` Table
```sql
Columns:
- id (uuid)
- filename (text)
- original_name (text)
- file_path (text)
- public_url (text)
- wallet_address (text)
- context (text)
- file_size (bigint)
- mime_type (text)
- status (text) -- 'pending_review', 'approved', 'rejected', 'deleted'
- uploaded_at (timestamp)
- reviewed_by (text)
- reviewed_at (timestamp)
- review_reason (text)
- created_at (timestamp)
- updated_at (timestamp)
```

### `moderation_logs` Table
```sql
Columns:
- id (uuid)
- image_id (uuid)
- action (text) -- 'approve', 'reject', 'delete'
- reason (text)
- admin_wallet (text)
- created_at (timestamp)
```

---

## 🔄 API Endpoints

### Upload Image (User)
```
POST /api/upload/moderated-image

Body (FormData):
- file: File
- walletAddress: string
- context: string (default: 'bounty_submission')

Response:
{
  "success": true,
  "id": "uuid",
  "url": "/uploads/moderated/filename.jpg",
  "status": "pending_review",
  "message": "Image uploaded successfully and is pending admin review"
}
```

### Get Images for Moderation (Admin)
```
GET /api/admin/moderate-image?status=pending_review&limit=50&offset=0

Response:
{
  "success": true,
  "images": [...],
  "count": 10
}
```

### Moderate Image (Admin)
```
POST /api/admin/moderate-image

Body:
{
  "imageId": "uuid",
  "action": "approve" | "reject" | "delete",
  "reason": "optional reason",
  "adminWallet": "admin-wallet-address"
}

Response:
{
  "success": true,
  "image": {...},
  "action": "approve",
  "message": "Image approved successfully"
}
```

---

## 📊 Statistics Dashboard

The admin panel shows real-time statistics:

| Metric | Description |
|--------|-------------|
| **Pending Review** | Images awaiting moderation |
| **Approved** | Total approved images |
| **Rejected** | Total rejected images |
| **Deleted** | Total deleted images |

---

## 🔐 Security Features

### 1. **Admin-Only Access**
- ✅ Moderation endpoints require admin privileges
- ✅ Checked via `isAdminForUser()` function
- ✅ Wallet verification required

### 2. **File Validation**
- ✅ File type checking (images only)
- ✅ Size limit enforcement (10MB max)
- ✅ Unique filename generation (UUID)

### 3. **Audit Trail**
- ✅ All moderation actions logged
- ✅ Admin wallet address recorded
- ✅ Timestamps for all actions
- ✅ Review reasons stored

### 4. **File Management**
- ✅ Rejected/deleted images removed from server
- ✅ Database records retained for audit
- ✅ Orphaned files prevented

---

## 🎨 UI Components

### BountySubmissionForm
**Location**: `src/components/bounty/BountySubmissionForm.tsx`
- Drag & drop upload zone
- File picker
- Image preview
- Upload progress indicator
- Error handling

### ImageModerationPanel
**Location**: `src/components/admin/ImageModerationPanel.tsx`
- Tabbed interface (Pending/Approved/Rejected)
- Grid layout for images
- Review modal
- Action buttons with icons
- Download functionality

### AdminDashboard Integration
**Location**: `src/app/admin/AdminDashboard.tsx`
- "Images" tab added to main dashboard
- Integrated with other admin functions
- Consistent UI styling

---

## 🚀 Quick Start Guide for Admins

### First Time Setup

1. **Access the Admin Panel**
   ```
   Navigate to: /admin-dashboard
   Connect your admin wallet
   ```

2. **Check Database Status**
   ```
   Go to: /admin/image-moderation
   Click "Refresh" to check database tables
   If needed, click "Create Tables" to initialize
   ```

3. **Start Moderating**
   ```
   - Click "Images" tab in admin dashboard
   - See pending images
   - Click "Review" on any image
   - Approve, reject, or delete
   ```

### Daily Workflow

1. **Morning Check**: Review pending images
2. **Moderate**: Approve good submissions, reject inappropriate ones
3. **Download**: Save approved images for records if needed
4. **Monitor**: Check statistics to track volume

---

## 💡 Best Practices

### For Admins

1. **Be Prompt**: Review images within 24 hours
2. **Be Fair**: Use review reasons to explain rejections
3. **Be Consistent**: Apply moderation guidelines uniformly
4. **Archive Important Images**: Download key submissions
5. **Monitor Patterns**: Watch for repeat offenders

### For Users

1. **Submit Quality**: Upload clear, relevant images
2. **Follow Guidelines**: Ensure images relate to the bounty
3. **Appropriate Content**: No offensive or inappropriate images
4. **Correct Format**: Use supported image formats
5. **Wait Patiently**: Allow 24-48 hours for review

---

## 🐛 Troubleshooting

### Image Won't Upload
**Problem**: Upload fails
**Solutions**:
- Check file size (must be < 10MB)
- Verify file type (must be image)
- Check internet connection
- Try different browser
- Clear cache and retry

### Can't See Moderation Panel
**Problem**: Admin panel not accessible
**Solutions**:
- Verify admin wallet is connected
- Check admin status in database
- Ensure `is_admin = true` in users table
- Clear browser cache
- Try different browser

### Image Not Showing
**Problem**: Image URL broken
**Solutions**:
- Check file exists in `/public/uploads/moderated/`
- Verify `public_url` in database
- Check file permissions
- Regenerate if needed

### Database Tables Missing
**Problem**: `moderated_images` table doesn't exist
**Solutions**:
- Go to `/admin/image-moderation`
- Click "Create Tables" button
- Verify tables created in Supabase dashboard
- Refresh the page

---

## 📈 Future Enhancements

Potential improvements you could add:

1. **Bulk Actions**: Approve/reject multiple images at once
2. **Auto-Moderation**: AI-powered image content screening
3. **User Notifications**: Email/in-app notifications on review status
4. **Image Tagging**: Add tags/categories to images
5. **Advanced Filters**: Search by user, date range, context
6. **Export Reports**: Download moderation statistics
7. **Image Editing**: Crop/resize tools in admin panel
8. **Comments**: Allow admins to add comments visible to users

---

## 📞 Support

If you encounter issues:

1. Check this documentation
2. Review the troubleshooting section
3. Check browser console for errors
4. Verify database tables exist
5. Confirm admin access is granted

---

## ✅ Summary

Your image moderation system is **fully functional** with:

✅ User image uploads for bounties  
✅ Admin review/approval/rejection workflow  
✅ Database tracking and audit logs  
✅ Download and save functionality  
✅ Real-time statistics  
✅ Secure, role-based access  
✅ Clean, intuitive UI  

Navigate to `/admin-dashboard` → **Images** tab to start moderating! 🎉

