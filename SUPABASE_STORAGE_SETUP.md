# Supabase Storage Setup Guide

## Overview
The application now uses Supabase Storage instead of the local filesystem for file uploads. This is required for serverless environments like Vercel where the filesystem is read-only.

## Required Storage Buckets

You need to create the following buckets in your Supabase project:

### 1. `moderated-media` Bucket
- **Purpose**: Stores moderated images and videos (bounty submissions, etc.)
- **Public**: Yes (files need to be publicly accessible)
- **File size limit**: 100MB
- **Allowed MIME types**: 
  - Images: `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/avif`
  - Videos: `video/mp4`, `video/webm`, `video/quicktime`, `video/x-msvideo`

### 2. `bounty-images` Bucket
- **Purpose**: Stores bounty-related images
- **Public**: Yes
- **File size limit**: 10MB
- **Allowed MIME types**: `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/avif`

## Setup Instructions

### Option 1: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **New bucket**
4. Create each bucket with the following settings:

#### For `moderated-media`:
- **Name**: `moderated-media`
- **Public bucket**: ✅ Enabled
- **File size limit**: 104857600 (100MB)
- **Allowed MIME types**: 
  ```
  image/jpeg,image/png,image/gif,image/webp,image/avif,video/mp4,video/webm,video/quicktime,video/x-msvideo
  ```

#### For `bounty-images`:
- **Name**: `bounty-images`
- **Public bucket**: ✅ Enabled
- **File size limit**: 10485760 (10MB)
- **Allowed MIME types**: 
  ```
  image/jpeg,image/png,image/gif,image/webp,image/avif
  ```

### Option 2: Using SQL (Supabase SQL Editor)

Run the following SQL commands in your Supabase SQL Editor:

```sql
-- Create moderated-media bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'moderated-media',
  'moderated-media',
  true,
  104857600, -- 100MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif', 'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo']
);

-- Create bounty-images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'bounty-images',
  'bounty-images',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif']
);
```

### Option 3: Using Supabase CLI

```bash
# Create moderated-media bucket
supabase storage create moderated-media --public --file-size-limit 104857600

# Create bounty-images bucket
supabase storage create bounty-images --public --file-size-limit 10485760
```

## Storage Policies

After creating the buckets, you need to set up storage policies to allow uploads. Run these in the Supabase SQL Editor:

```sql
-- Policy for moderated-media: Allow authenticated users to upload
CREATE POLICY "Allow authenticated uploads to moderated-media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'moderated-media');

-- Policy for moderated-media: Allow public read access
CREATE POLICY "Allow public read access to moderated-media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'moderated-media');

-- Policy for bounty-images: Allow authenticated users to upload
CREATE POLICY "Allow authenticated uploads to bounty-images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'bounty-images');

-- Policy for bounty-images: Allow public read access
CREATE POLICY "Allow public read access to bounty-images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'bounty-images');
```

**Note**: Since the API routes use the service role key, they have full access. The policies above are for client-side uploads if needed in the future.

## Verification

After setup, test the upload functionality:

1. Try uploading an image through the bounty submission form
2. Check that the file appears in the Supabase Storage dashboard
3. Verify that the public URL works and the image is accessible

## Troubleshooting

### Error: "Bucket not found"
- Ensure the bucket names match exactly: `moderated-media` and `bounty-images`
- Check that buckets are created in the correct Supabase project

### Error: "Permission denied"
- Verify that the buckets are set to public
- Check that storage policies are correctly configured
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is set in your environment variables

### Error: "File size too large"
- Check the file size limits on the buckets
- Verify the file being uploaded is within the limits

## Migration Notes

- Old files stored in `/public/uploads/` will not be accessible after this change
- If you have existing files, you'll need to migrate them to Supabase Storage
- The `public_url` field in the `moderated_images` table will now contain Supabase Storage URLs instead of local paths


