import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * POST /api/mentorship/go-live
 * 
 * Makes a session go live (with permission check)
 * Only admins and authorized presenters can use this
 * 
 * Request body:
 * {
 *   "session_id": "uuid",
 *   "wallet_address": "string"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { session_id, wallet_address } = body;

    if (!session_id || !wallet_address) {
      return NextResponse.json(
        { error: 'Missing required fields: session_id, wallet_address' },
        { status: 400 }
      );
    }

    console.log('🎬 Go live request:', { session_id, wallet_address });

    // First check if user is admin - admins have automatic access
    const { data: adminCheck } = await supabase
      .from('users')
      .select('is_admin')
      .eq('wallet_address', wallet_address)
      .single();

    let hasPermission = false;
    let permissionReason = '';
    let permissionRole = 'user';

    if (adminCheck?.is_admin) {
      hasPermission = true;
      permissionReason = 'Admin access';
      permissionRole = 'admin';
      console.log('✅ User is admin - granting automatic go-live access');
    } else {
      // Check mentorship permissions using database function
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
      permissionRole = permission?.role || 'presenter';
    }
    
    if (!hasPermission) {
      console.warn('⛔ Permission denied:', permissionReason);
      return NextResponse.json(
        { 
          error: 'Permission denied',
          reason: permissionReason || 'You do not have permission to go live',
          allowed: false
        },
        { status: 403 }
      );
    }

    console.log('✅ Permission granted:', permissionReason);

    // Go live using database function
    const { data: result, error: goLiveError } = await supabase
      .rpc('go_live_session', {
        p_session_id: session_id,
        p_wallet_address: wallet_address
      });

    if (goLiveError) {
      console.error('❌ Error going live:', goLiveError);
      return NextResponse.json(
        { error: 'Failed to go live' },
        { status: 500 }
      );
    }

    console.log('🎉 Session is now live!', result);

    // Create video room if using native streaming
    const { data: sessionData } = await supabase
      .from('mentorship_sessions')
      .select('stream_platform')
      .eq('id', session_id)
      .single();

    let videoRoomUrl = null;
    if (sessionData?.stream_platform === 'native') {
      // Create video room
      const roomRes = await fetch(`${request.nextUrl.origin}/api/mentorship/video-room`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: session_id,
          session_title: 'Live Session'
        })
      });

      if (roomRes.ok) {
        const roomData = await roomRes.json();
        videoRoomUrl = roomData.room_url;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Session is now live!',
      session_id: session_id,
      went_live_at: new Date().toISOString(),
      video_room_url: videoRoomUrl,
      permission_role: permissionRole
    });

  } catch (error) {
    console.error('💥 Error in go-live API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

