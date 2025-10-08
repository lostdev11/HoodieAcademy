import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    let query = supabase
      .from('council_notices')
      .select('*')
      .order('created_at', { ascending: false });

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching council notices:', error);
      return NextResponse.json({ error: 'Failed to fetch council notices' }, { status: 500 });
    }

    return NextResponse.json({ success: true, notices: data || [] });
  } catch (error) {
    console.error('Error in council notices GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, directive_date, priority, expires_at, created_by } = body;

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('council_notices')
      .insert({
        title,
        content,
        directive_date,
        priority: priority || 'normal',
        expires_at,
        created_by,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating council notice:', error);
      return NextResponse.json({ error: 'Failed to create council notice' }, { status: 500 });
    }

    return NextResponse.json({ success: true, notice: data });
  } catch (error) {
    console.error('Error in council notices POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, title, content, directive_date, priority, is_active, expires_at } = body;

    if (!id) {
      return NextResponse.json({ error: 'Notice ID is required' }, { status: 400 });
    }

    const updateData: any = { updated_at: new Date().toISOString() };
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (directive_date !== undefined) updateData.directive_date = directive_date;
    if (priority !== undefined) updateData.priority = priority;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (expires_at !== undefined) updateData.expires_at = expires_at;

    const { data, error } = await supabase
      .from('council_notices')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating council notice:', error);
      return NextResponse.json({ error: 'Failed to update council notice' }, { status: 500 });
    }

    return NextResponse.json({ success: true, notice: data });
  } catch (error) {
    console.error('Error in council notices PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Notice ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('council_notices')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting council notice:', error);
      return NextResponse.json({ error: 'Failed to delete council notice' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Notice deleted successfully' });
  } catch (error) {
    console.error('Error in council notices DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

