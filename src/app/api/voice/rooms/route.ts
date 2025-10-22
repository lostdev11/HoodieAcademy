import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/voice/rooms
 * Get all active voice chat rooms
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const squad = searchParams.get('squad');
    const wallet = searchParams.get('wallet');

    // Use the database function to get rooms with participant counts
    const { data: rooms, error } = await supabase
      .rpc('get_active_voice_rooms', { p_squad: squad });

    if (error) {
      console.error('Error fetching voice rooms:', error);
      return NextResponse.json(
        { error: 'Failed to fetch voice rooms', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      rooms: rooms || [],
      total: rooms?.length || 0
    });

  } catch (error) {
    console.error('Error in GET /api/voice/rooms:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/voice/rooms
 * Create a new voice chat room
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      room_name,
      room_description,
      created_by,
      squad,
      room_type = 'casual',
      max_participants = 10,
      is_public = true,
      tags = []
    } = body;

    // Validate required fields
    if (!room_name || !created_by) {
      return NextResponse.json(
        { error: 'room_name and created_by are required' },
        { status: 400 }
      );
    }

    // Verify user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('wallet_address, display_name')
      .eq('wallet_address', created_by)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Create the room
    const { data: room, error: roomError } = await supabase
      .from('voice_rooms')
      .insert({
        room_name,
        room_description,
        created_by,
        squad,
        room_type,
        max_participants,
        is_public,
        tags,
        is_active: true,
        started_at: new Date().toISOString()
      })
      .select()
      .single();

    if (roomError) {
      console.error('Error creating room:', roomError);
      return NextResponse.json(
        { error: 'Failed to create room', details: roomError.message },
        { status: 500 }
      );
    }

    // Auto-join creator to the room
    await supabase
      .from('voice_participants')
      .insert({
        room_id: room.id,
        wallet_address: created_by,
        display_name: user.display_name,
        status: 'active',
        is_moderator: true
      });

    // Log activity
    try {
      await supabase
        .from('user_activity')
        .insert({
          wallet_address: created_by,
          activity_type: 'voice_room_created',
          activity_data: {
            room_id: room.id,
            room_name,
            room_type
          }
        });
    } catch (logError) {
      console.warn('Failed to log room creation:', logError);
    }

    return NextResponse.json({
      success: true,
      message: 'Voice room created successfully',
      room
    });

  } catch (error) {
    console.error('Error in POST /api/voice/rooms:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/voice/rooms
 * Update a voice room (close, update settings, etc.)
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { room_id, wallet_address, is_active, room_name, room_description } = body;

    if (!room_id || !wallet_address) {
      return NextResponse.json(
        { error: 'room_id and wallet_address are required' },
        { status: 400 }
      );
    }

    // Verify user is room creator or admin
    const { data: room, error: roomError } = await supabase
      .from('voice_rooms')
      .select('created_by')
      .eq('id', room_id)
      .single();

    if (roomError || !room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    const { data: user } = await supabase
      .from('users')
      .select('is_admin')
      .eq('wallet_address', wallet_address)
      .single();

    const isAuthorized = room.created_by === wallet_address || user?.is_admin;

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Not authorized to update this room' },
        { status: 403 }
      );
    }

    // Build update object
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (is_active !== undefined) {
      updateData.is_active = is_active;
      if (!is_active) {
        updateData.ended_at = new Date().toISOString();
      }
    }

    if (room_name) updateData.room_name = room_name;
    if (room_description) updateData.room_description = room_description;

    // Update room
    const { data: updatedRoom, error: updateError } = await supabase
      .from('voice_rooms')
      .update(updateData)
      .eq('id', room_id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update room', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Room updated successfully',
      room: updatedRoom
    });

  } catch (error) {
    console.error('Error in PATCH /api/voice/rooms:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

