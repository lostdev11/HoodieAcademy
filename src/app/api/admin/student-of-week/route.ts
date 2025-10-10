import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// GET /api/admin/student-of-week - Get current student of the week
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('student_of_week')
      .select(`
        *,
        user:users!student_of_week_user_id_fkey (
          wallet_address,
          display_name,
          squad_id,
          total_xp,
          created_at
        )
      `)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching student of the week:', error);
      return NextResponse.json({ error: 'Failed to fetch student of the week' }, { status: 500 });
    }

    return NextResponse.json({ studentOfWeek: data });
  } catch (error) {
    console.error('Error in GET /api/admin/student-of-week:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/student-of-week - Set new student of the week
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, reason, admin_wallet } = body;

    if (!user_id || !reason || !admin_wallet) {
      return NextResponse.json(
        { error: 'user_id, reason, and admin_wallet are required' },
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

    // Verify user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, display_name, squad_id')
      .eq('id', user_id)
      .single();

    if (userError) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create new student of the week entry
    const { data: studentOfWeek, error: insertError } = await supabase
      .from('student_of_week')
      .insert({
        user_id,
        reason,
        set_by: admin_wallet,
        created_at: new Date().toISOString()
      })
      .select(`
        *,
        user:users!student_of_week_user_id_fkey (
          wallet_address,
          display_name,
          squad_id,
          total_xp,
          created_at
        )
      `)
      .single();

    if (insertError) {
      console.error('Error creating student of the week:', insertError);
      return NextResponse.json({ error: 'Failed to set student of the week' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      studentOfWeek
    });
  } catch (error) {
    console.error('Error in POST /api/admin/student-of-week:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/student-of-week - Remove current student of the week
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const admin_wallet = searchParams.get('admin_wallet');

    if (!admin_wallet) {
      return NextResponse.json({ error: 'admin_wallet is required' }, { status: 400 });
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

    // Delete current student of the week
    const { error: deleteError } = await supabase
      .from('student_of_week')
      .delete()
      .order('created_at', { ascending: false })
      .limit(1);

    if (deleteError) {
      console.error('Error deleting student of the week:', deleteError);
      return NextResponse.json({ error: 'Failed to remove student of the week' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/admin/student-of-week:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
