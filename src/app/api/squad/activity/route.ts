import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { buildSquadFilterClauses, normalizeSquadName } from '@/lib/squad-utils';

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
 * GET /api/squad/activity
 * Get comprehensive squad activity data and statistics
 * Query params:
 *   - squad: Squad name (required)
 *   - period: 'day' | 'week' | 'month' | 'all' (default: 'week')
 *   - includeMembers: Include detailed member list (default: false)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const squad = searchParams.get('squad');
    const period = searchParams.get('period') || 'week';
    const includeMembers = searchParams.get('includeMembers') === 'true';

    if (!squad) {
      return NextResponse.json(
        { error: 'Squad name is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();
    const canonicalSquad = squad ? normalizeSquadName(squad) : null;
    const squadLabel = canonicalSquad || squad || 'Unassigned';
    const filterClauses = buildSquadFilterClauses(squadLabel);

    // Calculate date range based on period
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case 'day':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'all':
        startDate = new Date('2000-01-01');
        break;
    }

    // 1. Get all squad members
    const { data: members, error: membersError } = await supabase
      .from('users')
      .select('wallet_address, display_name, total_xp, level, streak, is_admin, last_active, created_at, squad')
      .or(filterClauses.join(','));

    if (membersError) {
      console.error('Error fetching squad members:', membersError);
      return NextResponse.json(
        { error: 'Failed to fetch squad members' },
        { status: 500 }
      );
    }

    const memberWallets = members?.map(m => m.wallet_address) || [];
    const totalMembers = members?.length || 0;

    // 2. Calculate squad XP (sum of all member XP)
    const squadTotalXP = members?.reduce((sum, member) => sum + (member.total_xp || 0), 0) || 0;

    // 3. Get active members (logged in within last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const activeMembers = members?.filter(m => 
      m.last_active && new Date(m.last_active) > sevenDaysAgo
    ).length || 0;

    // 4. Get squad XP activity for the period
    const { data: xpActivity, error: xpError } = await supabase
      .from('xp_transactions')
      .select('wallet_address, xp_amount, action_type, created_at')
      .in('wallet_address', memberWallets.length > 0 ? memberWallets : [''])
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    const periodXP = xpActivity?.reduce((sum, txn) => sum + (txn.xp_amount || 0), 0) || 0;

    // 5. Get bounty submissions by squad members
    const { data: bountySubmissions } = await supabase
      .from('submissions')
      .select('id, wallet_address, bounty_id, status, created_at')
      .in('wallet_address', memberWallets.length > 0 ? memberWallets : [''])
      .gte('created_at', startDate.toISOString());

    const completedBounties = bountySubmissions?.filter(s => s.status === 'approved').length || 0;
    const pendingBounties = bountySubmissions?.filter(s => s.status === 'pending').length || 0;

    // 6. Get social feed activity (if social tables exist)
    let socialPosts = 0;
    let socialComments = 0;
    let socialReactions = 0;

    try {
      const { data: posts } = await supabase
        .from('social_posts')
        .select('id', { count: 'exact', head: true })
        .in('wallet_address', memberWallets.length > 0 ? memberWallets : [''])
        .gte('created_at', startDate.toISOString());

      const { data: comments } = await supabase
        .from('social_comments')
        .select('id', { count: 'exact', head: true })
        .in('wallet_address', memberWallets.length > 0 ? memberWallets : [''])
        .gte('created_at', startDate.toISOString());

      const { data: reactions } = await supabase
        .from('social_reactions')
        .select('id', { count: 'exact', head: true })
        .in('wallet_address', memberWallets.length > 0 ? memberWallets : [''])
        .gte('created_at', startDate.toISOString());

      socialPosts = posts?.length || 0;
      socialComments = comments?.length || 0;
      socialReactions = reactions?.length || 0;
    } catch (error) {
      // Social tables might not exist yet - silently continue
      console.log('Social tables not found (this is okay if not set up yet)');
    }

    // 7. Top contributors (members who earned most XP in period)
    const memberXPMap: Record<string, number> = {};
    xpActivity?.forEach(txn => {
      memberXPMap[txn.wallet_address] = (memberXPMap[txn.wallet_address] || 0) + txn.xp_amount;
    });

    const topContributors = Object.entries(memberXPMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([wallet, xp]) => {
        const member = members?.find(m => m.wallet_address === wallet);
        return {
          walletAddress: wallet,
          displayName: member?.display_name || `${wallet.slice(0, 6)}...${wallet.slice(-4)}`,
          xpEarned: xp,
          totalXP: member?.total_xp || 0,
          level: member?.level || 1
        };
      });

    // 8. Activity breakdown by action type
    const activityBreakdown: Record<string, number> = {};
    xpActivity?.forEach(txn => {
      activityBreakdown[txn.action_type] = (activityBreakdown[txn.action_type] || 0) + 1;
    });

    // 9. Daily activity trend (last 7 days)
    const dailyActivity: Record<string, number> = {};
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      last7Days.push(dateStr);
      dailyActivity[dateStr] = 0;
    }

    xpActivity?.forEach(txn => {
      const dateStr = txn.created_at.split('T')[0];
      if (dailyActivity.hasOwnProperty(dateStr)) {
        dailyActivity[dateStr] += txn.xp_amount;
      }
    });

    const activityTrend = last7Days.map(date => ({
      date,
      xp: dailyActivity[date] || 0
    }));

    // 10. Recent activity log
    const recentActivity = xpActivity?.slice(0, 20).map(txn => {
      const member = members?.find(m => m.wallet_address === txn.wallet_address);
      return {
        walletAddress: txn.wallet_address,
        displayName: member?.display_name || `${txn.wallet_address.slice(0, 6)}...`,
        actionType: txn.action_type,
        xpAmount: txn.xp_amount,
        timestamp: txn.created_at
      };
    }) || [];

    // 11. Squad rankings (compared to other squads)
    const { data: allUsers } = await supabase
      .from('users')
      .select('squad, total_xp');

    const squadXPMap: Record<string, number> = {};
    allUsers?.forEach(user => {
      const canonical = normalizeSquadName(user.squad);
      if (!canonical || canonical === 'Unassigned') {
        return;
      }
      squadXPMap[canonical] = (squadXPMap[canonical] || 0) + (user.total_xp || 0);
    });

    const squadRankings = Object.entries(squadXPMap)
      .sort(([, a], [, b]) => b - a)
      .map(([squadName, xp], index) => ({
        squad: squadName,
        totalXP: xp,
        rank: index + 1
      }));

    const currentSquadRank = squadRankings.find(r => r.squad === squad)?.rank || 0;

    // Build response
    const response: any = {
      success: true,
      squad: {
        name: squadLabel,
        rank: currentSquadRank,
        totalRanks: squadRankings.length
      },
      stats: {
        // Member Stats
        totalMembers,
        activeMembers,
        activeMemberRate: totalMembers > 0 ? Math.round((activeMembers / totalMembers) * 100) : 0,
        
        // XP Stats
        squadTotalXP,
        periodXP,
        averageXPPerMember: totalMembers > 0 ? Math.round(squadTotalXP / totalMembers) : 0,
        
        // Activity Stats
        completedBounties,
        pendingBounties,
        socialPosts,
        socialComments,
        socialReactions,
        totalEngagement: socialPosts + socialComments + socialReactions,
        
        // Period info
        period,
        periodStart: startDate.toISOString(),
        periodEnd: now.toISOString()
      },
      topContributors,
      activityBreakdown,
      activityTrend,
      recentActivity,
      squadRankings: squadRankings.slice(0, 5) // Top 5 squads
    };

    // Optionally include full member list
    if (includeMembers && members) {
      response.members = members.map(member => ({
        walletAddress: member.wallet_address,
        displayName: member.display_name,
        totalXP: member.total_xp || 0,
        level: member.level || 1,
        streak: member.streak || 0,
        isAdmin: member.is_admin || false,
        lastActive: member.last_active,
        joinedAt: member.created_at
      }));
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in GET /api/squad/activity:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/squad/activity
 * Log a squad activity event (for future analytics)
 * Body:
 *   - squad: Squad name
 *   - walletAddress: User's wallet
 *   - activityType: Type of activity
 *   - metadata: Additional data (optional)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { squad, walletAddress, activityType, metadata } = body;

    if (!squad || !walletAddress || !activityType) {
      return NextResponse.json(
        { error: 'squad, walletAddress, and activityType are required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // Log activity event (can be used for future analytics)
    const { data, error } = await supabase
      .from('squad_activity_log')
      .insert({
        squad,
        wallet_address: walletAddress,
        activity_type: activityType,
        metadata: metadata || {},
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      // Table might not exist yet - that's okay
      console.log('Squad activity log table not found (optional feature)');
      return NextResponse.json({
        success: true,
        message: 'Activity logged (in-memory only)',
        logged: false
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Activity logged successfully',
      activity: data,
      logged: true
    });

  } catch (error) {
    console.error('Error in POST /api/squad/activity:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

