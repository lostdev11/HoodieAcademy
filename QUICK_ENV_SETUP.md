# ⚡ Quick Environment Setup

## Your Daily.co API Key is Ready!

I've prepared everything for you. Just follow these 3 steps:

---

## Step 1: Create .env.local File (30 seconds)

In your project root folder (`Hoodie Academy real`), create a new file named:
```
.env.local
```

**How to create:**
- Right-click in folder → New → Text Document
- Rename to `.env.local` (remove .txt extension)
- If Windows hides extensions, enable "File name extensions" in View menu

---

## Step 2: Add Your API Key (30 seconds)

Open `.env.local` and paste this line:

```bash
DAILY_API_KEY=6589cc2aceef3b8f168128858bf33dacdc21635e38df092521e7377a8bab8873
```

**That's it!** Save the file.

---

## Step 3: Restart Server (30 seconds)

```bash
# In your terminal:
# Press Ctrl+C to stop the current server
# Then run:
npm run dev
```

Wait for "Ready" message.

---

## ✅ Test It Works

### **Create a test session:**
```sql
-- In Supabase SQL Editor:
INSERT INTO mentorship_sessions (
  title, scheduled_date, stream_platform, status
) VALUES (
  'Video Test', NOW(), 'native', 'live'
);
```

### **Visit the session:**
```
1. Go to /mentorship
2. Click your test session
3. Should see embedded video player
4. NO "demo mode" message
5. Success! ✅
```

---

## 🎁 What This Unlocks

With API key configured:
- ✅ Native in-app video streaming
- ✅ Up to 100 participants per session
- ✅ 10,000 minutes/month FREE
- ✅ Auto-recording to Daily.co
- ✅ Professional video quality
- ✅ No "demo mode" warnings

---

## 🐛 Troubleshooting

### **"Demo mode" still showing?**
- Make sure you saved `.env.local`
- Make sure you restarted the server
- Check spelling: `DAILY_API_KEY` (exact spelling)

### **Server not recognizing key?**
```bash
# Check if file exists:
dir .env.local

# Restart server:
npm run dev
```

### **Video player not loading?**
- Check browser console for errors
- Make sure session has `stream_platform = 'native'`
- Try clearing browser cache

---

## ✅ You're Done!

Once you:
1. ✅ Create `.env.local`
2. ✅ Add the API key line
3. ✅ Restart server

**Native streaming will work perfectly!** 🎥

---

## 🚀 Next: Test Your System

Follow **`FINAL_SETUP_CHECKLIST.md`** to:
1. Run database migrations
2. Grant yourself presenter access
3. Test "GO LIVE" button
4. Host your first session!

**Everything is ready!** 🎉

---

**Your API Key (save this):**
```
6589cc2aceef3b8f168128858bf33dacdc21635e38df092521e7377a8bab8873
```

**Built with 💜 for Hoodie Academy**

