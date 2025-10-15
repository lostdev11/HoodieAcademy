import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * GET /api/mentorship/sessions/[id]
 * 
 * Get a specific session by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    console.log('📅 Fetching session:', id);

    // Get session details
    const { data: session, error: sessionError } = await supabase
      .from('mentorship_sessions')
      .select('*')
      .eq('id', id)
      .single();

    if (sessionError || !session) {
      console.error('❌ Session not found:', id);
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Get RSVP count and questions
    const { data: rsvps } = await supabase
      .from('session_rsvps')
      .select('*')
      .eq('session_id', id)
      .eq('status', 'confirmed');

    const { data: questions } = await supabase
      .from('session_questions')
      .select('*')
      .eq('session_id', id)
      .eq('is_approved', true)
      .order('upvotes', { ascending: false });

    console.log('✅ Session found:', {
      id,
      rsvps: rsvps?.length || 0,
      questions: questions?.length || 0
    });

    return NextResponse.json({
      session,
      rsvp_count: rsvps?.length || 0,
      questions: questions || []
    });

  } catch (error) {
    console.error('💥 Error fetching session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/mentorship/sessions/[id]
 * 
 * Update a session (Admin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const updates = await request.json();

    console.log('✏️ Updating session:', id, updates);

    const { data, error } = await supabase
      .from('mentorship_sessions')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating session:', error);
      return NextResponse.json(
        { error: 'Failed to update session' },
        { status: 500 }
      );
    }

    console.log('✅ Session updated:', id);
    return NextResponse.json({
      success: true,
      session: data
    });

  } catch (error) {
    console.error('💥 Error updating session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/mentorship/sessions/[id]
 * 
 * Delete a session (Admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    console.log('🗑️ Deleting session:', id);

    const { error } = await supabase
      .from('mentorship_sessions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Error deleting session:', error);
      return NextResponse.json(
        { error: 'Failed to delete session' },
        { status: 500 }
      );
    }

    console.log('✅ Session deleted:', id);
    return NextResponse.json({
      success: true,
      message: 'Session deleted'
    });

  } catch (error) {
    console.error('💥 Error deleting session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

