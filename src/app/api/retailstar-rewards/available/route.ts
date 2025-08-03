import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { walletAddress, userSquad, submissionCount = 0, placement } = await request.json();

    if (!walletAddress || !userSquad) {
      return NextResponse.json(
        { error: 'Missing required fields: walletAddress, userSquad' },
        { status: 400 }
      );
    }

    // Get available rewards using the database function
    const { data: availableRewards, error } = await supabase.rpc('get_user_available_rewards', {
      p_wallet_address: walletAddress,
      p_user_squad: userSquad,
      p_submission_count: submissionCount,
      p_placement: placement
    });

    if (error) {
      console.error('Error getting available rewards:', error);
      return NextResponse.json(
        { error: 'Failed to get available rewards' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      rewards: availableRewards || []
    });

  } catch (error) {
    console.error('Error in get available rewards API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 