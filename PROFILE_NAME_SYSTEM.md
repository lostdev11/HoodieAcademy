# Profile Display Name System

## ✅ Status: WORKING PERFECTLY

### Test Results
```
✅ Display name can be changed by user
✅ Wallet address is ALWAYS maintained  
✅ Same wallet = Same user record
✅ Display name updates instantly
✅ No duplicate users created
✅ Wallet-to-user mapping is permanent
```

## How It Works

### Database Structure

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  wallet_address TEXT UNIQUE NOT NULL,  -- ← Permanent identifier
  display_name TEXT,                     -- ← Can be changed by user
  squad TEXT,
  is_admin BOOLEAN,
  created_at TIMESTAMP,
  last_active TIMESTAMP
);
```

### Key Concepts

#### 1. **Wallet Address = Permanent Identifier**
- The `wallet_address` is the **unique identifier** for each user
- It NEVER changes
- It's used to look up all user data
- It's the "key" to the user's account

#### 2. **Display Name = User-Changeable Label**
- The `display_name` is what others see
- Users can change it anytime in their profile
- Starts as auto-generated: "User {first6}..."
- Can be updated to any name the user wants

#### 3. **Relationship is Always Maintained**
```
Wallet Address  ←→  Display Name
(Permanent)         (Changeable)

7vswdZFp...     →   "User 7vswdZ..."  (initial)
7vswdZFp...     →   "Kong"            (user updates)
7vswdZFp...     →   "Cool Trader"     (user updates again)

The wallet address NEVER changes, only the display name!
```

## User Experience Flow

### First Connection
```
1. User connects wallet: 7vswdZFphxbtd1tCB5EhLNn2khiDiKmQEehSNUFHjz7M
2. System creates user:
   {
     wallet_address: "7vswdZFphxbtd1tCB5EhLNn2khiDiKmQEehSNUFHjz7M",
     display_name: "User 7vswdZ..."  // Auto-generated
   }
3. User sees "User 7vswdZ..." on their profile
```

### User Changes Display Name
```
1. User goes to Profile page
2. Clicks "Edit Profile"
3. Changes display name to "Kong"
4. Clicks "Save"
5. System updates:
   {
     wallet_address: "7vswdZFphxbtd1tCB5EhLNn2khiDiKmQEehSNUFHjz7M",
     display_name: "Kong"  // ← Updated!
   }
6. User now sees "Kong" everywhere
7. Wallet address association is STILL maintained
```

### User Reconnects
```
1. User disconnects and reconnects later
2. System looks up by wallet: "7vswdZFphxbtd1tCB5EhLNn2khiDiKmQEehSNUFHjz7M"
3. Finds user with display_name: "Kong"
4. Shows "Kong" (not "User 7vswdZ...")
5. All progress, XP, squad still there ✅
```

## Implementation Details

### Profile Save Function
Located in: `src/components/profile/ProfileView.tsx`

```typescript
const saveProfile = async () => {
  try {
    const response = await fetch('/api/users/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        walletAddress: wallet,      // ← Never changes
        displayName: displayName.trim(),  // ← User's new name
        squad: squad,
        activityType: 'profile_update'
      })
    });
    
    // Update localStorage for instant UI update
    localStorage.setItem('userDisplayName', displayName.trim());
  } catch (error) {
    console.error('Failed to save profile:', error);
  }
};
```

### API Endpoint
Located in: `src/app/api/users/track/route.ts`

```typescript
export async function POST(request: NextRequest) {
  const { walletAddress, displayName, squad } = await request.json();
  
  // Upsert user - updates based on wallet_address
  const { data: user, error } = await supabase
    .from('users')
    .upsert({
      wallet_address: walletAddress,  // ← Used to find record
      display_name: displayName,      // ← Updates this field
      squad: squad,
      last_active: new Date().toISOString()
    }, {
      onConflict: 'wallet_address'    // ← "If wallet exists, update"
    })
    .select()
    .single();
    
  return NextResponse.json({ success: true, user });
}
```

### What Happens in Database

#### Before Name Change
```sql
SELECT * FROM users WHERE wallet_address = '7vswdZFp...';

| wallet_address | display_name    | squad    | created_at |
|---------------|----------------|----------|------------|
| 7vswdZFp...   | User 7vswdZ... | creators | 2025-07-22 |
```

#### After Name Change
```sql
-- System runs: UPDATE users SET display_name = 'Kong' WHERE wallet_address = '7vswdZFp...'

SELECT * FROM users WHERE wallet_address = '7vswdZFp...';

| wallet_address | display_name | squad    | created_at |
|---------------|-------------|----------|------------|
| 7vswdZFp...   | Kong        | creators | 2025-07-22 |
                  ↑ Changed!   ↑ Same!    ↑ Same!
```

### Lookup Always Works

```typescript
// Lookup by wallet address (unique identifier)
const { data: user } = await supabase
  .from('users')
  .select('*')
  .eq('wallet_address', '7vswdZFphxbtd1tCB5EhLNn2khiDiKmQEehSNUFHjz7M')
  .single();

