import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * POST /api/mentorship/end-session
 * 
 * Ends a live session (with permission check)
 * Only admins and authorized presenters can use this
 * 
 * Request body:
 * {
 *   "session_id": "uuid",
 *   "wallet_address": "string",
 *   "recording_url": "string" (optional)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { session_id, wallet_address, recording_url } = body;

    if (!session_id || !wallet_address) {
      return NextResponse.json(
        { error: 'Missing required fields: session_id, wallet_address' },
        { status: 400 }
      );
    }

    console.log('🛑 End session request:', { session_id, wallet_address });

    // First check if user is admin - admins have automatic access
    const { data: adminCheck } = await supabase
      .from('users')
      .select('is_admin')
      .eq('wallet_address', wallet_address)
      .single();

    let hasPermission = false;
    let permissionReason = '';

    if (adminCheck?.is_admin) {
      hasPermission = true;
      permissionReason = 'Admin access';
      console.log('✅ User is admin - granting automatic end-session access');
    } else {
      // Check permissions
      const { data: permissionData, error: permissionError } = await supabase
        .rpc('can_user_go_live', {
          p_wallet_address: wallet_address,
          p_session_id: session_id
        });

      if (permissionError) {
        console.error('❌ Permission check error:', permissionError);
        return NextResponse.json(
          { error: 'Permission check failed' },
          { status: 500 }
        );
      }

      const permission = permissionData?.[0];
      hasPermission = permission?.allowed || false;
      permissionReason = permission?.reason || 'Unknown';
    }
    
    if (!hasPermission) {
      console.warn('⛔ Permission denied:', permissionReason);
      return NextResponse.json(
        { 
          error: 'Permission denied',
          reason: permissionReason || 'You do not have permission to end this session'
        },
        { status: 403 }
      );
    }

    // End session using database function
    const { data: result, error: endError } = await supabase
      .rpc('end_session', {
        p_session_id: session_id,
        p_wallet_address: wallet_address,
        p_recording_url: recording_url
      });

    if (endError) {
      console.error('❌ Error ending session:', endError);
      return NextResponse.json(
        { error: 'Failed to end session' },
        { status: 500 }
      );
    }

    console.log('✅ Session ended successfully');

    return NextResponse.json({
      success: true,
      message: 'Session ended',
      ended_at: new Date().toISOString(),
      recording_url: recording_url
    });

  } catch (error) {
    console.error('💥 Error in end-session API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

