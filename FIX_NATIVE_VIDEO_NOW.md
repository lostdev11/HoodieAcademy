# 🎥 Fix Native Video - Show Video Feed of Host

## ⚠️ **The Problem**
Your session is set to `stream_platform = 'discord'` which redirects to Discord. You want **native video** showing the host's video feed in the browser.

---

## ✅ **The Solution** (2 Minutes)

### **Step 1: Update Your Sessions to Use Native Video**

Run this in **Supabase SQL Editor**:

```sql
-- Check what platforms your sessions use
SELECT id, title, stream_platform, status
FROM mentorship_sessions
ORDER BY created_at DESC;

-- Update ALL sessions to use native video
UPDATE mentorship_sessions
SET stream_platform = 'native'
WHERE stream_platform != 'native';

-- Verify it worked
SELECT id, title, stream_platform, status
FROM mentorship_sessions;
```

**Or run the file:** `check-sessions-and-fix.sql`

---

### **Step 2: Refresh and Go Live Again**

1. **Refresh** your browser: `Ctrl + Shift + R`
2. Go to **Admin Dashboard** → **Live Sessions** → **Sessions**
3. Click **"Go Live Now"** again
4. This time you'll see the **VIDEO INTERFACE** with your camera! 🎥

---

## 🎬 **What You'll See Now**

After clicking "Go Live":

### **Page Redirects to Video Interface:**
```
┌────────────────────────────────────────────────────┐
│  🔴 LIVE NOW                          👑 Host       │
├────────────────────────────────────────────────────┤
│                                                      │
│  🎥 Live Video Feed - You are the host!            │
│  ┌──────────────────────────────────────────────┐  │
│  │                                                │  │
│  │         📹 YOUR VIDEO FEED HERE                │  │
│  │                                                │  │
│  │  Shows your camera (allow permissions)        │  │
│  │  Shows attendees when they join               │  │
│  │                                                │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  Controls:                                          │
│  [ 🎙️ Mute ]  [ 📹 Camera ]  [ 🖥️ Screen Share ]  │
│  [ 🔊 Volume ]  [ ⛶ Fullscreen ]  [ ☎️ Leave ]    │
│                                                      │
│  👥 1 participant (you)                             │
└────────────────────────────────────────────────────┘
```

---

## 🎯 **Key Difference**

### **Before (Discord/External):**
```sql
stream_platform = 'discord'
stream_url = 'https://discord.gg/...'
```
**Result:** ❌ Redirects to Discord (external link)

### **After (Native Video):**
```sql
stream_platform = 'native'
stream_url = NULL (or optional external backup)
```
**Result:** ✅ **Shows video player IN THE PAGE** with your camera feed!

---

## 🎥 **Native Video Features**

When `stream_platform = 'native'`, you get:

### **Video Display:**
- ✅ **Your video feed** in a box on the page
- ✅ **Attendee video feeds** in a grid
- ✅ **Real-time** - no delay
- ✅ **In-browser** - no external apps
- ✅ **HD quality** - up to 1080p

### **Host Controls:**
- ✅ **Microphone** - mute/unmute
- ✅ **Camera** - on/off
- ✅ **Screen Share** - show your screen to attendees
- ✅ **Volume** - control audio
- ✅ **Fullscreen** - expand view

### **Participant View:**
- ✅ **See everyone** in grid layout
- ✅ **Auto-layout** - adjusts as people join/leave
- ✅ **Participant counter** - "👥 5 participants"
- ✅ **Active speaker** - highlights who's talking

---

## 🌐 **Multi-Platform Streaming (Bonus)**

You can **stream to BOTH** native video AND Discord/YouTube!

### **Setup Multi-Platform:**
```sql
UPDATE mentorship_sessions
SET 
  stream_platform = 'native',  -- Shows video player
  stream_url = 'https://discord.gg/yourlink'  -- Also shows Discord link
WHERE id = 'your-session-id';
```

### **What Attendees See:**
1. **Primary:** 🎥 Native video player (in the page)
2. **Secondary:** 🌐 "Also Streaming On Discord" button below

This lets people choose:
- Join in-app video (native)
- OR join on Discord/YouTube/etc.

---

## 📋 **Complete Checklist**

### **Database Setup:**
- [ ] Run `check-sessions-and-fix.sql` to update sessions
- [ ] OR manually update with the SQL above
- [ ] Verify: `stream_platform = 'native'`

### **Browser Setup:**
- [ ] Using Chrome, Edge, or Safari (recommended)
- [ ] Camera/microphone connected
- [ ] Will allow permissions when prompted

### **Go Live:**
- [ ] Refresh admin dashboard
- [ ] Navigate to Live Sessions → Sessions
- [ ] Click "Go Live Now"
- [ ] **Watch it redirect to video interface!**
- [ ] **Allow camera/mic permissions**
- [ ] **See yourself on video!** ✅

