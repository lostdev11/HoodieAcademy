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

    // Get all users in the squad with their XP data
    const { data: members, error: membersError } = await supabase
      .from('users')
      .select(`
        wallet_address,
        display_name,
        squad,
        squad_selected_at,
        squad_lock_end_date,
        created_at,
        last_active
      `)
      .eq('squad', squadName)
      .order('created_at', { ascending: false });

    if (membersError) {
      console.error('Error fetching squad members:', membersError);
      return NextResponse.json(
        { error: 'Failed to fetch squad members' },
        { status: 500 }
      );
    }

    // Get XP data for all members
    const walletAddresses = members?.map(m => m.wallet_address) || [];
    
    let xpData: any[] = [];
    if (walletAddresses.length > 0) {
      const { data: xpRecords } = await supabase
        .from('user_xp')
        .select('wallet_address, total_xp, level')
        .in('wallet_address', walletAddresses);
      
      xpData = xpRecords || [];
    }

    // Combine member data with XP data
    const enrichedMembers = members?.map(member => {
      const xpInfo = xpData.find(xp => xp.wallet_address === member.wallet_address);
      
      // Calculate days in squad
      const joinedDate = new Date(member.squad_selected_at || member.created_at);
      const daysInSquad = Math.floor((Date.now() - joinedDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Calculate if squad is locked
      const lockEndDate = member.squad_lock_end_date ? new Date(member.squad_lock_end_date) : null;
      const isLocked = lockEndDate ? lockEndDate > new Date() : false;
      const daysUntilUnlock = lockEndDate ? Math.max(0, Math.floor((lockEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0;

      return {
        walletAddress: member.wallet_address,
        displayName: member.display_name || `User ${member.wallet_address.slice(0, 6)}...`,
        squad: member.squad,
        totalXP: xpInfo?.total_xp || 0,
        level: xpInfo?.level || 1,
        joinedSquadAt: member.squad_selected_at || member.created_at,
        daysInSquad,
        lastActive: member.last_active,
        squadLocked: isLocked,
        daysUntilUnlock,
        createdAt: member.created_at
      };
    }) || [];

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
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in squads/members API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

