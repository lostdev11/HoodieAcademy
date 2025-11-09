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
 * GET /api/squads/members
 * 
 * Get all members of a specific squad with their stats
 * Query params:
 *   - squad: Squad name (required)
 *   - sortBy: 'xp' | 'level' | 'recent' (default: 'xp')
 *   - limit: number of members to return (default: 100)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const squadName = searchParams.get('squad');
    const sortBy = searchParams.get('sortBy') || 'xp';
    const limit = parseInt(searchParams.get('limit') || '100');

    if (!squadName) {
      return NextResponse.json(
        { error: 'Squad name is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // Get all users in the squad with their XP data directly from users table
    // Use a more permissive query to catch all users, then filter in memory
    // Use minimal required fields first to avoid column errors
    const { data: allUsers, error: membersError } = await supabase
      .from('users')
      .select('wallet_address, display_name, squad, squad_id, total_xp, level, squad_selected_at, squad_lock_end_date, created_at, last_active, updated_at');

    if (membersError) {
      console.error('Error fetching users:', membersError);
      return NextResponse.json(
        { error: 'Failed to fetch squad members', details: membersError.message },
        { status: 500 }
      );
    }

    // Filter users with matching squad name (case-insensitive, trimmed)
    const members = allUsers?.filter(user => 
      user.squad && 
      user.squad.trim() !== '' && 
      user.squad.trim().toLowerCase() === squadName.trim().toLowerCase()
    ) || [];

    console.log(`📊 [Squad Members API] Found ${members.length} members for squad "${squadName}" out of ${allUsers?.length || 0} total users`);

    if (members.length === 0) {
      console.log(`⚠️ [Squad Members API] No members found for squad "${squadName}"`);
      return NextResponse.json({
        success: true,
        squad: squadName,
        statistics: {
          totalMembers: 0,
          activeMembers: 0,
          totalSquadXP: 0,
          avgXPPerMember: 0,
          lockedMembers: 0,
          topContributor: null
        },
        members: [],
        sortedBy: sortBy,
        timestamp: new Date().toISOString(),
        debug: {
          totalUsersInDB: allUsers?.length || 0,
          membersFound: 0,
          squadNamesInDB: [...new Set(allUsers?.filter(u => u.squad).map(u => u.squad.trim()) || [])]
        }
      });
    }

    // Enrich members with calculated data
    const enrichedMembers = members.map(member => {
      // Calculate days in squad
      const joinedDate = new Date(member.squad_selected_at || member.created_at);
      const daysInSquad = Math.max(0, Math.floor((Date.now() - joinedDate.getTime()) / (1000 * 60 * 60 * 24)));
      
      // Calculate if squad is locked
      const lockEndDate = member.squad_lock_end_date ? new Date(member.squad_lock_end_date) : null;
      const isLocked = lockEndDate ? lockEndDate > new Date() : false;
      const daysUntilUnlock = lockEndDate ? Math.max(0, Math.floor((lockEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0;

      return {
        walletAddress: member.wallet_address,
        displayName: member.display_name || `User ${member.wallet_address.slice(0, 6)}...`,
        squad: member.squad,
        totalXP: member.total_xp || 0,
        level: member.level || 1,
        streak: (member as any).streak || 0, // streak may not exist in all schemas
        joinedSquadAt: member.squad_selected_at || member.created_at,
        daysInSquad,
        lastActive: member.last_active,
        squadLocked: isLocked,
        daysUntilUnlock,
        createdAt: member.created_at
      };
    });

    // Sort based on sortBy parameter
    enrichedMembers.sort((a, b) => {
      switch (sortBy) {
        case 'level':
          return b.level - a.level || b.totalXP - a.totalXP;
        case 'recent':
          return new Date(b.lastActive || b.createdAt).getTime() - new Date(a.lastActive || a.createdAt).getTime();
        case 'xp':
        default:
          return b.totalXP - a.totalXP;
      }
    });

    // Apply limit
    const limitedMembers = enrichedMembers.slice(0, limit);

    // Calculate squad statistics
    const totalMembers = enrichedMembers.length;
    const totalSquadXP = enrichedMembers.reduce((sum, m) => sum + m.totalXP, 0);
    const avgXPPerMember = totalMembers > 0 ? Math.round(totalSquadXP / totalMembers) : 0;
    const activeMembers = enrichedMembers.filter(m => {
      const lastActiveDate = new Date(m.lastActive || m.createdAt);
      const daysSinceActive = (Date.now() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceActive <= 7; // Active in last 7 days
    }).length;

    const topContributor = enrichedMembers[0] || null;
    const lockedMembers = enrichedMembers.filter(m => m.squadLocked).length;

    console.log(`✅ [Squad Members API] Returning ${limitedMembers.length} members (of ${totalMembers} total) for squad "${squadName}"`);

    return NextResponse.json({
      success: true,
      squad: squadName,
      statistics: {
        totalMembers,
        activeMembers,
        totalSquadXP,
        avgXPPerMember,
        lockedMembers,
        topContributor: topContributor ? {
          displayName: topContributor.displayName,
          totalXP: topContributor.totalXP,
          level: topContributor.level
        } : null
      },
      members: limitedMembers,
      sortedBy: sortBy,
      timestamp: new Date().toISOString(),
      debug: {
        totalMembersInSquad: totalMembers,
        membersReturned: limitedMembers.length,
        limitApplied: limit
      }
    });

  } catch (error: any) {
    console.error('❌ [Squad Members API] Error:', error);
    console.error('❌ [Squad Members API] Error details:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name
    });
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error?.message || 'Unknown error',
        squad: squadName || 'unknown'
      },
      { status: 500 }
    );
  }
}

