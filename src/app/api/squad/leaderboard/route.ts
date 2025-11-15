import { NextRequest, NextResponse } from 'next/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getSquadEmoji, normalizeSquadName } from '@/lib/squad-utils';

export const dynamic = 'force-dynamic';

type Database = Record<string, never>;

function getSupabaseClient(): SupabaseClient<Database> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase configuration missing');
  }
  
  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

async function fetchUserXpMap(
  supabase: SupabaseClient<Database>,
  walletAddresses: string[]
) {
  const uniqueWallets = Array.from(new Set(walletAddresses)).filter(Boolean);

  if (uniqueWallets.length === 0) {
    return new Map<string, { totalXP: number; level: number }>();
  }

  const { data, error } = await supabase
    .from('user_xp')
    .select('wallet_address, total_xp, level')
    .in('wallet_address', uniqueWallets);

  if (error) {
    console.error('❌ [Squad Leaderboard] Failed to fetch user_xp fallback data:', error);
    return new Map();
  }

  return new Map(
    data?.map((row) => [
      row.wallet_address,
      {
        totalXP: row.total_xp || 0,
        level: row.level || 1
      }
    ]) ?? []
  );
}

/**
 * GET /api/squad/leaderboard
 * Get squad rankings and leaderboard
 * Query params:
 *   - limit: Number of squads to return (default: 10)
 *   - includeMembers: Include top members for each squad (default: false)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const includeMembers = searchParams.get('includeMembers') === 'true';

    const supabase = getSupabaseClient();

    const USERS_SELECT =
      'wallet_address, display_name, squad, total_xp, level, last_active';
    const USERS_FALLBACK_SELECT =
      'wallet_address, display_name, squad, last_active';
    let xpColumnsAvailable = true;

    // Get all users with squads
    // Use a more permissive query to catch all users, then filter in memory
    let { data: allUsers, error } = await supabase
      .from('users')
      .select(USERS_SELECT);

    if (error) {
      console.warn(
        '⚠️ [Squad Leaderboard] Failed to fetch total_xp/level from users table, falling back to user_xp:',
        error?.message || error
      );
      xpColumnsAvailable = false;
      const fallbackResponse = await supabase
        .from('users')
        .select(USERS_FALLBACK_SELECT);

      if (fallbackResponse.error) {
        console.error(
          '❌ [Squad Leaderboard] Fallback users query failed:',
          fallbackResponse.error
        );
        return NextResponse.json(
          {
            error: 'Failed to fetch squad data',
            details: fallbackResponse.error.message
          },
          { status: 500 }
        );
      }

      allUsers = fallbackResponse.data;
    }

    if (!allUsers) {
      console.error('❌ [Squad Leaderboard] No user records returned from Supabase');
      return NextResponse.json(
        { error: 'Failed to fetch squad data', details: error?.message },
        { status: 500 }
      );
    }

    // Filter users with valid squads (not null, not empty string)
    const users = allUsers?.filter(user => 
      user.squad && 
      user.squad.trim() !== '' && 
      user.squad !== null
    ) || [];

    console.log(`📊 [Squad Leaderboard] Found ${users.length} users with squads out of ${allUsers?.length || 0} total users`);

    let xpMap = new Map<string, { totalXP: number; level: number }>();

    if (!xpColumnsAvailable && users.length > 0) {
      xpMap = await fetchUserXpMap(
        supabase,
        users.map((user) => user.wallet_address)
      );
    }

    const resolveUserTotalXP = (user: any) => {
      if (xpColumnsAvailable) {
        return user.total_xp || 0;
      }
      return xpMap.get(user.wallet_address)?.totalXP || 0;
    };

    const resolveUserLevel = (user: any) => {
      if (xpColumnsAvailable) {
        return user.level || 1;
      }
      return xpMap.get(user.wallet_address)?.level || 1;
    };

    // Group by squad and calculate stats
    const squadStatsMap: Record<string, any> = {};

    users?.forEach(user => {
      const canonicalSquad = normalizeSquadName(user.squad);
      if (!canonicalSquad || canonicalSquad === 'Unassigned') {
        return;
      }

      if (!squadStatsMap[canonicalSquad]) {
        squadStatsMap[canonicalSquad] = {
          name: canonicalSquad,
          totalXP: 0,
          memberCount: 0,
          activeMembers: 0,
          averageLevel: 0,
          totalLevels: 0,
          members: []
        };
      }

      const squad = squadStatsMap[canonicalSquad];
      const totalXP = resolveUserTotalXP(user);
      const level = resolveUserLevel(user);

      squad.totalXP += totalXP;
      squad.memberCount += 1;
      squad.totalLevels += level;

      // Check if active (within last 7 days)
      if (user.last_active) {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        if (new Date(user.last_active) > sevenDaysAgo) {
          squad.activeMembers += 1;
        }
      }

      if (includeMembers) {
        squad.members.push({
          walletAddress: user.wallet_address,
          displayName: user.display_name || `User ${user.wallet_address.slice(0, 6)}...`,
          totalXP,
          level,
          streak: (user as any).streak || 0 // streak may not exist in all schemas
        });
      }
    });

    // Calculate averages and sort
    const squadRankings = Object.values(squadStatsMap).map(squad => ({
      name: squad.name,
      totalXP: squad.totalXP,
      memberCount: squad.memberCount,
      activeMembers: squad.activeMembers,
      activeMemberRate: squad.memberCount > 0 
        ? Math.round((squad.activeMembers / squad.memberCount) * 100) 
        : 0,
      averageXP: squad.memberCount > 0 
        ? Math.round(squad.totalXP / squad.memberCount) 
        : 0,
      averageLevel: squad.memberCount > 0 
        ? Math.round(squad.totalLevels / squad.memberCount) 
        : 0,
      emoji: getSquadEmoji(squad.name),
      topMembers: includeMembers 
        ? squad.members.sort((a: any, b: any) => b.totalXP - a.totalXP).slice(0, 5)
        : undefined
    }))
    .sort((a, b) => b.totalXP - a.totalXP)
    .map((squad, index) => ({
      ...squad,
      rank: index + 1
    }))
    .slice(0, limit);

    return NextResponse.json({
      success: true,
      squads: squadRankings,
      totalSquads: Object.keys(squadStatsMap).length,
      generatedAt: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ [Squad Leaderboard API] Error:', error);
    console.error('❌ [Squad Leaderboard API] Error details:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name
    });
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error?.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}

