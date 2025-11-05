import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * GET /api/friends
 * Get friends list for a user
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('wallet');
    const type = searchParams.get('type') || 'followers'; // 'followers' or 'following'

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Get friends based on type
    let friendsData: any;
    let error: any;
    
    if (type === 'following') {
      // Get users that this wallet follows
      const { data, error: fetchError } = await supabase
        .from('friends')
        .select('*')
        .eq('follower_wallet', walletAddress)
        .order('created_at', { ascending: false });
      
      friendsData = data;
      error = fetchError;
      
      // Enrich with user data
      if (friendsData && !error) {
        const walletAddresses = friendsData.map((f: any) => f.following_wallet);
        const { data: users } = await supabase
          .from('users')
          .select('wallet_address, display_name, squad, profile_picture, level, total_xp')
          .in('wallet_address', walletAddresses);
        
        friendsData = friendsData.map((friend: any) => ({
          ...friend,
          following_user: users?.find((u: any) => u.wallet_address === friend.following_wallet)
        }));
      }
    } else {
      // Get users that follow this wallet
      const { data, error: fetchError } = await supabase
        .from('friends')
        .select('*')
        .eq('following_wallet', walletAddress)
        .order('created_at', { ascending: false });
      
      friendsData = data;
      error = fetchError;
      
      // Enrich with user data
      if (friendsData && !error) {
        const walletAddresses = friendsData.map((f: any) => f.follower_wallet);
        const { data: users } = await supabase
          .from('users')
          .select('wallet_address, display_name, squad, profile_picture, level, total_xp')
          .in('wallet_address', walletAddresses);
        
        friendsData = friendsData.map((friend: any) => ({
          ...friend,
          follower_user: users?.find((u: any) => u.wallet_address === friend.follower_wallet)
        }));
      }
    }
    
    const data = friendsData;

    if (error) {
      console.error('Error fetching friends:', error);
      return NextResponse.json(
        { error: 'Failed to fetch friends', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      friends: data || [],
      count: data?.length || 0
    });
  } catch (error) {
    console.error('Error in GET /api/friends:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/friends
 * Add a friend/follow relationship
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { followerWallet, followingWallet } = body;

    if (!followerWallet || !followingWallet) {
      return NextResponse.json(
        { error: 'Both follower and following wallets are required' },
        { status: 400 }
      );
    }

    if (followerWallet === followingWallet) {
      return NextResponse.json(
        { error: 'Cannot follow yourself' },
        { status: 400 }
      );
    }

    // Check if relationship already exists
    const { data: existing, error: checkError } = await supabase
      .from('friends')
      .select('id')
      .eq('follower_wallet', followerWallet)
      .eq('following_wallet', followingWallet)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Already following this user' },
        { status: 400 }
      );
    }

    // Create the friendship
    const { data, error } = await supabase
      .from('friends')
      .insert({
        follower_wallet: followerWallet,
        following_wallet: followingWallet
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating friendship:', error);
      return NextResponse.json(
        { error: 'Failed to create friendship', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      friendship: data
    });
  } catch (error) {
    console.error('Error in POST /api/friends:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/friends
 * Remove a friend/follow relationship
 */
export async function DELETE(request: NextRequest) {
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

    // Delete the friendship
    const { error } = await supabase
      .from('friends')
      .delete()
      .eq('follower_wallet', followerWallet)
      .eq('following_wallet', followingWallet);

    if (error) {
      console.error('Error deleting friendship:', error);
      return NextResponse.json(
        { error: 'Failed to delete friendship', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true
    });
  } catch (error) {
    console.error('Error in DELETE /api/friends:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

