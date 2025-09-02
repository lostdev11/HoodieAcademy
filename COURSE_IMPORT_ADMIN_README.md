# Course Import Feature - Admin Dashboard

## Overview

The Hoodie Academy Admin Dashboard now includes a **Bulk Import Courses** feature that allows administrators to easily import all courses from the `public/courses` directory into the database with a single click.

## Features

### 1. Bulk Import Button
- **Location**: Admin Dashboard → Quick Actions section
- **Function**: Imports all JSON course files from `public/courses/` directory
- **Status**: Shows "Importing..." during process with loading state

### 2. Course Management Page Import
- **Location**: Admin Dashboard → Courses tab
- **Function**: Same bulk import functionality with progress tracking
- **Features**: Progress bar, real-time status updates

## How to Use

### Method 1: Quick Actions (Recommended)
1. Navigate to `/admin` dashboard
2. Scroll to the "Quick Actions" section
3. Click the **"Bulk Import Courses"** button
4. Confirm the import action
5. Wait for completion notification

### Method 2: Courses Management Page
1. Navigate to `/admin/courses`
2. Click the **"Bulk Import"** button in the header
3. Confirm the import action
4. Monitor progress with the progress bar
5. View completion results

## What Gets Imported

The system automatically processes all `.json` files in the `public/courses/` directory (excluding `sample-course.json`) and:

- **Creates new courses** if they don't exist
- **Updates existing courses** if they already exist (based on slug)
- **Maps course data** with proper defaults:
  - Level: `beginner` (default)
  - Access: `free` (default)
  - Visibility: `true` (default)
  - Published: `false` (default - requires manual approval)
  - Sort Order: `0` (default)

## Course Data Mapping

The import system automatically maps course properties:

| JSON Field | Database Field | Default Value |
|------------|----------------|---------------|
| `title` | `title` | Required |
| `description` | `description` | Empty string |
| `emoji` | `emoji` | 📚 |
| `badge` | `badge` | Empty string |
| `squad` | `squad` | Mapped from JSON |
| `level` | `level` | `beginner` |
| `access` | `access` | `free` |
| `category` | `category` | `general` |
| `totalLessons` | `totalLessons` | `0` |

## Squad Mappings

The system automatically maps squad names:
- `"Creators"` → `"creators"`
- `"Decoders"` → `"decoders"`
- `"Raiders"` → `"raiders"`
- `"Rangers"` → `"rangers"`

## After Import

1. **Review imported courses** in the admin dashboard
2. **Adjust visibility** using the toggle switches
3. **Set publish status** for courses you want live
4. **Configure sort order** for proper display
5. **Verify course data** matches expectations

## Error Handling

The import process includes comprehensive error handling:
- **Individual course failures** don't stop the entire import
- **Detailed error logging** for troubleshooting
- **Success/failure counts** in completion summary
- **Rollback protection** - existing courses are preserved

## API Endpoint

The bulk import uses the `/api/admin/bulk-import-courses` endpoint:
- **GET**: Returns count of available courses
- **POST**: Executes the bulk import process
- **Authentication**: Requires admin privileges
- **Rate Limiting**: None (intended for admin use)

## Troubleshooting

### Common Issues

1. **"Courses directory not found"**
   - Ensure `public/courses/` directory exists
   - Check file permissions

2. **"Import failed"**
   - Verify admin authentication
   - Check browser console for detailed errors
   - Ensure database connection is working

3. **"Unauthorized" error**
   - Verify user has admin privileges
   - Check if logged in to admin account

### Manual Import Alternative

If the bulk import fails, you can still use the existing manual methods:
- **Individual course creation** via the "Add Course" form
- **SQL import scripts** in the root directory
- **Browser console scripts** for debugging

## Security Notes

- **Admin-only access** - requires `is_admin: true` in users table
- **Input validation** - all course data is validated before insertion
- **SQL injection protection** - uses parameterized queries
- **File system access** - limited to `public/courses/` directory only

## Performance

- **Batch processing** - courses are processed sequentially to avoid overwhelming the database
- **Progress tracking** - real-time updates during import
- **Cache invalidation** - automatically refreshes course data after import
- **Optimized queries** - uses efficient database operations

## Support

For issues with the course import feature:
1. Check the browser console for error messages
2. Verify admin privileges and authentication
3. Ensure course JSON files are properly formatted
4. Check database connection and permissions
