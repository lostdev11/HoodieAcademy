import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * POST /api/mentorship/rsvp
 * 
 * RSVP to a mentorship session
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

    console.log('✅ Processing RSVP:', { session_id, wallet_address });

    // Call database function to handle RSVP
    const { data, error } = await supabase
      .rpc('rsvp_to_session', {
        p_session_id: session_id,
        p_wallet_address: wallet_address
      });

    if (error) {
      console.error('❌ Error creating RSVP:', error);
      return NextResponse.json(
        { error: 'Failed to create RSVP' },
        { status: 500 }
      );
    }

    console.log('✅ RSVP result:', data);
    return NextResponse.json(data);

  } catch (error) {
    console.error('💥 Error in RSVP API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/mentorship/rsvp
 * 
 * Cancel RSVP to a session
 * 
 * Request body:
 * {
 *   "session_id": "uuid",
 *   "wallet_address": "string"
 * }
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { session_id, wallet_address } = body;

    if (!session_id || !wallet_address) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('🗑️ Cancelling RSVP:', { session_id, wallet_address });

    // Update RSVP status to cancelled
    const { error } = await supabase
      .from('session_rsvps')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString()
      })
      .eq('session_id', session_id)
      .eq('wallet_address', wallet_address);

    if (error) {
      console.error('❌ Error cancelling RSVP:', error);
      return NextResponse.json(
        { error: 'Failed to cancel RSVP' },
        { status: 500 }
      );
    }

    // Decrement RSVP count
    await supabase
      .rpc('decrement', {
        table_name: 'mentorship_sessions',
        row_id: session_id,
        column_name: 'current_rsvps'
      });

    console.log('✅ RSVP cancelled');
    return NextResponse.json({
      success: true,
      message: 'RSVP cancelled'
    });

  } catch (error) {
    console.error('💥 Error cancelling RSVP:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

