import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { robustUserSync } from '@/lib/robust-user-sync';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('wallet');

    console.log('[ROBUST USERS API] Fetching users with robust sync...');

    // If wallet address is provided, verify admin status
    if (walletAddress) {
      const { data: isAdmin, error: adminError } = await supabase.rpc('is_wallet_admin', { 
        wallet: walletAddress 
      });

      if (adminError) {
        console.error('[ROBUST USERS API] Error checking admin status:', adminError);
        return NextResponse.json({ error: 'Failed to verify admin status' }, { status: 500 });
      }

      if (!isAdmin) {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
      }
    }

    // Use robust sync to get users
    const users = await robustUserSync.getAllUsers();
    console.log(`[ROBUST USERS API] Found ${users?.length || 0} users`);

    // Get user stats
    const stats = await robustUserSync.getUserStats();

    return NextResponse.json({
      users: users || [],
      stats: stats,
      total: users?.length || 0,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[ROBUST USERS API] Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { wallet_address, display_name, squad, is_admin } = body;

    if (!wallet_address) {
      return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
    }

    console.log('[ROBUST USERS API] Creating/updating user:', wallet_address);

    // Use robust sync to create/update user
    const user = await robustUserSync.syncUserOnWalletConnect(wallet_address, {
      display_name,
      squad,
      is_admin
    });

    // Track the activity
    await robustUserSync.trackUserActivity(wallet_address, 'user_profile_updated', {
      display_name,
      squad,
      is_admin,
      updated_at: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      user,
      message: 'User created/updated successfully'
    });

  } catch (error) {
    console.error('[ROBUST USERS API] POST Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
