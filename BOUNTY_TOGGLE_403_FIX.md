# Bounty Toggle 403 Error - Fixed! ✅

## The Problem

When clicking the eye icon to toggle bounty visibility in the admin dashboard, you were getting a **403 Forbidden** error:

```
PUT http://localhost:3000/api/bounties/b6c9029a-c455-4e76-b176-1f41c167045f 403 (Forbidden)
```

## Root Cause

The API route `/api/bounties/[id]/route.ts` expects the wallet address to be sent in the **HTTP header** `X-Wallet-Address` for admin authentication:

```typescript
// API expects this:
const walletAddress = req.headers.get('x-wallet-address');
```

However, `BountyManagerSimple.tsx` was **NOT sending the wallet address in the header**:

```typescript
// ❌ BEFORE - Missing the wallet header
const response = await fetch(`/api/bounties/${bounty.id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },  // ← No wallet header!
  body: JSON.stringify({ 
    ...bounty, 
    hidden: !bounty.hidden,
    walletAddress  // ← This was in the body, not the header
  })
});
```

## The Fix

Added the `X-Wallet-Address` header to match what the API expects:

```typescript
// ✅ AFTER - Wallet address in header
const response = await fetch(`/api/bounties/${bounty.id}`, {
  method: 'PUT',
  headers: { 
    'Content-Type': 'application/json',
    'X-Wallet-Address': walletAddress  // ← Now in header!
  },
  body: JSON.stringify({ 
    hidden: !bounty.hidden  // ← Only send what we're updating
  })
});
```

## Files Fixed

1. ✅ `src/components/admin/BountyManagerSimple.tsx` - Added wallet header
2. ✅ `src/app/admin-fixed/page.tsx` - Added wallet header
3. ℹ️ `src/components/admin/BountyManager.tsx` - Already had it correct

## How to Test

1. **Restart your dev server** (important!):
   ```bash
   # Press Ctrl+C in your terminal, then:
   npm run dev
   ```

2. **Go to the admin dashboard** and try toggling a bounty's visibility

3. **You should see these logs** in the browser console:
   ```
   🔄 [BOUNTY TOGGLE] Toggling bounty visibility: b6c9029a... from false to true
   🔑 [BOUNTY TOGGLE] Using wallet address: JCUGres3WA8MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU
   📊 [BOUNTY TOGGLE] Response status: 200
   ```

4. **In the server terminal**, you should see:
   ```
   🔍 [BOUNTY UPDATE] PATCH request for bounty: b6c9029a...
   🔍 [BOUNTY UPDATE] Wallet address from header: JCUGres3WA8MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU
   ✅ [BOUNTY UPDATE] Wallet-based admin check: true
   ✅ [BOUNTY UPDATE] Admin check passed
   ✅ [BOUNTY UPDATE] Bounty updated successfully
   ```

## Why This Happened

The `BountyManager.tsx` component was already sending the wallet address correctly in the header, but `BountyManagerSimple.tsx` (which is the one currently being used) was missing this header. The API route requires this header for wallet-based admin authentication.

## Next Steps

After restarting your dev server, the 403 error should be completely gone! 🎉

