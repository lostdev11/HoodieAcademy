# Squad Selection & Leaderboard Integration Fix Guide 🎯

Complete guide to ensure squad selection saves properly and reflects on the leaderboard.

## 🔧 Setup Required

### Step 1: Ensure Users Table Has Squad Fields

Run this SQL in your Supabase SQL Editor:

```sql
-- Run setup-users-table-squad-fields.sql
```

This adds the following columns if they don't exist:
- `squad` (TEXT) - Squad name
- `squad_id` (TEXT) - Squad ID
- `squad_selected_at` (TIMESTAMP) - When squad was selected
- `squad_lock_end_date` (TIMESTAMP) - When 30-day lock expires
- `squad_change_count` (INTEGER) - Number of times changed
- `level` (INTEGER) - Calculated from total_xp

### Step 2: Verify Table Structure

Check your `users` table has these columns:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users';
```

Expected columns:
- `wallet_address` (text, PRIMARY KEY)
- `display_name` (text)
- `total_xp` (integer)
- `level` (integer)
- `squad` (text) ← **Required**
- `squad_id` (text) ← **Required**
- `squad_selected_at` (timestamp)
- `squad_lock_end_date` (timestamp)
- `squad_change_count` (integer)
- `created_at` (timestamp)
- `updated_at` (timestamp)

## 🔄 How Squad Selection Works Now

### 1. User Selects Squad
```
User clicks squad on /choose-your-squad
    ↓
Confirmation dialog appears
    ↓
User confirms selection
    ↓
handleConfirmAssignment() called
```

### 2. API Call to Save Squad
```
POST /api/user-squad
Body: {
  wallet_address: "xxx",
  squad: "Hoodie Creators",
  squad_id: "creators"
}
```

### 3. Database Update
```
IF user exists:
  UPDATE users SET
    squad = 'Hoodie Creators',
    squad_id = 'creators',
    squad_selected_at = NOW(),
    squad_lock_end_date = NOW() + 30 days,
    squad_change_count = squad_change_count + 1
  WHERE wallet_address = 'xxx'

ELSE:
  INSERT INTO users (
    wallet_address,
    squad,
    squad_id,
    squad_selected_at,
    squad_lock_end_date,
    squad_change_count,
    total_xp,
    level,
    created_at
  ) VALUES (...)
```

### 4. Post-Save Actions
```
✅ Award +30 XP for joining squad
✅ Update localStorage cache
✅ Trigger storage event
✅ Show success message
✅ Redirect to dashboard
```

### 5. Leaderboard Integration
```
Leaderboard API queries:
  SELECT wallet_address, display_name, total_xp, level, squad
  FROM users
  WHERE squad = 'Hoodie Creators' (if filtered)
  ORDER BY total_xp DESC
```

## 🐛 Troubleshooting

### Issue 1: Squad not saving to database

**Symptoms:**
- Squad appears to save but doesn't persist
- Leaderboard doesn't show squad
- Dashboard shows "Unassigned"

**Solutions:**

1. **Check if users table has squad fields:**
```sql
-- Run this to add missing fields
\i setup-users-table-squad-fields.sql
```

2. **Check browser console for errors:**
```
Look for:
❌ Error saving squad: ...
❌ Error updating user squad: ...
```

3. **Verify API response:**
```javascript
// Should see in console:
✅ Squad saved successfully to database
✅ Squad join XP awarded (+30 XP)
```

### Issue 2: Squad doesn't appear on leaderboard

**Symptoms:**
- Squad saved successfully
- Appears in dashboard
- Doesn't show on leaderboard

**Solutions:**

1. **Verify database was actually updated:**
```sql
SELECT wallet_address, squad, squad_id, total_xp 
FROM users 
WHERE wallet_address = 'your_wallet_here';
```

2. **Clear cache and hard refresh:**
```
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (Mac)
```

3. **Check leaderboard API:**
```javascript
// Test directly
fetch('/api/leaderboard?limit=50')
  .then(r => r.json())
  .then(data => console.log(data.leaderboard));
