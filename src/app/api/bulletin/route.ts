import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const squadId = searchParams.get('squad');
    const type = searchParams.get('type'); // 'global' or 'squad'

    let query = supabase
      .from('bulletin_messages')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters
    if (type === 'global') {
      query = query.eq('type', 'global');
    } else if (type === 'squad' && squadId) {
      query = query.eq('type', 'squad').eq('squad_id', squadId);
    } else if (!type) {
      // If no type specified, get both global and squad messages
      if (squadId) {
        query = query.or(`type.eq.global,and(type.eq.squad,squad_id.eq.${squadId})`);
      } else {
        query = query.eq('type', 'global');
      }
    }

    const { data: messages, error } = await query;

    if (error) {
      console.error('Error fetching bulletin messages:', error);
      return NextResponse.json(
        { error: 'Failed to fetch bulletin messages', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(messages || []);
  } catch (error) {
    console.error('Error in bulletin API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, body: messageBody, priority, type, squad_id, author } = body;

    // Validate required fields
    if (!title || !messageBody || !priority || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: title, body, priority, type' },
        { status: 400 }
      );
    }

    // If type is squad, squad_id is required
    if (type === 'squad' && !squad_id) {
      return NextResponse.json(
        { error: 'squad_id is required for squad messages' },
        { status: 400 }
      );
    }

    const { data: message, error } = await supabase
      .from('bulletin_messages')
      .insert({
        title,
        body: messageBody,
        priority,
        type,
        squad_id: type === 'squad' ? squad_id : null,
        author: author || 'Hoodie Academy Admin'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating bulletin message:', error);
      return NextResponse.json(
        { error: 'Failed to create bulletin message', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error('Error in bulletin POST API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
