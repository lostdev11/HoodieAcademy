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
    // Only select columns that actually exist in the database
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select(`
        id,
        wallet_address,
        display_name,
        squad,
        is_admin,
        total_xp,
        level,
        created_at,
        updated_at
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

    // Fetch submission statistics from submissions table only
    const { data: submissions, error: submissionsError } = await supabase
      .from('submissions')
      .select('wallet_address, status');

    if (submissionsError) {
      console.warn('[ADMIN USERS API] Error fetching submissions:', submissionsError);
    }

    // Enrich users with basic data
    const enrichedUsers = users.map(user => {
      // Calculate submission stats for this user
      const userSubmissions = submissions?.filter(sub => sub.wallet_address === user.wallet_address) || [];
      
      const submissionStats = {
        total: userSubmissions.length,
        pending: userSubmissions.filter(sub => sub.status === 'pending').length,
        approved: userSubmissions.filter(sub => sub.status === 'approved').length,
        rejected: userSubmissions.filter(sub => sub.status === 'rejected').length
      };

      return {
        id: user.id,
        wallet_address: user.wallet_address,
        display_name: user.display_name,
        username: user.display_name, // Use display_name as username for now
        squad: user.squad,
        is_admin: user.is_admin || false, // Use actual admin status from database
        total_xp: user.total_xp || 0, // Use actual XP from database
        level: user.level || 1, // Use actual level from database
        profile_picture: null, // TODO: Add profile picture support
        bio: null, // TODO: Add bio support
        created_at: user.created_at,
        last_active: user.updated_at, // Use updated_at as last_active
        updated_at: user.updated_at,
        submissions: [], // TODO: Add detailed submission data if needed
        submissionStats: submissionStats,
        recentActivity: [], // TODO: Add activity tracking
        connectionData: {
          firstConnection: null,
          lastConnection: null,
          totalConnections: 0,
          hasVerifiedNFT: false,
          connectionHistory: []
        },
        displayName: user.display_name || `User ${user.wallet_address.slice(0, 6)}...`,
        formattedWallet: `${user.wallet_address.slice(0, 8)}...${user.wallet_address.slice(-6)}`,
        lastActiveFormatted: user.updated_at ? new Date(user.updated_at).toLocaleDateString() : 'Never',
        joinedFormatted: new Date(user.created_at).toLocaleDateString(),
        firstConnectionFormatted: 'Never',
        lastConnectionFormatted: 'Never'
      };
    });

    // Calculate overall stats
    const totalXP = enrichedUsers.reduce((sum, user) => sum + user.total_xp, 0);
    const avgLevel = enrichedUsers.length > 0 ? Math.round(enrichedUsers.reduce((sum, user) => sum + user.level, 0) / enrichedUsers.length) : 0;
    const totalSubmissions = enrichedUsers.reduce((sum, user) => sum + user.submissionStats.total, 0);
    const pendingSubmissions = enrichedUsers.reduce((sum, user) => sum + user.submissionStats.pending, 0);
    const totalConnections = 0; // Default to 0 since connection tracking doesn't exist yet
    const usersWithVerifiedNFTs = 0; // Default to 0 since NFT verification tracking doesn't exist yet
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
        avgConnectionsPerUser: 0
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