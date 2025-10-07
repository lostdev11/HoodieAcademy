# 🎯 Hoodie Academy Tracking System

A comprehensive production-ready tracking system that ties every user action to a connected Solana wallet and powers an enhanced Admin Dashboard.

## 🚀 Features

### Core Tracking
- **Wallet Connection Tracking**: Automatic logging of wallet connect/disconnect events
- **Page View Tracking**: Debounced page view logging with referrer tracking
- **Session Management**: Heartbeat-based session tracking with automatic cleanup
- **Course Event Tracking**: Comprehensive course, lesson, exam, and placement tracking
- **Activity Monitoring**: Real-time user activity with inactivity detection

### Bounty & XP System
- **Bounty Management**: Create, manage, and moderate bounties with XP rewards
- **Submission System**: User submissions with admin review workflow
- **XP Ledger**: Immutable XP tracking with multiple sources
- **Admin Controls**: Full admin dashboard with user management

### Analytics & Insights
- **DAU/WAU/MAU**: Daily, weekly, and monthly active user metrics
- **Live User Tracking**: Real-time active user monitoring
- **Course Analytics**: Course completion and engagement metrics
- **Bounty Analytics**: Submission rates and approval statistics
- **XP Distribution**: User progression and reward tracking

## 🏗️ Architecture

### Database Schema
- **Users Table**: Extended with tracking columns (`primary_wallet`, `last_active_at`)
- **Wallets Table**: 1:N relationship with users for multiple wallet support
- **Sessions Table**: Heartbeat-based session tracking
- **Event Log**: Immutable append-only event logging
- **Bounties & Submissions**: Complete bounty management system
- **XP Events**: Immutable XP ledger with audit trail

### Security
- **Row Level Security (RLS)**: Enabled on all tables with least-privilege policies
- **Admin Detection**: JWT claims + admin wallet list fallback
- **Authenticated APIs**: All tracking requires Supabase authentication
- **Data Validation**: Comprehensive input validation with Zod schemas

### Performance
- **Edge Runtime**: All API routes optimized for edge deployment
- **Materialized Views**: Pre-computed analytics for fast dashboard loading
- **Indexed Queries**: Optimized database indexes for common queries
- **Debounced Events**: Client-side event debouncing to prevent spam

## 📁 File Structure

```
src/
├── lib/
│   ├── tracking-schema-complete.sql    # Complete database schema
│   ├── admin.ts                        # Admin utility functions
│   ├── admin-queries.ts               # Dashboard data access layer
│   ├── seed-tracking-data.ts          # Test data generation
│   └── tracking/
│       └── client.ts                  # Client-side tracking utilities
├── hooks/
│   ├── useWalletTracking.ts           # Wallet event tracking
│   ├── usePageView.ts                 # Page view tracking
│   ├── useSessionTracking.ts          # Session management
│   └── useCourseEvents.ts             # Course event tracking
├── components/
│   ├── TrackingProvider.tsx           # Global tracking provider
│   └── admin/
│       └── EnhancedTrackingDashboard.tsx # Admin dashboard
├── app/api/
│   ├── track/route.ts                 # Event logging API
│   ├── session/route.ts               # Session management API
│   ├── bounties/                      # Bounty management APIs
│   ├── bounty-submissions/            # Submission management APIs
│   └── xp/                            # XP management APIs
└── types/
    └── tracking.ts                    # TypeScript definitions
```

## 🚀 Quick Start

### 1. Database Setup

Run the complete schema in your Supabase SQL Editor:

```sql
-- Run src/lib/tracking-schema-complete.sql
```

### 2. Environment Variables

Ensure your `.env.local` has:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Add Admin Wallets

Insert your admin wallet addresses:

```sql
INSERT INTO admin_wallets (wallet_address, label) VALUES 
  ('YOUR_ADMIN_WALLET_1', 'Primary Admin'),
  ('YOUR_ADMIN_WALLET_2', 'Secondary Admin');
```

### 4. Integrate Tracking

Wrap your app with the TrackingProvider:

```tsx
import { TrackingProvider } from '@/components/TrackingProvider';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html>
      <body>
        <TrackingProvider walletAddress={walletAddress} autoStart={true}>
          {children}
        </TrackingProvider>
      </body>
    </html>
  );
}
```

### 5. Use Tracking Hooks

```tsx
import { useTracking } from '@/components/TrackingProvider';

function CoursePage() {
  const { onCourseStart, onLessonComplete } = useTracking();

  const handleCourseStart = async () => {
    await onCourseStart('solana-basics');
  };

  const handleLessonComplete = async () => {
    await onLessonComplete('solana-basics', 'lesson-1');
  };

  return (
    <div>
      <button onClick={handleCourseStart}>Start Course</button>
      <button onClick={handleLessonComplete}>Complete Lesson</button>
    </div>
  );
}
```

## 📊 Admin Dashboard

### Key Metrics
- **Total Users**: All registered users
- **Active Users**: Users active in last 7 days
- **Live Users**: Users active in last 5 minutes
- **Total XP**: Sum of all XP across all users
- **Pending Submissions**: Bounties awaiting review

### User Management
- **User List**: All users with XP, submissions, and activity status
- **User Details**: Detailed view with event history and XP ledger
- **Admin Actions**: XP adjustments, submission moderation

### Bounty Management
- **Create Bounties**: Set rewards, deadlines, and requirements
- **Moderate Submissions**: Review and approve/reject submissions
- **Track Performance**: Monitor bounty engagement and completion rates

## 🔧 API Reference

### Event Tracking

