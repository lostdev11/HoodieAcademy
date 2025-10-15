# 🎥 Go Live Button - Complete Setup Guide

## 🎉 **IT'S READY!**

Your "Go Live" button now opens a **full video streaming interface** where you can see attendees on camera!

---

## 🚀 Quick Start (3 Steps)

### **Step 1: Create a Test Session**
Run this in your Supabase SQL Editor:
```sql
-- Copy and run create-test-live-session.sql
-- OR just run this:

INSERT INTO mentorship_sessions (
  title, description, mentor_name, mentor_wallet,
  scheduled_date, duration_minutes, max_attendees,
  stream_platform, created_by, status
) VALUES (
  '🎬 Test Live Video Session',
  'Testing the live video streaming interface',
  'Admin User',
  'qg7pNNZq7qDQuc6Xkd1x4NvS2VM3aHtCqHEzucZxRGA',
  NOW(),
  60,
  50,
  'native',  -- ← IMPORTANT: Use 'native' for video!
  'qg7pNNZq7qDQuc6Xkd1x4NvS2VM3aHtCqHEzucZxRGA',
  'scheduled'
);
```

### **Step 2: Refresh & Go Live**
1. **Refresh** your browser: `Ctrl + Shift + R`
2. Go to **Admin Dashboard** → **Live Sessions** tab
3. Click **"Sessions"** button
4. See your test session in **"Ready to Go Live"** section ← Red gradient card!
5. Click **"Go Live Now"** button
6. Confirm the dialog

### **Step 3: You're Live! 🎬**
You'll be **automatically redirected** to the video interface where you'll see:
- 🎥 **Video player** with your camera feed
- 👑 **"Host" badge** (purple) showing you're in control
- 🎛️ **Control panel** at the bottom with buttons for:
  - 🎙️ Mute/unmute mic
  - 📹 Camera on/off
  - 🖥️ Screen share
  - 🔊 Speaker control
  - ⛶ Fullscreen
  - ☎️ Leave call

---

## 🎯 What You'll See

### **Video Interface Layout:**

```
┌────────────────────────────────────────────────────┐
│  ← Back to Sessions    🔴 LIVE SESSION    👑 Host  │
├────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │                                                │  │
│  │          LIVE VIDEO FEED                      │  │
│  │                                                │  │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐      │  │
│  │  │  YOU    │  │ Student │  │ Student │      │  │
│  │  │  (Host) │  │    1    │  │    2    │      │  │
│  │  │   👤    │  │   👤    │  │   👤    │      │  │
│  │  └─────────┘  └─────────┘  └─────────┘      │  │
│  │                                                │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  [ 🎙️ ]  [ 📹 ]  [ 🖥️ ]  [ 🔊 ]  [ ⛶ ]  [ ☎️ ]  │
│                                    👥 3 people      │
│                                                      │
├────────────────────────────────────────────────────┤
│  💬 Live Q&A          📊 Session Info               │
│  Questions from attendees...                        │
└────────────────────────────────────────────────────┘
```

---

## 👥 How Attendees Join

### **Students/Attendees Will:**

1. **Visit:** `localhost:3000/mentorship` (or your domain)
2. **See** your live session at the top (marked with 🔴)
3. **Click** on the session
4. **Join** the video stream
5. **Appear** in your video grid!

### **You'll See Them:**
- Each attendee appears in a video tile
- Their name shows (wallet address)
- You can see if they're muted
- You can see participant count
- Grid auto-adjusts as people join/leave

---

## 🎛️ Video Controls Explained

### **🎙️ Microphone:**
- Click to mute/unmute
- Red = muted
- Green = active
- **Hosts** can mute others

### **📹 Camera:**
- Toggle video on/off
- See preview of yourself
- Bandwidth optimization when off

### **🖥️ Screen Share (Host Only):**
- Share entire screen
- Share specific window
- Share browser tab
- Perfect for presentations/demos

### **🔊 Speaker:**
- Control volume
- Test audio
- Switch audio devices

### **⛶ Fullscreen:**
- Expand to full screen
- Press ESC to exit
- Better for presentations

### **☎️ Leave:**
- Exit the video call
- Stay on the page
- Can rejoin anytime

---

## 🎨 Video Platform: Daily.co

### **Why Daily.co?**
- ✅ **Free tier:** 100 participants, unlimited rooms
- ✅ **No downloads:** Works in browser
- ✅ **HD quality:** 1080p video
- ✅ **Low latency:** Real-time interaction
- ✅ **Mobile friendly:** Works on phones
- ✅ **Screen sharing:** Built-in
- ✅ **Recording:** Available (paid plans)

### **Setup (Optional):**
To enable all features, add to `.env.local`:
```bash
DAILY_API_KEY=your_api_key_here
```

Get a free key at: https://dashboard.daily.co/

