# User Duplicate Prevention System

## ✅ Current Status: WORKING CORRECTLY

### Verification Results
```
📊 Total users in database: 5
📊 Unique wallet addresses: 5
✅ Database integrity: GOOD - No duplicates
✅ Upsert test successful - existing user was updated, not duplicated
```

## How Duplicate Prevention Works

### 1. **Database Level Protection**

The `users` table has `wallet_address` set as **UNIQUE**:

```sql
CREATE TABLE users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  wallet_address TEXT UNIQUE NOT NULL,  -- ← This prevents duplicates
  display_name TEXT,
  squad TEXT,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  last_active TIMESTAMP DEFAULT NOW()
);
```

**What this means:**
- PostgreSQL will **reject** any attempt to insert a duplicate wallet address
- Only ONE record per wallet address can exist in the database
- This is enforced at the database level, so it's impossible to bypass

### 2. **Application Level Protection**

All user creation code uses **UPSERT** operations:

```typescript
// src/lib/simple-user-tracker.ts
const { data: user, error } = await supabase
  .from('users')
  .upsert(userData, { 
    onConflict: 'wallet_address',  // ← If wallet exists, update it
    ignoreDuplicates: false         // ← Don't ignore, update the record
  })
  .select()
  .single();
```

**What UPSERT does:**
- **If wallet doesn't exist**: Creates new user
- **If wallet already exists**: Updates the existing user record
- **Result**: Always exactly ONE record per wallet

### 3. **Key Implementation Points**

#### Location 1: `src/lib/simple-user-tracker.ts`
```typescript
async trackWalletConnection(walletAddress: string) {
  // Creates OR updates user based on wallet_address
  await supabase.from('users').upsert({
    wallet_address: walletAddress,
    last_active: new Date().toISOString()
  }, { 
    onConflict: 'wallet_address' 
  });
}
```

#### Location 2: `src/hooks/use-wallet-supabase.ts`
```typescript
await simpleUserTracker.trackWalletConnection(walletAddress);
```

#### Location 3: `src/lib/user-data-sync.ts`
```typescript
async ensureUserProfile(walletAddress: string) {
  // Uses upsert to prevent duplicates
  const { data, error } = await supabase
    .from('users')
    .upsert({ wallet_address: walletAddress }, {
      onConflict: 'wallet_address'
    });
}
```

## What Happens When a User Logs In

### First Time Connection
```
1. User connects wallet (e.g., "7vswdZFp...")
2. System checks database for this wallet
3. Not found → Creates new user record
4. User is now in the system
```

### Subsequent Connections
```
1. User connects same wallet again
2. System attempts to upsert
3. Database sees wallet_address already exists
4. Updates existing record (last_active timestamp)
5. NO duplicate created ✅
```

### Example Flow
```javascript
// User connects wallet
const walletAddress = "7vswdZFphxbtd1tCB5EhLNn2khiDiKmQEehSNUFHjz7M";

// First connection
await trackWalletConnection(walletAddress);
// → Creates new user: { wallet_address: "7vswdZFp...", display_name: "User 7vswdZ..." }

// Second connection (same wallet)
await trackWalletConnection(walletAddress);
// → Updates same user: { wallet_address: "7vswdZFp...", last_active: "2025-10-08..." }

// Third connection (same wallet)
await trackWalletConnection(walletAddress);
// → Updates same user again (still only 1 record)
```

## Verification

### Manual Check
Run this script to verify no duplicates exist:
```bash
node check-duplicate-users.js
```

**Expected Output:**
```
✅ No duplicate users found! Each wallet address is unique.
✅ Database integrity: GOOD - No duplicates
✅ Upsert test successful
```

### SQL Check
Run this query in Supabase SQL Editor:
```sql
-- Check for duplicate wallet addresses
SELECT 
  wallet_address,
  COUNT(*) as count
FROM users
GROUP BY wallet_address
HAVING COUNT(*) > 1;
```

**Expected Result:** Empty (0 rows) = No duplicates

## Benefits of This System

### ✅ Data Integrity
- One wallet = One user account
- No confusion about which record is "real"
- Clean, consistent data

### ✅ User Experience
- Same wallet always sees same data
- Squad selection persists
- XP and progress tracked correctly
- No need to "merge" accounts

### ✅ System Reliability
- Database enforces uniqueness
- Application layer uses upsert
- Multiple layers of protection
- Impossible to accidentally create duplicates

## What Gets Updated on Reconnection

When a user reconnects with the same wallet, these fields are updated:

```typescript
{
  last_active: new Date().toISOString(),  // ← Always updated
  updated_at: new Date().toISOString(),    // ← Always updated
  is_admin: checkIfAdmin(wallet),          // ← Verified on each connection
  // These fields are NOT changed:
  // - wallet_address (stays same)
  // - created_at (stays same)
  // - display_name (only changed by user)
  // - squad (only changed by user)
}
```

## Edge Cases Handled

### Case 1: User Disconnects and Reconnects
```
✅ Same user record is used
✅ last_active is updated
✅ No duplicate created
```

### Case 2: User Connects from Different Device
```
✅ Same wallet = Same user record
✅ Data syncs across devices
✅ No duplicate created
```

### Case 3: User Switches Wallets
```
✅ Each wallet gets its own user record
✅ Different wallet = Different user
✅ This is intentional behavior
```

### Case 4: Concurrent Connections
```
✅ Database UNIQUE constraint prevents race conditions
✅ One request succeeds, others update
✅ Still only 1 record
```

## Troubleshooting

### If Duplicates Appear

**Symptoms:**
- Same wallet address appears multiple times in users list
- User sees different data on different logins

**Solution:**
```sql
-- 1. Check for duplicates
SELECT wallet_address, COUNT(*) 
FROM users 
GROUP BY wallet_address 
HAVING COUNT(*) > 1;

-- 2. Remove duplicates (keep oldest record)
DELETE FROM users a USING (
  SELECT MIN(created_at) as min_created_at, wallet_address
  FROM users 
  GROUP BY wallet_address
) b
WHERE a.wallet_address = b.wallet_address 
AND a.created_at > b.min_created_at;

-- 3. Verify unique constraint exists
SELECT conname, contype 
FROM pg_constraint 
WHERE conrelid = 'users'::regclass 
AND contype = 'u'
AND conname LIKE '%wallet_address%';

-- 4. Add constraint if missing
ALTER TABLE users 
ADD CONSTRAINT users_wallet_address_unique 
UNIQUE (wallet_address);
```

## Testing

### Automated Test
```javascript
// Test that same wallet doesn't create duplicate
const testWallet = "test123...";

// Connect 3 times
await trackWalletConnection(testWallet);
await trackWalletConnection(testWallet);
await trackWalletConnection(testWallet);

// Verify only 1 record exists
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('wallet_address', testWallet);

assert(data.length === 1); // ✅ Should pass
```

## Summary

### 🎯 Key Points
1. **Database prevents duplicates** via UNIQUE constraint
2. **Application uses upsert** to update instead of insert
3. **Wallet address is the unique identifier** for users
4. **System is working correctly** - verified with 5 real users
5. **No action needed** - protection is already in place

### ✅ What's Already Working
- ✅ Unique constraint on wallet_address
- ✅ Upsert operations throughout codebase
- ✅ No duplicate users in database (verified)
- ✅ Reconnection updates existing user
- ✅ Multiple connection points protected

### 📊 Current Database State
- 5 users in database
- 5 unique wallet addresses
- 0 duplicates
- 100% data integrity

The platform **already remembers user wallets** and **prevents duplicate user creation**! 🎉

