import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { verifyAdminAccess } from '@/lib/admin-utils';

export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'Bulk import courses endpoint',
    usage: 'POST with courses array and walletAddress'
  });
}

export async function POST(request: NextRequest) {
  try {
    if (!getSupabaseAdmin()) {
      console.error('Bulk import: Admin client unavailable');
      return NextResponse.json({ error: 'Server configuration error: Admin client unavailable' }, { status: 500 });
    }
    
    // Get the request data
    const { courses, walletAddress } = await request.json();
    
    if (!courses || !Array.isArray(courses) || courses.length === 0) {
      console.error('Bulk import: Invalid input');
      return NextResponse.json({ error: 'Invalid input: Expected an array of courses' }, { status: 400 });
    }
    
    if (!walletAddress) {
      console.error('Bulk import: Wallet address required');
      return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
    }

    // Verify admin access using the utility function
    const adminCheck = await verifyAdminAccess(walletAddress);
    
    if (!adminCheck.isAdmin) {
      console.error('Bulk import: Admin access required for wallet', walletAddress);
      return NextResponse.json({ error: adminCheck.error || 'Forbidden: Admin access required' }, { status: 403 });
    }

    console.log('Bulk import: Admin verified, proceeding with import of', courses.length, 'courses');

    // Proceed with bulk import using adminSupabase
    const { data, error } = await getSupabaseAdmin()
      .from('courses')
      .insert(courses)
      .select();

    if (error) {
      console.error('Bulk import: Database error:', error.message, error.details);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('Bulk import: Successfully imported', data.length, 'courses');

    return NextResponse.json({ 
      success: true, 
      message: `Successfully imported ${courses.length} courses`,
      data 
    }, { status: 200 });

  } catch (error) {
    console.error('Bulk import error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
