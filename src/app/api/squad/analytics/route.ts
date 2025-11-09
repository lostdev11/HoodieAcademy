import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

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
 * GET /api/squad/analytics
 * Get squad analytics with rankings based on overall XP from users in those squads
 * Query params:
 *   - includeMembers: Include full member list for each squad (default: false)
 *   - minMembers: Minimum number of members to include squad (default: 1)
 *   - sortBy: 'totalXP' | 'averageXP' | 'memberCount' (default: 'totalXP')
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeMembers = searchParams.get('includeMembers') === 'true';
    const minMembers = Math.max(1, parseInt(searchParams.get('minMembers') || '1'));
    const sortBy = searchParams.get('sortBy') || 'totalXP';

    const supabase = getSupabaseClient();

    // Get all users with squads assigned
    // Use a more permissive query to catch all users, then filter in memory
    const { data: allUsers, error } = await supabase
      .from('users')
      .select('wallet_address, display_name, squad, squad_id, total_xp, level, streak, last_active, created_at, updated_at');

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json(
        { error: 'Failed to fetch squad data', details: error.message },
        { status: 500 }
      );
    }

    // Filter users with valid squads (not null, not empty string)
    const users = allUsers?.filter(user => 
      user.squad && 
      user.squad.trim() !== '' && 
      user.squad !== null
    ) || [];

    console.log(`📊 [Squad Analytics] Found ${users.length} users with squads out of ${allUsers?.length || 0} total users`);

    if (users.length === 0) {
      console.log('⚠️ [Squad Analytics] No users with squads found');
      return NextResponse.json({
        success: true,
        squads: [],
        totalSquads: 0,
        totalUsers: 0,
        generatedAt: new Date().toISOString(),
        debug: {
          totalUsersInDB: allUsers?.length || 0,
          usersWithSquads: 0
        }
      });
    }

    // Group users by squad and calculate analytics
    const squadAnalyticsMap: Record<string, {
      squadName: string;
      squadId: string | null;
      totalXP: number;
      memberCount: number;
      activeMembers: number;
      averageXP: number;
      averageLevel: number;
      totalLevels: number;
      members: Array<{
        walletAddress: string;
        displayName: string | null;
        totalXP: number;
        level: number;
        streak: number;
        lastActive: string | null;
      }>;
    }> = {};

    // Process each user
    users.forEach(user => {
      if (!user.squad) return;

      // Initialize squad if not exists
      if (!squadAnalyticsMap[user.squad]) {
        squadAnalyticsMap[user.squad] = {
          squadName: user.squad,
          squadId: user.squad_id || null,
          totalXP: 0,
          memberCount: 0,
          activeMembers: 0,
          averageXP: 0,
          averageLevel: 0,
          totalLevels: 0,
          members: []
        };
      }

      const squad = squadAnalyticsMap[user.squad];
      
      // Add user XP to squad total
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

      // Always add member to list for counting, but only include in response if requested
      squad.members.push({
        walletAddress: user.wallet_address,
        displayName: user.display_name || null,
        totalXP: user.total_xp || 0,
        level: user.level || 1,
        streak: user.streak || 0,
        lastActive: user.last_active || null
      });
    });

    // Calculate averages and prepare final data
    const squadAnalytics = Object.values(squadAnalyticsMap)
      .map(squad => ({
        ...squad,
        averageXP: squad.memberCount > 0 
          ? Math.round(squad.totalXP / squad.memberCount) 
          : 0,
        averageLevel: squad.memberCount > 0 
          ? Math.round(squad.totalLevels / squad.memberCount) 
          : 0,
        activeMemberRate: squad.memberCount > 0 
          ? Math.round((squad.activeMembers / squad.memberCount) * 100) 
          : 0,
        // Sort members by XP and include/exclude based on flag
        members: includeMembers 
          ? squad.members.sort((a, b) => b.totalXP - a.totalXP)
          : undefined,
        // Always include member count for reference
        memberDetails: includeMembers ? undefined : {
          count: squad.members.length,
          note: 'Set includeMembers=true to see full member list'
        }
      }))
      // Filter by minimum members
      .filter(squad => squad.memberCount >= minMembers);

    // First, rank squads by total XP (primary ranking method)
    const rankedSquads = squadAnalytics
      .sort((a, b) => b.totalXP - a.totalXP)
      .map((squad, index) => ({
        ...squad,
        rank: index + 1
      }));

    // Then, sort by the requested parameter if different from totalXP
    const sortedSquads = sortBy !== 'totalXP'
      ? rankedSquads.sort((a, b) => {
          switch (sortBy) {
            case 'averageXP':
              return b.averageXP - a.averageXP;
            case 'memberCount':
              return b.memberCount - a.memberCount;
            default:
              return b.totalXP - a.totalXP;
          }
        })
      : rankedSquads;

    // Calculate summary statistics
    const totalUsers = users.length;
    const totalSquads = sortedSquads.length;
    const totalXPAcrossAllSquads = sortedSquads.reduce((sum, squad) => sum + squad.totalXP, 0);
    const averageSquadSize = totalSquads > 0 
      ? Math.round(totalUsers / totalSquads) 
      : 0;

    // Log summary for debugging
    console.log(`✅ [Squad Analytics] Processed ${totalSquads} squads with ${totalUsers} total members`);
    sortedSquads.forEach(squad => {
      console.log(`   - ${squad.squadName}: ${squad.memberCount} members, ${squad.totalXP} total XP, rank #${squad.rank}`);
    });

    return NextResponse.json({
      success: true,
      squads: sortedSquads,
      summary: {
        totalSquads,
        totalUsers,
        totalXPAcrossAllSquads,
        averageSquadSize,
        averageSquadXP: totalSquads > 0 
          ? Math.round(totalXPAcrossAllSquads / totalSquads) 
          : 0
      },
      generatedAt: new Date().toISOString(),
      query: {
        includeMembers,
        minMembers,
        sortBy
      },
      debug: {
        totalUsersInDB: allUsers?.length || 0,
        usersWithValidSquads: totalUsers,
        squadsFound: totalSquads
      }
    });

  } catch (error: any) {
    console.error('Error in GET /api/squad/analytics:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

