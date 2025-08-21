# Admin Dashboard Setup Guide

## Overview
This guide will help you set up admin access for the Hoodie Academy platform and fix the current issues with the admin dashboard.

## Issues Fixed
1. ✅ **Missing `is_admin` field in users table**
2. ✅ **Bounty edit form application errors**
3. ✅ **Admin wallet access control**
4. ✅ **Mobile responsiveness improvements**

## Setup Steps

### 1. Database Setup
Run the following SQL script in your Supabase SQL editor:

```sql
-- Admin Setup Script for Hoodie Academy
-- Run this script in your Supabase SQL editor to add admin functionality

-- =====================================================
-- 1. ADD ADMIN FIELD TO USERS TABLE
-- =====================================================

-- Add is_admin column to users table if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Create index for admin users
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin);

-- =====================================================
-- 2. CREATE/UPDATE ADMIN USERS
-- =====================================================

-- Insert or update admin users (all four admin wallets)
INSERT INTO users (wallet_address, display_name, squad, is_admin, created_at, last_active) 
VALUES 
  ('qg7pNNZq7qDQuc6Xkd1x4NvS2VM3aHtCqHEzucZxRGA', 'Prince', 'Creators', TRUE, NOW(), NOW()),
  ('JCUGres3WA8MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU', 'Prince 1', 'Creators', TRUE, NOW(), NOW()),
  ('7vswdZFphxbtd1tCB5EhLNn2khiDiKmQEehSNUFHjz7M', 'Kong', 'Creators', TRUE, NOW(), NOW()),
  ('63B9jg8iBy9pf4W4VDizbQnBD45QujmzbHyGRtHxknr7', 'Kong 1', 'Creators', TRUE, NOW(), NOW())
ON CONFLICT (wallet_address) 
DO UPDATE SET 
  is_admin = EXCLUDED.is_admin,
  display_name = EXCLUDED.display_name,
  squad = EXCLUDED.squad,
  last_active = NOW();

-- =====================================================
-- 3. UPDATE RLS POLICIES FOR ADMIN ACCESS
-- =====================================================

-- Drop existing policies that need admin access
DROP POLICY IF EXISTS "Users can update their own data" ON users;

-- Create new policies with admin access
CREATE POLICY "Users can update their own data or admin can update any" ON users
  FOR UPDATE USING (
    auth.jwt() ->> 'wallet_address' = wallet_address 
    OR 
    EXISTS (
      SELECT 1 FROM users 
      WHERE wallet_address = auth.jwt() ->> 'wallet_address' 
      AND is_admin = TRUE
    )
  );

-- Add admin policy for viewing all user data
CREATE POLICY "Admins can view all user data" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE wallet_address = auth.jwt() ->> 'wallet_address' 
      AND is_admin = TRUE
    )
  );
```

### 2. Verify Admin Setup
After running the script, verify the setup:

```sql
-- Check admin users
SELECT 
  wallet_address,
  display_name,
  squad,
  is_admin,
  created_at
FROM users 
WHERE is_admin = TRUE
ORDER BY created_at;

-- Check table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name = 'is_admin';
```

### 3. Admin Wallet Addresses
The following wallets now have admin access:

- **qg7pNNZq7qDQuc6Xkd1x4NvS2VM3aHtCqHEzucZxRGA** - Prince
- **JCUGres3WA8MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU** - Prince 1
- **7vswdZFphxbtd1tCB5EhLNn2khiDiKmQEehSNUFHjz7M** - Kong
- **63B9jg8iBy9pf4W4VDizbQnBD45QujmzbHyGRtHxknr7** - Kong 1

## Features Available

### User Management
- View all users and their activity
- Edit user profiles and squad assignments
- Track course completions and progress
- Monitor user engagement metrics

### Bounty Management
- Create and edit bounties
- Toggle bounty visibility
- Update bounty status (active/completed/expired)
- Track bounty submissions

### Course Management
- Toggle course visibility
- Publish/unpublish courses
- Monitor course completion rates

### Analytics Dashboard
- Total user count and active users
- Course completion statistics
- Squad distribution metrics
- Bounty performance tracking

## Mobile Responsiveness

The admin dashboard has been optimized for mobile devices with:

- Responsive grid layouts
- Mobile-friendly modal dialogs
- Touch-optimized button sizes
- Adaptive spacing and typography

## Troubleshooting

### Common Issues

1. **"Access denied" error**
   - Ensure your wallet is connected
   - Verify your wallet address is in the admin list
   - Check that the `is_admin` field is set to `TRUE`

2. **Bounty edit form not working**
   - The form has been fixed and should work properly now
   - Ensure you're using a supported browser

3. **Data not loading**
   - Check your internet connection
   - Verify Supabase connection settings
   - Ensure RLS policies are properly configured

### Support
If you encounter any issues, check:
1. Browser console for error messages
2. Supabase logs for database errors
3. Network tab for API failures

## Security Notes

- Admin access is controlled by wallet address verification
- RLS policies ensure data security
- Admin actions are logged for audit purposes
- Only authorized wallets can access admin functions

## Future Enhancements

Planned improvements include:
- Advanced user analytics
- Bulk user operations
- Enhanced bounty management
- Real-time activity monitoring
- Export functionality for reports
