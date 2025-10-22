# PFP Troubleshooting Guide 🔧
**Date:** October 21, 2025

## Issue: PFP Not Showing in Squad Badge

You've set a profile picture but it's not showing up in the Academy Member squad badge. Let's debug this step by step.

---

## Step 1: Check the Debugger

I've added a temporary debugger to your homepage. Here's how to use it:

1. **Go to:** `http://localhost:3001/`
2. **Look for:** "🔍 PFP Debugger" card on the homepage
3. **Check the information** it shows about your profile

### What to Look For:

**✅ Good Signs:**
- API Response Status: Success ✅ Yes, Exists ✅ Yes
- Has PFP: ✅ Yes
- Valid URL: ✅ Yes
- Should Show PFP: ✅ Yes (Academy Member with PFP)

**❌ Problem Signs:**
- API Response Status: Success ❌ No
- Has PFP: ❌ No
- Valid URL: ❌ No
- Should Show PFP: ❌ No

---

## Step 2: Check Your Database

### Option A: Use the SQL Script

1. **Open Supabase Dashboard** → SQL Editor
2. **Copy and paste** the contents of `set-test-pfp.sql`
3. **Replace** `YOUR_WALLET_ADDRESS` with your actual wallet address
4. **Replace** `YOUR_PFP_URL` with your actual profile picture URL
5. **Run the script**

### Option B: Manual Database Check

```sql
-- Check if your user exists and has a profile picture
SELECT 
  wallet_address,
  display_name,
  squad,
  profile_picture,
  updated_at
FROM users 
WHERE wallet_address = 'YOUR_WALLET_ADDRESS';
```

### Option C: Set a Test PFP

```sql
-- Set a test profile picture (replace with your wallet address)
UPDATE users 
SET 
  profile_picture = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
  updated_at = NOW()
WHERE wallet_address = 'qg7pNNZq7qDQuc6Xkd1x4NvS2VM3aHtCqHEzucZxRGA';
```

---

## Step 3: Common Issues & Solutions

### Issue 1: No Profile Picture in Database

**Symptoms:**
- Debugger shows "Has PFP: ❌ No"
- `profile_picture` field is NULL in database

**Solution:**
```sql
UPDATE users 
SET profile_picture = 'YOUR_PFP_URL'
WHERE wallet_address = 'YOUR_WALLET_ADDRESS';
```

### Issue 2: Invalid PFP URL

**Symptoms:**
- Debugger shows "Valid URL: ❌ No"
- PFP URL doesn't start with `http`

**Solution:**
- Use a valid HTTP/HTTPS URL
- Example: `https://example.com/image.jpg`

### Issue 3: You're in a Squad

**Symptoms:**
- Debugger shows "Should Show PFP: ❌ No"
- Squad field is not null

**Solution:**
- PFP only shows for Academy Members (squad = null)
- Squad members see their squad badge instead
- To test PFP, temporarily set your squad to null:

```sql
UPDATE users 
SET squad = NULL
WHERE wallet_address = 'YOUR_WALLET_ADDRESS';
```

### Issue 4: API Not Returning PFP

**Symptoms:**
- Database has PFP but API doesn't return it
- Debugger shows "Has PFP: ❌ No" but database has the URL

**Solution:**
- The API was fixed to map `profile_picture` to `pfp_url`
- Refresh the page to get the updated API response

### Issue 5: Caching Issues

**Symptoms:**
- Changes made but not reflected immediately

**Solution:**
- Hard refresh the page (Ctrl+F5 or Cmd+Shift+R)
- Clear browser cache
- Wait a few seconds for API cache to clear

---

## Step 4: Test the Fix

### Quick Test Steps:

1. **Set a test PFP:**
   ```sql
   UPDATE users 
   SET profile_picture = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
   WHERE wallet_address = 'YOUR_WALLET_ADDRESS';
   ```

2. **Make sure you're an Academy Member:**
   ```sql
   UPDATE users 
   SET squad = NULL
   WHERE wallet_address = 'YOUR_WALLET_ADDRESS';
   ```

3. **Refresh the homepage** and check:
   - Debugger shows "Has PFP: ✅ Yes"
   - Squad badge shows your PFP instead of graduation cap

---

## Step 5: Verify Everything Works

### Checklist:

- [ ] Database has `profile_picture` URL
- [ ] User is Academy Member (squad = null)
- [ ] API returns `pfp_url` field
- [ ] Debugger shows all green checkmarks
- [ ] Squad badge shows PFP instead of graduation cap

---

## Step 6: Remove Debugger (When Done)

Once everything works, remove the debugger:

1. **Edit** `src/app/page.tsx`
2. **Remove** the import: `import PfpDebugger from "@/components/debug/PfpDebugger"`
3. **Remove** the debugger component:
   ```tsx
   {/* PFP Debugger - Temporary */}
   {walletAddress && (
     <PfpDebugger walletAddress={walletAddress} />
   )}
   ```

---

## API Endpoints to Test

### Test User Profile API:
```bash
curl "http://localhost:3001/api/user-profile?wallet=YOUR_WALLET_ADDRESS"
```

**Expected Response:**
```json
{
  "success": true,
  "exists": true,
  "profile": {
    "walletAddress": "YOUR_WALLET_ADDRESS",
    "displayName": "Your Name",
    "squad": null,
    "pfp_url": "https://example.com/your-pfp.jpg",
    ...
  }
}
```

---

## Database Schema

### Users Table Structure:
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  wallet_address TEXT UNIQUE NOT NULL,
  display_name TEXT,
  squad TEXT,                    -- NULL = Academy Member
  profile_picture TEXT,          -- Your PFP URL goes here
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

---

## Still Not Working?

### Debug Checklist:

1. **Check browser console** for JavaScript errors
2. **Check network tab** for failed API requests
3. **Verify wallet address** is correct (case-sensitive)
4. **Check Supabase logs** for database errors
5. **Try a different PFP URL** to rule out URL issues

### Get Help:

1. **Check the debugger output** on your homepage
2. **Copy the raw API response** from the debugger
3. **Share the SQL query results** from your database
4. **Include any error messages** from browser console

---

## Quick Fix Commands

### Set Test PFP and Make Academy Member:
```sql
-- Replace with your actual wallet address
UPDATE users 
SET 
  profile_picture = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
  squad = NULL,
  updated_at = NOW()
WHERE wallet_address = 'qg7pNNZq7qDQuc6Xkd1x4NvS2VM3aHtCqHEzucZxRGA';
```

### Check Results:
```sql
SELECT 
  wallet_address,
  display_name,
  squad,
  profile_picture,
  updated_at
FROM users 
WHERE wallet_address = 'qg7pNNZq7qDQuc6Xkd1x4NvS2VM3aHtCqHEzucZxRGA';
```

---

## Success! 🎉

Once it's working, you should see:
- ✅ Your profile picture in the squad badge (top-right corner)
- ✅ Debugger shows all green checkmarks
- ✅ No more graduation cap icon

**The PFP feature is now working for Academy Members!** 🖼️✨
