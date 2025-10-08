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
    const latest = searchParams.get('latest') === 'true';

    let query = supabase
      .from('academy_spotlight')
      .select('*')
      .order('featured_at', { ascending: false });

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    if (latest) {
      query = query.limit(1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching spotlights:', error);
      return NextResponse.json({ error: 'Failed to fetch spotlights' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      spotlights: data || [],
      spotlight: latest && data?.length ? data[0] : null
    });
  } catch (error) {
    console.error('Error in spotlight GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { quote, author, author_title, author_squad, author_image, created_by } = body;

    if (!quote || !author) {
      return NextResponse.json({ error: 'Quote and author are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('academy_spotlight')
      .insert({
        quote,
        author,
        author_title,
        author_squad,
        author_image,
        created_by,
        is_active: true,
        featured_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating spotlight:', error);
      return NextResponse.json({ error: 'Failed to create spotlight' }, { status: 500 });
    }

    return NextResponse.json({ success: true, spotlight: data });
  } catch (error) {
    console.error('Error in spotlight POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, quote, author, author_title, author_squad, author_image, is_active } = body;

    if (!id) {
      return NextResponse.json({ error: 'Spotlight ID is required' }, { status: 400 });
    }

    const updateData: any = { updated_at: new Date().toISOString() };
    if (quote !== undefined) updateData.quote = quote;
    if (author !== undefined) updateData.author = author;
    if (author_title !== undefined) updateData.author_title = author_title;
    if (author_squad !== undefined) updateData.author_squad = author_squad;
    if (author_image !== undefined) updateData.author_image = author_image;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data, error } = await supabase
      .from('academy_spotlight')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating spotlight:', error);
      return NextResponse.json({ error: 'Failed to update spotlight' }, { status: 500 });
    }

    return NextResponse.json({ success: true, spotlight: data });
  } catch (error) {
    console.error('Error in spotlight PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Spotlight ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('academy_spotlight')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting spotlight:', error);
      return NextResponse.json({ error: 'Failed to delete spotlight' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Spotlight deleted successfully' });
  } catch (error) {
    console.error('Error in spotlight DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

