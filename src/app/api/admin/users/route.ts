import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('wallet');

    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
    }

    console.log('[ADMIN USERS API] Fetching real users from database...');

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Fetch all users with their basic information
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (usersError) {
      console.error('[ADMIN USERS API] Error fetching users:', usersError);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    if (!users || users.length === 0) {
      console.log('[ADMIN USERS API] No users found in database');
      return NextResponse.json({
        users: [],
        total: 0,
        totalSubmissions: 0,
        stats: {
          totalUsers: 0,
          totalXP: 0,
          avgLevel: 0,
          totalSubmissions: 0,
          pendingSubmissions: 0
        }
      });
    }

    // Fetch XP data for all users
    const { data: xpData, error: xpError } = await supabase
      .from('user_xp')
      .select('*');

    if (xpError) {
      console.warn('[ADMIN USERS API] Error fetching XP data:', xpError);
    }

    // Fetch submission statistics from both tables
    const { data: submissions, error: submissionsError } = await supabase
      .from('submissions')
      .select('wallet_address, status');

    if (submissionsError) {
      console.warn('[ADMIN USERS API] Error fetching submissions:', submissionsError);
    }

    // Fetch bounty submissions for XP tracking and submission stats
    const { data: bountySubmissions, error: bountySubmissionsError } = await supabase
      .from('bounty_submissions')
      .select('wallet_address, xp_awarded, placement, status');

    if (bountySubmissionsError) {
      console.warn('[ADMIN USERS API] Error fetching bounty submissions:', bountySubmissionsError);
    }

    // Fetch recent activity (last 10 activities per user)
    const { data: activities, error: activitiesError } = await supabase
      .from('user_activity')
      .select('wallet_address, activity_type, created_at')
      .order('created_at', { ascending: false })
      .limit(100); // Get recent activities, we'll filter per user

    if (activitiesError) {
      console.warn('[ADMIN USERS API] Error fetching activities:', activitiesError);
    }

    // Enrich users with all the data
    const enrichedUsers = users.map(user => {
      // Get XP data for this user
      const userXP = xpData?.find(xp => xp.wallet_address === user.wallet_address);
      
      // Calculate submission stats for this user (from both tables)
      const userSubmissions = submissions?.filter(sub => sub.wallet_address === user.wallet_address) || [];
      const userBountySubmissions = bountySubmissions?.filter(sub => sub.wallet_address === user.wallet_address) || [];
      
      // Combine both types of submissions
      const allUserSubmissions = [
        ...userSubmissions.map(sub => ({ status: sub.status })),
        ...userBountySubmissions.map(sub => ({ status: sub.status }))
      ];
      
      const submissionStats = {
        total: allUserSubmissions.length,
        pending: allUserSubmissions.filter(sub => sub.status === 'pending').length,
        approved: allUserSubmissions.filter(sub => sub.status === 'approved').length,
        rejected: allUserSubmissions.filter(sub => sub.status === 'rejected').length
      };

      // Get recent activity for this user (last 5 activities)
      const userActivities = activities?.filter(activity => activity.wallet_address === user.wallet_address).slice(0, 5) || [];

      // Calculate level based on total XP (simple formula: level = floor(total_xp / 100) + 1)
      const totalXP = userXP?.total_xp || 0;
      const level = Math.floor(totalXP / 100) + 1;

      return {
        id: user.id,
        wallet_address: user.wallet_address,
        display_name: user.display_name,
        username: user.display_name, // Use display_name as username for now
        squad: user.squad,
        total_xp: totalXP,
        level: level,
        profile_picture: null, // TODO: Add profile picture support
        bio: null, // TODO: Add bio support
        created_at: user.created_at,
        last_active: user.last_active,
        updated_at: user.updated_at,
        submissions: [], // TODO: Add detailed submission data if needed
        submissionStats: submissionStats,
        recentActivity: userActivities.map(activity => ({
          activity_type: activity.activity_type,
          created_at: activity.created_at
        })),
        displayName: user.display_name || `User ${user.wallet_address.slice(0, 6)}...`,
        formattedWallet: `${user.wallet_address.slice(0, 8)}...${user.wallet_address.slice(-6)}`,
        lastActiveFormatted: user.last_active ? new Date(user.last_active).toLocaleDateString() : 'Never',
        joinedFormatted: new Date(user.created_at).toLocaleDateString()
      };
    });

    // Calculate overall stats
    const totalXP = enrichedUsers.reduce((sum, user) => sum + user.total_xp, 0);
    const avgLevel = enrichedUsers.length > 0 ? Math.round(enrichedUsers.reduce((sum, user) => sum + user.level, 0) / enrichedUsers.length) : 0;
    const totalSubmissions = enrichedUsers.reduce((sum, user) => sum + user.submissionStats.total, 0);
    const pendingSubmissions = enrichedUsers.reduce((sum, user) => sum + user.submissionStats.pending, 0);

    console.log('[ADMIN USERS API] Returning', enrichedUsers.length, 'real users from database');

    return NextResponse.json({
      users: enrichedUsers,
      total: enrichedUsers.length,
      totalSubmissions: totalSubmissions,
      stats: {
        totalUsers: enrichedUsers.length,
        totalXP: totalXP,
        avgLevel: avgLevel,
        totalSubmissions: totalSubmissions,
        pendingSubmissions: pendingSubmissions
      }
    });

  } catch (error) {
    console.error('[ADMIN USERS API ERROR]', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}