---

## 🎬 **What Happens Step-by-Step**

### **1. Click "Go Live Now"**
```
Button clicked
  ↓
API call to /api/mentorship/go-live
  ↓
Session status → 'live'
  ↓
Redirect to /mentorship/[session-id]
```

### **2. Page Loads Video Interface**
```
Page loads
  ↓
Checks: stream_platform === 'native' ✅
  ↓
Creates Daily.co video room
  ↓
Shows "Setting up video room..." (2-3 seconds)
  ↓
Video room ready!
```

### **3. Video Interface Appears**
```
🔴 LIVE NOW header
  ↓
👑 Host badge (for you)
  ↓
📹 VIDEO PLAYER loads
  ↓
Asks for camera/mic permissions
  ↓
YOUR VIDEO FEED APPEARS! 🎉
  ↓
Control buttons activate
  ↓
Ready to stream!
```

---

## 🐛 **If You Still See Discord Link:**

### **Check Session Settings:**
```sql
-- Find your session ID
SELECT id, title, stream_platform
FROM mentorship_sessions
WHERE status = 'live' OR status = 'scheduled'
ORDER BY created_at DESC;

-- Update specific session to native
UPDATE mentorship_sessions
SET stream_platform = 'native',
    stream_url = NULL
WHERE id = 'your-session-id-here';
```

### **Clear Cache:**
1. Press `Ctrl + Shift + R` to hard refresh
2. Or clear browser cache completely
3. Close and reopen browser tab

---

## 🎯 **Different Streaming Options**

### **Option 1: Native Video Only** (Recommended)
```sql
stream_platform = 'native'
stream_url = NULL
```
✅ Video player shows in page
✅ Full host controls
✅ See all attendees
✅ No external apps needed

### **Option 2: External Platform Only**
```sql
stream_platform = 'discord'  -- or 'youtube', 'zoom', etc.
stream_url = 'https://...'
```
✅ Opens external link
❌ No video in page
❌ No host controls in Hoodie Academy

### **Option 3: Multi-Platform (Both!)**
```sql
stream_platform = 'native'  -- Primary
stream_url = 'https://discord.gg/...'  -- Backup
```
✅ Video player shows in page
✅ Also shows Discord button below
✅ Best of both worlds!

---

## 📹 **Video Requirements**

### **Browser Permissions:**
When you go live, browser will ask:
```
🎥 Allow camera access?
🎙️ Allow microphone access?
```
**Click "Allow"** for both!

### **Hardware:**
- Camera (webcam or built-in)
- Microphone (headset recommended)
- Good internet (5+ Mbps upload)

### **Supported Browsers:**
- ✅ Chrome (best)
- ✅ Edge (best)
- ✅ Safari (good)
- ⚠️ Firefox (works but not recommended)

---

## 🎊 **Quick Test Right Now:**

### **Method 1: Update Existing Session**
```sql
-- Find your latest session
SELECT id FROM mentorship_sessions ORDER BY created_at DESC LIMIT 1;

-- Update it to native (replace 'xxx' with actual ID)
UPDATE mentorship_sessions
SET stream_platform = 'native', stream_url = NULL
WHERE id = 'xxx';
```

### **Method 2: Create New Test Session**
Run `create-test-live-session.sql` file I created

### **Then:**
1. Refresh dashboard
2. Go Live again  
3. **SEE VIDEO INTERFACE!** 🎥

---

## 💡 **Pro Tip: Multi-Stream Setup**

Want to stream to native video AND Discord/YouTube simultaneously?

### **For Hosts/Admins:**
1. Set session to `stream_platform = 'native'`
2. Add Discord/YouTube URL to `stream_url`
3. When you go live:
   - You use the **native video interface** (full controls)
   - Students see **both options** (native video + external link)
   - You can use OBS to **restream** to Discord/YouTube
   
### **OBS Setup** (Optional):
1. Download OBS Studio
2. Add "Browser Source" → Your session URL
3. Stream to Discord/YouTube/Twitch
4. Students get video everywhere!

---

## ✅ **Summary**

**Problem:** Sessions using Discord/external platforms don't show video feed

**Solution:** Change `stream_platform` to `'native'`

**Result:** Full video interface with host camera feed! 🎥

---

## 🚀 **DO THIS NOW:**

1. **Run this SQL:**
```sql
UPDATE mentorship_sessions
SET stream_platform = 'native'
WHERE id IN (
  SELECT id FROM mentorship_sessions 
  WHERE status = 'live' OR status = 'scheduled'
);
```

2. **Refresh browser:** `Ctrl + Shift + R`

3. **Go Live again!**

4. **You'll see the video box with your camera!** 🎉

---

Need help? Let me know what you see after updating the session platform!

