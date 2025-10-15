import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { session_id, student_wallet, student_name } = body;

    if (!session_id || !student_wallet) {
      return NextResponse.json(
        { error: 'Missing session_id or student_wallet' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Call database function to request permission
    const { data, error } = await supabase.rpc('request_to_speak', {
      p_session_id: session_id,
      p_student_wallet: student_wallet,
      p_student_name: student_name || `Student ${student_wallet.slice(0, 8)}...`
    });

    if (error) {
      console.error('❌ Error requesting permission:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    console.log('✅ Permission requested:', data);

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('💥 Error in permissions/request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