```

### Issue 3: Changes don't reflect immediately

**Symptoms:**
- Squad saved successfully
- Takes time to appear
- Need to refresh multiple times

**Solution:**
This is normal! The app now:
1. Saves to database ✅
2. Updates localStorage cache ✅
3. Triggers storage event ✅
4. Redirects to dashboard ✅
5. Dashboard fetches from API ✅

**If still not showing:**
- Wait 2-3 seconds
- Refresh the page
- Check browser console for errors

## ✅ Verification Checklist

After selecting a squad, verify:

### In Browser Console:
```
🔄 Saving squad selection: { wallet: '...', squad: 'Hoodie Creators', squadId: 'creators' }
📡 Squad save result: { success: true, ... }
✅ Squad saved successfully to database
✅ Squad join XP awarded (+30 XP)
```

### In Database:
```sql
SELECT wallet_address, squad, squad_id, squad_selected_at, squad_lock_end_date
FROM users
WHERE wallet_address = 'your_wallet';
```

Should return:
- `squad`: 'Hoodie Creators' (or your selected squad)
- `squad_id`: 'creators'
- `squad_selected_at`: timestamp
- `squad_lock_end_date`: timestamp (30 days from now)

### In UI:
- ✅ Dashboard → Squad tab shows your squad
- ✅ Squad badge appears in header
- ✅ Leaderboard shows your squad in the "Squad" column
- ✅ Can filter leaderboard by your squad
- ✅ Squad Analytics shows you in your squad's stats

## 🔍 Debug Commands

### Check Current Squad in Database
```sql
SELECT 
  wallet_address,
  display_name,
  squad,
  squad_id,
  total_xp,
  level,
  squad_selected_at,
  squad_lock_end_date,
  CASE 
    WHEN squad_lock_end_date > NOW() THEN 'Locked'
    ELSE 'Unlocked'
  END as lock_status,
  EXTRACT(DAY FROM (squad_lock_end_date - NOW())) as days_remaining
FROM users
WHERE wallet_address = 'YOUR_WALLET_HERE';
```

### Check All Squad Assignments
```sql
SELECT 
  squad,
  COUNT(*) as member_count,
  SUM(total_xp) as squad_total_xp,
  AVG(total_xp) as avg_xp_per_member
FROM users
WHERE squad IS NOT NULL
GROUP BY squad
ORDER BY squad_total_xp DESC;
```

### Check Squad on Leaderboard
```sql
SELECT 
  wallet_address,
  display_name,
  squad,
  total_xp,
  level,
  ROW_NUMBER() OVER (ORDER BY total_xp DESC) as global_rank,
  ROW_NUMBER() OVER (PARTITION BY squad ORDER BY total_xp DESC) as squad_rank
FROM users
WHERE squad IS NOT NULL
ORDER BY total_xp DESC
LIMIT 50;
```

## 🎯 Features Added

### Enhanced API (`/api/user-squad`)
- ✅ Checks if user exists before updating
- ✅ Uses UPDATE for existing users
- ✅ Uses INSERT for new users
- ✅ Ensures all required fields are set
- ✅ Returns detailed error messages
- ✅ Logs success/failure to console

### Enhanced Squad Selection Page
- ✅ Detailed console logging
- ✅ Awards +30 XP for joining squad
- ✅ Better success messages
- ✅ Triggers storage events
- ✅ Redirects to dashboard (not home)
- ✅ Shows errors clearly

### Database Integration
- ✅ Leaderboard reads from `users.squad`
- ✅ Squad Activity API reads from `users.squad`
- ✅ User Profile API reads from `users.squad`
- ✅ All pages use unified API

## 📊 Testing Steps

### Test Squad Selection:

1. **Open browser console** (F12)

2. **Go to `/choose-your-squad`**

3. **Select a squad** (e.g., Creators)

4. **Confirm selection**

5. **Check console for:**
```
🔄 Saving squad selection: ...
📡 Squad save result: ...
✅ Squad saved successfully to database
✅ Squad join XP awarded (+30 XP)
```

6. **Should redirect to dashboard**

7. **Check Dashboard → Squad tab:**
   - Should show your selected squad
   - Should show live stats

8. **Check Leaderboard:**
   - Should show your squad in the "Squad" column
   - Can filter by your squad

### Test Squad Lock:

1. Try to change squad immediately
2. Should show "Locked" message with days remaining
3. Can renew for another 30 days

## 🚨 Common Issues & Fixes

### "Failed to update squad"
**Cause:** Database connection issue or missing fields
**Fix:** Run `setup-users-table-squad-fields.sql`

### Squad shows as "Unassigned" after selection
**Cause:** Database not updated or cache issue
**Fix:** 
1. Check browser console for errors
2. Verify database with SQL query above
3. Clear localStorage and try again

### Leaderboard doesn't filter by squad
**Cause:** Squad field null or empty in database
**Fix:** Re-save squad selection with enhanced logging

### XP not awarded for joining
**Cause:** XP auto-reward API not responding
**Fix:** Check that `/api/xp/auto-reward` endpoint exists

## ✅ Success Indicators

When everything works correctly, you'll see:

1. **Console Logs:**
```
🔄 Saving squad selection
📡 Squad save result: { success: true }
✅ Squad saved successfully to database
✅ Squad join XP awarded (+30 XP)
```

2. **Success Alert:**
```
🎉 Success! You've joined Hoodie Creators!

✅ Squad saved to database
🎯 +30 XP for joining a squad
🔒 Locked for 30 days

Redirecting to dashboard...
```

3. **Dashboard:**
- Squad tab shows "Hoodie Creators Squad"
- Shows real member counts and stats
- Badge displays correctly

4. **Leaderboard:**
- Your entry shows "Hoodie Creators" in Squad column
- Can filter to see only Creators members
- Squad rank calculated correctly

---

**Run `setup-users-table-squad-fields.sql` first, then try selecting your squad again!** 🚀

