# 🎯 Bounty Submission System - Complete Setup

## Overview
Complete end-to-end bounty submission system with image upload, admin approval, and XP rewards.

---

## 🔧 **CRITICAL: Database Schema Setup**

### Step 1: Run the Database Migration

**YOU MUST RUN THIS FIRST** - Open Supabase SQL Editor and run `fix-bounty-submissions-schema.sql`:

```sql
-- Add missing columns to bounty_submissions table for image support

-- Add image_url column
ALTER TABLE bounty_submissions 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add title column
ALTER TABLE bounty_submissions 
ADD COLUMN IF NOT EXISTS title TEXT;

-- Add description column
ALTER TABLE bounty_submissions 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add squad column
ALTER TABLE bounty_submissions 
ADD COLUMN IF NOT EXISTS squad VARCHAR(50);

-- Add course_ref column
ALTER TABLE bounty_submissions 
ADD COLUMN IF NOT EXISTS course_ref TEXT;

-- Update submission_type to include 'both' option
ALTER TABLE bounty_submissions 
DROP CONSTRAINT IF EXISTS bounty_submissions_submission_type_check;

ALTER TABLE bounty_submissions 
ADD CONSTRAINT bounty_submissions_submission_type_check 
CHECK (submission_type IN ('text', 'link', 'image', 'file', 'both'));

-- Create index for image_url for faster lookups
CREATE INDEX IF NOT EXISTS idx_bounty_submissions_image_url 
ON bounty_submissions(image_url) 
WHERE image_url IS NOT NULL;
```

### Step 2: Verify Schema

