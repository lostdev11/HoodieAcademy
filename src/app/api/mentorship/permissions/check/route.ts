import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const session_id = searchParams.get('session_id');
    const student_wallet = searchParams.get('student_wallet');

    if (!session_id || !student_wallet) {
      return NextResponse.json(
        { error: 'Missing session_id or student_wallet' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Call database function to check permission
    const { data, error } = await supabase.rpc('check_student_permission', {
      p_session_id: session_id,
      p_student_wallet: student_wallet
    });

    if (error) {
      console.error('❌ Error checking permission:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      permissions: data
    });

  } catch (error) {
    console.error('💥 Error in permissions/check:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

