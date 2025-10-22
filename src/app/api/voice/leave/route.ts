import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/voice/leave
 * Leave a voice chat room
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { room_id, wallet_address } = body;

    if (!room_id || !wallet_address) {
      return NextResponse.json(
        { error: 'room_id and wallet_address are required' },
        { status: 400 }
      );
    }

    // Use the database function to leave the room
    const { data, error } = await supabase
      .rpc('leave_voice_room', {
        p_room_id: room_id,
        p_wallet_address: wallet_address
      });

    if (error) {
      console.error('Error leaving room:', error);
      return NextResponse.json(
        { error: 'Failed to leave room', details: error.message },
        { status: 500 }
      );
    }

    if (!data || !data.success) {
      return NextResponse.json(
        { error: data?.error || 'Failed to leave room' },
        { status: 400 }
      );
    }

    // Check if room is now empty and should be ended
    const { data: participants } = await supabase
      .from('voice_participants')
      .select('id')
      .eq('room_id', room_id)
      .eq('status', 'active');

    // If no active participants, mark room as inactive
    if (!participants || participants.length === 0) {
      await supabase
        .from('voice_rooms')
        .update({
          is_active: false,
          ended_at: new Date().toISOString()
        })
        .eq('id', room_id);
    }

    // Log activity
    try {
      await supabase
        .from('user_activity')
        .insert({
          wallet_address,
          activity_type: 'voice_room_left',
          activity_data: {
            room_id
          }
        });
    } catch (logError) {
      console.warn('Failed to log room leave:', logError);
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully left voice room'
    });

  } catch (error) {
    console.error('Error in POST /api/voice/leave:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

