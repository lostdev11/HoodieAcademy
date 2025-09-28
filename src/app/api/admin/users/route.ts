import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('wallet');

    console.log('[ADMIN USERS API] Fetching real users from database...');

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // If wallet address is provided, verify admin status
    if (walletAddress) {
      const { data: isAdmin, error: adminError } = await supabase.rpc('is_wallet_admin', { 
        wallet: walletAddress 
      });

      if (adminError) {
        console.error('[ADMIN USERS API] Error checking admin status:', adminError);
        return NextResponse.json({ error: 'Failed to verify admin status' }, { status: 500 });
      }

      if (!isAdmin) {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
      }
    }

    // Fetch all users with their basic information
    // Use a more flexible select to handle missing columns
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select(`
        id,
        wallet_address,
        display_name,
        squad,
        is_admin,
        created_at,
        updated_at,
        last_active,
        profile_completed,
        squad_test_completed,
        placement_test_completed,
        last_seen,
        total_xp,
        level,
        username,
        bio,
        profile_picture,
        xp_total
      `)
      .order('created_at', { ascending: false });

    if (usersError) {
      console.error('[ADMIN USERS API] Error fetching users:', usersError);
      return NextResponse.json({ 
        error: 'Failed to fetch users',
        details: usersError.message,
        code: usersError.code
      }, { status: 500 });
    }

    console.log(`[ADMIN USERS API] Found ${users?.length || 0} users in database`);

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
      .select('wallet_address, activity_type, created_at, metadata')
      .order('created_at', { ascending: false })
      .limit(100); // Get recent activities, we'll filter per user

    if (activitiesError) {
      console.warn('[ADMIN USERS API] Error fetching activities:', activitiesError);
    }

    // Fetch wallet connection logs for connection tracking
    const { data: walletConnections, error: connectionsError } = await supabase
      .from('wallet_connections')
      .select('wallet_address, connection_type, connection_timestamp, verification_result, user_agent')
      .order('connection_timestamp', { ascending: false });

    if (connectionsError) {
      console.warn('[ADMIN USERS API] Error fetching wallet connections:', connectionsError);
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

      // Get wallet connection data for this user
      const userConnections = walletConnections?.filter(conn => conn.wallet_address === user.wallet_address) || [];
      const firstConnection = userConnections.find(conn => conn.connection_type === 'connect');
      const lastConnection = userConnections.find(conn => conn.connection_type === 'connect');
      const totalConnections = userConnections.filter(conn => conn.connection_type === 'connect').length;
      const hasVerifiedNFT = userConnections.some(conn => 
        conn.verification_result && 
        typeof conn.verification_result === 'object' && 
        conn.verification_result.wifhoodie_found === true
      );

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
          activity_data: activity.metadata,
          created_at: activity.created_at
        })),
        connectionData: {
          firstConnection: firstConnection?.connection_timestamp,
          lastConnection: lastConnection?.connection_timestamp,
          totalConnections: totalConnections,
          hasVerifiedNFT: hasVerifiedNFT,
          connectionHistory: userConnections.slice(0, 10) // Last 10 connections
        },
        displayName: user.display_name || `User ${user.wallet_address.slice(0, 6)}...`,
        formattedWallet: `${user.wallet_address.slice(0, 8)}...${user.wallet_address.slice(-6)}`,
        lastActiveFormatted: user.last_active ? new Date(user.last_active).toLocaleDateString() : 'Never',
        joinedFormatted: new Date(user.created_at).toLocaleDateString(),
        firstConnectionFormatted: firstConnection?.connection_timestamp ? new Date(firstConnection.connection_timestamp).toLocaleDateString() : 'Never',
        lastConnectionFormatted: lastConnection?.connection_timestamp ? new Date(lastConnection.connection_timestamp).toLocaleDateString() : 'Never'
      };
    });

    // Calculate overall stats
    const totalXP = enrichedUsers.reduce((sum, user) => sum + user.total_xp, 0);
    const avgLevel = enrichedUsers.length > 0 ? Math.round(enrichedUsers.reduce((sum, user) => sum + user.level, 0) / enrichedUsers.length) : 0;
    const totalSubmissions = enrichedUsers.reduce((sum, user) => sum + user.submissionStats.total, 0);
    const pendingSubmissions = enrichedUsers.reduce((sum, user) => sum + user.submissionStats.pending, 0);
    const totalConnections = enrichedUsers.reduce((sum, user) => sum + user.connectionData.totalConnections, 0);
    const usersWithVerifiedNFTs = enrichedUsers.filter(user => user.connectionData.hasVerifiedNFT).length;
    const activeUsers = enrichedUsers.filter(user => {
      const lastActive = user.last_active ? new Date(user.last_active) : new Date(0);
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return lastActive > sevenDaysAgo;
    }).length;

    console.log('[ADMIN USERS API] Returning', enrichedUsers.length, 'real users from database');

    return NextResponse.json({
      users: enrichedUsers,
      total: enrichedUsers.length,
      totalSubmissions: totalSubmissions,
      stats: {
        totalUsers: enrichedUsers.length,
        activeUsers: activeUsers,
        totalXP: totalXP,
        avgLevel: avgLevel,
        totalSubmissions: totalSubmissions,
        pendingSubmissions: pendingSubmissions,
        totalConnections: totalConnections,
        usersWithVerifiedNFTs: usersWithVerifiedNFTs,
        avgConnectionsPerUser: enrichedUsers.length > 0 ? Math.round(totalConnections / enrichedUsers.length * 10) / 10 : 0
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