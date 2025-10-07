import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('[SIMPLE ADMIN USERS API] Fetching users from database...');

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Fetch all users with basic information only (only columns that exist)
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
        last_active
      `)
      .order('created_at', { ascending: false });

    if (usersError) {
      console.error('[SIMPLE ADMIN USERS API] Error fetching users:', usersError);
      return NextResponse.json({ 
        error: 'Failed to fetch users',
        details: usersError.message,
        code: usersError.code
      }, { status: 500 });
    }

    console.log(`[SIMPLE ADMIN USERS API] Found ${users?.length || 0} users in database`);

    if (!users || users.length === 0) {
      console.log('[SIMPLE ADMIN USERS API] No users found in database');
      return NextResponse.json({
        users: [],
        total: 0,
        stats: {
          totalUsers: 0,
          activeUsers: 0,
          totalXP: 0,
          avgLevel: 0,
          totalSubmissions: 0,
          pendingSubmissions: 0,
          totalConnections: 0,
          verifiedNFTs: 0
        }
      });
    }

    // Enrich users with basic data
    const enrichedUsers = users.map(user => {
      // Calculate level based on simple formula (can be enhanced later)
      const level = 1; // Default level for now
      const totalXP = 0; // Default XP for now

      // Calculate if user is active (last 7 days)
      const lastActive = user.last_active ? new Date(user.last_active) : new Date(0);
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const isActive = lastActive > sevenDaysAgo;

      return {
        id: user.id,
        wallet_address: user.wallet_address,
        display_name: user.display_name,
        username: user.display_name,
        squad: user.squad,
        total_xp: totalXP,
        level: level,
        profile_picture: null,
        bio: null,
        created_at: user.created_at,
        last_active: user.last_active,
        updated_at: user.updated_at,
        is_admin: user.is_admin || false,
        profile_completed: false, // Default value since column may not exist
        squad_test_completed: false, // Default value since column may not exist
        placement_test_completed: false, // Default value since column may not exist
        displayName: user.display_name || `User ${user.wallet_address.slice(0, 6)}...`,
        formattedWallet: `${user.wallet_address.slice(0, 8)}...${user.wallet_address.slice(-6)}`,
        lastActiveFormatted: user.last_active ? new Date(user.last_active).toLocaleDateString() : 'Never',
        joinedFormatted: new Date(user.created_at).toLocaleDateString(),
        isActive: isActive
      };
    });

    // Calculate overall stats
    const totalUsers = enrichedUsers.length;
    const activeUsers = enrichedUsers.filter(user => user.isActive).length;
    const totalXP = 0; // Will be calculated when XP system is implemented
    const avgLevel = 1; // Will be calculated when XP system is implemented
    const totalSubmissions = 0; // Will be calculated when submission system is implemented
    const pendingSubmissions = 0; // Will be calculated when submission system is implemented
    const totalConnections = totalUsers; // Use user count as proxy for connections
    const verifiedNFTs = enrichedUsers.filter(user => user.profile_completed).length;

    console.log('[SIMPLE ADMIN USERS API] Returning', enrichedUsers.length, 'users from database');

    return NextResponse.json({
      users: enrichedUsers,
      total: totalUsers,
      stats: {
        totalUsers: totalUsers,
        activeUsers: activeUsers,
        totalXP: totalXP,
        avgLevel: avgLevel,
        totalSubmissions: totalSubmissions,
        pendingSubmissions: pendingSubmissions,
        totalConnections: totalConnections,
        verifiedNFTs: verifiedNFTs
      }
    });

  } catch (error) {
    console.error('[SIMPLE ADMIN USERS API ERROR]', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
