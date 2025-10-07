import { NextRequest, NextResponse } from 'next/server';
import { migrateModeratedImagesTables, checkModeratedImagesTables, getModeratedImagesStats } from '@/lib/database/migrate-moderated-images';
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

    console.log('🚀 Starting moderated images migration...');
    
    // Run the migration
    const result = await migrateModeratedImagesTables();
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Migration completed successfully',
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error in migration API:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check admin permissions
    const admin = await isAdminForUser(supabase);
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Check if tables exist
    const tableCheck = await checkModeratedImagesTables();
    
    // Get statistics if tables exist
    let stats = null;
    if (tableCheck.exists) {
      const statsResult = await getModeratedImagesStats();
      if (statsResult.success) {
        stats = statsResult.statistics;
      }
    }

    return NextResponse.json({
      success: true,
      tablesExist: tableCheck.exists,
      statistics: stats,
      message: tableCheck.exists ? 'Tables are ready' : 'Tables need to be created'
    });

  } catch (error) {
    console.error('Error in migration status API:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
