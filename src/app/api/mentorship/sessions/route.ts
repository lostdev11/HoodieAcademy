import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * GET /api/mentorship/sessions
 * 
 * Get upcoming or past mentorship sessions
 * 
 * Query params:
 * - type: 'upcoming' | 'past' (default: 'upcoming')
 * - squad: filter by squad (optional)
 * - limit: number of sessions (default: 10)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'upcoming';
    const squad = searchParams.get('squad');
    const limit = parseInt(searchParams.get('limit') || '10');

    console.log('📅 Fetching mentorship sessions:', { type, squad, limit });

    if (type === 'upcoming') {
      // Get upcoming sessions
      const { data, error } = await supabase
        .rpc('get_upcoming_sessions', {
          p_limit: limit,
          p_squad: squad
        });

      if (error) {
        console.error('❌ Error fetching upcoming sessions:', error);
        return NextResponse.json(
          { error: 'Failed to fetch upcoming sessions' },
          { status: 500 }
        );
      }

      console.log('✅ Found upcoming sessions:', data?.length || 0);
      return NextResponse.json({ sessions: data || [] });

    } else if (type === 'past') {
      // Get past sessions
      const { data, error } = await supabase
        .rpc('get_past_sessions', {
          p_limit: limit,
          p_squad: squad
        });

      if (error) {
        console.error('❌ Error fetching past sessions:', error);
        return NextResponse.json(
          { error: 'Failed to fetch past sessions' },
          { status: 500 }
        );
      }

      console.log('✅ Found past sessions:', data?.length || 0);
      return NextResponse.json({ sessions: data || [] });

    } else {
      return NextResponse.json(
        { error: 'Invalid type parameter. Use "upcoming" or "past"' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('💥 Error in sessions API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/mentorship/sessions
 * 
 * Create a new mentorship session (Admin only)
 * 
 * Request body:
 * {
 *   "title": "string",
 *   "description": "string",
 *   "mentor_name": "string",
 *   "scheduled_date": "ISO datetime",
 *   "duration_minutes": number,
 *   "session_type": "live_qa" | "workshop" | "office_hours" | "ama",
 *   "topic_tags": ["tag1", "tag2"],
 *   "stream_platform": "zoom" | "youtube" | "twitch" | "discord",
 *   "stream_url": "string",
 *   "max_attendees": number (optional)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      mentor_name,
      mentor_wallet,
      scheduled_date,
      duration_minutes = 60,
      session_type = 'live_qa',
      topic_tags = [],
      squad_filter,
      stream_platform,
      stream_url,
      registration_url,
      max_attendees,
      created_by
    } = body;

    // Validate required fields
    if (!title || !mentor_name || !scheduled_date) {
      return NextResponse.json(
        { error: 'Missing required fields: title, mentor_name, scheduled_date' },
        { status: 400 }
      );
    }

    console.log('📝 Creating new mentorship session:', { title, mentor_name, scheduled_date });

    // Insert session
    const { data, error } = await supabase
      .from('mentorship_sessions')
      .insert({
        title,
        description,
        mentor_name,
        mentor_wallet,
        scheduled_date,
        duration_minutes,
        session_type,
        topic_tags,
        squad_filter,
        stream_platform,
        stream_url,
        registration_url,
        max_attendees,
        created_by,
        status: 'scheduled',
        is_published: true
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating session:', error);
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      );
    }

    console.log('✅ Session created:', data.id);
    return NextResponse.json({
      success: true,
      session: data
    }, { status: 201 });

  } catch (error) {
    console.error('💥 Error creating session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

