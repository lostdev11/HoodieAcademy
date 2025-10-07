import { NextRequest, NextResponse } from 'next/server';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { createClient } from '@supabase/supabase-js';
import { isAdminForUser } from '@/lib/admin';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Check admin permissions
    const admin = await isAdminForUser(supabase);
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { 
      imageId, 
      action, // 'approve', 'reject', 'delete'
      reason,
      adminWallet 
    } = body;

    if (!imageId || !action) {
      return NextResponse.json({ error: 'Image ID and action are required' }, { status: 400 });
    }

    // Get the image record
    const { data: imageRecord, error: fetchError } = await supabase
      .from('moderated_images')
      .select('*')
      .eq('id', imageId)
      .single();

    if (fetchError || !imageRecord) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    let newStatus: string;
    let shouldDeleteFile = false;

    switch (action) {
      case 'approve':
        newStatus = 'approved';
        break;
      case 'reject':
        newStatus = 'rejected';
        shouldDeleteFile = true;
        break;
      case 'delete':
        newStatus = 'deleted';
        shouldDeleteFile = true;
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Update the image record
    const { data: updatedRecord, error: updateError } = await supabase
      .from('moderated_images')
      .update({
        status: newStatus,
        reviewed_by: adminWallet,
        reviewed_at: new Date().toISOString(),
        review_reason: reason || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', imageId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating image record:', updateError);
      return NextResponse.json({ error: 'Failed to update image record' }, { status: 500 });
    }

    // Delete the physical file if rejected or deleted
    if (shouldDeleteFile) {
      try {
        const filePath = join(process.cwd(), 'public', imageRecord.public_url);
        await unlink(filePath);
        console.log('✅ File deleted:', filePath);
      } catch (deleteError) {
        console.error('Error deleting file:', deleteError);
        // Don't fail the request if file deletion fails
      }
    }

    // Log the moderation action
    await supabase
      .from('moderation_logs')
      .insert({
        image_id: imageId,
        action: action,
        reason: reason || null,
        admin_wallet: adminWallet,
        created_at: new Date().toISOString()
      });

    return NextResponse.json({
      success: true,
      image: updatedRecord,
      action: action,
      message: `Image ${action}d successfully`
    });

  } catch (error) {
    console.error('Error in image moderation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check admin permissions
    const admin = await isAdminForUser(supabase);
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending_review';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get images for moderation with user info
    const { data: images, error } = await supabase
      .from('moderated_images')
      .select(`
        *,
        users:wallet_address (
          display_name,
          squad
        )
      `)
      .eq('status', status)
      .order('uploaded_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching images for moderation:', error);
      return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      images: images || [],
      count: images?.length || 0
    });

  } catch (error) {
    console.error('Error in moderation GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
