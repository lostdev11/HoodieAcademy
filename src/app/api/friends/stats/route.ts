import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * GET /api/friends/stats
 * Get friend statistics for a user
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

    // Get followers count
    const { count: followersCount } = await supabase
      .from('friends')
      .select('*', { count: 'exact', head: true })
      .eq('following_wallet', walletAddress);

    // Get following count
    const { count: followingCount } = await supabase
      .from('friends')
      .select('*', { count: 'exact', head: true })
      .eq('follower_wallet', walletAddress);

    return NextResponse.json({
      success: true,
      stats: {
        followers: followersCount || 0,
        following: followingCount || 0
      }
    });
  } catch (error) {
    console.error('Error in GET /api/friends/stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

