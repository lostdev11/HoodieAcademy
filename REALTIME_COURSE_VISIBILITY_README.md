# Real-time Course Visibility System

## Overview

The Hoodie Academy now features a **real-time course visibility system** that allows administrators to instantly hide/show courses and publish/unpublish them. All changes are reflected immediately across all user interfaces without requiring page refreshes.

## Features

### 🚀 Real-time Updates
- **Instant visibility changes** - Courses appear/disappear immediately when toggled
- **Live published status updates** - Published/unpublished changes are reflected in real-time
- **Cross-tab synchronization** - Changes made in admin dashboard appear instantly on user pages
- **No page refresh required** - All updates happen automatically via WebSocket connections

### 👁️ Course Visibility Control
- **Eye icon toggle** - Control whether courses are visible to users
- **Globe/Lock toggle** - Control whether courses are published (live) or in draft mode
- **Dual-layer control** - Courses must be both visible AND published to appear to users

### 🔒 Admin-Only Access
- **Admin dashboard controls** - Only administrators can modify course visibility
- **Secure API endpoints** - All visibility changes require admin authentication
- **Audit trail** - Changes are logged with admin user ID and timestamp

## How It Works

### 1. Database Schema
The system uses two boolean fields in the `courses` table:
- `is_visible` - Controls whether the course can be seen
- `is_published` - Controls whether the course is live/active

### 2. Real-time Subscriptions
Supabase real-time subscriptions listen for database changes:
- **Admin dashboard** - Subscribes to all course changes for real-time updates
- **User pages** - Subscribe to course changes to show/hide content immediately
- **API endpoints** - Filter courses based on visibility and published status

### 3. Server Actions
Server-side functions handle database updates:
- `setCourseVisibility()` - Updates course visibility status
- `setCoursePublished()` - Updates course published status
- Automatic cache invalidation and path revalidation

## Implementation Details

### API Endpoints

#### GET /api/courses
- **Admin users**: See all courses (including hidden/unpublished)
- **Regular users**: Only see courses where `is_visible = true` AND `is_published = true`
- **Real-time**: Automatically updates when courses change

#### POST /api/admin/courses/[id]/visibility
- **Admin only**: Updates course visibility
- **Real-time**: Changes broadcast to all connected clients

#### POST /api/admin/courses/[id]/publish
- **Admin only**: Updates course published status
- **Real-time**: Changes broadcast to all connected clients

### Real-time Channels

#### Admin Dashboard Channel
```typescript
const adminChannel = supabase
  .channel('admin-courses-changes')
  .on('postgres_changes', { table: 'courses' }, handleChange)
```

#### User Pages Channel
```typescript
const userChannel = supabase
  .channel('courses-changes')
  .on('postgres_changes', { table: 'courses' }, handleChange)
```

### State Management
- **Local state updates** - Immediate UI feedback for better UX
- **Server state sync** - Database changes trigger real-time updates
- **Optimistic updates** - UI updates immediately, then syncs with server

## Usage

### For Administrators

#### 1. Access Admin Dashboard
Navigate to `/admin` and go to the Courses tab

#### 2. Toggle Course Visibility
- **Eye icon** (👁️) - Click to toggle course visibility
- **Green eye** = Course is visible to users
- **Red eye-off** = Course is hidden from users

#### 3. Toggle Course Published Status
- **Globe icon** (🌐) = Course is published and live
- **Lock icon** (🔒) = Course is in draft mode

#### 4. Real-time Feedback
- Changes appear immediately in the admin dashboard
- All connected user pages update automatically
- No manual refresh required

### For Users

#### 1. Automatic Updates
- Course visibility changes are reflected immediately
- Hidden courses disappear from view instantly
- New visible courses appear automatically

#### 2. Seamless Experience
- No page refreshes needed
- Changes happen in real-time
- Consistent state across all tabs/windows

## Testing the System

### Test Page
Visit `/test-realtime-courses` to see the real-time system in action:

1. **Open admin dashboard** in one tab
2. **Open test page** in another tab
3. **Toggle course visibility** in admin dashboard
4. **Watch changes appear** immediately on test page

### Console Logging
All real-time events are logged to the browser console:
```
Admin course change detected: { eventType: 'UPDATE', ... }
Course change detected: { eventType: 'UPDATE', ... }
```

## Security Considerations

### Authentication
- All visibility changes require admin authentication
- Server actions verify admin privileges before database updates
- API endpoints check user permissions

### Data Validation
- Input validation on all course updates
- SQL injection protection via parameterized queries
- Audit trail for all administrative actions

### Rate Limiting
- No artificial rate limits (intended for admin use)
- Consider implementing rate limiting for production use

## Performance

### Real-time Efficiency
- **WebSocket connections** - Minimal overhead for real-time updates
- **Selective subscriptions** - Only subscribe to necessary tables
- **Efficient updates** - Only affected components re-render

### Database Optimization
- **Indexed fields** - `is_visible` and `is_published` are indexed
- **Efficient queries** - Filtered queries only fetch necessary data
- **Cache invalidation** - Strategic cache clearing for optimal performance

## Troubleshooting

### Common Issues

#### 1. Real-time Not Working
- Check browser console for connection errors
- Verify Supabase environment variables
- Ensure database has real-time enabled

#### 2. Changes Not Reflecting
- Check admin authentication status
- Verify database permissions
- Check browser console for error messages

#### 3. Performance Issues
- Monitor WebSocket connection count
- Check database query performance
- Verify proper cleanup of subscriptions

### Debug Mode
Enable debug logging by checking browser console:
- Real-time connection status
- Database change events
- Error messages and stack traces

## Future Enhancements

### Planned Features
- **Bulk visibility changes** - Toggle multiple courses at once
- **Scheduled visibility** - Set courses to auto-hide/show at specific times
- **Visibility analytics** - Track when and why courses are hidden
- **Advanced filtering** - Filter courses by visibility status in admin

### Technical Improvements
- **WebSocket reconnection** - Automatic reconnection on connection loss
- **Change batching** - Group multiple changes for efficiency
- **Offline support** - Queue changes when offline, sync when reconnected

## Support

For issues with the real-time course visibility system:

1. **Check browser console** for error messages
2. **Verify admin privileges** and authentication
3. **Test real-time connections** using the test page
4. **Check database permissions** and real-time settings
5. **Review network tab** for failed API calls

## Technical Requirements

- **Supabase** - Database with real-time enabled
- **Next.js 13+** - App router with server actions
- **React 18+** - Hooks and state management
- **TypeScript** - Type safety and better development experience
- **WebSocket support** - Browser compatibility for real-time features
