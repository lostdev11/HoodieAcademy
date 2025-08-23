# Server Actions for Course Management

This document describes the server actions that have been integrated into the Hoodie Academy project for managing course visibility and publishing status.

## Overview

The server actions provide secure, server-side functions for admin users to manage courses. They handle authentication, authorization, and database updates while maintaining proper audit trails.

## Available Actions

### `setCourseVisibility(courseId: string, visible: boolean)`
Toggles the visibility of a course. Only visible courses are shown to non-admin users.

**Parameters:**
- `courseId`: The unique identifier of the course
- `visible`: Boolean indicating whether the course should be visible

**Usage:**
```typescript
import { setCourseVisibility } from '@/lib/server-actions';

// Make a course visible
await setCourseVisibility('wallet-wizardry', true);

// Hide a course
await setCourseVisibility('wallet-wizardry', false);
```

### `setCoursePublished(courseId: string, published: boolean)`
Toggles the published status of a course. Only published courses are accessible to users.

**Parameters:**
- `courseId`: The unique identifier of the course
- `published`: Boolean indicating whether the course should be published

**Usage:**
```typescript
import { setCoursePublished } from '@/lib/server-actions';

// Publish a course
await setCoursePublished('wallet-wizardry', true);

// Mark as draft
await setCoursePublished('wallet-wizardry', false);
```

### `updateCourse(courseId: string, updates: Record<string, any>)`
Updates multiple properties of a course at once.

**Parameters:**
- `courseId`: The unique identifier of the course
- `updates`: Object containing the fields to update

**Usage:**
```typescript
import { updateCourse } from '@/lib/server-actions';

await updateCourse('wallet-wizardry', {
  title: 'Updated Title',
  description: 'Updated description',
  level: 'intermediate'
});
```

### `deleteCourse(courseId: string)`
Permanently deletes a course from the database.

**Parameters:**
- `courseId`: The unique identifier of the course

**Usage:**
```typescript
import { deleteCourse } from '@/lib/server-actions';

await deleteCourse('wallet-wizardry');
```

### `createCourse(courseData: Record<string, any>)`
Creates a new course in the database.

**Parameters:**
- `courseData`: Object containing the course data

**Usage:**
```typescript
import { createCourse } from '@/lib/server-actions';

await createCourse({
  title: 'New Course',
  description: 'Course description',
  emoji: '🚀',
  pathType: 'tech',
  href: '/courses/new-course',
  isVisible: true,
  isPublished: false
});
```

## Security Features

### Admin Authentication
All server actions require admin authentication. The `assertAdmin` function:
1. Verifies the user is signed in
2. Checks if the user has admin privileges
3. Returns the user ID for audit trail purposes

### Audit Trail
Each action automatically records:
- `updated_by`: The admin user who made the change
- `updated_at`: Timestamp of the change

### Route Revalidation
After each action, relevant routes are automatically revalidated:
- `/courses` - Course listing page
- `/` - Homepage (if it shows courses)

## Integration with Existing Code

The server actions have been integrated with your existing admin dashboard:

- **Admin Page**: Course visibility and publishing toggles now use server actions
- **Local State**: UI updates immediately while server actions run in background
- **Error Handling**: Proper error handling with user feedback
- **Loading States**: Loading indicators during server action execution

## Database Schema Requirements

The server actions expect a `courses` table with the following fields:
- `id` (primary key)
- `is_visible` (boolean)
- `is_published` (boolean)
- `updated_by` (foreign key to users table)
- `updated_at` (timestamp)

And a `users` table with:
- `id` (primary key)
- `is_admin` (boolean)

## Error Handling

Server actions throw errors for:
- Unauthenticated users
- Non-admin users
- Database operation failures
- Invalid course IDs

Handle errors in your UI components:

```typescript
try {
  await setCourseVisibility(courseId, true);
  // Success - update UI
} catch (error) {
  console.error('Failed to update course:', error);
  // Show error message to user
}
```

## Performance Considerations

- Server actions run on the server, reducing client-side bundle size
- Route revalidation ensures users see updated content immediately
- Database operations are optimized with proper indexing
- Admin checks are cached within the request lifecycle

## Future Enhancements

Potential improvements to consider:
- Batch operations for multiple courses
- Soft delete instead of hard delete
- Course versioning and rollback
- Advanced permission system (course-specific admins)
- Webhook notifications for course changes
