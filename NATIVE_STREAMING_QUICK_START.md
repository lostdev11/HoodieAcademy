# 🚀 Native In-App Streaming - Quick Start

## Get Live in 5 Minutes!

### Step 1: Install (1 minute)
```bash
npm install @daily-co/daily-js @daily-co/daily-react
```

### Step 2: Get API Key (2 minutes - FREE!)
1. Go to https://daily.co
2. Sign up (free!)
3. Dashboard → API Keys → Create
4. Copy your key

### Step 3: Configure (1 minute)
```bash
# Add to .env.local:
DAILY_API_KEY=paste_your_key_here
```

### Step 4: Restart (30 seconds)
```bash
npm run dev
```

### Step 5: Test! (30 seconds)
```sql
-- Create native streaming session
INSERT INTO mentorship_sessions (
  title,
  mentor_name,
  scheduled_date,
  stream_platform,
  status
) VALUES (
  'Test Native Streaming',
  'Your Name',
  NOW(),
  'native',  -- ← This makes it native!
  'live'     -- ← Go live immediately
);
```

**Visit `/mentorship` → Click your session → See embedded player!** 🎉

---

## 🎯 That's It!

You now have:
- ✅ Native in-app video streaming
- ✅ Full video controls (mute, camera, screen share)
- ✅ Works on desktop + mobile
- ✅ Up to 100 participants (free tier)
- ✅ Auto-recording
- ✅ 10,000 minutes/month FREE

---

## 🎥 How to Use

### **Native Streaming (In-App):**
```sql
stream_platform = 'native'
```
→ Shows embedded video player

### **External Streaming (Zoom, etc.):**
```sql
stream_platform = 'zoom'  -- or 'youtube', 'twitch'
stream_url = 'https://zoom.us/...'
```
→ Shows "Join on Zoom" button

**Both work!** Use what fits your needs.

---

## 💰 Pricing

**FREE Tier:** 10,000 minutes/month
- 10 sessions × 90 min each = 900 min/month
- Well within free tier! 🎉

**Paid:** $99/mo for 100,000 min (if you outgrow free)

---

## 📚 Full Docs

See `NATIVE_STREAMING_SETUP.md` for complete documentation.

---

**🎉 Start streaming in-app now!**

