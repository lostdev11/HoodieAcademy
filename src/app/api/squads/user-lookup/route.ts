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
 * GET /api/squads/user-lookup
 * 
 * Look up multiple users and their squad affiliations
 * Query params:
 *   - wallets: Comma-separated wallet addresses
 * 
 * OR
 * 
 * POST /api/squads/user-lookup
 * Body: { wallets: string[] }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletsParam = searchParams.get('wallets');

    if (!walletsParam) {
      return NextResponse.json(
        { error: 'Wallets parameter is required' },
        { status: 400 }
      );
    }

    const wallets = walletsParam.split(',').map(w => w.trim()).filter(w => w);
    return await lookupUsers(wallets);

  } catch (error) {
    console.error('Error in squads/user-lookup API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { wallets } = await request.json();

    if (!wallets || !Array.isArray(wallets)) {
      return NextResponse.json(
        { error: 'Wallets array is required' },
        { status: 400 }
      );
    }

    return await lookupUsers(wallets);

  } catch (error) {
    console.error('Error in squads/user-lookup API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function lookupUsers(walletAddresses: string[]) {
  const supabase = getSupabaseClient();

  // Fetch user data
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('wallet_address, display_name, squad, total_xp, level, is_admin, last_active')
    .in('wallet_address', walletAddresses);

  if (usersError) {
    console.error('Error fetching users:', usersError);
    return NextResponse.json(
      { error: 'Failed to fetch user data' },
      { status: 500 }
    );
  }

  // Map results
  const userMap = walletAddresses.map(wallet => {
    const userData = users?.find(u => u.wallet_address === wallet);
    
    if (!userData) {
      return {
        walletAddress: wallet,
        exists: false,
        displayName: `User ${wallet.slice(0, 6)}...`,
        squad: 'Unassigned',
        totalXP: 0,
        level: 1,
        isAdmin: false
      };
    }

    return {
      walletAddress: wallet,
      exists: true,
      displayName: userData.display_name || `User ${wallet.slice(0, 6)}...`,
      squad: userData.squad || 'Unassigned',
      totalXP: userData.total_xp || 0,
      level: userData.level || 1,
      isAdmin: userData.is_admin || false,
      lastActive: userData.last_active
    };
  });

  // Group by squad
  const bySquad: { [key: string]: any[] } = {};
  userMap.forEach(user => {
    const squad = user.squad || 'Unassigned';
    if (!bySquad[squad]) {
      bySquad[squad] = [];
    }
    bySquad[squad].push(user);
  });

  return NextResponse.json({
    success: true,
    users: userMap,
    bySquad,
    totalUsers: userMap.length,
    existingUsers: userMap.filter(u => u.exists).length,
    timestamp: new Date().toISOString()
  });
}

