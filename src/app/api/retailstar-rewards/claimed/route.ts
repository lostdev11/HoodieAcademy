import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('walletAddress');

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Missing walletAddress parameter' },
        { status: 400 }
      );
    }

    // Get user's claimed rewards
    const { data: userRewards, error } = await supabase
      .from('user_retailstar_rewards')
      .select(`
        *,
        retailstar_rewards (
          name,
          description,
          type,
          rarity
        )
      `)
      .eq('wallet_address', walletAddress)
      .eq('status', 'active')
      .order('claimed_at', { ascending: false });

    if (error) {
      console.error('Error getting user rewards:', error);
      return NextResponse.json(
        { error: 'Failed to get user rewards' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      rewards: userRewards || []
    });

  } catch (error) {
    console.error('Error in get user rewards API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
