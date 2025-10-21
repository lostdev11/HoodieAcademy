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
 * GET /api/squads/stats
 * 
 * Get comprehensive statistics for a specific squad or all squads
 * Query params:
 *   - squad: Squad name (optional - if not provided, returns all squads)
 *   - detailed: 'true' | 'false' (default: 'false') - include detailed breakdown
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const squadName = searchParams.get('squad');
    const detailed = searchParams.get('detailed') === 'true';

    const supabase = getSupabaseClient();

    if (squadName) {
      // Get stats for specific squad
      return await getSquadStats(supabase, squadName, detailed);
    } else {
      // Get overview for all squads
      return await getAllSquadsOverview(supabase);
    }

  } catch (error) {
    console.error('Error in squads/stats API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function getSquadStats(supabase: any, squadName: string, detailed: boolean) {
  // Get all members
  const { data: members } = await supabase
    .from('users')
    .select('wallet_address, display_name, created_at, last_active, squad_selected_at')
    .eq('squad', squadName);

  const walletAddresses = members?.map((m: any) => m.wallet_address) || [];
  const memberCount = members?.length || 0;

  if (memberCount === 0) {
    return NextResponse.json({
      success: true,
      squad: squadName,
      exists: false,
      message: 'No members found in this squad'
    });
  }

  // Get XP data
  const { data: xpData } = await supabase
    .from('user_xp')
    .select('wallet_address, total_xp, level')
    .in('wallet_address', walletAddresses);

  const totalXP = xpData?.reduce((sum: number, record: any) => sum + (record.total_xp || 0), 0) || 0;
  const avgXP = Math.round(totalXP / memberCount);
  const maxLevel = Math.max(...(xpData?.map((r: any) => r.level || 1) || [1]));

  // Get activity data for last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const { data: weekActivity } = await supabase
    .from('user_activity')
    .select('wallet_address, activity_type, created_at')
    .in('wallet_address', walletAddresses)
    .gte('created_at', sevenDaysAgo.toISOString());

  const activeThisWeek = new Set(weekActivity?.map((a: any) => a.wallet_address)).size;

  // Get bounty submissions
  const { data: bounties } = await supabase
    .from('bounty_submissions')
    .select('wallet_address, status')
    .in('wallet_address', walletAddresses);

  const totalBounties = bounties?.length || 0;
  const completedBounties = bounties?.filter((b: any) => b.status === 'won').length || 0;

  // Get social activity
  const { data: socialPosts } = await supabase
    .from('social_posts')
    .select('author_wallet')
    .in('author_wallet', walletAddresses)
    .eq('status', 'active');

  const totalPosts = socialPosts?.length || 0;

  const stats = {
    success: true,
    squad: squadName,
    emoji: getSquadEmoji(squadName),
    exists: true,
    overview: {
      totalMembers: memberCount,
      activeThisWeek,
      activityRate: Math.round((activeThisWeek / memberCount) * 100)
    },
    xp: {
      totalXP,
      avgXPPerMember: avgXP,
      maxLevel,
      topPerformers: xpData
        ?.sort((a: any, b: any) => (b.total_xp || 0) - (a.total_xp || 0))
        .slice(0, 5)
        .map((x: any) => ({
          walletAddress: x.wallet_address,
          displayName: members?.find((m: any) => m.wallet_address === x.wallet_address)?.display_name || 
                      `User ${x.wallet_address.slice(0, 6)}...`,
          totalXP: x.total_xp || 0,
          level: x.level || 1
        })) || []
    },
    engagement: {
      totalBounties,
      completedBounties,
      bountyWinRate: totalBounties > 0 ? Math.round((completedBounties / totalBounties) * 100) : 0,
      totalSocialPosts: totalPosts,
      avgPostsPerMember: memberCount > 0 ? (totalPosts / memberCount).toFixed(1) : '0'
    },
    growth: {
      newMembersThisWeek: members?.filter((m: any) => {
        const joinDate = new Date(m.squad_selected_at || m.created_at);
        return joinDate > sevenDaysAgo;
      }).length || 0
    },
    timestamp: new Date().toISOString()
  };

  // Add detailed breakdown if requested
  if (detailed) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const { data: monthActivity } = await supabase
      .from('user_activity')
      .select('activity_type, created_at, metadata')
      .in('wallet_address', walletAddresses)
      .gte('created_at', thirtyDaysAgo.toISOString());

    // Group by day
    const dailyActivity: { [key: string]: number } = {};
    monthActivity?.forEach((activity: any) => {
      const day = activity.created_at.split('T')[0];
      dailyActivity[day] = (dailyActivity[day] || 0) + 1;
    });

    (stats as any).detailed = {
      dailyActivityLast30Days: Object.entries(dailyActivity)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      activityBreakdown: {
        xpAwarded: monthActivity?.filter((a: any) => a.activity_type === 'xp_awarded').length || 0,
        dailyLogins: monthActivity?.filter((a: any) => a.activity_type === 'daily_login_bonus').length || 0,
        coursesCompleted: monthActivity?.filter((a: any) => a.activity_type === 'course_completed').length || 0,
        socialInteractions: monthActivity?.filter((a: any) => 
          a.activity_type.includes('social')
        ).length || 0
      }
    };
  }

  return NextResponse.json(stats);
}

async function getAllSquadsOverview(supabase: any) {
  const SQUAD_NAMES = ['Creators', 'Decoders', 'Speakers', 'Raiders', 'Rangers'];
  
  const squadsOverview = await Promise.all(
    SQUAD_NAMES.map(async (squadName) => {
      const { data: members } = await supabase
        .from('users')
        .select('wallet_address')
        .eq('squad', squadName);

      const memberCount = members?.length || 0;
      const walletAddresses = members?.map((m: any) => m.wallet_address) || [];

      let totalXP = 0;
      if (walletAddresses.length > 0) {
        const { data: xpData } = await supabase
          .from('user_xp')
          .select('total_xp')
          .in('wallet_address', walletAddresses);

        totalXP = xpData?.reduce((sum: number, r: any) => sum + (r.total_xp || 0), 0) || 0;
      }

      return {
        squad: squadName,
        emoji: getSquadEmoji(squadName),
        totalMembers: memberCount,
        totalXP,
        avgXPPerMember: memberCount > 0 ? Math.round(totalXP / memberCount) : 0
      };
    })
  );

  // Sort by total XP
  squadsOverview.sort((a, b) => b.totalXP - a.totalXP);

  const totalMembers = squadsOverview.reduce((sum, s) => sum + s.totalMembers, 0);
  const totalXP = squadsOverview.reduce((sum, s) => sum + s.totalXP, 0);

  return NextResponse.json({
    success: true,
    squads: squadsOverview,
    global: {
      totalMembers,
      totalXP,
      avgMembersPerSquad: Math.round(totalMembers / SQUAD_NAMES.length),
      avgXPPerUser: totalMembers > 0 ? Math.round(totalXP / totalMembers) : 0
    },
    timestamp: new Date().toISOString()
  });
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

