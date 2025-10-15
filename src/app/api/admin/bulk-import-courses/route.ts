import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Force dynamic rendering to avoid build-time issues
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'Bulk import courses endpoint',
    usage: 'POST with courses array and walletAddress'
  });
}

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    // Get the request data
    const { courses, walletAddress } = await request.json();
    
    if (!courses || !Array.isArray(courses) || courses.length === 0) {
      return NextResponse.json({ error: 'Invalid input: Expected an array of courses' }, { status: 400 });
    }
    
    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
    }

    // Verify admin access
    const { data: userData } = await adminClient
      .from('users')
      .select('is_admin, admin')
      .eq('wallet_address', walletAddress)
      .single();
    
    if (!userData || (!userData.is_admin && !userData.admin)) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Proceed with bulk import
    const { data, error } = await adminClient
      .from('courses')
      .insert(courses)
      .select();

    if (error) {
      console.error('Bulk import: Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

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
