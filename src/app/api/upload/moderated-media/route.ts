import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@supabase/supabase-js';

// Validate environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase environment variables');
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Supabase Storage bucket name for moderated media
const STORAGE_BUCKET = 'moderated-media';

// Define allowed media types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
const ALLOWED_MEDIA_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];

// Size limits (in bytes)
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const walletAddress = formData.get('walletAddress') as string;
    const context = formData.get('context') as string || 'bounty_submission';
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!walletAddress || walletAddress.trim() === '') {
      return NextResponse.json({ 
        error: 'Wallet address is required. Please connect your wallet before uploading.' 
      }, { status: 400 });
    }

    // Validate file type
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    
    if (!isImage && !isVideo) {
      return NextResponse.json({ error: 'Only image and video files are allowed' }, { status: 400 });
    }

    // Validate against allowed types
    if (!ALLOWED_MEDIA_TYPES.includes(file.type)) {
      return NextResponse.json({ 
        error: `File type not allowed. Allowed types: ${ALLOWED_MEDIA_TYPES.join(', ')}` 
      }, { status: 400 });
    }

    // Validate file size
    const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;
    const maxSizeMB = Math.round(maxSize / (1024 * 1024));
    
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: `File size must be less than ${maxSizeMB}MB` 
      }, { status: 400 });
    }

    // Validate Supabase connection
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ 
        error: 'Server configuration error: Database not configured. Please contact support.' 
      }, { status: 500 });
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const filePath = `moderated/${fileName}`;
    
    // Convert file to buffer for upload
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Check if bucket exists before attempting upload
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) {
      console.error('Error listing buckets:', listError);
    } else {
      const bucketExists = buckets?.some(bucket => bucket.name === STORAGE_BUCKET);
      if (!bucketExists) {
        console.error(`Bucket '${STORAGE_BUCKET}' not found in Supabase Storage`);
        return NextResponse.json({ 
          error: `Storage bucket '${STORAGE_BUCKET}' not found. Please create the bucket in your Supabase project. See SUPABASE_STORAGE_SETUP.md for instructions.` 
        }, { status: 500 });
      }
    }

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.error('Error uploading to Supabase Storage:', uploadError);
      
      // Check for bucket not found error specifically
      const errorMessage = uploadError.message || String(uploadError);
      if (errorMessage.toLowerCase().includes('bucket not found') || 
          errorMessage.toLowerCase().includes('not found')) {
        return NextResponse.json({ 
          error: `Storage bucket '${STORAGE_BUCKET}' not found. Please create the bucket in your Supabase project. See SUPABASE_STORAGE_SETUP.md for instructions.` 
        }, { status: 500 });
      }
      
      return NextResponse.json({ 
        error: `Failed to upload file: ${errorMessage}` 
      }, { status: 500 });
    }

    // Get public URL from Supabase Storage
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;

    // Store media record in database for moderation
    const recordId = uuidv4();
    const { data: mediaRecord, error: dbError } = await supabase
      .from('moderated_images')
      .insert({
        id: recordId,
        filename: fileName,
        original_name: file.name,
        file_path: filePath,
        public_url: publicUrl,
        wallet_address: walletAddress,
        context: context,
        file_size: file.size,
        mime_type: file.type,
        status: 'pending_review',
        uploaded_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    console.log('Database insert result:', { mediaRecord, dbError });

    if (dbError) {
      console.error('Error saving media record:', dbError);
      // Clean up the file from storage if database save fails
      try {
        await supabase.storage
          .from(STORAGE_BUCKET)
          .remove([filePath]);
      } catch (cleanupError) {
        console.error('Error cleaning up file from storage:', cleanupError);
      }
      return NextResponse.json({ 
        error: `Failed to save media record: ${dbError.message || 'Database error'}` 
      }, { status: 500 });
    }
    
    // Determine media type from mime_type for response
    const mediaType = isImage ? 'image' : 'video';
    
    return NextResponse.json({
      success: true,
      id: mediaRecord.id,
      url: publicUrl,
      fileName: fileName,
      originalName: file.name,
      size: file.size,
      type: file.type,
      mediaType: mediaType,
      status: 'pending_review',
      message: `${isImage ? 'Image' : 'Video'} uploaded successfully and is pending admin review`
    });

  } catch (error) {
    console.error('Error uploading moderated media:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { 
        error: `Failed to upload media: ${errorMessage}`,
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending_review';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get media for moderation
    const { data: media, error } = await supabase
      .from('moderated_images')
      .select('*')
      .eq('status', status)
      .order('uploaded_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching moderated media:', error);
      return NextResponse.json({ error: 'Failed to fetch media' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      images: media || [],
      count: media?.length || 0
    });

  } catch (error) {
    console.error('Error in moderated media GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

