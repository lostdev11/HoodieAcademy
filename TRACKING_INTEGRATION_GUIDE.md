# 🚀 Tracking System Integration Guide

## Quick Setup Steps

### 1. Database Setup
Run the complete schema in your Supabase SQL Editor:

```sql
-- Copy and paste the contents of src/lib/tracking-schema-complete.sql
-- This will create all necessary tables, RLS policies, and triggers
```

### 2. Add Your Admin Wallets
Insert your admin wallet addresses:

```sql
INSERT INTO admin_wallets (wallet_address, label) VALUES 
  ('YOUR_ADMIN_WALLET_1', 'Primary Admin'),
  ('YOUR_ADMIN_WALLET_2', 'Secondary Admin');
```

### 3. Test the System
Visit `/tracking-demo` to test the tracking system with your wallet.

### 4. Access Admin Dashboard
Visit `/admin-tracking` to see the comprehensive admin dashboard.

## Integration with Your Existing App

### Option 1: Global Tracking Provider (Recommended)
Wrap your entire app with the TrackingProvider:

```tsx
// In your root layout or _app.tsx
import { TrackingProvider } from '@/components/TrackingProvider';
import { useWalletSupabase } from '@/hooks/use-wallet-supabase';

export default function RootLayout({ children }: { children: ReactNode }) {
  const { wallet } = useWalletSupabase();
  
  return (
    <html>
      <body>
        <TrackingProvider walletAddress={wallet} autoStart={true}>
          {children}
        </TrackingProvider>
      </body>
    </html>
  );
}
```

### Option 2: Component-Level Tracking
Use tracking hooks in specific components:

```tsx
import { useTracking } from '@/components/TrackingProvider';

function CoursePage() {
  const { onCourseStart, onLessonComplete } = useTracking();

  const handleStartCourse = async () => {
    await onCourseStart('solana-basics');
  };

  return (
    <button onClick={handleStartCourse}>
      Start Course
    </button>
  );
}
```

## API Endpoints

### Event Tracking
- `POST /api/track` - Log any tracking event
- `POST /api/session` - Start a new session
- `PATCH /api/session` - End a session

### Bounty Management
- `GET /api/bounties` - List all bounties
- `POST /api/bounties` - Create bounty (admin only)
- `GET /api/bounties/[id]` - Get bounty details
- `PATCH /api/bounties/[id]` - Update bounty (admin only)
- `DELETE /api/bounties/[id]` - Delete bounty (admin only)

### Submissions
- `GET /api/bounties/[id]/submissions` - List submissions for a bounty
- `POST /api/bounties/[id]/submissions` - Submit to a bounty
- `POST /api/bounty-submissions/[id]/moderate` - Moderate submission (admin only)

### XP Management
- `GET /api/xp/[userId]` - Get user's XP data
- `POST /api/xp/adjust` - Adjust user XP (admin only)

## Key Features

### ✅ What's Working
- Wallet connection tracking
- Page view tracking with debouncing
- Session management with heartbeats
- Course event tracking
- Bounty system with XP rewards
- Admin dashboard with real-time stats
- RLS security policies
- Edge-optimized API routes

### 🔧 Configuration
- Admin detection via JWT claims + wallet list
- Automatic user creation on wallet connect
- XP rewards on bounty approval
- Materialized views for analytics
- Comprehensive error handling

## Troubleshooting

### Common Issues

**Build Errors:**
- ✅ Fixed: All import paths now use correct Supabase client
- ✅ Fixed: All API routes use service role key for admin operations

**Authentication Issues:**
- Make sure your wallet is in the `admin_wallets` table
- Check that `SUPABASE_SERVICE_ROLE_KEY` is set in your environment

**Tracking Not Working:**
- Ensure wallet is connected before testing
- Check browser console for errors
- Verify database schema is applied

### Debug Mode
Enable debug logging by checking the browser console. All tracking events will be logged there.

## Next Steps

1. **Test the system** using the demo page
2. **Add your admin wallets** to the database
3. **Integrate tracking** into your existing components
4. **Customize the admin dashboard** for your needs
5. **Set up monitoring** for production use

## Support

If you encounter any issues:
1. Check the browser console for errors
2. Verify your Supabase configuration
3. Ensure all environment variables are set
4. Check that the database schema is applied correctly

The tracking system is now fully integrated and ready to use! 🎉