```typescript
// Log any event
await logEvent({
  kind: 'course_start',
  courseId: 'solana-basics',
  sessionId: 'session-uuid',
  walletAddress: 'wallet-address'
});

// Specific event helpers
await logWalletConnect('wallet-address');
await logPageView('/course/solana-basics');
await logCourseComplete('solana-basics');
```

### Session Management

```typescript
// Start session
const response = await fetch('/api/session', {
  method: 'POST',
  body: JSON.stringify({ walletAddress: 'wallet-address' })
});
const { sessionId } = await response.json();

// End session
await fetch('/api/session', {
  method: 'PATCH',
  body: JSON.stringify({ sessionId })
});
```

### Bounty Management

```typescript
// Create bounty (admin only)
await fetch('/api/bounties', {
  method: 'POST',
  body: JSON.stringify({
    title: 'Build a DeFi Dashboard',
    description: 'Create a comprehensive DeFi dashboard',
    reward_xp: 250,
    status: 'open',
    tags: ['defi', 'dashboard']
  })
});

// Submit to bounty
await fetch('/api/bounties/bounty-id/submissions', {
  method: 'POST',
  body: JSON.stringify({
    title: 'My DeFi Dashboard',
    content: 'Description of my submission',
    url: 'https://example.com/dashboard',
    evidence_links: ['https://github.com/user/repo']
  })
});
```

## 🧪 Testing

### Seed Test Data

```typescript
import { seedTrackingData } from '@/lib/seed-tracking-data';

// Generate sample data
await seedTrackingData();

// Clear all data
await clearTrackingData();
```

### Test Admin Access

```typescript
import { isAdminForUser } from '@/lib/admin';

const supabase = createClient();
const isAdmin = await isAdminForUser(supabase);
console.log('Is admin:', isAdmin);
```

## 📈 Analytics Queries

### Daily Active Users

```sql
SELECT day, dau 
FROM activity_daily 
WHERE day >= NOW() - INTERVAL '30 days' 
ORDER BY day;
```

### Top XP Earners (7 days)

```sql
SELECT u.display_name, SUM(xe.delta) as total_xp
FROM xp_events xe
JOIN users u ON u.id = xe.user_id
WHERE xe.created_at >= NOW() - INTERVAL '7 days'
GROUP BY u.id, u.display_name
ORDER BY total_xp DESC
LIMIT 10;
```

### Bounty Performance

```sql
SELECT 
  b.title,
  COUNT(bs.id) as total_submissions,
  COUNT(CASE WHEN bs.status = 'approved' THEN 1 END) as approved,
  AVG(bs.score) as avg_score
FROM bounties b
LEFT JOIN bounty_submissions bs ON b.id = bs.bounty_id
GROUP BY b.id, b.title
ORDER BY total_submissions DESC;
```

## 🔒 Security Considerations

### RLS Policies
- Users can only read their own data
- Admins can read all data via JWT claims or wallet list
- Event logging is restricted to authenticated users
- XP adjustments are admin-only

### Data Privacy
- All timestamps stored in UTC
- IP addresses are optional and can be disabled
- User agents are logged for analytics but not stored permanently
- Personal data follows GDPR principles

### Rate Limiting
- Client-side debouncing prevents event spam
- Server-side validation ensures data integrity
- Session management prevents duplicate tracking

## 🚀 Deployment

### Vercel Edge Functions
All API routes are optimized for Vercel Edge Runtime:

```typescript
export const runtime = 'edge';
```

### Database Optimization
- Materialized views refresh nightly
- Stale sessions are cleaned up automatically
- Event log is partitioned by date (future enhancement)

### Monitoring
- All errors are logged to console
- Failed events are retried automatically
- Admin dashboard shows real-time metrics

## 🔄 Maintenance

### Daily Tasks
- Refresh materialized views
- Clean up stale sessions
- Archive old event logs (if needed)

### Weekly Tasks
- Review inactive users
- Analyze bounty performance
- Update admin wallet list

### Monthly Tasks
- Generate comprehensive analytics reports
- Review and optimize database performance
- Update tracking system based on usage patterns

## 📝 Contributing

### Adding New Event Types
1. Add to `EventKind` enum in `types/tracking.ts`
2. Update database schema if needed
3. Add client helper function in `lib/tracking/client.ts`
4. Update admin dashboard to display new events

### Adding New Analytics
1. Add query function in `lib/admin-queries.ts`
2. Update dashboard component
3. Add appropriate indexes for performance
4. Test with sample data

## 🐛 Troubleshooting

### Common Issues

**Events not logging:**
- Check Supabase authentication
- Verify RLS policies
- Check browser console for errors

**Admin access denied:**
- Verify admin wallet is in `admin_wallets` table
- Check JWT claims for `role: 'admin'`
- Ensure user is authenticated

**Performance issues:**
- Check database indexes
- Monitor materialized view refresh
- Review query performance in Supabase dashboard

### Debug Mode

Enable debug logging:

```typescript
// In your component
const { sessionId, isActive, error } = useTracking();
console.log('Tracking state:', { sessionId, isActive, error });
```

## 📚 Additional Resources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js Edge Runtime](https://nextjs.org/docs/app/building-your-application/routing/route-handlers#edge-runtime)
- [Zod Schema Validation](https://zod.dev/)
- [React Hooks Best Practices](https://react.dev/learn/reusing-logic-with-custom-hooks)

---

**Built with ❤️ for Hoodie Academy**

*This tracking system provides comprehensive user analytics while maintaining privacy and security. All data is stored securely in Supabase with proper access controls and audit trails.*
