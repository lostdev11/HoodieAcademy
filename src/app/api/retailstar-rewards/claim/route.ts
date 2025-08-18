import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Only create client if environment variables are available
const createSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase configuration is missing');
  }
  
  return createClient(supabaseUrl, supabaseKey);
};

export async function POST(request: NextRequest) {
  try {
    const { walletAddress, rewardId, metadata } = await request.json();

    if (!walletAddress || !rewardId) {
      return NextResponse.json(
        { error: 'Missing required fields: walletAddress, rewardId' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = createSupabaseClient();

    // Check if user already has this reward
    const { data: existingReward } = await supabase
      .from('user_retailstar_rewards')
      .select('*')
      .eq('wallet_address', walletAddress)
      .eq('reward_id', rewardId)
      .eq('status', 'active')
      .single();

    if (existingReward) {
      return NextResponse.json(
        { error: 'User already has this reward' },
        { status: 409 }
      );
    }

    // Award the reward using the database function
    const { data: result, error } = await supabase.rpc('award_retailstar_reward', {
      p_wallet_address: walletAddress,
      p_reward_id: rewardId,
      p_metadata: metadata || {},
      p_expires_at: null // No expiration for now
    });

    if (error) {
      console.error('Error awarding reward:', error);
      return NextResponse.json(
        { error: 'Failed to award reward' },
        { status: 500 }
      );
    }

    // Get the awarded reward details
    const { data: rewardDetails } = await supabase
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

    return NextResponse.json({
      success: true,
      reward: rewardDetails,
      message: 'Reward claimed successfully!'
    });

  } catch (error) {
    console.error('Error in claim reward API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('walletAddress');

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Missing walletAddress parameter' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = createSupabaseClient();

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