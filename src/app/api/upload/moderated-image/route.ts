import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 });
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 });
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

    // Store image record in database for moderation
    const { data: imageRecord, error: dbError } = await supabase
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
        status: 'pending_review',
        uploaded_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    console.log('Database insert result:', { imageRecord, dbError });

    if (dbError) {
      console.error('Error saving image record:', dbError);
      // Clean up the file if database save fails
      try {
        await unlink(filePath);
      } catch (cleanupError) {
        console.error('Error cleaning up file:', cleanupError);
      }
      return NextResponse.json({ error: 'Failed to save image record' }, { status: 500 });
    }

    // Return the public URL and record ID
    const publicUrl = `/uploads/moderated/${fileName}`;
    
    return NextResponse.json({
      success: true,
      id: imageRecord.id,
      url: publicUrl,
      fileName: fileName,
      originalName: file.name,
      size: file.size,
      type: file.type,
      status: 'pending_review',
      message: 'Image uploaded successfully and is pending admin review'
    });

  } catch (error) {
    console.error('Error uploading moderated image:', error);
    return NextResponse.json(
      { error: 'Failed to upload image' },
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

    // Get images for moderation
    const { data: images, error } = await supabase
      .from('moderated_images')
      .select('*')
      .eq('status', status)
      .order('uploaded_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching moderated images:', error);
      return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      images: images || [],
      count: images?.length || 0
    });

  } catch (error) {
    console.error('Error in moderated images GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
