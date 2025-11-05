import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
 * GET /api/leaderboard
 * Get ranked list of users by XP
 * Query params:
 *   - limit: Number of users to return (default: 100, max: 500)
 *   - offset: Pagination offset (default: 0)
 *   - squad: Filter by squad (optional)
 *   - wallet: Get specific user's rank (optional)
 *   - timeframe: 'all-time' | 'monthly' | 'weekly' (default: 'all-time')
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500);
    const offset = parseInt(searchParams.get('offset') || '0');
    const squad = searchParams.get('squad');
    const walletAddress = searchParams.get('wallet');
    const timeframe = searchParams.get('timeframe') || 'all-time';

    const supabase = getSupabaseClient();

    // If requesting specific user's rank
    if (walletAddress) {
      return getUserRank(supabase, walletAddress, squad);
    }

    // Build base query
    let query = supabase
      .from('users')
      .select('wallet_address, display_name, total_xp, level, squad, created_at, updated_at')
      .order('total_xp', { ascending: false });

    // Apply filters
    if (squad) {
      query = query.eq('squad', squad);
    }

    // Time-based filtering (if you track XP with timestamps)
    if (timeframe === 'weekly') {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      query = query.gte('updated_at', oneWeekAgo);
    } else if (timeframe === 'monthly') {
      const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      query = query.gte('updated_at', oneMonthAgo);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: users, error } = await query;

    if (error) {
      console.error('Error fetching leaderboard:', error);
      return NextResponse.json(
        { error: 'Failed to fetch leaderboard' },
        { status: 500 }
      );
    }

    // Calculate proper ranks based on XP position
    // First, get all users to calculate ranks accurately (respecting filters)
    let allUsersQuery = supabase
      .from('users')
      .select('total_xp')
      .order('total_xp', { ascending: false });

    if (squad) {
      allUsersQuery = allUsersQuery.eq('squad', squad);
    }

    // Apply same timeframe filter
    if (timeframe === 'weekly') {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      allUsersQuery = allUsersQuery.gte('updated_at', oneWeekAgo);
    } else if (timeframe === 'monthly') {
      const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      allUsersQuery = allUsersQuery.gte('updated_at', oneMonthAgo);
    }

    const { data: allUsers } = await allUsersQuery;
    
    // Create a map of XP to rank (handling ties correctly)
    const xpToRank: Map<number, number> = new Map();
    if (allUsers && allUsers.length > 0) {
      let currentRank = 1;
      let previousXP = allUsers[0].total_xp || 0;
      xpToRank.set(previousXP, currentRank);
      
      for (let i = 1; i < allUsers.length; i++) {
        const currentXP = allUsers[i].total_xp || 0;
        if (currentXP < previousXP) {
          currentRank = i + 1;
          previousXP = currentXP;
        }
        // For users with same XP, use the same rank
        if (!xpToRank.has(currentXP)) {
          xpToRank.set(currentXP, currentRank);
        }
      }
    }

    // Add rank to each user based on their actual XP position
    const rankedUsers = users?.map((user) => {
      const rank = xpToRank.get(user.total_xp) || 1;
      return {
        ...user,
        rank,
        xpToNextLevel: 1000 - (user.total_xp % 1000),
        progressToNextLevel: ((user.total_xp % 1000) / 1000) * 100
      };
    }) || [];

    // Get total user count for pagination
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      success: true,
      leaderboard: rankedUsers,
      pagination: {
        limit,
        offset,
        total: totalUsers || 0,
        hasMore: (offset + limit) < (totalUsers || 0)
      },
      timeframe,
      squad: squad || 'all'
    });

  } catch (error) {
    console.error('Error in GET /api/leaderboard:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Get a specific user's rank and nearby users
 */
async function getUserRank(supabase: any, walletAddress: string, squad?: string | null) {
  try {
    // Get user's data
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('wallet_address, display_name, total_xp, level, squad, created_at')
      .eq('wallet_address', walletAddress)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Calculate user's rank
    let rankQuery = supabase
      .from('users')
      .select('total_xp', { count: 'exact', head: true })
      .gt('total_xp', user.total_xp);

    if (squad) {
      rankQuery = rankQuery.eq('squad', squad);
    }

    const { count } = await rankQuery;
    const userRank = (count || 0) + 1;

    // Get users above and below this user (context)
    let contextQuery = supabase
      .from('users')
      .select('wallet_address, display_name, total_xp, level, squad')
      .order('total_xp', { ascending: false });

    if (squad) {
      contextQuery = contextQuery.eq('squad', squad);
    }

    // Get 5 users above and 5 below
    const startRank = Math.max(1, userRank - 5);
    const endRank = userRank + 5;

    contextQuery = contextQuery.range(startRank - 1, endRank - 1);

    const { data: nearbyUsers } = await contextQuery;

    // Add ranks to nearby users
    const rankedNearbyUsers = nearbyUsers?.map((u: any, idx: number) => ({
      ...u,
      rank: startRank + idx,
      isCurrentUser: u.wallet_address === walletAddress
    })) || [];

    return NextResponse.json({
      success: true,
      user: {
        ...user,
        rank: userRank,
        xpToNextLevel: 1000 - (user.total_xp % 1000),
        progressToNextLevel: ((user.total_xp % 1000) / 1000) * 100
      },
      nearbyUsers: rankedNearbyUsers,
      squad: squad || 'all'
    });

  } catch (error) {
    console.error('Error getting user rank:', error);
    return NextResponse.json(
      { error: 'Failed to get user rank' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/leaderboard/stats
 * Get overall leaderboard statistics
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();

    // Get total stats
    const { data: stats } = await supabase
      .rpc('get_leaderboard_stats')
      .single();

    // If RPC doesn't exist, calculate manually
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    const { data: topUser } = await supabase
      .from('users')
      .select('total_xp, display_name')
      .order('total_xp', { ascending: false })
      .limit(1)
      .single();

    const { data: avgXP } = await supabase
      .from('users')
      .select('total_xp');

    const averageXP = avgXP 
      ? avgXP.reduce((sum, u) => sum + (u.total_xp || 0), 0) / avgXP.length 
      : 0;

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers: totalUsers || 0,
        topUser: topUser ? {
          name: topUser.display_name,
          xp: topUser.total_xp
        } : null,
        averageXP: Math.round(averageXP),
        totalXPAwarded: avgXP ? avgXP.reduce((sum, u) => sum + (u.total_xp || 0), 0) : 0
      }
    });

  } catch (error) {
    console.error('Error in POST /api/leaderboard:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
