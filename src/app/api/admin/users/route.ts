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

    // Get filter parameter for hidden users
    const showHidden = searchParams.get('showHidden') === 'true';

    // Fetch all users with their basic information
    // Only select columns that actually exist in the database
    let query = supabase
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
        updated_at,
        hidden,
        hidden_at,
        hidden_by
      `);

    // Filter out hidden users unless showHidden is true
    if (!showHidden) {
      query = query.or('hidden.is.null,hidden.eq.false');
    }

    const { data: users, error: usersError } = await query.order('created_at', { ascending: false });

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

    // Deduplicate users by wallet_address (keep most recent)
    const uniqueUsersMap = new Map();
    users.forEach(user => {
      const existing = uniqueUsersMap.get(user.wallet_address);
      if (!existing || new Date(user.updated_at) > new Date(existing.updated_at)) {
        uniqueUsersMap.set(user.wallet_address, user);
      }
    });
    const deduplicatedUsers = Array.from(uniqueUsersMap.values());

    console.log(`[ADMIN USERS API] Deduplicated: ${users.length} → ${deduplicatedUsers.length} users`);

    // Filter out test/mock users
    const isTestUser = (user: any) => {
      const wallet = user.wallet_address?.toLowerCase() || '';
      const displayName = user.display_name?.toLowerCase() || '';
      
      // Filter test wallet addresses
      if (wallet.startsWith('test-') || 
          wallet.startsWith('test-wallet') ||
          wallet === 'admin-wallet' ||
          wallet.includes('test123456789') ||
          wallet.includes('usertest') ||
          wallet.includes('demowallet') ||
          wallet.includes('testwallet')) {
        return true;
      }
      
      // Filter test display names
      if (displayName.includes('test user') ||
          displayName === 'admin user' ||
          displayName === 'alice johnson' ||
          displayName === 'bob smith' ||
          displayName === 'charlie brown' ||
          displayName.startsWith('demo user')) {
        return true;
      }
      
      return false;
    };

    const realUsers = deduplicatedUsers.filter(user => !isTestUser(user));
    console.log(`[ADMIN USERS API] Filtered test users: ${deduplicatedUsers.length} → ${realUsers.length} real users`);

    // Enrich users with basic data
    const enrichedUsers = realUsers.map(user => {
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
        hidden: user.hidden || false,
        hidden_at: user.hidden_at || null,
        hidden_by: user.hidden_by || null,
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

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { admin_wallet, target_wallet, action = 'delete' } = body;

    console.log('[USER DELETE/HIDE] Request:', {
      admin_wallet,
      target_wallet,
      action
    });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Validate required fields
    if (!admin_wallet || !target_wallet) {
      return NextResponse.json(
        { error: 'admin_wallet and target_wallet are required' },
        { status: 400 }
      );
    }

    // Check if user is admin
    const { data: admin, error: adminError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('wallet_address', admin_wallet)
      .single();

    if (adminError || !admin?.is_admin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Prevent admin from deleting themselves
    if (admin_wallet === target_wallet) {
      return NextResponse.json(
        { error: 'Cannot delete your own admin account' },
        { status: 400 }
      );
    }

    // Get user details before deletion/hiding for logging
    const { data: targetUser, error: fetchError } = await supabase
      .from('users')
      .select('wallet_address, display_name, username, total_xp, hidden')
      .eq('wallet_address', target_wallet)
      .single();

    if (fetchError || !targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Handle hide/unhide action
    if (action === 'hide' || action === 'unhide') {
      const isHidden = action === 'hide';
      
      const { error: updateError } = await supabase
        .from('users')
        .update({
          hidden: isHidden,
          hidden_at: isHidden ? new Date().toISOString() : null,
          hidden_by: isHidden ? admin_wallet : null,
          updated_at: new Date().toISOString()
        })
        .eq('wallet_address', target_wallet);

      if (updateError) {
        console.error('Error hiding/unhiding user:', updateError);
        return NextResponse.json(
          { error: `Failed to ${action} user`, details: updateError.message },
          { status: 500 }
        );
      }

      // Log the hide/unhide activity
      try {
        await supabase
          .from('user_activity')
          .insert({
            wallet_address: admin_wallet,
            activity_type: isHidden ? 'user_hidden' : 'user_unhidden',
            metadata: {
              target_user: target_wallet,
              target_user_name: targetUser.display_name || targetUser.username,
              action: action,
              hidden_by: admin_wallet,
              timestamp: new Date().toISOString()
            },
            created_at: new Date().toISOString()
          });
      } catch (logError) {
        console.warn('Failed to log user hide/unhide:', logError);
      }

      console.log(`[USER ${action.toUpperCase()}]`, {
        target_wallet,
        action_by: admin_wallet,
        user_name: targetUser.display_name || targetUser.username
      });

      return NextResponse.json({
        success: true,
        message: `User ${targetUser.display_name || targetUser.username || 'user'} has been ${isHidden ? 'hidden' : 'unhidden'}`,
        action: action,
        user: {
          wallet_address: targetUser.wallet_address,
          display_name: targetUser.display_name,
          username: targetUser.username,
          hidden: isHidden
        }
      });
    }

    // Default action: Delete user permanently
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('wallet_address', target_wallet);

    if (deleteError) {
      console.error('Error deleting user:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete user', details: deleteError.message },
        { status: 500 }
      );
    }

    // Log the deletion activity
    try {
      await supabase
        .from('user_activity')
        .insert({
          wallet_address: admin_wallet,
          activity_type: 'user_deleted',
          metadata: {
            deleted_user: target_wallet,
            deleted_user_name: targetUser.display_name || targetUser.username,
            deleted_user_xp: targetUser.total_xp,
            deleted_by: admin_wallet,
            deleted_at: new Date().toISOString()
          }
        });
    } catch (logError) {
      console.warn('Failed to log user deletion:', logError);
    }

    console.log('[USER DELETED]', {
      target_wallet,
      deleted_by: admin_wallet,
      user_name: targetUser.display_name || targetUser.username
    });

    return NextResponse.json({
      success: true,
      message: `User ${targetUser.display_name || targetUser.username || 'deleted'} has been removed`,
      deleted_user: {
        wallet_address: targetUser.wallet_address,
        display_name: targetUser.display_name,
        username: targetUser.username
      }
    });

  } catch (error) {
    console.error('Error in DELETE /api/admin/users:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}