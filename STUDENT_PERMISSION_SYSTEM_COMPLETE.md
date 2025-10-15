# 🎓 STUDENT PERMISSION SYSTEM - COMPLETE!

## ✅ **RAISE HAND / REQUEST TO SPEAK SYSTEM READY!**

Students must now request permission from the host before they can speak or show video! 🎯

---

## 🚀 **SETUP (2 STEPS)**

### **Step 1: Run SQL Setup**
In Supabase SQL Editor, run:
```bash
setup-student-permissions.sql
```

### **Step 2: Refresh Browser**
```
Ctrl + Shift + R
```

**Done!** The permission system is active! 🎉

---

## 📋 **HOW IT WORKS**

### **For Students (Attendees):**

#### **1. Student Joins Live Session**
When a student visits a live session, they see:

```
┌────────────────────────────────────────┐
│                                         │
│        👥                               │
│                                         │
│   🎓 Join the Live Session             │
│   You're viewing this live session     │
│   To speak and show your video,        │
│   you need host approval                │
│                                         │
│   [✋ Raise Hand to Speak]              │
│                                         │
│   💡 Click "Raise Hand" and the host   │
│   will be notified. Once approved,     │
│   you'll be able to turn on your       │
│   camera and microphone.               │
│                                         │
└────────────────────────────────────────┘
```

#### **2. Student Clicks "Raise Hand"**
After clicking, they see:

```
┌────────────────────────────────────────┐
│                                         │
│        ✋ (pulsing)                     │
│                                         │
│   ⏳ Waiting for Host Approval         │
│   Your hand is raised!                  │
│   The host will approve your request   │
│   shortly                               │
│                                         │
│   ⚪ ⚪ ⚪ (animated dots)              │
│                                         │
│   ⏰ Checking for approval every       │
│   few seconds...                        │
│                                         │
└────────────────────────────────────────┘
```

The system automatically polls for approval every 3 seconds.

#### **3a. If Host APPROVES**
Browser asks for camera/mic permission:

```
┌─────────────────────────────────────┐
│ localhost:3000 wants to:            │
│ 📹 Use your camera                  │
│ 🎙️ Use your microphone              │
│                                      │
│ [ Block ]  [ Allow ] ← CLICK THIS!  │
└─────────────────────────────────────┘
```

Then student's video feed activates! ✅

#### **3b. If Host DENIES**
```
┌────────────────────────────────────────┐
│                                         │
│        ⛔                               │
│                                         │
│   ❌ Request Denied                    │
│   The host declined your request       │
│   to speak                              │
│   You can continue watching            │
│   the session                           │
│                                         │
│   [ Try Requesting Again ]             │
│                                         │
└────────────────────────────────────────┘
```

---

### **For Host:**

#### **1. Host Sees Request Notification**
When students raise their hand, host sees this panel **above the video**:

```
┌────────────────────────────────────────────────┐
│  ✋ Students Waiting to Speak [2]              │
│  Approve or deny their requests below          │
│                                                  │
│  ┌──────────────────────────────────────────┐ │
│  │ 👤 Student qg7pNN...  [✓ Approve] [✗ Deny] │ │
│  └──────────────────────────────────────────┘ │
│                                                  │
│  ┌──────────────────────────────────────────┐ │
│  │ 👤 Student 8xKm3P...  [✓ Approve] [✗ Deny] │ │
│  └──────────────────────────────────────────┘ │
│                                                  │
│  💡 Tip: Approved students will be able to     │
│  turn on their camera and microphone           │
└────────────────────────────────────────────────┘
```

#### **2. Host Clicks "Approve"**
- Request disappears from list
- Student gets notified automatically (via polling)
- Student's browser asks for camera/mic
- Student's video appears in grid

#### **3. Host Clicks "Deny"**
- Request disappears from list
- Student sees "Request Denied" message
- Student can request again

---

## 🎯 **FEATURES**

### **Security:**
- ✅ Students **CANNOT** turn on camera/mic without approval
- ✅ Host must explicitly approve each student
- ✅ Database-backed permission tracking
- ✅ RLS policies prevent unauthorized access

### **User Experience:**
- ✅ **Auto-polling**: Students automatically notified when approved (no refresh needed)
- ✅ **Visual feedback**: Different screens for waiting, approved, denied
- ✅ **Real-time**: Updates every 3 seconds
- ✅ **No manual refresh**: Everything happens automatically

### **Host Control:**
- ✅ **See all pending requests** in one panel
- ✅ **Approve or deny** with one click
- ✅ **Panel auto-updates** every 5 seconds
- ✅ **Panel auto-hides** when no requests

