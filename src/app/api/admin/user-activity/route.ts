import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';        // keep secrets in Node, not Edge
export const dynamic = 'force-dynamic'; // avoid static optimization

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  
  return createClient(url, key, { 
    auth: { persistSession: false } 
  });
}

// Log user activity
export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const body = await req.json();
    const { 
      wallet_address, 
      activity_type, 
      profile_data, 
      course_data, 
      wallet_data, 
      achievement_data, 
      session_data, 
      metadata, 
      notes 
    } = body;

    if (!wallet_address || !activity_type) {
      return NextResponse.json({ 
        error: 'Missing required fields: wallet_address and activity_type' 
      }, { status: 400 });
    }

    // Validate activity type
    const validActivityTypes = [
      'profile_update', 'squad_assignment', 'wallet_connect', 'wallet_disconnect',
      'course_start', 'course_complete', 'course_approval', 'badge_earned',
      'exam_taken', 'login', 'logout', 'pfp_update', 'nft_verification'
    ];

    if (!validActivityTypes.includes(activity_type)) {
      return NextResponse.json({ 
        error: 'Invalid activity_type. Must be one of: ' + validActivityTypes.join(', ') 
      }, { status: 400 });
    }

    // Insert the activity log
    const { data, error } = await supabase
      .from('user_activity_logs')
      .insert({
        wallet_address,
        activity_type,
        user_agent: req.headers.get('user-agent'),
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
        profile_data,
        course_data,
        wallet_data,
        achievement_data,
        session_data,
        metadata,
        notes
      })
      .select();

    if (error) {
      console.error('Error logging user activity:', error);
      return NextResponse.json({ 
        error: 'Failed to log activity',
        details: error.message 
      }, { status: 500 });
    }

    console.log('User activity logged:', {
      wallet_address,
      activity_type,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({ 
      success: true, 
      message: 'User activity logged successfully',
      data 
    });

  } catch (error: any) {
    console.error('Error in user activity logging:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}

// Get user activity logs for admin dashboard
export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const wallet_address = searchParams.get('wallet_address');
    const activity_type = searchParams.get('activity_type');
    const squad = searchParams.get('squad');
    const course_id = searchParams.get('course_id');
    const display_name = searchParams.get('display_name');

    let query = supabase
      .from('user_activity_logs')
      .select('*')
      .order('activity_timestamp', { ascending: false })
      .range(offset, offset + limit - 1);

    // Add filters if provided
    if (wallet_address) {
      query = query.eq('wallet_address', wallet_address);
    }
    if (activity_type) {
      query = query.eq('activity_type', activity_type);
    }
    if (squad) {
      query = query.eq('squad', squad);
    }
    if (course_id) {
      query = query.eq('course_id', course_id);
    }
    if (display_name) {
      query = query.ilike('display_name', `%${display_name}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching user activity logs:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch activity logs',
        details: error.message 
      }, { status: 500 });
    }

    // Get total count for pagination
    const { count } = await supabase
      .from('user_activity_logs')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({ 
      success: true,
      data,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (offset + limit) < (count || 0)
      }
    });

  } catch (error: any) {
    console.error('Error fetching user activity logs:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}
