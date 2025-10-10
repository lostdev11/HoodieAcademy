import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// GET /api/admin/milestones - Get all academy milestones
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    const { data: milestones, error } = await supabase
      .from('academy_milestones')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching milestones:', error);
      return NextResponse.json({ error: 'Failed to fetch milestones' }, { status: 500 });
    }

    // Get total count
    const { count, error: countError } = await supabase
      .from('academy_milestones')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Error fetching milestones count:', countError);
    }

    return NextResponse.json({
      milestones: milestones || [],
      totalCount: count || 0
    });
  } catch (error) {
    console.error('Error in GET /api/admin/milestones:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/milestones - Create new milestone
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, progress, target_date, admin_wallet } = body;

    if (!title || !description || progress === undefined || !target_date || !admin_wallet) {
      return NextResponse.json(
        { error: 'title, description, progress, target_date, and admin_wallet are required' },
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

    // Create new milestone
    const { data: milestone, error: insertError } = await supabase
      .from('academy_milestones')
      .insert({
        title,
        description,
        progress: Math.min(100, Math.max(0, parseInt(progress))), // Ensure progress is between 0-100
        target_date: new Date(target_date).toISOString(),
        created_by: admin_wallet,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating milestone:', insertError);
      return NextResponse.json({ error: 'Failed to create milestone' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      milestone
    });
  } catch (error) {
    console.error('Error in POST /api/admin/milestones:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/admin/milestones - Update milestone
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, title, description, progress, target_date, admin_wallet } = body;

    if (!id || !title || !description || progress === undefined || !target_date || !admin_wallet) {
      return NextResponse.json(
        { error: 'id, title, description, progress, target_date, and admin_wallet are required' },
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

    // Update milestone
    const { data: milestone, error: updateError } = await supabase
      .from('academy_milestones')
      .update({
        title,
        description,
        progress: Math.min(100, Math.max(0, parseInt(progress))), // Ensure progress is between 0-100
        target_date: new Date(target_date).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating milestone:', updateError);
      return NextResponse.json({ error: 'Failed to update milestone' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      milestone
    });
  } catch (error) {
    console.error('Error in PUT /api/admin/milestones:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/milestones - Delete milestone
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

    // Delete milestone
    const { error: deleteError } = await supabase
      .from('academy_milestones')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting milestone:', deleteError);
      return NextResponse.json({ error: 'Failed to delete milestone' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/admin/milestones:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