### **Demo Mode (No API Key Needed):**
Works **without** an API key for testing:
- ✅ Up to 2 participants
- ✅ 30-minute sessions
- ✅ All core features work
- ✅ Perfect for development

---

## 🐛 Troubleshooting

### **"I don't see the video interface"**
**Check:**
1. Session `stream_platform` = `'native'` (not 'zoom', 'youtube', etc.)
2. Session `status` = `'live'`
3. Page finished loading (wait 2-3 seconds)
4. Console logs show "Video room ready"

**Fix:**
```sql
-- Update your session to use native streaming
UPDATE mentorship_sessions
SET stream_platform = 'native'
WHERE id = 'your-session-id';
```

### **"Video player shows error"**
**Check:**
1. Browser permissions for camera/mic (allow when prompted)
2. No other app using camera (close Zoom, etc.)
3. Using Chrome, Edge, or Safari (Firefox has issues)
4. Check console for Daily.co errors

**Fix:**
- Reload the page
- Clear browser cache
- Try incognito mode
- Check browser console (F12)

### **"I don't see any attendees"**
**Check:**
1. Did anyone join? (Check participant count)
2. Share the URL: `yoursite.com/mentorship/[session-id]`
3. Attendees must click "Join Live Stream" button

**Test with yourself:**
- Open incognito window
- Go to session URL
- Join as a student
- You should see yourself twice!

---

## 📊 Session Types Comparison

### **Native Streaming** (Recommended for Live Classes):
```sql
stream_platform = 'native'
```
- ✅ Video embedded in page
- ✅ See all participants
- ✅ Full host controls
- ✅ Perfect for: Classes, office hours, workshops

### **Zoom** (Good for Large Events):
```sql
stream_platform = 'zoom'
stream_url = 'https://zoom.us/j/...'
```
- ✅ External Zoom link
- ✅ Supports 100+ people
- ✅ Zoom features (polls, etc.)
- ✅ Perfect for: Large webinars, conferences

### **YouTube Live** (Best for Broadcasts):
```sql
stream_platform = 'youtube'
stream_url = 'https://youtube.com/watch?v=...'
```
- ✅ Embedded player
- ✅ Unlimited viewers
- ✅ Auto-recorded
- ✅ Perfect for: Announcements, lectures

---

## 🎯 Advanced Features

### **Record Your Sessions:**
With Daily.co paid plan ($99/mo):
- Cloud recording
- Auto-upload to storage
- Transcription available
- Analytics included

### **NFT-Gate Your Streams:**
Require WifHoodie NFT to join:
```sql
UPDATE mentorship_sessions
SET requires_nft = true
WHERE id = 'your-session-id';
```

### **Award XP for Attendance:**
Auto-award XP when students attend:
```sql
UPDATE mentorship_sessions
SET xp_reward = 100
WHERE id = 'your-session-id';
```

---

## 📝 **Files Created/Modified**

### **New Files:**
1. `create-test-live-session.sql` - Quick test session creator
2. `fix-go-live-minimal.sql` - Database functions for Go Live
3. `GO_LIVE_VIDEO_INTERFACE_COMPLETE.md` - This guide!

### **Modified Files:**
1. `src/components/admin/MentorshipManager.tsx`
   - ✅ Redirects to video interface after going live
   - ✅ Fixed crashes and null safety
   - ✅ Enhanced "Ready to Go Live" section

2. `src/app/mentorship/[id]/page.tsx`
   - ✅ Shows 👑 Host badge for admins
   - ✅ Gives admins host privileges
   - ✅ Enhanced visual hierarchy

3. `src/app/api/mentorship/go-live/route.ts`
   - ✅ Fixed undefined variable bug
   - ✅ Proper permission tracking

---

## ✅ **Final Checklist**

Before testing, make sure you've:
- [ ] Run `fix-go-live-minimal.sql` in Supabase
- [ ] Created a test session with `stream_platform = 'native'`
- [ ] Refreshed your admin dashboard
- [ ] Navigated to Live Sessions → Sessions tab
- [ ] Allowed browser permissions for camera/mic

**Then:**
- [ ] Click "Go Live Now"
- [ ] Get redirected to video interface
- [ ] See yourself on camera
- [ ] See 👑 Host badge
- [ ] Access full video controls

---

## 🎊 **YOU'RE READY!**

Everything is set up! When you click "Go Live Now":

1. ⚡ Session status → "live"
2. 🚀 Auto-redirect to `/mentorship/[id]`
3. 🎥 Video room auto-created
4. 📹 Camera/mic activate
5. 👑 You're the host!
6. 👥 Attendees can join
7. 🎬 **You see everyone on video!**

---

## 🎬 **Try It Now!**

1. Run `create-test-live-session.sql` in Supabase
2. Refresh your admin dashboard
3. Click "Go Live Now" on your test session
4. **Experience the video interface!** 🎉

Questions or issues? Check the troubleshooting section above!

