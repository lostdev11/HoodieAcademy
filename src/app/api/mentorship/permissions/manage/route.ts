import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { permission_id, host_wallet, action, can_speak, can_show_video } = body;

    if (!permission_id || !host_wallet || !action) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!['approve', 'deny', 'revoke'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be: approve, deny, or revoke' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Call database function to manage permission
    const { data, error } = await supabase.rpc('manage_student_permission', {
      p_permission_id: permission_id,
      p_host_wallet: host_wallet,
      p_action: action,
      p_can_speak: can_speak !== false, // Default true
      p_can_show_video: can_show_video !== false // Default true
    });

    if (error) {
      console.error('❌ Error managing permission:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    console.log(`✅ Permission ${action}d:`, data);

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('💥 Error in permissions/manage:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

