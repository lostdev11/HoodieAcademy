# Wallet-Based User Tracking System Setup Guide

This guide will help you set up the comprehensive wallet-based user tracking system for Hoodie Academy.

## 🚀 Quick Setup Checklist

### 1. Database Setup
1. **Run the main schema SQL file:**
   ```bash
   # Copy the contents of src/lib/user-tracking-schema.sql
   # Paste into your Supabase SQL Editor and run
   ```

2. **Verify tables were created:**
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('profiles', 'wallets', 'sessions', 'event_log', 'course_progress', 'placement_progress', 'admin_approvals');
   ```

### 2. Environment Variables
Ensure these are set in your `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Code Integration
1. **Replace the existing wallet hook** (optional but recommended):
   ```typescript
   // In your components, replace:
   import { useWalletSupabase } from '@/hooks/use-wallet-supabase';
   
   // With:
   import { useEnhancedWalletSupabase } from '@/hooks/use-enhanced-wallet-supabase';
   ```

2. **Add tracking to your root layout:**
   ```typescript
   // In your root layout or _app.tsx
   import TrackingProvider from '@/components/TrackingProvider';
   
   export default function RootLayout({ children }) {
     return (
       <html>
         <body>
           <TrackingProvider>
             {children}
           </TrackingProvider>
         </body>
       </html>
     );
   }
   ```

3. **Add course tracking to your course components:**
   ```typescript
   import { useCourseEvents } from '@/hooks/useCourseEvents';
   
   function CourseComponent() {
     const { onCourseStart, onCourseComplete, onLessonStart, onLessonComplete } = useCourseEvents();
     
     useEffect(() => {
       onCourseStart('course-id');
     }, []);
     
     const handleLessonComplete = () => {
       onLessonComplete('course-id', 'lesson-id');
     };
   }
   ```

### 4. Admin Dashboard Integration
The admin dashboard now includes a new "User Tracking" tab with:
- Real-time user analytics (DAU/WAU/MAU)
- Live user monitoring
- Course activity tracking
- Inactive user identification
- Top courses by activity

### 5. Scheduled Jobs (Optional)
Set up these scheduled jobs for optimal performance:

```sql
-- Run this daily to refresh materialized views
SELECT refresh_activity_views();

-- Run this hourly to clean up stale sessions
SELECT end_stale_sessions();
```

## 📊 What's Tracked

### Automatic Tracking
- **Wallet connections/disconnections**
- **Page views** (with debouncing)
- **Session heartbeats** (every 30 seconds)
- **User activity timestamps**

### Manual Tracking (via hooks)
- **Course starts/completions**
- **Lesson starts/completions**
- **Exam starts/submissions**
- **Placement test events**
- **Custom events**

## 🔧 API Endpoints

### `/api/track` (POST)
Logs events to the tracking system.
```typescript
{
  kind: 'page_view' | 'course_start' | 'wallet_connect' | ...,
  path?: string,
  referrer?: string,
  payload?: Record<string, unknown>,
  sessionId?: string,
  walletAddress?: string,
  courseId?: string,
  lessonId?: string,
  examId?: string
}
```

### `/api/session` (POST/PATCH)
Manages user sessions.
```typescript
// POST - Start session
{ walletAddress?: string }

// PATCH - End session  
{ sessionId: string }
```

## 📈 Admin Dashboard Queries

### Live Users (Last 5 minutes)
```sql
SELECT * FROM public.live_users 
ORDER BY last_heartbeat_at DESC;
```

### Daily Active Users (Last 30 days)
```sql
SELECT * FROM public.activity_daily 
WHERE day >= NOW() - INTERVAL '30 days'
ORDER BY day DESC;
```

### Top Courses (Last 7 days)
```sql
SELECT * FROM public.top_courses_7d 
ORDER BY active_users DESC;
```

### Inactive Users (7+ days)
```sql
SELECT * FROM public.inactive_users_7d 
ORDER BY last_event_at ASC;
```

## 🛠️ Troubleshooting

### Common Issues

1. **RLS Policies Blocking Access**
   ```sql
   -- Check if admin policies are working
   SELECT auth.jwt() ->> 'role' as user_role;
   ```

2. **Materialized Views Not Updating**
   ```sql
   -- Manually refresh views
   REFRESH MATERIALIZED VIEW CONCURRENTLY public.activity_daily;
   ```

3. **Session Not Starting**
   - Check if user is authenticated with Supabase
   - Verify RLS policies allow session creation
   - Check browser console for errors

### Debug Mode
Enable debug logging by adding to your component:
```typescript
useEffect(() => {
  console.log('Tracking state:', { wallet, sessionId, sessionActive });
}, [wallet, sessionId, sessionActive]);
```

## 🔒 Security Notes

- All tables have Row Level Security (RLS) enabled
- Users can only access their own data
- Admin access requires JWT role claim
- All API routes validate authentication
- Edge runtime provides better security

## 📝 Migration from Existing System

If you're migrating from the existing tracking system:

1. **Keep existing tables** - new system works alongside them
2. **Gradually migrate** - use new hooks in new components first
3. **Data migration** - existing user data will be automatically migrated
4. **Test thoroughly** - verify tracking works before full migration

## 🎯 Next Steps

1. **Monitor Performance** - Check query performance on materialized views
2. **Set up Alerts** - Monitor for failed tracking events
3. **Custom Analytics** - Build additional dashboard components
4. **A/B Testing** - Use custom events for feature testing
5. **Export Data** - Set up data export for external analytics

## 📞 Support

If you encounter issues:
1. Check the browser console for errors
2. Verify Supabase RLS policies
3. Test API endpoints directly
4. Check database logs for errors

The system is designed to be robust and fail gracefully - tracking failures won't break your app.