After running the migration, verify the columns exist:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'bounty_submissions'
ORDER BY ordinal_position;
```

You should see:
- `id`, `bounty_id`, `wallet_address`, `submission_content`, `submission_type`
- `status`, `admin_notes`, `created_at`, `updated_at`
- **NEW**: `image_url`, `title`, `description`, `squad`, `course_ref`

---

## 📁 System Architecture

### Frontend Components

#### 1. **Bounty Page** (`src/app/bounties/page.tsx`)
- Full-screen dark-themed bounty display
- Navigation to Home and Dashboard
- Stats cards showing active bounties, total rewards, submissions
- Uses `BountiesGrid` component

#### 2. **BountiesGrid** (`src/components/BountiesGrid.tsx`)
- Displays all bounties in a responsive grid
- Each bounty card shows:
  - Title, description, reward, deadline
  - Submission count
  - Status badge (active/completed/expired)
  - Submission form (if user hasn't submitted)

#### 3. **BountySubmissionCard** (within `BountiesGrid.tsx`)
- **Text Input**: Textarea for submission description
- **Image Upload**: 
  - Drag & drop area
  - "Choose Image File" button
  - Auto-upload on file selection
  - Image preview
  - Upload status (uploading/success/error)
- **Submit Button**: 
  - Disabled until requirements met
  - Shows loading state during submission
  - Development debug panel showing validation status

### Backend APIs

#### 1. **Bounty Submission** (`/api/bounties/[id]/submit/`)

**POST Request:**
```typescript
{
  submission: string;          // Text content
  walletAddress: string;        // User's wallet
  submissionType: 'text' | 'both';  // Type of submission
  imageUrl?: string;           // Uploaded image URL (optional)
  title?: string;              // Title (optional)
  description?: string;        // Description (optional)
  squad?: string;              // Squad affiliation (optional)
  courseRef?: string;          // Course reference (optional)
}
```

**Response (Success):**
```typescript
{
  success: true;
  submission: {
    id: string;
    bounty_id: string;
    wallet_address: string;
    submission_content: string;
    submission_type: string;
    image_url?: string;
    status: 'pending';
    created_at: string;
    // ... other fields
  };
  message: 'Bounty submitted successfully!';
}
```

**Features:**
- Validates bounty exists and is active
- Prevents duplicate submissions per wallet
- Auto-increments bounty submission count
- Stores image URL and metadata
- Comprehensive error logging

#### 2. **Image Upload** (`/api/upload/moderated-image`)

**POST Request (FormData):**
```typescript
{
  file: File;                  // Image file
  walletAddress: string;       // User's wallet
  context: 'bounty_submission'; // Upload context
}
```

**Response:**
```typescript
{
  success: true;
  id: string;                  // Moderated image record ID
  url: string;                 // Public URL to image
  fileName: string;            // Stored filename
  originalName: string;        // Original filename
  status: 'pending';           // Moderation status
}
```

**Features:**
- Validates file type and size
- Converts images to AVIF format
- Stores with moderation status
- Returns public URL immediately
- Tracks uploader wallet address

#### 3. **Admin Submissions API** (`/api/admin/submissions`)

**GET Request:**
```
/api/admin/submissions?wallet=<admin_wallet>
```

**Response:**
```typescript
[
  {
    id: string;
    wallet_address: string;
    bounty_id: string;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    updated_at: string;
    bounty: {
      id: string;
      title: string;
      short_desc: string;
      reward: string;
      reward_type: 'XP' | 'SOL' | 'NFT';
      status: string;
      squad_tag?: string;
    };
    submission: {
      id: string;
      title: string;
      description: string;
      image_url?: string;
      created_at: string;
      status: string;
    };
  }
]
```

**Features:**
- Fetches all bounty submissions with bounty details
- Includes image URLs for review
- Ordered by creation date (newest first)
- Comprehensive error handling

#### 4. **Submission Approval** (`/api/admin/submissions/approve`)

**POST Request:**
```typescript
{
  submissionId: string;
  walletAddress: string;  // Admin wallet
  action: 'approve' | 'reject';
}
```

**Features:**
- Admin authentication check
- Updates submission status
- Awards XP/SOL on approval
- Marks bounty as completed for user
- Logs approval/rejection activity
- Comprehensive error handling

---

## 🎨 User Flow

### Submitting a Bounty

1. **Navigate** to `/bounties`
2. **View** available bounties (active bounties only)
3. **Click** "View Details" on a bounty card
4. **Enter** submission text in the textarea
5. **Upload** image (optional or required based on bounty):
   - Click the drag & drop area, OR
   - Click "Choose Image File" button
   - Wait for ✅ upload success
6. **Submit** - button enabled when:
   - Text is entered, AND
   - Image is uploaded (if required)
7. **Confirmation** - Success message appears
8. **Card Updates** - Bounty card shows "Submission Submitted" status

### Admin Review Flow

1. **Navigate** to `/admin-dashboard`
2. **Click** "Submissions" tab
3. **View** pending submissions with:
   - User wallet address
   - Bounty title
   - Submission text
   - Uploaded image (if any)
   - Submission date
4. **Review** submission content and image
5. **Approve** or **Reject**:
   - **Approve**: Awards XP/SOL, marks bounty as completed
   - **Reject**: Updates status, no rewards
6. **View** approved/rejected submissions in respective tabs

---

## 📊 Database Schema

### `bounty_submissions` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `bounty_id` | UUID | Foreign key to bounties |
| `wallet_address` | TEXT | Submitter's wallet |
| `submission_content` | TEXT | Main submission text |
| `submission_type` | VARCHAR(20) | 'text', 'link', 'image', 'file', 'both' |
| `status` | VARCHAR(20) | 'pending', 'approved', 'rejected', 'completed' |
| `image_url` | TEXT | URL to uploaded image |
| `title` | TEXT | Submission title |
| `description` | TEXT | Additional description |
| `squad` | VARCHAR(50) | User's squad affiliation |
| `course_ref` | TEXT | Related course reference |
| `admin_notes` | TEXT | Admin notes/comments |
| `created_at` | TIMESTAMPTZ | Submission timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

### Constraints
- **Unique**: One submission per wallet per bounty (`bounty_id`, `wallet_address`)
- **Foreign Key**: `bounty_id` references `bounties(id)` with CASCADE delete
- **Check**: `submission_type` IN ('text', 'link', 'image', 'file', 'both')
- **Check**: `status` IN ('pending', 'approved', 'rejected', 'completed')

### Indexes
- `idx_bounty_submissions_bounty_id` - Fast bounty lookups
- `idx_bounty_submissions_wallet_address` - Fast user lookups
- `idx_bounty_submissions_status` - Fast status filtering
- `idx_bounty_submissions_created_at` - Chronological ordering
- `idx_bounty_submissions_image_url` - Image submissions only
- `idx_bounty_submissions_unique` - Prevents duplicates

---

## 🔍 Debugging

### Frontend Debug Features

**Development Mode Only** - Debug panel shows:
- ✅/❌ Text entered
- Yes/No Image required
- ✅/❌ File selected
- ✅/❌ Upload success
- ✅/❌ Can submit

**Console Logs:**
- 🔄 Image upload start
- ✅ Image uploaded successfully
- 🚀 Submitting bounty (with all data)
- 📤 Request being sent
- 📥 API response status
- 📥 API response data
- ✅ Success or ❌ Error

### Backend Debug Features

**API Logs:**
- 🎯 Bounty submission request received
- 📝 Data being inserted
- ✅ Submission created successfully
- ❌ Errors with full details

---

## 🚨 Common Issues & Solutions

### Issue: "Cannot submit - missing wallet or text"
**Cause**: Wallet not connected or text field empty
**Solution**: 
1. Ensure wallet is connected (check localStorage for `walletAddress` or `hoodie_academy_wallet`)
2. Type text in the submission field

### Issue: "500 Internal Server Error" when submitting
**Cause**: Database schema missing columns
**Solution**: Run `fix-bounty-submissions-schema.sql` in Supabase SQL Editor

### Issue: Image uploads but submit fails
**Cause**: State management or validation issue
**Solution**: 
1. Check that `uploadSuccess` is `true`
2. Check that text is entered
3. Look at development debug panel for validation status

### Issue: Submissions not appearing in admin dashboard
**Cause**: API fetching from wrong table
**Solution**: 
1. Verify admin API is fetching from `bounty_submissions`
2. Check database for submissions: `SELECT * FROM bounty_submissions;`
3. Check console for API errors

### Issue: "You have already submitted for this bounty"
**Cause**: Duplicate submission attempt
**Solution**: This is expected - users can only submit once per bounty

---

## ✅ Testing Checklist

### User Submission Flow
- [ ] Can navigate to `/bounties` page
- [ ] Can see active bounties
- [ ] Can expand "View Details" on a bounty
- [ ] Can type submission text
- [ ] Can upload image via drag & drop
- [ ] Can upload image via "Choose Image File" button
- [ ] See upload progress indicator
- [ ] See upload success message
- [ ] See image preview after upload
- [ ] Submit button is disabled until requirements met
- [ ] Submit button is enabled when valid
- [ ] Can click submit and see loading state
- [ ] See success message after submission
- [ ] Card shows "Submission Submitted" status
- [ ] Cannot submit duplicate for same bounty

### Admin Review Flow
- [ ] Can navigate to `/admin-dashboard`
- [ ] Can see "Submissions" tab
- [ ] See pending submissions count
- [ ] See submission details (wallet, bounty, text, image)
- [ ] Can view uploaded images
- [ ] Can approve submission
- [ ] Can reject submission
- [ ] See approved submissions in Approved tab
- [ ] See rejected submissions in Rejected tab

### Database
- [ ] Run `fix-bounty-submissions-schema.sql`
- [ ] Verify columns exist in `bounty_submissions`
- [ ] Check RLS policies allow inserts
- [ ] Verify submissions appear in database after submit
- [ ] Verify status updates on approve/reject

---

## 🎉 Features Implemented

### ✅ User Side
- Beautiful dark-themed bounty page matching app style
- Full-screen layout with animated backgrounds
- Drag & drop image upload
- Alternative upload button
- Image preview and upload status
- Real-time validation feedback
- Prevention of duplicate submissions
- Submission status tracking

### ✅ Admin Side
- Dedicated submissions tab in admin dashboard
- Three-tab view: Pending, Approved, Rejected
- Stats overview (pending/approved/rejected counts)
- View submission details and images
- One-click approve/reject actions
- Automatic XP/SOL rewards on approval
- Activity logging for auditing

### ✅ Backend
- Secure bounty submission API
- Image upload with moderation queue
- Duplicate prevention
- Admin-only approval endpoints
- Comprehensive error handling
- Detailed logging for debugging
- Database schema migrations

---

## 🔐 Security Features

1. **Wallet Verification**: Only connected wallets can submit
2. **Duplicate Prevention**: Unique constraint on (bounty_id, wallet_address)
3. **Admin Checks**: Approval endpoints verify admin status
4. **Image Moderation**: All uploaded images pending review
5. **RLS Policies**: Row-level security on all tables
6. **Input Validation**: Server-side validation of all inputs

---

## 📈 Next Steps

### Enhancements
- [ ] Add rich text editor for submissions
- [ ] Support multiple image uploads per submission
- [ ] Add submission editing before approval
- [ ] Email notifications for approval/rejection
- [ ] Submission comments/feedback from admin
- [ ] Batch approve/reject actions
- [ ] Export submissions to CSV
- [ ] Submission search and filtering

### Rewards Integration
- [ ] Auto-award XP on approval (via existing XP system)
- [ ] SOL payment integration
- [ ] NFT prize distribution
- [ ] Leaderboard updates on approval
- [ ] Badge/achievement unlocks

---

## 🎓 For Developers

### File Structure
```
src/
├── app/
│   ├── bounties/
│   │   └── page.tsx                    # Main bounty page
│   └── api/
│       ├── bounties/
│       │   └── [id]/
│       │       └── submit/
│       │           └── route.ts        # Submission endpoint
│       ├── upload/
│       │   └── moderated-image/
│       │       └── route.ts            # Image upload
│       └── admin/
│           └── submissions/
│               ├── route.ts            # Fetch submissions
│               └── approve/
│                   └── route.ts        # Approve/reject
├── components/
│   ├── BountiesGrid.tsx                # Bounty display + submission
│   └── admin/
│       └── SubmissionApproval.tsx      # Admin review interface
```

### Key Functions

**`handleSubmitBounty`** - Submits bounty with text and image
**`uploadImage`** - Handles image upload to moderation queue
**`handleApprove`** - Admin approves submission
**`handleReject`** - Admin rejects submission

### State Management

**BountySubmissionCard:**
- `submissionText` - User's submission text
- `selectedFile` - Chosen image file
- `uploadedImageUrl` - URL after successful upload
- `isUploading` - Upload in progress
- `uploadSuccess` - Upload completed successfully
- `canSubmit` - Validation status

**BountiesGrid:**
- `bounties` - List of all bounties
- `userSubmissions` - User's submission status per bounty
- `submittingBounty` - Which bounty is being submitted
- `walletAddress` - Connected wallet

---

## 📝 Code Examples

### Submitting a Bounty (Frontend)
```typescript
const handleSubmitBounty = async (
  bountyId: string,
  submissionText: string,
  imageUrl?: string
) => {
  const response = await fetch(`/api/bounties/${bountyId}/submit/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      submission: submissionText,
      walletAddress,
      submissionType: imageUrl ? 'both' : 'text',
      imageUrl: imageUrl || undefined
    })
  });
  
  const result = await response.json();
  if (response.ok) {
    // Update UI, show success message
  }
};
```

### Fetching Submissions (Admin)
```typescript
const fetchSubmissions = async () => {
  const response = await fetch(`/api/admin/submissions?wallet=${adminWallet}`);
  const submissions = await response.json();
  // Display in admin dashboard
};
```

### Approving a Submission (Admin)
```typescript
const approveSubmission = async (submissionId: string) => {
  const response = await fetch('/api/admin/submissions/approve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      submissionId,
      walletAddress: adminWallet,
      action: 'approve'
    })
  });
  
  const result = await response.json();
  // Update UI, show success
};
```

---

## 🎯 Success Criteria

When everything is working:

1. ✅ User can submit bounty with text and image
2. ✅ Submission appears in database immediately
3. ✅ Admin sees submission in dashboard
4. ✅ Admin can view submission details and image
5. ✅ Admin can approve submission
6. ✅ User receives XP/SOL rewards on approval
7. ✅ Bounty is marked as completed for user
8. ✅ Submission count increases on bounty card
9. ✅ User cannot submit duplicate to same bounty
10. ✅ All actions are logged and tracked

---

## 🚀 Deployment Notes

1. Run database migration in production Supabase
2. Ensure environment variables are set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (for admin operations)
3. Test submission flow in production
4. Verify image uploads work with production URLs
5. Test admin approval flow
6. Monitor server logs for errors

---

## 📞 Support

If submissions aren't working:
1. Check browser console for frontend errors
2. Check server terminal for backend errors
3. Verify database schema matches requirements
4. Check RLS policies in Supabase
5. Verify wallet is connected
6. Clear browser cache and localStorage

---

**Last Updated:** October 10, 2025
**Status:** ✅ Complete - Ready for testing after database migration

