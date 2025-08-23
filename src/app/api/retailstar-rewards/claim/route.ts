import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseBrowser } from '@/lib/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    const { walletAddress, rewardId, userSquad } = await request.json();

    if (!walletAddress || !rewardId || !userSquad) {
      return NextResponse.json(
        { error: 'Missing required fields: walletAddress, rewardId, userSquad' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = getSupabaseBrowser();

    // Check if user already has this reward
    const { data: existingReward, error: existingError } = await supabase
      .from('user_retailstar_rewards')
      .select('*')
      .eq('wallet_address', walletAddress)
      .eq('reward_id', rewardId)
      .eq('status', 'active')
      .single();

    if (existingError && existingError.code !== 'PGRST116') {
      console.error('Error checking existing reward:', existingError);
      return NextResponse.json(
        { error: 'Failed to check existing reward' },
        { status: 500 }
      );
    }

    if (existingReward) {
      console.log('User already has this reward');
      return NextResponse.json(
        { error: 'User already has this reward' },
        { status: 409 }
      );
    }

    // Award the reward using the database function
    const { data: result, error } = await supabase.rpc('award_retailstar_reward', {
      p_wallet_address: walletAddress,
      p_reward_id: rewardId,
      p_metadata: {}, // No metadata for now
      p_expires_at: null // No expiration for now
    });

    if (error) {
      console.error('Error awarding reward:', error);
      return NextResponse.json(
        { error: 'Failed to award reward', details: error },
        { status: 500 }
      );
    }

    console.log('Reward awarded successfully, result:', result);

    // Get the awarded reward details
    const { data: rewardDetails, error: detailsError } = await supabase
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
      .eq('id', result)
      .single();

    if (detailsError) {
      console.error('Error getting reward details:', detailsError);
      // Still return success since the reward was awarded
      return NextResponse.json({
        success: true,
        rewardId: result,
        message: 'Reward claimed successfully!'
      });
    }

    return NextResponse.json({
      success: true,
      reward: rewardDetails,
      message: 'Reward claimed successfully!'
    });

  } catch (error) {
    console.error('Error in claim reward API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    );
  }
}

 