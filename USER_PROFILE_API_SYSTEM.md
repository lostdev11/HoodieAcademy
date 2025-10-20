# User Profile API System 👤

Unified API endpoint and React hook for fetching complete user profile data including squad, XP, level, and all metadata.

## 🎯 Overview

The User Profile API provides a single source of truth for all user data, eliminating inconsistencies between different parts of the application.

## 📦 Components

### 1. API Endpoint: `/api/user-profile`

**Method:** GET

**Query Parameters:**
```typescript
{
  wallet: string;  // Required: User's wallet address
}
```

**Response:**
```typescript
{
  success: boolean;
  exists: boolean;
  profile: {
    // Basic Info
    walletAddress: string;
    displayName: string | null;
    level: number;              // Calculated from totalXP
    totalXP: number;
    streak: number;
    isAdmin: boolean;
    banned: boolean;
    
    // Squad Information
    squad: {
      name: string;
      id: string;
      selectedAt: string;
      lockEndDate: string;
      changeCount: number;
      isLocked: boolean;
      remainingDays: number;
    } | null;
    hasSquad: boolean;
    
    // Timestamps
    createdAt: string;
    lastActive: string | null;
    updatedAt: string;
    
    // Additional Data
    completedCourses: string[];
    badges: string[];
    bio: string | null;
    nftCount: number;
  }
}
```

### 2. React Hook: `useUserProfile`

**Usage:**
```typescript
import { useUserProfile } from '@/hooks/useUserProfile';

function MyComponent() {
  const { 
    profile, 
    loading, 
    error, 
    refresh,
    // Helper getters
    squad,
    hasSquad,
    level,
    totalXP,
    isAdmin 
  } = useUserProfile(walletAddress);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      <h2>Welcome, {profile?.displayName}!</h2>
      <p>Squad: {squad}</p>
      <p>Level: {level}</p>
      <p>Total XP: {totalXP}</p>
    </div>
  );
}
```

**Hook API:**
```typescript
interface UseUserProfileReturn {
  profile: UserProfile | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  
  // Helper getters
  squad: string;              // Squad name or 'Unassigned'
  hasSquad: boolean;
  level: number;
  totalXP: number;
  isAdmin: boolean;
}
```

## 🚀 Integration Examples

### Example 1: Fetch Profile in Component
```typescript
'use client';

import { useEffect, useState } from 'react';

export default function ProfileCard({ walletAddress }: { walletAddress: string }) {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const loadProfile = async () => {
      const response = await fetch(`/api/user-profile?wallet=${walletAddress}`);
      const data = await response.json();
      
      if (data.success) {
        setProfile(data.profile);
      }
    };
    
    loadProfile();
  }, [walletAddress]);

  return (
    <div>
      <h3>{profile?.displayName || 'Anonymous'}</h3>
      <p>Squad: {profile?.squad?.name || 'Unassigned'}</p>
      <p>Level {profile?.level} ({profile?.totalXP} XP)</p>
    </div>
  );
}
```

### Example 2: Using the Hook
```typescript
'use client';

import { useUserProfile } from '@/hooks/useUserProfile';

export default function UserStats({ walletAddress }: { walletAddress: string }) {
  const { profile, loading, squad, level, totalXP, refresh } = useUserProfile(walletAddress);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h3>Your Stats</h3>
      <p>Squad: {squad}</p>
      <p>Level: {level}</p>
      <p>XP: {totalXP}</p>
      <button onClick={refresh}>Refresh</button>
    </div>
  );
}
```

### Example 3: Check Squad Lock Status
```typescript
const { profile } = useUserProfile(walletAddress);

if (profile?.squad?.isLocked) {
  console.log(`Squad locked for ${profile.squad.remainingDays} more days`);
} else if (profile?.hasSquad) {
  console.log('Squad can be changed');
} else {
  console.log('No squad assigned');
}
```

## 🔄 Data Flow

```
User Login
    ↓
API: /api/user-profile?wallet=xxx
    ↓
Fetch from Supabase 'users' table
    ↓
Calculate level, squad lock status
    ↓
Return complete profile
    ↓
Components use data consistently
```

## 🎯 Benefits

