import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getSupabaseClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[PreviewLookupAPI] Missing Supabase environment configuration');
    throw new Error('Server configuration error');
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);

    const email = searchParams.get('email');
    const walletAddress = searchParams.get('wallet_address');

    if (!email && !walletAddress) {
      return NextResponse.json(
        { error: 'email or wallet_address is required' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('preview_submissions')
      .select('*')
      .order('submitted_at', { ascending: false })
      .limit(1);

    if (email) {
      query = query.eq('email', email);
    }

    if (walletAddress) {
      query = query.eq('wallet_address', walletAddress);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      console.error('[PreviewLookupAPI:GET] Failed to lookup preview submission:', error);
      return NextResponse.json(
        { error: 'Failed to lookup preview submission' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      submission: data ?? null,
    });
  } catch (error) {
    console.error('[PreviewLookupAPI:GET] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


