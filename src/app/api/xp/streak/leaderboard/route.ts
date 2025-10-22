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
 * GET /api/xp/streak/leaderboard?limit=10
 * 
 * Get streak leaderboard
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    console.log('🏆 [STREAK LEADERBOARD] Fetching top', limit);

    const supabase = getSupabaseClient();

    // Get streak leaderboard
    const { data, error } = await supabase
      .rpc('get_streak_leaderboard', { p_limit: limit });

    if (error) {
      console.error('❌ [STREAK LEADERBOARD] Error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch streak leaderboard', details: error.message },
        { status: 500 }
      );
    }

    const leaderboard = data.map((entry: any) => ({
      walletAddress: entry.wallet_address,
      displayName: entry.display_name,
      currentStreak: entry.current_streak,
      longestStreak: entry.longest_streak,
      totalClaims: entry.total_claims,
      lastClaimDate: entry.last_claim_date
    }));

    console.log('✅ [STREAK LEADERBOARD] Found', leaderboard.length, 'entries');

    return NextResponse.json({
      leaderboard,
      count: leaderboard.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [STREAK LEADERBOARD] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

