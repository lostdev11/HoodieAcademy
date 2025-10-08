import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  console.log('🔍 [ANNOUNCEMENTS API] GET request received');
  
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const category = searchParams.get('category');

    console.log('🔍 [ANNOUNCEMENTS API] Query params:', { includeInactive, category });

    let query = supabase
      .from('academy_announcements')
      .select('*')
      .order('posted_at', { ascending: false });

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    if (category) {
      query = query.eq('category', category);
    }

    console.log('🔍 [ANNOUNCEMENTS API] Executing query...');
    const { data, error } = await query;
    console.log('🔍 [ANNOUNCEMENTS API] Query result:', { dataCount: data?.length, error });

    if (error) {
      console.error('❌ [ANNOUNCEMENTS API] Error fetching announcements:', error);
      return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 });
    }

    console.log('✅ [ANNOUNCEMENTS API] Returning success response');
    return NextResponse.json({ success: true, announcements: data || [] });
  } catch (error) {
    console.error('❌ [ANNOUNCEMENTS API] Error in GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  console.log('🔍 [ANNOUNCEMENTS API] POST request received');
  
  try {
    const body = await request.json();
    const { title, content, category, is_expandable, expires_at, created_by } = body;

    console.log('🔍 [ANNOUNCEMENTS API] Request body:', { title, content, category, is_expandable, expires_at, created_by });

    if (!title || !content) {
      console.log('❌ [ANNOUNCEMENTS API] Missing required fields');
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    console.log('🔍 [ANNOUNCEMENTS API] Inserting announcement...');
    const { data, error } = await supabase
      .from('academy_announcements')
      .insert({
        title,
        content,
        category: category || 'general',
        is_expandable: is_expandable !== undefined ? is_expandable : true,
        expires_at,
        created_by,
        is_active: true,
        posted_at: new Date().toISOString()
      })
      .select()
      .single();

    console.log('🔍 [ANNOUNCEMENTS API] Insert result:', { data, error });

    if (error) {
      console.error('❌ [ANNOUNCEMENTS API] Error creating announcement:', error);
      return NextResponse.json({ error: 'Failed to create announcement' }, { status: 500 });
    }

    console.log('✅ [ANNOUNCEMENTS API] Announcement created successfully');
    return NextResponse.json({ success: true, announcement: data });
  } catch (error) {
    console.error('❌ [ANNOUNCEMENTS API] Error in POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, title, content, category, is_expandable, is_active, expires_at } = body;

    if (!id) {
      return NextResponse.json({ error: 'Announcement ID is required' }, { status: 400 });
    }

    const updateData: any = { updated_at: new Date().toISOString() };
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (category !== undefined) updateData.category = category;
    if (is_expandable !== undefined) updateData.is_expandable = is_expandable;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (expires_at !== undefined) updateData.expires_at = expires_at;

    const { data, error } = await supabase
      .from('academy_announcements')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating announcement:', error);
      return NextResponse.json({ error: 'Failed to update announcement' }, { status: 500 });
    }

    return NextResponse.json({ success: true, announcement: data });
  } catch (error) {
    console.error('Error in announcements PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Announcement ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('academy_announcements')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting announcement:', error);
      return NextResponse.json({ error: 'Failed to delete announcement' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Announcement deleted successfully' });
  } catch (error) {
    console.error('Error in announcements DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
