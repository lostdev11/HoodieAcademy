# Bounty Hide Function Fix

## Issue Description
When trying to hide a bounty from the admin dashboard, users received a "failed" error message.

## Root Cause
The bounty API endpoint (`/api/bounties/[id]/route.ts`) had two problems:

### 1. **Missing `hidden` field in validation schema**
The Zod validation schema didn't include the `hidden` field:
```typescript
const BountyUpdate = z.object({
  title: z.string().min(3).optional(),
  description: z.string().optional(),
  // ... other fields ...
  // ❌ hidden field was missing!
});
```

### 2. **Missing PUT method**
The `BountyManager` component was calling the API with PUT method:
```typescript
const response = await fetch(`/api/bounties/${bounty.id}`, {
  method: 'PUT',  // ← Using PUT
  body: JSON.stringify({ ...bounty, hidden: !bounty.hidden })
});
```

But the API only had PATCH, GET, and DELETE methods:
```typescript
export async function GET(...) { }
export async function PATCH(...) { }  // ← Only PATCH, no PUT
export async function DELETE(...) { }
```

## Solution

### Fix 1: Added `hidden` field to validation schema
```typescript
const BountyUpdate = z.object({
  title: z.string().min(3).optional(),
  description: z.string().optional(),
  slug: z.string().optional(),
  reward_xp: z.number().int().min(1).optional(),
  status: z.enum(['draft','open','closed']).optional(),
  open_at: z.string().datetime().optional(),
  close_at: z.string().datetime().optional(),
  tags: z.array(z.string()).optional(),
  max_submissions: z.number().int().positive().optional(),
  allow_multiple_submissions: z.boolean().optional(),
  image_required: z.boolean().optional(),
  submission_type: z.enum(['text', 'image', 'both']).optional(),
  hidden: z.boolean().optional()  // ✅ Added!
});
```

### Fix 2: Added PUT method that forwards to PATCH
```typescript
// Add PUT method to handle legacy calls
export async function PUT(
  req: NextRequest, 
  { params }: { params: { id: string } }
) {
  // Just forward to PATCH
  return PATCH(req, { params });
}
```

## Implementation Paths

There are actually **two different ways** bounties can be hidden:

### Path 1: Via API Endpoint (BountyManager Component)
**Used by:** `src/components/admin/BountyManager.tsx`

```typescript
const handleToggleHidden = async (bounty: Bounty) => {
  const response = await fetch(`/api/bounties/${bounty.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      ...bounty, 
      hidden: !bounty.hidden,
      walletAddress 
    })
  });
  // Handles response...
};
```

**Flow:**
```
BountyManager → API: /api/bounties/[id] (PUT) → Database
```

**Status:** ✅ **NOW FIXED** (was broken before)

### Path 2: Via Server Action (Admin Dashboard Pages)
**Used by:** 
- `src/app/admin-simple/page.tsx`
- `src/app/admin/AdminDashboard.tsx`

```typescript
import { toggleBountyHidden } from '@/lib/admin-server-actions';

const toggleBountyVisibility = async (bountyId: string) => {
  const b = bounties.find(x => x.id === bountyId);
  await toggleBountyHidden(bountyId, !b.hidden);
  // Update local state...
};
```

**Server Action:**
```typescript
// src/lib/admin-server-actions.ts
export async function toggleBountyHidden(id: string, hidden: boolean) {
  const { supabase, user } = await assertAdminClient();
  const { error } = await supabase
    .from("bounties")
    .update({ hidden, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/admin");
  revalidatePath("/bounties");
}
```

**Flow:**
```
Admin Dashboard → Server Action → Database (direct)
```

**Status:** ✅ **Always worked** (bypasses API, updates database directly)

## Files Changed

### Modified
- **`src/app/api/bounties/[id]/route.ts`**
  - Added `hidden: z.boolean().optional()` to `BountyUpdate` schema
  - Added `PUT` method that forwards to `PATCH`

## Testing

### Test Case 1: Hide/Show via BountyManager Component
```
1. Go to admin dashboard with BountyManager
2. Click hide button on a bounty
3. ✅ Bounty should be hidden
4. Click show button
5. ✅ Bounty should be visible again
```

### Test Case 2: Hide/Show via Admin Dashboard
```
1. Go to /admin-simple
2. Navigate to Bounties tab
3. Click eye icon to hide/show
4. ✅ Should toggle visibility
```

## Why It Was Failing

### Before the Fix
```
User clicks "Hide" button
  ↓
Frontend sends PUT request with { hidden: true }
  ↓
API receives PUT request
  ↓
❌ No PUT method defined → 405 Method Not Allowed
  OR
API receives PATCH request
  ↓
Zod validation runs
  ↓
❌ "hidden" field not in schema → Validation fails
  ↓
Returns 400 Bad Request
  ↓
Frontend shows "Failed" message
```

### After the Fix
```
User clicks "Hide" button
  ↓
Frontend sends PUT request with { hidden: true }
  ↓
API receives PUT request
  ↓
✅ PUT method forwards to PATCH
  ↓
Zod validation runs
  ↓
✅ "hidden" field is in schema → Validation passes
  ↓
Database updates: UPDATE bounties SET hidden = true
  ↓
Returns 200 OK with updated bounty
  ↓
Frontend shows success, bounty is hidden ✅
```

## Additional Notes

### Validation Schema Completeness
The validation schema now includes all common bounty fields that might need updating:
- ✅ `hidden` - Toggle visibility
- ✅ `status` - Change bounty status
- ✅ `title` - Update title
- ✅ `description` - Update description
- ✅ All other bounty properties

### Method Compatibility
By adding the PUT method that forwards to PATCH, we maintain compatibility with:
- Legacy frontend code using PUT
- New frontend code using PATCH
- Both work correctly now

### Admin Permissions
Both paths (API and Server Action) check for admin permissions:
- **API Route:** Uses `isAdminForUser(supabase)` 
- **Server Action:** Uses `assertAdminClient()` or `assertAdminWallet()`

## Summary

✅ **Fixed:** Added `hidden` field to API validation schema  
✅ **Fixed:** Added PUT method to handle existing frontend calls  
✅ **Verified:** Server actions already working (direct database access)  
✅ **Result:** Hide/Show bounty functionality now works correctly  

The "failed to hide bounty" error is now resolved! 🎉

