import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/voice/join
 * Join a voice chat room
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

    // Use the database function to join the room
    const { data, error } = await supabase
      .rpc('join_voice_room', {
        p_room_id: room_id,
        p_wallet_address: wallet_address
      });

    if (error) {
      console.error('Error joining room:', error);
      return NextResponse.json(
        { error: 'Failed to join room', details: error.message },
        { status: 500 }
      );
    }

    if (!data || !data.success) {
      return NextResponse.json(
        { error: data?.error || 'Failed to join room' },
        { status: 400 }
      );
    }

    // Get updated room details with participants
    const { data: roomData } = await supabase
      .from('voice_rooms')
      .select(`
        *,
        voice_participants(wallet_address, display_name, status, is_speaking, is_muted, is_moderator, joined_at)
      `)
      .eq('id', room_id)
      .single();

    // Log activity
    try {
      await supabase
        .from('user_activity')
        .insert({
          wallet_address,
          activity_type: 'voice_room_joined',
          activity_data: {
            room_id,
            room_name: roomData?.room_name
          }
        });
    } catch (logError) {
      console.warn('Failed to log room join:', logError);
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully joined voice room',
      room: roomData
    });

  } catch (error) {
    console.error('Error in POST /api/voice/join:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

