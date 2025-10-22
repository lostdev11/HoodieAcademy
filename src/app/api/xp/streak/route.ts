import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Initialize Supabase client
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase configuration missing');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

/**
 * GET /api/xp/streak?wallet=<wallet_address>
 * 
 * Get streak information for a user
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('wallet');

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    console.log('🔥 [STREAK] Getting streak for:', walletAddress.slice(0, 10) + '...');

    const supabase = getSupabaseClient();

    // Get comprehensive streak stats
    const { data, error } = await supabase
      .rpc('get_user_streak_stats', { p_wallet_address: walletAddress })
      .single();

    if (error) {
      console.error('❌ [STREAK] Error fetching streak:', error);
      return NextResponse.json(
        { error: 'Failed to fetch streak data', details: error.message },
        { status: 500 }
      );
    }

    const response = {
      walletAddress,
      currentStreak: data?.current_streak || 0,
      longestStreak: data?.longest_streak || 0,
      totalClaims: data?.total_claims || 0,
      lastClaimDate: data?.last_claim_date || null,
      hasActiveStreak: (data?.current_streak || 0) > 0
    };

    console.log('✅ [STREAK] Streak data:', response);

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ [STREAK] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

