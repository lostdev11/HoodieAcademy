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

const SQUAD_NAMES = ['Creators', 'Decoders', 'Speakers', 'Raiders', 'Rangers'];

/**
 * GET /api/squads/rankings
 * 
 * Get rankings of all squads based on various metrics
 * Query params:
 *   - metric: 'xp' | 'members' | 'activity' | 'avg_xp' (default: 'xp')
 *   - period: 'all' | 'week' | 'month' (default: 'all')
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const metric = searchParams.get('metric') || 'xp';
    const period = searchParams.get('period') || 'all';

    const supabase = getSupabaseClient();

    // Calculate date filter based on period
    let dateFilter: Date | null = null;
    if (period === 'week') {
      dateFilter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === 'month') {
      dateFilter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }

    const squadRankings = await Promise.all(
      SQUAD_NAMES.map(async (squadName) => {
        // Get all members of this squad
        const { data: members } = await supabase
          .from('users')
          .select('wallet_address, created_at, last_active')
          .eq('squad', squadName);

        const memberCount = members?.length || 0;
        const walletAddresses = members?.map(m => m.wallet_address) || [];

        // Get XP data for all members
        let totalXP = 0;
        let periodXP = 0;
        
        if (walletAddresses.length > 0) {
          // Get total XP
          const { data: xpData } = await supabase
            .from('user_xp')
            .select('total_xp')
            .in('wallet_address', walletAddresses);
          
          totalXP = xpData?.reduce((sum, record) => sum + (record.total_xp || 0), 0) || 0;

          // Get period XP if applicable
          if (dateFilter) {
            const { data: activityData } = await supabase
              .from('user_activity')
              .select('metadata')
              .in('wallet_address', walletAddresses)
              .eq('activity_type', 'xp_awarded')
              .gte('created_at', dateFilter.toISOString());

            periodXP = activityData?.reduce((sum, activity) => {
              return sum + (activity.metadata?.xp_amount || 0);
            }, 0) || 0;
          }
        }

        // Calculate activity metrics
        const activeMembers = members?.filter(m => {
          const lastActiveDate = new Date(m.last_active || m.created_at);
          const daysSinceActive = (Date.now() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24);
          return daysSinceActive <= 7; // Active in last 7 days
        }).length || 0;

        const avgXPPerMember = memberCount > 0 ? Math.round(totalXP / memberCount) : 0;
        const activityRate = memberCount > 0 ? Math.round((activeMembers / memberCount) * 100) : 0;

        return {
          squad: squadName,
          totalMembers: memberCount,
          activeMembers,
          totalXP,
          periodXP: period !== 'all' ? periodXP : totalXP,
          avgXPPerMember,
          activityRate,
          emoji: getSquadEmoji(squadName)
        };
      })
    );

    // Sort based on metric
    squadRankings.sort((a, b) => {
      switch (metric) {
        case 'members':
          return b.totalMembers - a.totalMembers;
        case 'activity':
          return b.activityRate - a.activityRate;
        case 'avg_xp':
          return b.avgXPPerMember - a.avgXPPerMember;
        case 'xp':
        default:
          return (period !== 'all' ? b.periodXP : b.totalXP) - (period !== 'all' ? a.periodXP : a.totalXP);
      }
    });

    // Add rankings
    const rankedSquads = squadRankings.map((squad, index) => ({
      ...squad,
      rank: index + 1
    }));

    // Calculate overall statistics
    const totalUsers = squadRankings.reduce((sum, s) => sum + s.totalMembers, 0);
    const totalXP = squadRankings.reduce((sum, s) => sum + s.totalXP, 0);
    const totalActive = squadRankings.reduce((sum, s) => sum + s.activeMembers, 0);

    return NextResponse.json({
      success: true,
      rankings: rankedSquads,
      metric,
      period,
      statistics: {
        totalUsers,
        totalXP,
        totalActiveUsers: totalActive,
        totalSquads: SQUAD_NAMES.length,
        avgUsersPerSquad: Math.round(totalUsers / SQUAD_NAMES.length),
        mostPopularSquad: rankedSquads.reduce((prev, current) => 
          current.totalMembers > prev.totalMembers ? current : prev
        , rankedSquads[0]),
        topPerformingSquad: rankedSquads[0]
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in squads/rankings API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function getSquadEmoji(squadName: string): string {
  const emojiMap: { [key: string]: string } = {
    'Creators': '🎨',
    'Decoders': '🧠',
    'Speakers': '🎤',
    'Raiders': '⚔️',
    'Rangers': '🦅'
  };
  return emojiMap[squadName] || '🏆';
}

