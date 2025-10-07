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
      imageIds, 
      action, // 'approve', 'reject', 'delete'
      reason,
      adminWallet 
    } = body;

    if (!imageIds || !Array.isArray(imageIds) || imageIds.length === 0) {
      return NextResponse.json({ error: 'Image IDs array is required' }, { status: 400 });
    }

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    let newStatus: string;
    let shouldDeleteFiles = false;

    switch (action) {
      case 'approve':
        newStatus = 'approved';
        break;
      case 'reject':
        newStatus = 'rejected';
        shouldDeleteFiles = true;
        break;
      case 'delete':
        newStatus = 'deleted';
        shouldDeleteFiles = true;
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Get the image records
    const { data: imageRecords, error: fetchError } = await supabase
      .from('moderated_images')
      .select('*')
      .in('id', imageIds);

    if (fetchError) {
      console.error('Error fetching image records:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch image records' }, { status: 500 });
    }

    if (!imageRecords || imageRecords.length === 0) {
      return NextResponse.json({ error: 'No images found' }, { status: 404 });
    }

    // Update all image records
    const { data: updatedRecords, error: updateError } = await supabase
      .from('moderated_images')
      .update({
        status: newStatus,
        reviewed_by: adminWallet,
        reviewed_at: new Date().toISOString(),
        review_reason: reason || null,
        updated_at: new Date().toISOString()
      })
      .in('id', imageIds)
      .select();

    if (updateError) {
      console.error('Error updating image records:', updateError);
      return NextResponse.json({ error: 'Failed to update image records' }, { status: 500 });
    }

    // Delete physical files if needed
    let deletedFiles = 0;
    if (shouldDeleteFiles) {
      for (const imageRecord of imageRecords) {
        try {
          const filePath = join(process.cwd(), 'public', imageRecord.public_url);
          await unlink(filePath);
          deletedFiles++;
          console.log('✅ File deleted:', filePath);
        } catch (deleteError) {
          console.error('Error deleting file:', deleteError);
          // Continue with other files even if one fails
        }
      }
    }

    // Log the bulk moderation actions
    const moderationLogs = imageIds.map(imageId => ({
      image_id: imageId,
      action: action,
      reason: reason || null,
      admin_wallet: adminWallet,
      created_at: new Date().toISOString()
    }));

    await supabase
      .from('moderation_logs')
      .insert(moderationLogs);

    return NextResponse.json({
      success: true,
      action: action,
      processedCount: updatedRecords?.length || 0,
      deletedFiles: deletedFiles,
      message: `Successfully ${action}d ${updatedRecords?.length || 0} images`
    });

  } catch (error) {
    console.error('Error in bulk image moderation:', error);
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
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('moderated_images')
      .select(`
        *,
        users:wallet_address (
          display_name,
          squad
        )
      `)
      .order('uploaded_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: images, error } = await query;

    if (error) {
      console.error('Error fetching images:', error);
      return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 });
    }

    // Get statistics
    const { data: stats } = await supabase
      .from('moderated_images')
      .select('status')
      .then(result => {
        if (result.data) {
          const stats = result.data.reduce((acc: any, img: any) => {
            acc[img.status] = (acc[img.status] || 0) + 1;
            return acc;
          }, {});
          return { data: stats };
        }
        return { data: {} };
      });

    return NextResponse.json({
      success: true,
      images: images || [],
      count: images?.length || 0,
      statistics: stats || {}
    });

  } catch (error) {
    console.error('Error in bulk actions GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
