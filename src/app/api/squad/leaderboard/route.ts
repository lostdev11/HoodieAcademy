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

    // Get all users with squads
    const { data: users, error } = await supabase
      .from('users')
      .select('wallet_address, display_name, squad, total_xp, level, streak, last_active')
      .not('squad', 'is', null);

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json(
        { error: 'Failed to fetch squad data' },
        { status: 500 }
      );
    }

    // Group by squad and calculate stats
    const squadStatsMap: Record<string, any> = {};

    users?.forEach(user => {
      if (!user.squad) return;

      if (!squadStatsMap[user.squad]) {
        squadStatsMap[user.squad] = {
          name: user.squad,
          totalXP: 0,
          memberCount: 0,
          activeMembers: 0,
          averageLevel: 0,
          totalLevels: 0,
          members: []
        };
      }

      const squad = squadStatsMap[user.squad];
      squad.totalXP += user.total_xp || 0;
      squad.memberCount += 1;
      squad.totalLevels += user.level || 1;

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
          displayName: user.display_name,
          totalXP: user.total_xp || 0,
          level: user.level || 1,
          streak: user.streak || 0
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

  } catch (error) {
    console.error('Error in GET /api/squad/leaderboard:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

