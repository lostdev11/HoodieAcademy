# 🔑 Add Your Daily.co API Key

## Quick Instructions

### **Step 1: Create/Edit .env.local**

1. In your project root folder (`Hoodie Academy real`), create a file named `.env.local` (if it doesn't exist)
2. Or open it if it already exists

### **Step 2: Add This Line**

```bash
DAILY_API_KEY=6589cc2aceef3b8f168128858bf33dacdc21635e38df092521e7377a8bab8873
```

### **Step 3: Restart Your Server**

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

---

## ✅ Complete .env.local File Should Look Like:

```bash
# Daily.co API Key for Native Video Streaming
DAILY_API_KEY=6589cc2aceef3b8f168128858bf33dacdc21635e38df092521e7377a8bab8873

# Supabase (you should already have these)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Helius (if using NFT verification)
NEXT_PUBLIC_HELIUS_API_KEY=your_helius_key

# Solana RPC (optional)
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
```

---

## 🧪 Test It Works

### **After restarting server:**

1. Create a test session with native streaming:
```sql
INSERT INTO mentorship_sessions (
  title, scheduled_date, stream_platform, status
) VALUES (
  'Test Native Video', NOW(), 'native', 'live'
);
```

2. Visit the session page
3. You should see embedded video player (not "demo mode" message)
4. **Success!** ✅

---

## 🔐 Security Note

**Your API key is now active!** 

**What this enables:**
- ✅ Native in-app video streaming
- ✅ Up to 100 participants per session
- ✅ 10,000 minutes/month FREE
- ✅ Auto-recording
- ✅ Professional video experience

**Keep it secure:**
- ✅ `.env.local` is in `.gitignore` (already protected)
- ✅ Never commit this file to Git
- ✅ Don't share publicly

---

## ✅ You're Ready!

Once you add the key and restart:
- ✅ Native streaming will work
- ✅ Video rooms auto-created
- ✅ Professional experience
- ✅ No "demo mode" messages

**Just add the key and restart!** 🚀

