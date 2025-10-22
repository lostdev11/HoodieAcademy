import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/voice/messages
 * Get messages for a voice room
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const room_id = searchParams.get('room_id');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!room_id) {
      return NextResponse.json(
        { error: 'room_id is required' },
        { status: 400 }
      );
    }

    const { data: messages, error } = await supabase
      .from('voice_messages')
      .select(`
        *,
        users!inner(display_name, level, squad)
      `)
      .eq('room_id', room_id)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching messages:', error);
      return NextResponse.json(
        { error: 'Failed to fetch messages', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      messages: messages || [],
      total: messages?.length || 0
    });

  } catch (error) {
    console.error('Error in GET /api/voice/messages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/voice/messages
 * Send a message in a voice room
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { room_id, wallet_address, content, message_type = 'text' } = body;

    if (!room_id || !wallet_address || !content) {
      return NextResponse.json(
        { error: 'room_id, wallet_address, and content are required' },
        { status: 400 }
      );
    }

    // Verify user is in the room
    const { data: participant } = await supabase
      .from('voice_participants')
      .select('status')
      .eq('room_id', room_id)
      .eq('wallet_address', wallet_address)
      .single();

    if (!participant || participant.status !== 'active') {
      return NextResponse.json(
        { error: 'You must be in the room to send messages' },
        { status: 403 }
      );
    }

    // Create the message
    const { data: message, error: messageError } = await supabase
      .from('voice_messages')
      .insert({
        room_id,
        wallet_address,
        content,
        message_type
      })
      .select(`
        *,
        users!inner(display_name, level, squad)
      `)
      .single();

    if (messageError) {
      console.error('Error creating message:', messageError);
      return NextResponse.json(
        { error: 'Failed to send message', details: messageError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message
    });

  } catch (error) {
    console.error('Error in POST /api/voice/messages:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

