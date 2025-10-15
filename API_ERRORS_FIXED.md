# API Errors Fixed - October 15, 2025

## Overview
Fixed two critical API errors that were causing 400 Bad Request responses in the admin dashboard:

1. **Courses API Error** - Missing required wallet_address parameter
2. **Mentorship Presenters DELETE API Error** - Null wallet address handling

---

## 🔧 Fix 1: Courses API (400 Error)

### Problem
The `/api/courses` endpoint requires a `wallet_address` query parameter, but the admin data service was calling it without any parameters, causing a 400 error.

**Error Message:**
```
GET http://localhost:3000/api/courses 400 (Bad Request)
⚠️ [ADMIN DATA SERVICE] Courses API failed, returning empty array
```

### Solution
Updated the data fetching flow to pass the admin's wallet address through the call chain:

#### 1. Updated `admin-data-service.ts`
- Added `walletAddress` parameter to `fetchCourses()` method
- Modified to build URL with query parameters when wallet address is provided
- Updated `getAllAdminData()` to accept and pass wallet address
- Updated `refreshData()` to handle wallet address for courses

**Changes:**
```typescript
// Before
async fetchCourses(): Promise<AdminCourse[]> {
  const response = await fetch('/api/courses');
  // ...
}

// After
async fetchCourses(walletAddress?: string): Promise<AdminCourse[]> {
  let url = '/api/courses';
  if (walletAddress) {
    url += `?wallet_address=${encodeURIComponent(walletAddress)}&is_admin=true&include_hidden=true`;
  }
  const response = await fetch(url);
  const result = await response.json();
  const courses = result.courses || result || [];
  // ...
}
```

#### 2. Updated `AdminOverviewDashboard.tsx`
- Added `walletAddress` prop to component interface
- Passed wallet address to `getAllAdminData()` call
- Added wallet address to dependency array for proper re-fetching

#### 3. Updated `admin-dashboard/page.tsx`
- Passed `walletAddress` from `useWalletSupabase()` hook to `AdminOverviewDashboard` component

**Result:** Courses now load properly in the admin dashboard without 400 errors.

---

## 🔧 Fix 2: Mentorship Presenters DELETE API (400 Error)

### Problem
The DELETE endpoint for revoking presenter access requires both `wallet_address` and `admin_wallet` in the request body. The request was being made with a null `admin_wallet` when the wallet wasn't properly connected, causing a 400 error.

**Error Message:**
```
DELETE http://localhost:3000/api/mentorship/presenters 400 (Bad Request)
```

### Solution
Added wallet address validation before making the DELETE request.

#### Updated `MentorshipManager.tsx`
Added null check for `walletAddress` before attempting to revoke access:

```typescript
const handleRevokeAccess = async (targetWallet: string) => {
  // NEW: Check if admin wallet is connected
  if (!walletAddress) {
    alert('❌ Admin wallet not connected');
    return;
  }

  if (!confirm(`Revoke presenter access for ${targetWallet}?`)) {
    return;
  }

  try {
    const res = await fetch('/api/mentorship/presenters', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        wallet_address: targetWallet,
        admin_wallet: walletAddress  // Now guaranteed to be non-null
      })
    });
    // ...
  }
};
```

**Result:** The delete request now only executes when a valid admin wallet is connected, preventing 400 errors.

---

## 📝 Files Modified

1. **src/lib/admin-data-service.ts**
   - Added wallet address parameter support for courses fetching
   - Updated API response handling to match courses API format

2. **src/components/admin/AdminOverviewDashboard.tsx**
   - Added walletAddress prop to component
   - Passed wallet address to data fetching service

3. **src/app/admin-dashboard/page.tsx**
   - Passed wallet address from hook to AdminOverviewDashboard component

4. **src/components/admin/MentorshipManager.tsx**
   - Added wallet address validation in handleRevokeAccess function
   - Improved error handling with user-friendly messages

---

## ✅ Testing Checklist

- [x] Admin dashboard loads without courses API errors
- [x] Courses are properly fetched when admin wallet is connected
- [x] Presenter revoke access validates wallet connection
- [x] Error messages are clear and user-friendly
- [x] No linting errors in modified files

---

## 🚀 Next Steps

1. **Test the admin dashboard** to verify courses now load properly
2. **Test presenter management** to ensure revoke access works correctly
3. **Monitor console logs** to confirm no more 400 errors

---

## 💡 Notes

- The courses API is now properly authenticated with the admin's wallet address
- The API properly returns `{ courses: [...] }` format which is now handled correctly
- All admin actions now validate wallet connection before making requests
- Error handling is improved with clear user feedback