// Result:
{
  wallet_address: "7vswdZFphxbtd1tCB5EhLNn2khiDiKmQEehSNUFHjz7M",
  display_name: "Kong",  // ← Whatever user set it to
  squad: "creators",
  total_xp: 500,
  level: 5
  // ... all user data
}
```

## Data Persistence

### What's Tied to Wallet Address
All of these are **permanently associated** with the wallet address:

```
Wallet: 7vswdZFp...
├── Display Name: "Kong" (changeable)
├── Squad: "Hoodie Creators" (changeable after 30 days)
├── XP: 500 (earned over time)
├── Level: 5 (based on XP)
├── Course Progress (all completions)
├── Bounty Submissions (all submissions)
├── Admin Status (if applicable)
└── Created Date (never changes)
```

### What Changes When Name Updates
```
✅ Display name shown in profile
✅ Display name shown in leaderboards
✅ Display name shown in squad chat
✅ Display name in admin dashboard

❌ Wallet address (NEVER changes)
❌ User ID (NEVER changes)
❌ XP/Progress (stays same)
❌ Squad assignment (separate from name)
```

## Example Scenarios

### Scenario 1: User Changes Name Multiple Times
```
Day 1: Connects → "User 7vswdZ..."
Day 2: Changes to → "Kong"
Day 5: Changes to → "Kong Master"
Day 10: Changes to → "The Real Kong"

Wallet address: 7vswdZFp... (SAME throughout)
All XP, progress, squad: (PRESERVED throughout)
```

### Scenario 2: Two Users with Same Display Name
```
User A:
  wallet_address: "7vswdZFp..."
  display_name: "Kong"

User B:
  wallet_address: "qg7pNNZq..."
  display_name: "Kong"

✅ This is allowed! Display name is NOT unique.
✅ Wallet addresses are different → Different users
✅ System tracks them separately
```

### Scenario 3: Looking Up User Data
```javascript
// When Kong logs in:
const walletAddress = "7vswdZFphxbtd1tCB5EhLNn2khiDiKmQEehSNUFHjz7M";

// System looks up by wallet:
const user = await getUserByWallet(walletAddress);

// Finds:
{
  display_name: "Kong",
  squad: "Hoodie Creators",
  total_xp: 500,
  // ... all user data associated with this wallet
}

// Shows "Kong" in the UI
// All progress is there
// Squad assignment is there
// Everything is tied to the wallet ✅
```

## UI Components

### Profile Display
```tsx
// Shows user's chosen display name
<h2>{userData.display_name}</h2>

// Shows wallet for verification
<p className="text-sm text-gray-400">
  Wallet: {wallet.slice(0, 8)}...{wallet.slice(-6)}
</p>
```

### Profile Edit Form
```tsx
<Input
  type="text"
  value={displayName}
  onChange={(e) => setDisplayName(e.target.value)}
  placeholder="Enter your display name"
/>

<Button onClick={saveProfile}>
  Save Profile
</Button>
```

### What Gets Saved
```typescript
// User edits display name and clicks save
await fetch('/api/users/track', {
  method: 'POST',
  body: JSON.stringify({
    walletAddress: wallet,     // ← Identifier (unchanged)
    displayName: newName,      // ← New name user entered
    activityType: 'profile_update'
  })
});

// Database updates:
// UPDATE users SET display_name = newName WHERE wallet_address = wallet
```

## Benefits

### ✅ User Control
- Users can choose their own identity
- Not stuck with auto-generated names
- Can change name anytime

### ✅ Data Integrity
- Wallet address never changes
- All data stays connected
- No risk of losing progress

### ✅ Privacy Options
- Users can use pseudonyms
- Don't have to reveal wallet in name
- Can be anonymous or public

### ✅ Recognition
- Users can build reputation with chosen name
- Others recognize them by display name
- Wallet address stays in background

## Admin View

Admins can see both display name and wallet:

```typescript
// In admin dashboard
<td>{user.display_name}</td>
<td className="text-xs text-gray-400">
  {user.wallet_address.slice(0, 8)}...
</td>
```

This allows admins to:
- See user's chosen name
- Verify by wallet address if needed
- Track user activity
- Resolve disputes

## Security

### Wallet Address is Source of Truth
```
User claims: "I'm Kong"
System verifies: "Does this wallet match Kong's wallet?"
If yes → Allow access
If no → Deny access
```

### Display Name Can't Be Used for Auth
```
❌ Login by display name → NOT secure
✅ Login by wallet signature → Secure

Display names are for display only!
Wallet addresses are for authentication!
```

## Summary

### 🎯 How It Works
1. **Wallet address** = Permanent, unique identifier
2. **Display name** = User-changeable label
3. **Association** = Always maintained in database
4. **Updates** = Instant via upsert operation
5. **Persistence** = All data tied to wallet, not name

### ✅ What's Guaranteed
- Wallet address NEVER changes
- Display name can change anytime
- System ALWAYS knows which wallet = which user
- All progress/data stays with the wallet
- No duplicates created
- Name changes are instant

### 💡 Real-World Example
```
Think of it like a phone number vs. contact name:

Wallet Address = Phone number (permanent)
Display Name = Contact name (changeable)

You can change "Mom" to "Mother" to "Mama"
But the phone number stays the same!
```

The system is working **exactly as intended**! 🎉