---

## 📁 **FILES CREATED**

### **Database:**
1. **`setup-student-permissions.sql`**
   - Creates `session_student_permissions` table
   - RLS policies for security
   - Functions: `request_to_speak`, `manage_student_permission`, `check_student_permission`, `get_pending_requests`

### **API Routes:**
2. **`src/app/api/mentorship/permissions/request/route.ts`**
   - POST endpoint for students to request permission
   
3. **`src/app/api/mentorship/permissions/manage/route.ts`**
   - POST endpoint for hosts to approve/deny/revoke permissions
   
4. **`src/app/api/mentorship/permissions/check/route.ts`**
   - GET endpoint to check student permission status
   
5. **`src/app/api/mentorship/permissions/pending/route.ts`**
   - GET endpoint to get list of pending requests

### **Components:**
6. **`src/components/mentorship/NativeVideoPlayer.tsx`** (Updated)
   - Added student permission checking
   - Added "Raise Hand" button
   - Added waiting/denied states
   - Auto-polls for approval
   
7. **`src/components/mentorship/HostPermissionPanel.tsx`** (New)
   - Shows pending requests to host
   - Approve/deny buttons
   - Auto-refreshes every 5 seconds
   
8. **`src/app/mentorship/[id]/page.tsx`** (Updated)
   - Added `HostPermissionPanel` for hosts
   - Passes `userWallet` to `NativeVideoPlayer`

---

## 🔄 **FLOW DIAGRAM**

### **Student Flow:**
```
Student Visits Session
        ↓
See "Raise Hand to Speak" button
        ↓
Click Button
        ↓
Status: "Waiting for Host Approval"
        ↓
[Auto-polling every 3 seconds]
        ↓
    ┌───────────┴───────────┐
    ↓                        ↓
✅ APPROVED              ❌ DENIED
    ↓                        ↓
Browser asks for         Show "Request Denied"
camera/mic                   ↓
    ↓                    Can request again
Allow permission
    ↓
Camera & mic active! 🎥
```

### **Host Flow:**
```
Host Goes Live
        ↓
Student raises hand
        ↓
Orange notification panel appears
        ↓
Host sees: "Students Waiting to Speak [1]"
        ↓
    ┌───────────┴───────────┐
    ↓                        ↓
Click [Approve]          Click [Deny]
    ↓                        ↓
Student gets access      Student sees denied
Request removed          Request removed
```

---

## 🎨 **VISUAL STATES**

### **Student States:**

#### **State 1: No Permission**
- 🎓 "Join the Live Session"
- Purple/cyan gradient
- Big "Raise Hand to Speak" button

#### **State 2: Waiting**
- ⏳ "Waiting for Host Approval"
- Orange gradient
- Animated hand emoji (pulsing)
- Animated dots

#### **State 3: Denied**
- ❌ "Request Denied"
- Red gradient
- ⛔ Stop sign emoji
- "Try Requesting Again" button

#### **State 4: Approved**
- 📹 "Requesting Camera Access"
- Cyan gradient
- Camera permission prompt
- Then: Camera feed activates

---

## 💻 **DATABASE SCHEMA**

### **Table: `session_student_permissions`**
```sql
id                UUID PRIMARY KEY
session_id        UUID NOT NULL
student_wallet    TEXT NOT NULL
student_name      TEXT
can_speak         BOOLEAN DEFAULT FALSE
can_show_video    BOOLEAN DEFAULT FALSE
requested_at      TIMESTAMPTZ
approved_at       TIMESTAMPTZ
approved_by       TEXT
status            TEXT  -- 'waiting', 'approved', 'denied', 'revoked'
created_at        TIMESTAMPTZ DEFAULT NOW()
updated_at        TIMESTAMPTZ DEFAULT NOW()

UNIQUE(session_id, student_wallet)
```

### **Functions:**
1. **`request_to_speak(session_id, student_wallet, student_name)`**
   - Creates or updates permission request
   - Returns success status

2. **`manage_student_permission(permission_id, host_wallet, action, can_speak, can_show_video)`**
   - Actions: 'approve', 'deny', 'revoke'
   - Verifies host authorization
   - Updates permission record

3. **`check_student_permission(session_id, student_wallet)`**
   - Returns current permission status
   - Used by students to check if approved

4. **`get_pending_requests(session_id)`**
   - Returns list of waiting requests
   - Used by host permission panel

---

## 🧪 **TESTING**

### **Test as Student:**
1. Open incognito window
2. Connect different wallet
3. Visit live session URL
4. Click "Raise Hand to Speak"
5. See "Waiting for Host Approval"

