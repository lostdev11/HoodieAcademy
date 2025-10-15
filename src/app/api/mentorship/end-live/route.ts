import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { session_id, wallet_address } = body;

    console.log('🛑 End live request:', { session_id, wallet_address });

    if (!session_id || !wallet_address) {
      return NextResponse.json(
        { error: 'Missing session_id or wallet_address' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get session to verify ownership
    const { data: session, error: sessionError } = await supabase
      .from('mentorship_sessions')
      .select('*')
      .eq('id', session_id)
      .single();

    if (sessionError || !session) {
      console.error('❌ Session not found:', sessionError);
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Check if user is host or admin
    const { data: user } = await supabase
      .from('users')
      .select('is_admin')
      .eq('wallet_address', wallet_address)
      .single();

    const isAdmin = user?.is_admin || false;
    const isHost = session.mentor_wallet === wallet_address;

    if (!isHost && !isAdmin) {
      console.error('❌ Not authorized to end this session');
      return NextResponse.json(
        { error: 'Not authorized. Only the host or admin can end the session.' },
        { status: 403 }
      );
    }

    // End the session
    const { error: updateError } = await supabase
      .from('mentorship_sessions')
      .update({
        status: 'completed',
        ended_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', session_id);

    if (updateError) {
      console.error('❌ Error ending session:', updateError);
      return NextResponse.json(
        { error: 'Failed to end session' },
        { status: 500 }
      );
    }

    // Clear all student permissions for this session
    const { error: permError } = await supabase
      .from('session_student_permissions')
      .update({
        status: 'revoked',
        can_speak: false,
        can_show_video: false,
        updated_at: new Date().toISOString()
      })
      .eq('session_id', session_id)
      .eq('status', 'approved');

    if (permError) {
      console.warn('⚠️ Warning: Could not revoke student permissions:', permError);
      // Don't fail the request, just log it
    }

    console.log('✅ Session ended successfully');

    return NextResponse.json({
      success: true,
      message: 'Session ended successfully',
      session_id,
      ended_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('💥 Error in end-live:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

