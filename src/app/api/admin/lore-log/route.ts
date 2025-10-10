import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// GET /api/admin/lore-log - Get all lore log entries
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    const { data: loreEntries, error } = await supabase
      .from('lore_log')
      .select('*')
      .order('entry_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching lore log entries:', error);
      return NextResponse.json({ error: 'Failed to fetch lore log entries' }, { status: 500 });
    }

    // Get total count
    const { count, error: countError } = await supabase
      .from('lore_log')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Error fetching lore log count:', countError);
    }

    return NextResponse.json({
      loreEntries: loreEntries || [],
      totalCount: count || 0
    });
  } catch (error) {
    console.error('Error in GET /api/admin/lore-log:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/lore-log - Create new lore log entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, entry_date, admin_wallet } = body;

    if (!title || !content || !entry_date || !admin_wallet) {
      return NextResponse.json(
        { error: 'title, content, entry_date, and admin_wallet are required' },
        { status: 400 }
      );
    }

    // Check if admin
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('wallet_address', admin_wallet)
      .single();

    if (adminError || !adminUser?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Create new lore log entry
    const { data: loreEntry, error: insertError } = await supabase
      .from('lore_log')
      .insert({
        title,
        content,
        entry_date: new Date(entry_date).toISOString(),
        created_by: admin_wallet,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating lore log entry:', insertError);
      return NextResponse.json({ error: 'Failed to create lore log entry' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      loreEntry
    });
  } catch (error) {
    console.error('Error in POST /api/admin/lore-log:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/admin/lore-log - Update lore log entry
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, title, content, entry_date, admin_wallet } = body;

    if (!id || !title || !content || !entry_date || !admin_wallet) {
      return NextResponse.json(
        { error: 'id, title, content, entry_date, and admin_wallet are required' },
        { status: 400 }
      );
    }

    // Check if admin
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('wallet_address', admin_wallet)
      .single();

    if (adminError || !adminUser?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Update lore log entry
    const { data: loreEntry, error: updateError } = await supabase
      .from('lore_log')
      .update({
        title,
        content,
        entry_date: new Date(entry_date).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating lore log entry:', updateError);
      return NextResponse.json({ error: 'Failed to update lore log entry' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      loreEntry
    });
  } catch (error) {
    console.error('Error in PUT /api/admin/lore-log:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/lore-log - Delete lore log entry
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const admin_wallet = searchParams.get('admin_wallet');

    if (!id || !admin_wallet) {
      return NextResponse.json({ error: 'id and admin_wallet are required' }, { status: 400 });
    }

    // Check if admin
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('wallet_address', admin_wallet)
      .single();

    if (adminError || !adminUser?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Delete lore log entry
    const { error: deleteError } = await supabase
      .from('lore_log')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting lore log entry:', deleteError);
      return NextResponse.json({ error: 'Failed to delete lore log entry' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/admin/lore-log:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
