import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * GET /api/friends/check
 * Check if a user is following another user
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const followerWallet = searchParams.get('follower');
    const followingWallet = searchParams.get('following');

    if (!followerWallet || !followingWallet) {
      return NextResponse.json(
        { error: 'Both follower and following wallets are required' },
        { status: 400 }
      );
    }

    // Check if friendship exists
    const { data, error } = await supabase
      .from('friends')
      .select('id, created_at')
      .eq('follower_wallet', followerWallet)
      .eq('following_wallet', followingWallet)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking friendship:', error);
      return NextResponse.json(
        { error: 'Failed to check friendship status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      isFollowing: !!data,
      relationship: data
    });
  } catch (error) {
    console.error('Error in GET /api/friends/check:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

