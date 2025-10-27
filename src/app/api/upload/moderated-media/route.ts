import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
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

    // Generate unique filename
    const fileExtension = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'moderated');
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filePath = join(uploadsDir, fileName);
    
    await writeFile(filePath, buffer);

    // Store media record in database for moderation
    const { data: mediaRecord, error: dbError } = await supabase
      .from('moderated_images')
      .insert({
        id: uuidv4(),
        filename: fileName,
        original_name: file.name,
        file_path: filePath,
        public_url: `/uploads/moderated/${fileName}`,
        wallet_address: walletAddress,
        context: context,
        file_size: file.size,
        mime_type: file.type,
        media_type: isImage ? 'image' : 'video',
        status: 'pending_review',
        uploaded_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    console.log('Database insert result:', { mediaRecord, dbError });

    if (dbError) {
      console.error('Error saving media record:', dbError);
      // Clean up the file if database save fails
      try {
        await unlink(filePath);
      } catch (cleanupError) {
        console.error('Error cleaning up file:', cleanupError);
      }
      return NextResponse.json({ error: 'Failed to save media record' }, { status: 500 });
    }

    // Return the public URL and record ID
    const publicUrl = `/uploads/moderated/${fileName}`;
    
    return NextResponse.json({
      success: true,
      id: mediaRecord.id,
      url: publicUrl,
      fileName: fileName,
      originalName: file.name,
      size: file.size,
      type: file.type,
      mediaType: isImage ? 'image' : 'video',
      status: 'pending_review',
      message: `${isImage ? 'Image' : 'Video'} uploaded successfully and is pending admin review`
    });

  } catch (error) {
    console.error('Error uploading moderated media:', error);
    return NextResponse.json(
      { error: 'Failed to upload media' },
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