### Before (Multiple Sources):
- ❌ Squad from localStorage (`squad-storage.ts`)
- ❌ XP from `/api/xp`
- ❌ Admin status from `/api/admin/check`
- ❌ Inconsistent data across pages
- ❌ Multiple API calls
- ❌ Cache synchronization issues

### After (Unified API):
- ✅ Single source of truth
- ✅ One API call for all data
- ✅ Consistent across all pages
- ✅ Automatic level calculation
- ✅ Squad lock status included
- ✅ Easier to maintain

## 📊 Updated Pages

The following pages now use the unified API:

1. **Home Page** (`src/app/page.tsx`)
   - Displays squad badge in header
   - Shows squad information consistently

2. **Dashboard Page** (`src/app/dashboard/page.tsx`)
   - Fetches complete profile on load
   - Squad data synced with database

3. **User Dashboard Component** (`src/components/dashboard/UserDashboard.tsx`)
   - Uses unified API for squad data
   - Ensures consistency with Squad tab

4. **Social Feed Page** (`src/app/social/page.tsx`)
   - Fetches profile for squad and XP
   - Single API call instead of multiple

## 🔐 Security

- ✅ Uses Supabase Service Role Key for secure database access
- ✅ Returns only necessary user data
- ✅ No sensitive information exposed
- ✅ Proper error handling

## 🛠️ Database Schema

The API reads from the `users` table:

```sql
users (
  wallet_address text PRIMARY KEY,
  display_name text,
  total_xp integer DEFAULT 0,
  streak integer DEFAULT 0,
  is_admin boolean DEFAULT false,
  banned boolean DEFAULT false,
  squad text,
  squad_id text,
  squad_selected_at timestamp,
  squad_lock_end_date timestamp,
  squad_change_count integer DEFAULT 0,
  completed_courses jsonb,
  badges jsonb,
  bio text,
  nft_count integer DEFAULT 0,
  created_at timestamp,
  last_active timestamp,
  updated_at timestamp
)
```

## 🚨 Error Handling

### API Returns 404 if User Not Found:
```json
{
  "error": "User not found",
  "exists": false
}
```

### API Returns 400 for Missing Wallet:
```json
{
  "error": "Wallet address is required"
}
```

### Hook Handles Errors Gracefully:
```typescript
const { profile, error } = useUserProfile(wallet);

if (error) {
  // Handle error - component can show fallback UI
  console.error('Profile fetch failed:', error);
}
```

## 📝 Best Practices

### 1. Always Use the Unified API
```typescript
// ✅ GOOD - Single API call
const response = await fetch(`/api/user-profile?wallet=${wallet}`);

// ❌ BAD - Multiple API calls
const xpResponse = await fetch(`/api/xp?wallet=${wallet}`);
const squadResponse = await fetch(`/api/user-squad?wallet=${wallet}`);
```

### 2. Use the Hook for React Components
```typescript
// ✅ GOOD - Automatic loading states and refresh
const { profile, loading, squad } = useUserProfile(wallet);

// ❌ BAD - Manual state management
const [profile, setProfile] = useState(null);
useEffect(() => { /* fetch logic */ }, [wallet]);
```

### 3. Handle Unassigned Users
```typescript
// ✅ GOOD - Always show something
<SquadBadge squad={profile?.squad?.name || 'Unassigned'} />

// ❌ BAD - Conditional rendering creates layout shift
{profile?.squad && <SquadBadge squad={profile.squad.name} />}
```

## 🔄 Migration Guide

### Old Code (Before):
```typescript
import { getSquadName } from '@/utils/squad-storage';

const squadName = getSquadName(); // Only from localStorage
```

### New Code (After):
```typescript
import { useUserProfile } from '@/hooks/useUserProfile';

const { squad } = useUserProfile(walletAddress); // From database
```

## 🎉 Features

✅ **Single source of truth** for user data  
✅ **Automatic level calculation** from XP  
✅ **Squad lock status** included  
✅ **Unassigned user support**  
✅ **React hook** for easy integration  
✅ **Error handling** built-in  
✅ **Refresh capability**  
✅ **TypeScript support**  
✅ **Consistent across all pages**  

---

**Ready to use!** The unified API ensures squad and badge information is always accurate and displayed consistently throughout the academy! 🚀