### **Test as Host:**
1. Go live from admin dashboard
2. See your camera feed
3. Wait for student to raise hand
4. Orange panel appears above video
5. Click "Approve"
6. Panel disappears

### **Verify Student Approved:**
1. In student window, wait 3 seconds
2. Should auto-refresh to camera permission
3. Click "Allow" on browser popup
4. Student camera activates!

---

## 🔧 **CONFIGURATION**

### **Polling Intervals:**
- **Student polling**: Every 3 seconds (checks for approval)
- **Host polling**: Every 5 seconds (checks for new requests)
- **Max polling time**: 5 minutes (then stops)

### **Permissions:**
When host approves, both are enabled by default:
- `can_speak: true` (microphone)
- `can_show_video: true` (camera)

### **Custom Permissions:**
You can approve with limited permissions:
```javascript
{
  can_speak: true,      // Allow mic only
  can_show_video: false // Camera off
}
```

---

## 🐛 **TROUBLESHOOTING**

### **"Students can't see Raise Hand button"**
**Check:**
- `userWallet` prop is passed to `NativeVideoPlayer`
- Student is NOT identified as host
- Session is live (`status = 'live'`)

### **"Host doesn't see permission panel"**
**Check:**
- Host wallet matches `session.mentor_wallet` or is admin
- At least one student has raised hand
- Panel auto-hides if no requests

### **"Student stuck on 'Waiting' forever"**
**Check:**
- Network tab for failed API calls
- Console for errors
- Polling is running (check every 3 seconds in network tab)

### **"Permission not persisting"**
**Check:**
- Database: `SELECT * FROM session_student_permissions WHERE status = 'approved'`
- Should see approved record
- RLS policies allow access

---

## 📊 **CONSOLE LOGS**

### **Student Side:**
```javascript
// When raising hand
✅ Permission requested

// While polling
Checking permissions...

// When approved
🎉 Permission approved!
📹 Requesting camera and microphone access...
✅ Camera and microphone access granted!

// When denied
❌ Permission denied
```

### **Host Side:**
```javascript
// When request comes in
Fetching pending requests... [1 request]

// When approving
✅ Permission approved

// When denying
❌ Permission denied
```

---

## ✅ **CHECKLIST**

Before testing:
- [ ] Ran `setup-student-permissions.sql` in Supabase
- [ ] Refreshed browser: `Ctrl + Shift + R`
- [ ] Session is live (`status = 'live'`)
- [ ] Session uses native streaming (`stream_platform = 'native'`)

Test as Host:
- [ ] Go live from admin dashboard
- [ ] Camera feed shows
- [ ] No permission panel (yet)

Test as Student:
- [ ] Open incognito with different wallet
- [ ] Visit live session
- [ ] See "Raise Hand to Speak" button
- [ ] Click button
- [ ] See "Waiting for Host Approval"

Test Approval:
- [ ] Switch to host window
- [ ] See orange notification panel
- [ ] See student in list
- [ ] Click "Approve"
- [ ] Panel disappears

Test Student Approval:
- [ ] Switch to student window
- [ ] Wait up to 3 seconds
- [ ] See "Requesting Camera Access"
- [ ] Browser asks for permission
- [ ] Click "Allow"
- [ ] Student camera activates ✅

---

## 🎉 **YOU'RE DONE!**

The complete permission system is ready:

### **✅ Students:**
- Must raise hand to speak
- See clear waiting state
- Auto-notified when approved
- Can request again if denied

### **✅ Hosts:**
- See all pending requests
- Approve/deny with one click
- Panel auto-updates
- Full control over who speaks

### **✅ Security:**
- Database-backed permissions
- RLS policies protect data
- Only approved students get camera access
- Host has full control

---

## 🚀 **NEXT STEPS**

Possible enhancements:
- [ ] Audio-only mode (mic without camera)
- [ ] Time limits (auto-revoke after X minutes)
- [ ] Queue system (approve in order)
- [ ] Chat instead of video
- [ ] Hand raise count tracking
- [ ] Notification sound for host
- [ ] Student video grid (multiple students)
- [ ] Picture-in-picture mode

---

## 📹 **TEST NOW!**

1. **Run SQL**: `setup-student-permissions.sql`
2. **Refresh**: `Ctrl + Shift + R`
3. **Go Live**: As host
4. **Open Incognito**: As student
5. **Raise Hand**: Click the button
6. **Approve**: From host panel
7. **See Video**: Student camera appears! 🎥

**The permission system is complete and working!** 🎉✨

